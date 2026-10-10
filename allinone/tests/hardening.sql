-- Dados sintéticos locais, transação completamente revertida. Sem CNPJ ou CPF real.
BEGIN;
INSERT INTO ab_aio.tenants(id,name,legal_key,timezone) VALUES
 ('10000000-0000-4000-8000-000000000011','R2 A','R2_A','America/Sao_Paulo'),
 ('10000000-0000-4000-8000-000000000012','R2 B','R2_B','America/Cuiaba');
INSERT INTO ab_aio.actors VALUES('20000000-0000-4000-8000-000000000011','R2 editor',true),('20000000-0000-4000-8000-000000000012','R2 leitor',true);
INSERT INTO ab_aio.memberships VALUES
 ('10000000-0000-4000-8000-000000000011','20000000-0000-4000-8000-000000000011','editor',true),
 ('10000000-0000-4000-8000-000000000012','20000000-0000-4000-8000-000000000011','editor',true),
 ('10000000-0000-4000-8000-000000000011','20000000-0000-4000-8000-000000000012','viewer',true);
DO $$
DECLARE a uuid:='20000000-0000-4000-8000-000000000011'; v uuid:='20000000-0000-4000-8000-000000000012';t uuid:='10000000-0000-4000-8000-000000000011';b uuid:='10000000-0000-4000-8000-000000000012';c1 jsonb;c2 jsonb;p jsonb;e jsonb;f jsonb;l jsonb;k uuid:=gen_random_uuid();before_count bigint;
BEGIN
 c1:=public.ab_aio_command(a,t,'clients',k,NULL,NULL,'{"name":"Cliente um"}');
 c2:=public.ab_aio_command(a,t,'clients',gen_random_uuid(),NULL,NULL,'{"name":"Cliente dois"}');
 p:=public.ab_aio_command(a,t,'projects',gen_random_uuid(),NULL,NULL,jsonb_build_object('name','Projeto','client_id',c1->>'id'));
 BEGIN
  PERFORM public.ab_aio_command(a,t,'deals',gen_random_uuid(),NULL,NULL,jsonb_build_object('title','Proposta incompatível','client_id',c2->>'id','project_id',p->>'id'));
  RAISE EXCEPTION 'EXPECT_RELATION_DENIED';
 EXCEPTION WHEN foreign_key_violation THEN NULL;END;
 PERFORM public.ab_aio_command(a,t,'deals',gen_random_uuid(),NULL,NULL,jsonb_build_object('title','Proposta válida','client_id',c1->>'id','project_id',p->>'id'));
 BEGIN
  PERFORM public.ab_aio_command(a,t,'projects',gen_random_uuid(),(p->>'id')::uuid,1,jsonb_build_object('client_id',c2->>'id'));
  RAISE EXCEPTION 'EXPECT_PARENT_REASSIGN_DENIED';
 EXCEPTION WHEN foreign_key_violation THEN NULL;END;
 e:=public.ab_aio_command(a,t,'ledger_entries',gen_random_uuid(),NULL,NULL,'{"title":"Receita declarada","direction":"income","amount_minor":10099,"status":"recorded","recorded_date":"2026-10-10","evidence_ref":"fixture"}');
 SELECT count(*) INTO before_count FROM ab_aio.audit_log WHERE tenant_id=t;
 BEGIN PERFORM public.ab_aio_command(a,t,'ledger_entries',gen_random_uuid(),(e->>'id')::uuid,1,'{"amount_minor":20099}'); RAISE EXCEPTION 'EXPECT_FINALIZED';EXCEPTION WHEN check_violation THEN ASSERT SQLERRM='RECORD_FINALIZED';END;
 ASSERT (SELECT count(*) FROM ab_aio.audit_log WHERE tenant_id=t)=before_count,'REJECT_NO_AUDIT_SIDE_EFFECT';
 BEGIN PERFORM public.ab_aio_command(a,t,'ledger_entries',gen_random_uuid(),(e->>'id')::uuid,1,'{"status":"expected"}'); RAISE EXCEPTION 'EXPECT_NO_REOPEN';EXCEPTION WHEN check_violation THEN NULL;END;
 BEGIN PERFORM public.ab_aio_command(a,t,'ledger_entries',gen_random_uuid(),(e->>'id')::uuid,1,'{"status":"cancelled","notes":"   "}'); RAISE EXCEPTION 'EXPECT_REASON';EXCEPTION WHEN check_violation THEN NULL;END;
 e:=public.ab_aio_command(a,t,'ledger_entries',gen_random_uuid(),(e->>'id')::uuid,1,'{"status":"cancelled","notes":"Correção documentada de teste"}');
 ASSERT e->>'version'='2','FINALIZED_CANCELLED_WITH_REASON';
 BEGIN PERFORM public.ab_aio_command(a,t,'ledger_entries',gen_random_uuid(),(e->>'id')::uuid,2,'{"status":"recorded"}'); RAISE EXCEPTION 'EXPECT_CANCELLED_TERMINAL';EXCEPTION WHEN check_violation THEN NULL;END;
 f:=public.ab_aio_command(a,t,'affiliate_events',gen_random_uuid(),NULL,NULL,'{"platform":"AMAZON","event_id":"fixture","commission_minor":100,"currency":"BRL","status":"confirmed","occurred_at":"2026-10-10T00:00:00Z","source_ref":"fixture"}');
 BEGIN PERFORM public.ab_aio_command(a,t,'affiliate_events',gen_random_uuid(),(f->>'id')::uuid,1,'{"commission_minor":1000}'); RAISE EXCEPTION 'EXPECT_EVENT_FROZEN';EXCEPTION WHEN check_violation THEN NULL;END;
 f:=public.ab_aio_command(a,t,'affiliate_events',gen_random_uuid(),(f->>'id')::uuid,1,'{"status":"reversed"}');
 ASSERT f->>'status'='reversed';
 ASSERT public.ab_aio_receipt(a,t,k)->>'state'='committed','RECEIPT_FOUND';
 ASSERT public.ab_aio_receipt(a,b,k)->>'state'='not_observed','RECEIPT_TENANT_SCOPE';
 ASSERT public.ab_aio_receipt(v,t,k)->>'state'='not_observed','RECEIPT_ACTOR_SCOPE';
 ASSERT public.ab_aio_receipt(a,t,gen_random_uuid())->>'state'='not_observed','ABSENCE_EXPLICIT';
 INSERT INTO ab_aio.clients(id,tenant_id,name) SELECT gen_random_uuid(),t,'Referência '||lpad(g::text,3,'0') FROM generate_series(1,125)g;
 INSERT INTO ab_aio.clients(id,tenant_id,name) VALUES(gen_random_uuid(),t,'Busca Alvo tardio'),(gen_random_uuid(),t,'Literal %_ sem wildcard');
 INSERT INTO ab_aio.clients(id,tenant_id,name) VALUES(gen_random_uuid(),b,'Busca Alvo outra organização');
 l:=public.ab_aio_lookup(a,t,'clients','Busca Alvo');
 ASSERT jsonb_array_length(l->'items')=1,'LOOKUP_NOT_LIMITED_TO_FIRST_PAGE';
 ASSERT l->'items'->0->>'name'='Busca Alvo tardio';
 ASSERT jsonb_array_length(public.ab_aio_lookup(a,t,'clients','%_')->'items')=1,'LOOKUP_LITERAL_WILDCARDS';
 l:=public.ab_aio_list(a,t,'clients',NULL,NULL,100);
 ASSERT (l->>'has_more')::boolean AND jsonb_array_length(l->'items')=100,'HAS_MORE_REAL';
 l:=public.ab_aio_list(a,t,'clients',(l->'items'->99->>'updated_at')::timestamptz,(l->'items'->99->>'id')::uuid,100);
 ASSERT NOT (l->>'has_more')::boolean AND jsonb_array_length(l->'items')=29,'LAST_PAGE_REAL';
 ASSERT public.ab_aio_overview(a,t)->>'schema_revision'='3','SCHEMA_REVISION';
 ASSERT public.ab_aio_overview(a,t)->>'business_timezone'='America/Sao_Paulo','TENANT_TIMEZONE_A';
 ASSERT public.ab_aio_overview(a,b)->>'business_timezone'='America/Cuiaba','TENANT_TIMEZONE_B';
 BEGIN PERFORM public.ab_aio_lookup(a,t,'pg_roles','xx');RAISE EXCEPTION 'EXPECT_LOOKUP_ALLOWLIST';EXCEPTION WHEN invalid_parameter_value THEN NULL;END;
 RAISE NOTICE 'ALLinONE R2: vínculos comerciais, financeiro finalizado, comissões, recibos, lookup, paginação e fuso aprovados';
END $$;
ROLLBACK;
