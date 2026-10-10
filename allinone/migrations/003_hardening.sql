-- Revisão R2. Aplicar somente depois de 001 e 002, como administrador.
-- A migração não modifica/corrige dados incompatíveis: uma violação aborta a transação inteira.
BEGIN;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '30s';
DO $$ BEGIN
 IF current_setting('server_encoding') <> 'UTF8' THEN RAISE EXCEPTION 'UTF8_REQUIRED'; END IF;
 IF EXISTS (SELECT FROM pg_roles WHERE rolname='ab_aio_executor' AND (rolsuper OR rolbypassrls OR rolcanlogin)) THEN RAISE EXCEPTION 'EXECUTOR_ROLE_UNSAFE'; END IF;
END $$;
CREATE TABLE ab_aio.schema_revisions(version integer PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());
REVOKE ALL ON ab_aio.schema_revisions FROM PUBLIC;
INSERT INTO ab_aio.schema_revisions(version) VALUES (3);
ALTER TABLE ab_aio.tenants ADD COLUMN timezone text NOT NULL DEFAULT 'Etc/UTC';
ALTER TABLE ab_aio.projects ADD CONSTRAINT project_client_identity UNIQUE(tenant_id,id,client_id);
ALTER TABLE ab_aio.deals ADD CONSTRAINT deal_matches_project_client
 FOREIGN KEY(tenant_id,project_id,client_id) REFERENCES ab_aio.projects(tenant_id,id,client_id) ON DELETE RESTRICT;
ALTER TABLE ab_aio.ledger_entries ADD CONSTRAINT recorded_evidence_nonblank
 CHECK(status<>'recorded' OR (recorded_date IS NOT NULL AND length(btrim(coalesce(evidence_ref,''))) BETWEEN 1 AND 500));
CREATE OR REPLACE FUNCTION ab_aio.enter_context(p_actor uuid,p_tenant uuid,p_write boolean) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE business_timezone text;
BEGIN
 IF p_actor IS NULL OR p_tenant IS NULL OR p_write IS NULL THEN RAISE EXCEPTION 'ACCESS_DENIED' USING ERRCODE='42501'; END IF;
 -- Serializa revogação com operações em andamento.
 SELECT t.timezone INTO business_timezone FROM ab_aio.memberships m
 JOIN ab_aio.actors a ON a.id=m.actor_id JOIN ab_aio.tenants t ON t.id=m.tenant_id
 WHERE a.id=p_actor AND a.enabled AND m.enabled AND m.tenant_id=p_tenant
 AND (NOT p_write OR m.role IN ('owner','editor')) FOR SHARE OF m,a,t;
 IF NOT FOUND THEN RAISE EXCEPTION 'ACCESS_DENIED' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS (SELECT FROM pg_catalog.pg_timezone_names WHERE name=business_timezone) THEN RAISE EXCEPTION 'TIMEZONE_INVALID' USING ERRCODE='22023'; END IF;
 PERFORM set_config('ab_aio.tenant',p_tenant::text,true);
 PERFORM set_config('ab_aio.actor',p_actor::text,true);
 PERFORM set_config('ab_aio.timezone',business_timezone,true);
END $$;
CREATE FUNCTION ab_aio.guard_revision() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF NEW.id IS DISTINCT FROM OLD.id OR NEW.tenant_id IS DISTINCT FROM OLD.tenant_id
 OR NEW.created_at IS DISTINCT FROM OLD.created_at OR NEW.version <> OLD.version+1 THEN
  RAISE EXCEPTION 'RECORD_IDENTITY_IMMUTABLE' USING ERRCODE='23514';
 END IF;
 IF TG_TABLE_NAME IN ('harness_runs','llm_usage') THEN RAISE EXCEPTION 'APPEND_ONLY_RESOURCE' USING ERRCODE='23514'; END IF;
 IF TG_TABLE_NAME='ledger_entries' THEN
  IF OLD.status IN ('recorded','cancelled') THEN
   IF (to_jsonb(NEW)-ARRAY['status','notes','version','updated_at']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['status','notes','version','updated_at'])
    OR OLD.status='cancelled' OR NEW.status<>'cancelled' OR length(btrim(NEW.notes))=0 THEN
    RAISE EXCEPTION 'RECORD_FINALIZED' USING ERRCODE='23514';
   END IF;
  END IF;
 END IF;
 IF TG_TABLE_NAME='affiliate_events' THEN
  IF (to_jsonb(NEW)-ARRAY['status','commission_minor','version','updated_at']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['status','commission_minor','version','updated_at'])
   OR OLD.status='reversed' OR (OLD.status='confirmed' AND (NEW.status<>'reversed' OR NEW.commission_minor<>OLD.commission_minor)) THEN
   RAISE EXCEPTION 'EVENT_FINALIZED' USING ERRCODE='23514';
  END IF;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION ab_aio.guard_revision() FROM PUBLIC;
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['clients','projects','tasks','deals','ledger_entries','domains','harness_runs','llm_usage','affiliate_events','documents'] LOOP
  EXECUTE format('CREATE TRIGGER enforce_revision BEFORE UPDATE ON ab_aio.%I FOR EACH ROW EXECUTE FUNCTION ab_aio.guard_revision()',t);
 END LOOP;
END $$;
CREATE OR REPLACE FUNCTION public.ab_aio_list(p_actor uuid,p_tenant uuid,p_resource text,p_before timestamptz DEFAULT NULL,p_before_id uuid DEFAULT NULL,p_limit integer DEFAULT 100) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET statement_timeout='5s' AS $$
DECLARE result jsonb;
BEGIN
 PERFORM ab_aio.enter_context(p_actor,p_tenant,false);
 IF p_resource IS NULL OR p_resource NOT IN ('clients','projects','tasks','deals','ledger_entries','domains','harness_runs','llm_usage','affiliate_events','documents','audit_log') OR p_limit IS NULL OR p_limit<1 OR p_limit>200 THEN RAISE EXCEPTION 'RESOURCE_INVALID' USING ERRCODE='22023'; END IF;
 IF p_resource='audit_log' THEN
  IF p_before IS NOT NULL OR p_before_id IS NOT NULL THEN RAISE EXCEPTION 'CURSOR_INVALID' USING ERRCODE='22023'; END IF;
  SELECT coalesce(jsonb_agg(to_jsonb(x)||jsonb_build_object('id',x.id::text) ORDER BY x.id DESC),'[]') INTO result FROM (SELECT * FROM ab_aio.audit_log ORDER BY id DESC LIMIT p_limit) x;
  RETURN jsonb_build_object('items',result,'limit',p_limit,'bounded',true);
 END IF;
 IF (p_before IS NULL)<>(p_before_id IS NULL) THEN RAISE EXCEPTION 'CURSOR_INVALID' USING ERRCODE='22023'; END IF;
 EXECUTE format('WITH page AS MATERIALIZED (SELECT * FROM ab_aio.%1$I WHERE ($1::timestamptz IS NULL OR (updated_at,id)<($1,$2::uuid)) ORDER BY updated_at DESC,id DESC LIMIT ($3+1))
 SELECT jsonb_build_object(''items'',(SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.updated_at DESC,x.id DESC),''[]'') FROM (SELECT * FROM page ORDER BY updated_at DESC,id DESC LIMIT $3) x),''total'',(SELECT count(*) FROM ab_aio.%1$I),''limit'',$3,''has_more'',(SELECT count(*)>$3 FROM page))',p_resource) INTO result USING p_before,p_before_id,p_limit;
 RETURN result;
END $$;
CREATE OR REPLACE FUNCTION public.ab_aio_overview(p_actor uuid,p_tenant uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET statement_timeout='5s' AS $$
DECLARE business_timezone text;
BEGIN
 PERFORM ab_aio.enter_context(p_actor,p_tenant,false);
 business_timezone:=current_setting('ab_aio.timezone');
 RETURN (SELECT jsonb_build_object('schema',1,'schema_revision',3,'at',statement_timestamp(),
 'business_date',(statement_timestamp() AT TIME ZONE business_timezone)::date,'business_timezone',business_timezone,
 'counts',jsonb_build_object('projects',(SELECT count(*) FROM ab_aio.projects),'activeProjects',(SELECT count(*) FROM ab_aio.projects WHERE state<>'archived'),'clients',(SELECT count(*) FROM ab_aio.clients),'tasks',(SELECT count(*) FROM ab_aio.tasks),'blocked',(SELECT count(*) FROM ab_aio.tasks WHERE state='blocked'),'overdue',(SELECT count(*) FROM ab_aio.tasks WHERE due_date<(statement_timestamp() AT TIME ZONE business_timezone)::date AND state NOT IN ('done','cancelled')),'deals',(SELECT count(*) FROM ab_aio.deals),'domains',(SELECT count(*) FROM ab_aio.domains),'documents',(SELECT count(*) FROM ab_aio.documents)),
 'finance',(SELECT coalesce(jsonb_agg(x ORDER BY x.currency,x.direction,x.status),'[]') FROM (SELECT currency,direction,status,sum(amount_minor)::text AS amount_minor FROM ab_aio.ledger_entries GROUP BY currency,direction,status) x),
 'llm',(SELECT jsonb_build_object('requests',count(*),'tokens',coalesce(sum(prompt_tokens::numeric+completion_tokens),0)::text,'known_cost_microusd',coalesce(sum(cost_microusd),0)::text,'unpriced',count(*) FILTER(WHERE cost_microusd IS NULL)) FROM ab_aio.llm_usage)));
END $$;
CREATE FUNCTION public.ab_aio_receipt(p_actor uuid,p_tenant uuid,p_command uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET statement_timeout='5s' AS $$
DECLARE result jsonb;
BEGIN
 PERFORM ab_aio.enter_context(p_actor,p_tenant,false);
 IF p_command IS NULL THEN RAISE EXCEPTION 'COMMAND_ID_INVALID' USING ERRCODE='22023'; END IF;
 SELECT jsonb_build_object('state','committed','command_id',command_id,'result',response,'committed_at',created_at)
 INTO result FROM ab_aio.command_receipts WHERE tenant_id=p_tenant AND actor_id=p_actor AND command_id=p_command;
 -- Ausência de recibo NÃO prova que uma chamada concorrente foi abortada.
 RETURN coalesce(result,jsonb_build_object('state','not_observed','command_id',p_command));
END $$;
CREATE FUNCTION public.ab_aio_lookup(p_actor uuid,p_tenant uuid,p_resource text,p_query text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET statement_timeout='5s' AS $$
DECLARE result jsonb;pattern text;
BEGIN
 PERFORM ab_aio.enter_context(p_actor,p_tenant,false);
 IF p_resource IS NULL OR p_resource NOT IN ('clients','projects') OR p_query IS NULL OR length(btrim(p_query))<2 OR length(p_query)>120 THEN RAISE EXCEPTION 'LOOKUP_INVALID' USING ERRCODE='22023'; END IF;
 pattern:='%'||replace(replace(replace(btrim(p_query),'\','\\'),'%','\%'),'_','\_')||'%';
 EXECUTE format('WITH page AS MATERIALIZED (SELECT id,name FROM ab_aio.%I WHERE name ILIKE $1 ORDER BY name,id LIMIT 26)
 SELECT jsonb_build_object(''items'',(SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.name,x.id),''[]'') FROM (SELECT * FROM page ORDER BY name,id LIMIT 25) x),''truncated'',(SELECT count(*)>25 FROM page),''limit'',25)',p_resource) INTO result USING pattern;
 RETURN result;
END $$;
ALTER FUNCTION public.ab_aio_receipt(uuid,uuid,uuid) OWNER TO ab_aio_executor;
ALTER FUNCTION public.ab_aio_lookup(uuid,uuid,text,text) OWNER TO ab_aio_executor;
REVOKE ALL ON FUNCTION public.ab_aio_receipt(uuid,uuid,uuid),public.ab_aio_lookup(uuid,uuid,text,text) FROM PUBLIC;
DO $$ DECLARE r text; BEGIN
 FOREACH r IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
  IF EXISTS(SELECT FROM pg_roles WHERE rolname=r) THEN
   EXECUTE format('REVOKE ALL ON TABLE ab_aio.schema_revisions FROM %I',r);
   EXECUTE format('REVOKE ALL ON FUNCTION ab_aio.guard_revision() FROM %I',r);
   EXECUTE format('REVOKE ALL ON FUNCTION public.ab_aio_receipt(uuid,uuid,uuid),public.ab_aio_lookup(uuid,uuid,text,text) FROM %I',r);
  END IF;
 END LOOP;
 IF EXISTS(SELECT FROM pg_roles WHERE rolname='service_role') THEN
  GRANT EXECUTE ON FUNCTION public.ab_aio_receipt(uuid,uuid,uuid),public.ab_aio_lookup(uuid,uuid,text,text) TO service_role;
 END IF;
END $$;
COMMIT;
