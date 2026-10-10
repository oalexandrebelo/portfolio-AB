#!/usr/bin/env python3
"""Somente PostgreSQL local de teste: verifica revogação concorrente sem dados reais."""
import json
import os
import selectors
import subprocess
import time
import uuid
from urllib.parse import urlparse

url=os.environ.get('AIO_TEST_DATABASE_URL','')
u=urlparse(url)
if u.scheme not in ('postgres','postgresql') or u.hostname not in ('127.0.0.1','localhost') or not u.path.endswith('_test'):
    raise SystemExit('Banco local terminado em _test obrigatório.')
args=['psql',url,'-X','-q','-A','-t','-v','ON_ERROR_STOP=1']
def sql(text):
    return subprocess.check_output(args,input=text,text=True,timeout=10).strip()

tenant,actor,command=[str(uuid.uuid4()) for _ in range(3)]
name='r2_revoke_'+uuid.uuid4().hex
active=None
revoker=None
try:
    sql(f"INSERT INTO ab_aio.tenants(id,name,legal_key) VALUES('{tenant}','Teste revogação','{tenant}');INSERT INTO ab_aio.actors VALUES('{actor}','Teste revogação',true);INSERT INTO ab_aio.memberships VALUES('{tenant}','{actor}','editor',true);")
    active=subprocess.Popen(args,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,bufsize=1)
    active.stdin.write(f"BEGIN;SELECT ab_aio.enter_context('{actor}','{tenant}',true);SELECT 'HELD';\n")
    active.stdin.flush()
    ready=False
    for _ in range(3):
        line=active.stdout.readline()
        if line.strip()=='HELD':
            ready=True
            break
    assert ready,'Contexto de autorização não adquirido.'
    revoker=subprocess.Popen(args+['-c',f"UPDATE ab_aio.memberships SET enabled=false WHERE tenant_id='{tenant}' AND actor_id='{actor}';"],env={**os.environ,'PGAPPNAME':name},stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
    blocked=False
    for _ in range(50):
        if sql(f"SELECT count(*) FROM pg_stat_activity WHERE application_name='{name}' AND wait_event_type='Lock';")=='1':
            blocked=True
            break
        time.sleep(0.02)
    assert blocked,'A revogação precisa aguardar a transação que já obteve autorização.'
    statement=f"SELECT public.ab_aio_command('{actor}','{tenant}','clients','{command}',NULL,NULL,'{{\"name\":\"Cliente sintético\"}}');COMMIT;\n"
    out,err=active.communicate(statement,timeout=10)
    assert active.returncode==0,err
    revoker.communicate(timeout=10)
    assert revoker.returncode==0,'Revogação não confirmada.'
    denied=subprocess.run(args,input=f"SELECT public.ab_aio_command('{actor}','{tenant}','clients','{uuid.uuid4()}',NULL,NULL,'{{\"name\":\"Não criar\"}}');",text=True,capture_output=True,timeout=10)
    assert denied.returncode!=0 and 'ACCESS_DENIED' in denied.stderr,'Nova operação não pode usar membership revogada.'
    counts=json.loads(sql(f"SELECT json_build_object('clients',(SELECT count(*) FROM ab_aio.clients WHERE tenant_id='{tenant}'),'audit',(SELECT count(*) FROM ab_aio.audit_log WHERE tenant_id='{tenant}'),'enabled',(SELECT enabled FROM ab_aio.memberships WHERE tenant_id='{tenant}' AND actor_id='{actor}'));"))
    assert counts=={'clients':1,'audit':1,'enabled':False},counts
    print(json.dumps({'suite':'ALLinONE-R2/revocation','checks':5,'state':'passed','semantics':'Operação já autorizada termina; revogação confirma depois; operações novas são negadas. Não é cancelamento retroativo.','result':counts}))
finally:
    for process in (active,revoker):
        if process and process.poll() is None:
            process.kill()
            process.wait(timeout=5)
    sql('BEGIN;'+''.join(f"DELETE FROM ab_aio.{table} WHERE tenant_id='{tenant}';" for table in ['audit_log','outbox','command_receipts','clients','memberships'])+f"DELETE FROM ab_aio.actors WHERE id='{actor}';DELETE FROM ab_aio.tenants WHERE id='{tenant}';COMMIT;")
