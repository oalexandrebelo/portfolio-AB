#!/usr/bin/env python3
"""Teste destrutivo exclusivamente em banco local descartável terminado em _test."""
from concurrent.futures import ThreadPoolExecutor
import json
import os
import subprocess
import uuid
from urllib.parse import urlparse

URL = os.environ.get('AIO_TEST_DATABASE_URL', '')
u = urlparse(URL)
if u.scheme not in ('postgres', 'postgresql') or u.hostname not in ('localhost', '127.0.0.1') or not u.path.endswith('_test'):
    raise SystemExit('Use AIO_TEST_DATABASE_URL de um PostgreSQL local cujo banco termine em _test.')

def sql(text, allow_error=False):
    result = subprocess.run(['psql', URL, '-X', '-q', '-A', '-t', '-v', 'ON_ERROR_STOP=1'], input=text, text=True, capture_output=True, timeout=25)
    if result.returncode and not allow_error:
        raise RuntimeError(result.stderr)
    return result

def quoted(value):
    return "'" + str(value).replace("'", "''") + "'"

tenant, actor, replay_id = map(str, (uuid.uuid4(), uuid.uuid4(), uuid.uuid4()))

def command(command_id, row_id=None, version=None, title='Cliente de concorrência'):
    args = [quoted(actor), quoted(tenant), "'clients'", quoted(command_id), quoted(row_id) if row_id else 'NULL', str(version) if version else 'NULL', quoted(json.dumps({'name': title})) + '::jsonb']
    return sql('SELECT public.ab_aio_command(' + ','.join(args) + ');', allow_error=True)

try:
    sql(f"INSERT INTO ab_aio.tenants VALUES('{tenant}','Teste concorrente','{tenant}',NULL,false); INSERT INTO ab_aio.actors VALUES('{actor}','Ator de teste',true); INSERT INTO ab_aio.memberships VALUES('{tenant}','{actor}','editor',true);")
    with ThreadPoolExecutor(max_workers=8) as pool:
        results = list(pool.map(lambda _: command(replay_id), range(16)))
    assert all(r.returncode == 0 for r in results), 'Todas as repetições legítimas devem retornar o mesmo sucesso.'
    records = [json.loads(r.stdout) for r in results]
    assert all(row == records[0] for row in records), 'Replay divergente.'
    record_id = records[0]['id']
    with ThreadPoolExecutor(max_workers=2) as pool:
        updates = list(pool.map(lambda text: command(str(uuid.uuid4()), record_id, 1, text), ['Edição simultânea A', 'Edição simultânea B']))
    assert sum(r.returncode == 0 for r in updates) == 1, 'Exatamente uma edição da versão 1 deve vencer.'
    assert any('VERSION_CONFLICT' in r.stderr for r in updates), 'A edição perdedora precisa de conflito explícito.'
    counts = json.loads(sql(f"SELECT json_build_object('rows',(SELECT count(*) FROM ab_aio.clients WHERE tenant_id='{tenant}'),'audit',(SELECT count(*) FROM ab_aio.audit_log WHERE tenant_id='{tenant}'),'outbox',(SELECT count(*) FROM ab_aio.outbox WHERE tenant_id='{tenant}'),'receipts',(SELECT count(*) FROM ab_aio.command_receipts WHERE tenant_id='{tenant}'),'version',(SELECT version FROM ab_aio.clients WHERE id='{record_id}'));").stdout)
    assert counts == {'rows': 1, 'audit': 2, 'outbox': 2, 'receipts': 2, 'version': 2}, counts
    print(json.dumps({'suite': 'AB-ALLinONE/PostgreSQL-concurrency', 'simultaneous_replays': 16, 'competing_edits': 2, 'result': 'passed', 'final': counts}))
finally:
    tables = ['audit_log', 'outbox', 'command_receipts', 'clients', 'memberships']
    cleanup = 'BEGIN;' + ''.join(f"DELETE FROM ab_aio.{table} WHERE tenant_id='{tenant}';" for table in tables) + f"DELETE FROM ab_aio.actors WHERE id='{actor}'; DELETE FROM ab_aio.tenants WHERE id='{tenant}'; COMMIT;"
    sql(cleanup)
