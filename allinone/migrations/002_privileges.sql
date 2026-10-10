-- Executar após 001_core.sql, antes de configurar o backend em produção.
-- Revoga concessões diretas que podem ser herdadas de default privileges do ambiente.
BEGIN;
REVOKE ALL ON SCHEMA ab_aio FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA ab_aio FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA ab_aio FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA ab_aio FROM PUBLIC;
DO $$ DECLARE r text; BEGIN
 FOREACH r IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
  IF EXISTS(SELECT FROM pg_roles WHERE rolname=r) THEN
   EXECUTE format('REVOKE ALL ON SCHEMA ab_aio FROM %I',r);
   EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA ab_aio FROM %I',r);
   EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA ab_aio FROM %I',r);
   EXECUTE format('REVOKE ALL ON ALL FUNCTIONS IN SCHEMA ab_aio FROM %I',r);
  END IF;
 END LOOP;
 FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
  IF EXISTS(SELECT FROM pg_roles WHERE rolname=r) THEN
   EXECUTE format('REVOKE ALL ON FUNCTION public.ab_aio_list(uuid,uuid,text,timestamptz,uuid,integer),public.ab_aio_overview(uuid,uuid),public.ab_aio_command(uuid,uuid,text,uuid,uuid,integer,jsonb) FROM %I',r);
  END IF;
 END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.ab_aio_list(uuid,uuid,text,timestamptz,uuid,integer),public.ab_aio_overview(uuid,uuid),public.ab_aio_command(uuid,uuid,text,uuid,uuid,integer,jsonb) FROM PUBLIC;
DO $$ BEGIN
 IF EXISTS(SELECT FROM pg_roles WHERE rolname='service_role') THEN
  GRANT EXECUTE ON FUNCTION public.ab_aio_list(uuid,uuid,text,timestamptz,uuid,integer),public.ab_aio_overview(uuid,uuid),public.ab_aio_command(uuid,uuid,text,uuid,uuid,integer,jsonb) TO service_role;
 END IF;
END $$;
COMMENT ON FUNCTION public.ab_aio_command(uuid,uuid,text,uuid,uuid,integer,jsonb) IS 'Entrada exclusiva do backend autenticado. p_actor vem da sessão administrativa; nunca disponibilizar service_role ao navegador. Função executa sob papel NOLOGIN e NOBYPASSRLS.';
COMMIT;
