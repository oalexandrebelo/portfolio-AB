import {z} from 'zod';
import {Failure} from './fault';
import {readText} from './io';

export type RpcName = 'ab_aio_list' | 'ab_aio_overview' | 'ab_aio_command' | 'ab_aio_receipt' | 'ab_aio_lookup';
const DatabaseError = z.object({code: z.string(), message: z.string()});
const rejectedCodes = new Set(['23503', '23505', '23514', '23502', '22023', '22P02', '22007', '22008', '22001']);

export function databaseConfigured(): boolean {
  return Boolean(process.env.AB_ALLINONE_SUPABASE_URL && process.env.AB_ALLINONE_SERVICE_KEY);
}

/** Uma resposta HTTP 200 não basta: somente um contrato válido confirma sucesso. */
export async function decodeDatabaseResponse<T>(response: Response, mutating: boolean, validate: (value: unknown) => T): Promise<T> {
  let value: unknown;
  try {
    if (!/^application\/json(?:;|$)/i.test(response.headers.get('content-type') ?? '')) throw new Error('TYPE');
    const declared = response.headers.get('content-length');
    if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > 2_000_000)) throw new Error('LENGTH');
    value = JSON.parse(await readText(response.body, 2_000_000, 8000));
  } catch {
    throw new Failure('DATABASE_RESPONSE_INVALID', 502, mutating);
  }
  if (!response.ok) {
    const parsed = DatabaseError.safeParse(value);
    if (!parsed.success) throw new Failure('DATABASE_RESPONSE_INVALID', 502, mutating);
    const {code, message} = parsed.data;
    if (code === '42501') throw new Failure('ACCESS_DENIED', 403);
    if (code === 'P0001' && ['VERSION_CONFLICT', 'IDEMPOTENCY_CONFLICT'].includes(message)) throw new Failure(message, 409);
    if (code === 'P0002') throw new Failure('RECORD_NOT_FOUND', 404);
    if (code==='23514' && ['RECORD_FINALIZED','EVENT_FINALIZED','APPEND_ONLY_RESOURCE'].includes(message)) throw new Failure(message,409);
    if (rejectedCodes.has(code)) throw new Failure('RECORD_INVALID', 422);
    if (['40001', '40P01', '55P03', '57014'].includes(code)) throw new Failure('TRANSACTION_RETRY', 503);
    throw new Failure('DATABASE_UNAVAILABLE', 503, mutating);
  }
  try { return validate(value); }
  catch { throw new Failure('DATABASE_RESPONSE_INVALID', 502, mutating); }
}

export async function rpc<T>(name: RpcName, params: Record<string, unknown>, validate: (value: unknown) => T): Promise<T> {
  if (!databaseConfigured()) throw new Failure('DATABASE_NOT_CONNECTED', 503);
  let root: URL;
  try { root = new URL(process.env.AB_ALLINONE_SUPABASE_URL!); }
  catch { throw new Failure('DATABASE_CONFIGURATION', 503); }
  if (root.protocol !== 'https:' || root.username || root.password || root.pathname !== '/' || root.search || root.hash) {
    throw new Failure('DATABASE_CONFIGURATION', 503);
  }
  const mutating = name === 'ab_aio_command';
  const requestBody = JSON.stringify(params);
  let response: Response;
  try {
    response = await fetch(new URL('/rest/v1/rpc/' + name, root), {
      method: 'POST', redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(8000),
      headers: {'content-type': 'application/json', apikey: process.env.AB_ALLINONE_SERVICE_KEY!, authorization: 'Bearer ' + process.env.AB_ALLINONE_SERVICE_KEY!},
      body: requestBody,
    });
  } catch { throw new Failure('DATABASE_UNAVAILABLE', 503, mutating); }
  return decodeDatabaseResponse(response, mutating, validate);
}
