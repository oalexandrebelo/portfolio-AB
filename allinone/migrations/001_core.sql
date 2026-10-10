-- Executar uma vez, como administrador, em PostgreSQL 15+. Não toca tabelas do blog.
-- Transporte: somente backend confiável. Usuários nunca recebem chave service_role.
BEGIN;
CREATE SCHEMA ab_aio;
REVOKE ALL ON SCHEMA ab_aio FROM PUBLIC;
DO $$ BEGIN
 IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='ab_aio_executor') THEN
  CREATE ROLE ab_aio_executor NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
 END IF;
 IF EXISTS(SELECT FROM pg_roles WHERE rolname='ab_aio_executor' AND (rolsuper OR rolbypassrls OR rolcanlogin)) THEN RAISE EXCEPTION 'EXECUTOR_ROLE_UNSAFE'; END IF;
END $$;
CREATE TABLE ab_aio.tenants(id uuid PRIMARY KEY,name text NOT NULL CHECK(length(name) BETWEEN 1 AND 180),legal_key text NOT NULL UNIQUE,tax_id text UNIQUE CHECK(tax_id IS NULL OR tax_id ~ '^[A-Z0-9]{12}[0-9]{2}$'),verified boolean NOT NULL DEFAULT false);
CREATE TABLE ab_aio.actors(id uuid PRIMARY KEY,name text NOT NULL,enabled boolean NOT NULL DEFAULT true);
CREATE TABLE ab_aio.memberships(tenant_id uuid REFERENCES ab_aio.tenants ON DELETE RESTRICT,actor_id uuid REFERENCES ab_aio.actors ON DELETE RESTRICT,role text NOT NULL CHECK(role IN ('owner','editor','viewer')),enabled boolean NOT NULL DEFAULT true,PRIMARY KEY(tenant_id,actor_id));
CREATE TABLE ab_aio.clients(
 id uuid PRIMARY KEY,tenant_id uuid NOT NULL REFERENCES ab_aio.tenants,name text NOT NULL CHECK(length(name) BETWEEN 1 AND 180),document text CHECK(document IS NULL OR document ~ '^([0-9]{11}|[A-Z0-9]{12}[0-9]{2})$'),email text,notes text NOT NULL DEFAULT '',is_active boolean NOT NULL DEFAULT true,
 version integer NOT NULL DEFAULT 1 CHECK(version>0),created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),UNIQUE(tenant_id,id),UNIQUE(tenant_id,document),CHECK(length(notes)<=4000));
CREATE TABLE ab_aio.projects(
 id uuid PRIMARY KEY,tenant_id uuid NOT NULL REFERENCES ab_aio.tenants,client_id uuid,name text NOT NULL CHECK(length(name) BETWEEN 1 AND 180),description text NOT NULL DEFAULT '',state text NOT NULL DEFAULT 'discovery' CHECK(state IN ('idea','discovery','building','operating','paused','archived')),priority integer NOT NULL DEFAULT 2 CHECK(priority BETWEEN 1 AND 4),due_date date,repository_url text,study_slug text,
 version integer NOT NULL DEFAULT 1 CHECK(version>0),created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),UNIQUE(tenant_id,id),FOREIGN KEY(tenant_id,client_id) REFERENCES ab_aio.clients(tenant_id,id) ON DELETE RESTRICT,CHECK(length(description)<=4000),CHECK(repository_url IS NULL OR (repository_url LIKE 'https://%' AND length(repository_url)<=500)));
CREATE TABLE ab_aio.tasks(
 id uuid PRIMARY KEY,tenant_id uuid NOT NULL REFERENCES ab_aio.tenants,project_id uuid NOT NULL,title text NOT NULL CHECK(length(title) BETWEEN 1 AND 180),notes text NOT NULL DEFAULT '',state text NOT NULL DEFAULT 'backlog' CHECK(state IN ('backlog','in_progress','blocked','done','cancelled')),priority integer NOT NULL DEFAULT 2 CHECK(priority BETWEEN 1 AND 4),due_date date,
 version integer NOT NULL DEFAULT 1 CHECK(version>0),created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),FOREIGN KEY(tenant_id,project_id) REFERENCES ab_aio.projects(tenant_id,id) ON DELETE RESTRICT,CHECK(length(notes)<=4000));
CREATE TABLE ab_aio.deals(
 id uuid PRIMARY KEY,tenant_id uuid NOT NULL REFERENCES ab_aio.tenants,client_id uuid,project_id uuid,title text NOT NULL CHECK(length(title) BETWEEN 1 AND 180),amount_minor bigint NOT NULL DEFAULT 0 CHECK(amount_minor BETWEEN 0 AND 9000000000000),currency text NOT NULL DEFAULT 'BRL' CHECK(currency IN ('BRL','USD')),stage text NOT NULL DEFAULT 'LEAD' CHECK(stage IN ('LEAD','QUALIFIED','PROPOSAL','CONTRACT_PENDING','WON','LOST')),notes text NOT NULL DEFAULT '',
 version integer NOT NULL DEFAULT 1 CHECK(version>0),created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),FOREIGN KEY(tenant_id,client_id) REFERENCES ab_aio.clients(tenant_id,id),FOREIGN KEY(tenant_id,project_id) REFERENCES ab_aio.projects(tenant_id,id),CHECK(length(notes)<=4000));
CREATE TABLE ab_aio.ledger_entries(
 id uuid PRIMARY KEY,tenant_id uuid NOT NULL REFERENCES ab_aio.tenants,project_id uuid,title text NOT NULL CHECK(length(title) BETWEEN 1 AND 180),direction text NOT NULL CHECK(direction IN ('income','expense')),amount_minor bigint NOT NULL CHECK(amount_minor BETWEEN 1 AND 9000000000000),currency text NOT NULL CHECK(currency IN ('BRL','USD')),due_date date,recorded_date date,status text NOT NULL DEFAULT 'expected' CHECK(status IN ('expected','recorded','cancelled')),evidence_ref text,notes text NOT NULL DEFAULT '',
 version integer NOT NULL DEFAULT 1 CHECK(version>0),created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),FOREIGN KEY(tenant_id,project_id) REFERENCES ab_aio.projects(tenant_id,id),CHECK(status<>'recorded' OR (recorded_date IS NOT NULL AND length(coalesce(evidence_ref,''))>0)),CHECK(length(notes)<=4000));
COMMENT ON TABLE ab_aio.ledger_entries IS 'Registros gerenciais declarados. Não é saldo bancário, contabilidade de partidas dobradas, ordem de pagamento ou NFS-e.';
CREATE TABLE ab_aio.domains(
 id uuid PRIMARY KEY,tenant_id uuid NOT NULL REFERENCES ab_aio.tenants,project_id uuid,name text NOT NULL CHECK(length(name)<=253 AND name ~ '^([a-z0-9][a-z0-9-]*\.)+[a-z]{2,63}$'),registrar text NOT NULL DEFAULT '',dns_provider text NOT NULL DEFAULT '',expires_on date,notes text NOT NULL DEFAULT '',
 version integer NOT NULL DEFAULT 1 CHECK(version>0),created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),FOREIGN KEY(tenant_id,project_id) REFERENCES ab_aio.projects(tenant_id,id),UNIQUE(tenant_id,name),CHECK(length(notes)<=4000));
CREATE TABLE ab_aio.harness_runs(
 id uuid PRIMARY KEY,tenant_id uuid NOT NULL REFERENCES ab_aio.tenants,project_id uuid NOT NULL,commit_sha text NOT NULL CHECK(commit_sha ~ '^([a-f0-9]{40}|[a-f0-9]{64})$'),status text NOT NULL CHECK(status IN ('QUEUED','RUNNING','PASSED','FAILED','CANCELLED')),total_assertions integer NOT NULL CHECK(total_assertions>=0),passed_assertions integer NOT NULL CHECK(passed_assertions>=0),failed_assertions integer NOT NULL CHECK(failed_assertions>=0),skipped_assertions integer NOT NULL DEFAULT 0 CHECK(skipped_assertions>=0),execution_time_ms integer NOT NULL CHECK(execution_time_ms>=0),source_ref text NOT NULL,
 version integer NOT NULL DEFAULT 1 CHECK(version>0),created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),FOREIGN KEY(tenant_id,project_id) REFERENCES ab_aio.projects(tenant_id,id),CHECK(passed_assertions::bigint+failed_assertions+skipped_assertions<=total_assertions),CHECK(status<>'PASSED' OR (failed_assertions=0 AND passed_assertions::bigint+skipped_assertions=total_assertions)));
CREATE TABLE ab_aio.llm_usage(
 id uuid PRIMARY KEY,tenant_id uuid NOT NULL REFERENCES ab_aio.tenants,project_id uuid NOT NULL,provider text NOT NULL,model_name text NOT NULL,event_id text NOT NULL,prompt_tokens bigint NOT NULL CHECK(prompt_tokens BETWEEN 0 AND 9000000000000),completion_tokens bigint NOT NULL CHECK(completion_tokens BETWEEN 0 AND 9000000000000),cached_input_tokens bigint NOT NULL DEFAULT 0 CHECK(cached_input_tokens>=0 AND cached_input_tokens<=prompt_tokens),cost_microusd bigint CHECK(cost_microusd BETWEEN 0 AND 9000000000000),latency_ms integer NOT NULL CHECK(latency_ms>=0),occurred_at timestamptz NOT NULL,
 version integer NOT NULL DEFAULT 1 CHECK(version>0),created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),FOREIGN KEY(tenant_id,project_id) REFERENCES ab_aio.projects(tenant_id,id),UNIQUE(tenant_id,provider,event_id));
CREATE TABLE ab_aio.affiliate_events(
 id uuid PRIMARY KEY,tenant_id uuid NOT NULL REFERENCES ab_aio.tenants,project_id uuid,platform text NOT NULL CHECK(platform IN ('SHOPEE','MERCADO_LIVRE','AMAZON','ALIEXPRESS')),event_id text NOT NULL,commission_minor bigint NOT NULL CHECK(commission_minor BETWEEN 0 AND 9000000000000),currency text NOT NULL CHECK(currency IN ('BRL','USD')),status text NOT NULL CHECK(status IN ('provisional','confirmed','reversed')),occurred_at timestamptz NOT NULL,source_ref text NOT NULL,
 version integer NOT NULL DEFAULT 1 CHECK(version>0),created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),FOREIGN KEY(tenant_id,project_id) REFERENCES ab_aio.projects(tenant_id,id),UNIQUE(tenant_id,platform,event_id));
CREATE TABLE ab_aio.documents(
 id uuid PRIMARY KEY,tenant_id uuid NOT NULL REFERENCES ab_aio.tenants,project_id uuid,title text NOT NULL CHECK(length(title) BETWEEN 1 AND 180),kind text NOT NULL CHECK(kind IN ('study','contract','fiscal','evidence')),status text NOT NULL CHECK(status IN ('draft','received','archived')),external_ref text NOT NULL,sha256 text CHECK(sha256 IS NULL OR sha256 ~ '^[a-f0-9]{64}$'),
 version integer NOT NULL DEFAULT 1 CHECK(version>0),created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),FOREIGN KEY(tenant_id,project_id) REFERENCES ab_aio.projects(tenant_id,id));
CREATE TABLE ab_aio.audit_log(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,tenant_id uuid NOT NULL REFERENCES ab_aio.tenants,actor_id uuid NOT NULL REFERENCES ab_aio.actors,resource text NOT NULL,record_id uuid NOT NULL,operation text NOT NULL,version integer NOT NULL,request_id uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp());
CREATE TABLE ab_aio.command_receipts(tenant_id uuid NOT NULL REFERENCES ab_aio.tenants,actor_id uuid NOT NULL REFERENCES ab_aio.actors,command_id uuid NOT NULL,request_hash text NOT NULL,response jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(tenant_id,actor_id,command_id));
CREATE TABLE ab_aio.outbox(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,tenant_id uuid NOT NULL REFERENCES ab_aio.tenants,event_type text NOT NULL,aggregate_id uuid NOT NULL,aggregate_version integer NOT NULL,payload jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),delivered_at timestamptz,UNIQUE(tenant_id,aggregate_id,aggregate_version));
CREATE INDEX tasks_board ON ab_aio.tasks(tenant_id,state,due_date,id);
CREATE INDEX projects_client ON ab_aio.projects(tenant_id,client_id);
CREATE INDEX deals_stage ON ab_aio.deals(tenant_id,stage,currency);
CREATE INDEX ledger_due ON ab_aio.ledger_entries(tenant_id,status,due_date);
CREATE INDEX llm_time ON ab_aio.llm_usage(tenant_id,project_id,occurred_at DESC);
CREATE INDEX llm_brin ON ab_aio.llm_usage USING brin(occurred_at);
CREATE INDEX outbox_pending ON ab_aio.outbox(tenant_id,id) WHERE delivered_at IS NULL;
CREATE INDEX audit_time ON ab_aio.audit_log(tenant_id,id DESC);
-- Identidade é estabelecida pelo backend autenticado, não por um valor enviado livremente pelo navegador.
CREATE FUNCTION ab_aio.enter_context(p_actor uuid,p_tenant uuid,p_write boolean) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT EXISTS(SELECT FROM ab_aio.memberships m JOIN ab_aio.actors a ON a.id=m.actor_id WHERE a.id=p_actor AND a.enabled AND m.enabled AND m.tenant_id=p_tenant AND (NOT p_write OR m.role IN ('owner','editor'))) THEN RAISE EXCEPTION 'ACCESS_DENIED' USING ERRCODE='42501'; END IF;
 PERFORM set_config('ab_aio.tenant',p_tenant::text,true);PERFORM set_config('ab_aio.actor',p_actor::text,true);
END $$;
REVOKE ALL ON FUNCTION ab_aio.enter_context(uuid,uuid,boolean) FROM PUBLIC;
GRANT USAGE ON SCHEMA ab_aio TO ab_aio_executor;
GRANT EXECUTE ON FUNCTION ab_aio.enter_context(uuid,uuid,boolean) TO ab_aio_executor;
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['clients','projects','tasks','deals','ledger_entries','domains','harness_runs','llm_usage','affiliate_events','documents','audit_log','command_receipts','outbox'] LOOP
  EXECUTE format('ALTER TABLE ab_aio.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('ALTER TABLE ab_aio.%I FORCE ROW LEVEL SECURITY',t);
  EXECUTE format('CREATE POLICY tenant_scope ON ab_aio.%I TO ab_aio_executor USING (tenant_id=NULLIF(current_setting(''ab_aio.tenant'',true),'''')::uuid) WITH CHECK (tenant_id=NULLIF(current_setting(''ab_aio.tenant'',true),'''')::uuid)',t);
  EXECUTE format('GRANT SELECT,INSERT ON ab_aio.%I TO ab_aio_executor',t);
  IF t NOT IN ('audit_log','command_receipts','outbox') THEN
   EXECUTE format('GRANT UPDATE ON ab_aio.%I TO ab_aio_executor',t);
   EXECUTE format('CREATE INDEX ON ab_aio.%I(tenant_id,updated_at DESC,id DESC)',t);
  END IF;
 END LOOP;
END $$;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA ab_aio TO ab_aio_executor;
CREATE FUNCTION public.ab_aio_list(p_actor uuid,p_tenant uuid,p_resource text,p_before timestamptz DEFAULT NULL,p_before_id uuid DEFAULT NULL,p_limit integer DEFAULT 100) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET statement_timeout='5s' AS $$
DECLARE result jsonb; total bigint;
BEGIN
 PERFORM ab_aio.enter_context(p_actor,p_tenant,false);
 IF p_resource NOT IN ('clients','projects','tasks','deals','ledger_entries','domains','harness_runs','llm_usage','affiliate_events','documents','audit_log') OR p_limit<1 OR p_limit>200 THEN RAISE EXCEPTION 'RESOURCE_INVALID' USING ERRCODE='22023'; END IF;
 IF p_resource='audit_log' THEN SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') INTO result FROM (SELECT * FROM ab_aio.audit_log ORDER BY id DESC LIMIT p_limit) x;RETURN jsonb_build_object('items',result,'limit',p_limit,'bounded',true);END IF;
 IF (p_before IS NULL)<>(p_before_id IS NULL) THEN RAISE EXCEPTION 'CURSOR_INVALID' USING ERRCODE='22023';END IF;
 EXECUTE format('SELECT coalesce(jsonb_agg(to_jsonb(x)),''[]'') FROM (SELECT * FROM ab_aio.%I WHERE ($1::timestamptz IS NULL OR (updated_at,id)<($1,$2::uuid)) ORDER BY updated_at DESC,id DESC LIMIT $3) x',p_resource) INTO result USING p_before,p_before_id,p_limit;
 EXECUTE format('SELECT count(*) FROM ab_aio.%I',p_resource) INTO total;
 RETURN jsonb_build_object('items',result,'total',total,'limit',p_limit);
END $$;
CREATE FUNCTION public.ab_aio_overview(p_actor uuid,p_tenant uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET statement_timeout='5s' AS $$
DECLARE counts jsonb; finance jsonb; costs jsonb;
BEGIN
 PERFORM ab_aio.enter_context(p_actor,p_tenant,false);
 SELECT jsonb_build_object('projects',(SELECT count(*) FROM ab_aio.projects),'activeProjects',(SELECT count(*) FROM ab_aio.projects WHERE state<>'archived'),'clients',(SELECT count(*) FROM ab_aio.clients),'tasks',(SELECT count(*) FROM ab_aio.tasks),'blocked',(SELECT count(*) FROM ab_aio.tasks WHERE state='blocked'),'overdue',(SELECT count(*) FROM ab_aio.tasks WHERE due_date<current_date AND state NOT IN ('done','cancelled')),'deals',(SELECT count(*) FROM ab_aio.deals),'domains',(SELECT count(*) FROM ab_aio.domains),'documents',(SELECT count(*) FROM ab_aio.documents)) INTO counts;
 SELECT coalesce(jsonb_agg(x),'[]') INTO finance FROM (SELECT currency,direction,status,sum(amount_minor)::text AS amount_minor FROM ab_aio.ledger_entries GROUP BY currency,direction,status) x;
 SELECT jsonb_build_object('requests',count(*),'tokens',coalesce(sum(prompt_tokens+completion_tokens),0)::text,'known_cost_microusd',coalesce(sum(cost_microusd),0)::text,'unpriced',count(*) FILTER(WHERE cost_microusd IS NULL)) INTO costs FROM ab_aio.llm_usage;
 RETURN jsonb_build_object('schema',1,'at',clock_timestamp(),'counts',counts,'finance',finance,'llm',costs);
END $$;
CREATE FUNCTION public.ab_aio_command(p_actor uuid,p_tenant uuid,p_resource text,p_command uuid,p_id uuid,p_version integer,p_data jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET statement_timeout='8s' SET lock_timeout='3s' AS $$
DECLARE allowed text[];defaults jsonb;old_row jsonb;new_row jsonb;result jsonb;receipt ab_aio.command_receipts%ROWTYPE;h text;rid uuid;ver integer;now_at timestamptz:=clock_timestamp();
BEGIN
 PERFORM ab_aio.enter_context(p_actor,p_tenant,true);
 IF p_command IS NULL OR jsonb_typeof(p_data)<>'object' OR octet_length(p_data::text)>16384 OR (p_id IS NULL)<>(p_version IS NULL) THEN RAISE EXCEPTION 'COMMAND_INVALID' USING ERRCODE='22023'; END IF;
 CASE p_resource
 WHEN 'clients' THEN allowed:=ARRAY['name','document','email','notes','is_active'];defaults:='{"notes":"","is_active":true}';
 WHEN 'projects' THEN allowed:=ARRAY['name','client_id','description','state','priority','due_date','repository_url','study_slug'];defaults:='{"description":"","state":"discovery","priority":2}';
 WHEN 'tasks' THEN allowed:=ARRAY['project_id','title','notes','state','priority','due_date'];defaults:='{"notes":"","state":"backlog","priority":2}';
 WHEN 'deals' THEN allowed:=ARRAY['client_id','project_id','title','amount_minor','currency','stage','notes'];defaults:='{"amount_minor":0,"currency":"BRL","stage":"LEAD","notes":""}';
 WHEN 'ledger_entries' THEN allowed:=ARRAY['project_id','title','direction','amount_minor','currency','due_date','recorded_date','status','evidence_ref','notes'];defaults:='{"currency":"BRL","status":"expected","notes":""}';
 WHEN 'domains' THEN allowed:=ARRAY['project_id','name','registrar','dns_provider','expires_on','notes'];defaults:='{"registrar":"","dns_provider":"","notes":""}';
 WHEN 'harness_runs' THEN allowed:=ARRAY['project_id','commit_sha','status','total_assertions','passed_assertions','failed_assertions','skipped_assertions','execution_time_ms','source_ref'];defaults:='{"skipped_assertions":0}';
 WHEN 'llm_usage' THEN allowed:=ARRAY['project_id','provider','model_name','event_id','prompt_tokens','completion_tokens','cached_input_tokens','cost_microusd','latency_ms','occurred_at'];defaults:='{"cached_input_tokens":0}';
 WHEN 'affiliate_events' THEN allowed:=ARRAY['project_id','platform','event_id','commission_minor','currency','status','occurred_at','source_ref'];defaults:='{"currency":"BRL"}';
 WHEN 'documents' THEN allowed:=ARRAY['project_id','title','kind','status','external_ref','sha256'];defaults:='{"status":"received"}';
 ELSE RAISE EXCEPTION 'RESOURCE_INVALID' USING ERRCODE='22023';END CASE;
 IF EXISTS(SELECT FROM jsonb_object_keys(p_data) k WHERE NOT k=ANY(allowed)) OR p_data='{}' THEN RAISE EXCEPTION 'FIELDS_INVALID' USING ERRCODE='22023';END IF;
 h:=encode(sha256(convert_to(jsonb_build_object('resource',p_resource,'id',p_id,'version',p_version,'data',p_data)::text,'UTF8')),'hex');
 PERFORM pg_advisory_xact_lock(hashtextextended(p_tenant::text||p_actor::text||p_command::text,0));
 SELECT * INTO receipt FROM ab_aio.command_receipts WHERE tenant_id=p_tenant AND actor_id=p_actor AND command_id=p_command;
 IF FOUND THEN IF receipt.request_hash<>h THEN RAISE EXCEPTION 'IDEMPOTENCY_CONFLICT' USING ERRCODE='P0001';END IF;RETURN receipt.response;END IF;
 IF p_id IS NOT NULL THEN
  EXECUTE format('SELECT to_jsonb(t) FROM ab_aio.%I t WHERE id=$1 FOR UPDATE',p_resource) INTO old_row USING p_id;
  IF old_row IS NULL THEN RAISE EXCEPTION 'RECORD_NOT_FOUND' USING ERRCODE='P0002';END IF;
  IF (old_row->>'version')::integer<>p_version THEN RAISE EXCEPTION 'VERSION_CONFLICT' USING ERRCODE='P0001';END IF;
  IF p_resource IN ('llm_usage','harness_runs') THEN RAISE EXCEPTION 'APPEND_ONLY_RESOURCE' USING ERRCODE='22023';END IF;
 END IF;
 rid:=coalesce(p_id,gen_random_uuid());ver:=coalesce(p_version,0)+1;
 new_row:=coalesce(old_row,defaults)||p_data||jsonb_build_object('id',rid,'tenant_id',p_tenant,'version',ver,'created_at',coalesce(old_row->'created_at',to_jsonb(now_at)),'updated_at',now_at);
 IF p_id IS NULL THEN
  EXECUTE format('INSERT INTO ab_aio.%I SELECT (jsonb_populate_record(NULL::ab_aio.%I,$1)).* RETURNING to_jsonb(%I.*)',p_resource,p_resource,p_resource) INTO result USING new_row;
 ELSE
  EXECUTE format('UPDATE ab_aio.%I t SET (%s)=(SELECT %s FROM jsonb_populate_record(NULL::ab_aio.%I,$1) r) WHERE t.id=$2 RETURNING to_jsonb(t.*)',p_resource,(SELECT string_agg(quote_ident(x),',') FROM unnest(allowed||ARRAY['version','updated_at']) x),(SELECT string_agg('r.'||quote_ident(x),',') FROM unnest(allowed||ARRAY['version','updated_at']) x),p_resource) INTO result USING new_row,rid;
 END IF;
 INSERT INTO ab_aio.audit_log(tenant_id,actor_id,resource,record_id,operation,version,request_id) VALUES(p_tenant,p_actor,p_resource,rid,CASE WHEN p_id IS NULL THEN 'create' ELSE 'update' END,ver,p_command);
 INSERT INTO ab_aio.outbox(tenant_id,event_type,aggregate_id,aggregate_version,payload) VALUES(p_tenant,p_resource||'.changed',rid,ver,jsonb_build_object('resource',p_resource,'id',rid,'version',ver));
 INSERT INTO ab_aio.command_receipts VALUES(p_tenant,p_actor,p_command,h,result,now_at);
 RETURN result;
END $$;
ALTER FUNCTION public.ab_aio_list(uuid,uuid,text,timestamptz,uuid,integer) OWNER TO ab_aio_executor;
ALTER FUNCTION public.ab_aio_overview(uuid,uuid) OWNER TO ab_aio_executor;
ALTER FUNCTION public.ab_aio_command(uuid,uuid,text,uuid,uuid,integer,jsonb) OWNER TO ab_aio_executor;
REVOKE ALL ON FUNCTION public.ab_aio_list(uuid,uuid,text,timestamptz,uuid,integer),public.ab_aio_overview(uuid,uuid),public.ab_aio_command(uuid,uuid,text,uuid,uuid,integer,jsonb) FROM PUBLIC;
DO $$ BEGIN
 IF EXISTS(SELECT FROM pg_roles WHERE rolname='service_role') THEN
  GRANT EXECUTE ON FUNCTION public.ab_aio_list(uuid,uuid,text,timestamptz,uuid,integer),public.ab_aio_overview(uuid,uuid),public.ab_aio_command(uuid,uuid,text,uuid,uuid,integer,jsonb) TO service_role;
 END IF;
END $$;
COMMIT;
