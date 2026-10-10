import {z} from 'zod';
import type {Admin, Auth} from './auth';
import {moduleGates, validateCommand, isResource, resources, type Resource} from './contracts';
import {Failure} from './fault';
import {databaseConfigured, rpc} from './transport';
export {Failure, failureResponse} from './fault';
export {databaseConfigured} from './transport';

const UUID = z.string().uuid();
const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const digits = z.string().regex(/^(?:0|[1-9]\d{0,39})$/);
const Asset = z.object({name: z.string().min(1).max(180), provider: z.enum(['repository', 'hosting']), external_id: z.string().max(100), reference: z.string().max(500), branch: z.string().max(150).optional(), visibility: z.enum(['public', 'private']).optional()}).strict();
const Inventory = z.object({schema: z.literal(1), capturedAt: z.string().datetime({offset: true}), scope: z.string().max(500), assets: z.array(Asset).max(500)}).strict();
const Metadata = z.object({id: UUID, tenant_id: UUID, version: z.number().int().min(1).max(2147483647), created_at: z.string().datetime({offset: true}), updated_at: z.string().datetime({offset: true})});

/** Esquema de resposta e escopo são verificados antes de liberar os registros à interface. */
export function validateRecord(value: unknown, resource: Resource, tenant: string, id?: string | null, version?: number) {
  const parsed = resources[resource].extend(Metadata.shape).strict().parse(value);
  if (parsed.tenant_id !== tenant || (id && parsed.id !== id) || (version !== undefined && parsed.version !== version)) throw new Error('RESPONSE_SCOPE');
  return parsed;
}

export function inventory() {
  const raw = process.env.AB_ALLINONE_INVENTORY;
  if (!raw) return {schema: 1, capturedAt: null, scope: 'Inventário não cadastrado.', assets: [], freshness: 'missing'};
  if (Buffer.byteLength(raw, 'utf8') > 100000) throw new Failure('INVENTORY_CONFIGURATION', 503);
  try {
    const data = Inventory.parse(JSON.parse(raw));
    const age = Math.max(0, Math.floor((Date.now() - Date.parse(data.capturedAt)) / 1000));
    if (Date.parse(data.capturedAt) > Date.now() + 300000) throw new Error('FUTURE_SNAPSHOT');
    const ids = data.assets.map(x => `${x.provider}:${x.external_id}`);
    if (new Set(ids).size !== ids.length) throw new Error('DUPLICATE_ASSET');
    return {...data, ageSeconds: age, freshness: age > 86400 ? 'stale' : 'recent_snapshot'};
  } catch { throw new Failure('INVENTORY_CONFIGURATION', 503); }
}

function tenantFor(admin: Admin, id: string) {
  if (!UUID.safeParse(id).success || !admin.tenants.includes(id)) throw new Failure('ACCESS_DENIED', 403);
  return id;
}

export function bootstrap(admin: Admin, c: Auth) {
  const data = admin.role === 'owner' ? inventory() : {schema: 1, capturedAt: null, scope: 'Inventário global reservado ao proprietário.', assets: [], freshness: 'restricted'};
  return {
    schema: 1, release: 'AB-ALLinONE/1.1-r2', actor: {id: admin.id, name: admin.name, role: admin.role},
    tenants: c.tenants.filter(t => admin.tenants.includes(t.id)), studies: admin.studies.map(slug => ({slug})), inventory: data,
    database: {configured: databaseConfigured(), mode: databaseConfigured() ? 'configured_not_yet_verified' : 'inventory_only', message: databaseConfigured() ? 'A leitura verificará a conexão, revisão do esquema e permissões.' : 'Banco administrativo não conectado. Nenhuma alteração é salva; consulta do inventário disponível.'},
    gates: moduleGates,
    capabilities: {metadata: true, transactional: databaseConfigured(), payments: false, fiscalIssuance: false, dnsWrites: false, domainPurchase: false, remoteExecution: false},
  };
}

const Overview = z.object({
  schema: z.literal(1), schema_revision: z.literal(3), at: z.string().datetime({offset: true}),
  business_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), business_timezone: z.string().min(1).max(100),
  counts: z.object({projects: count, activeProjects: count, clients: count, tasks: count, blocked: count, overdue: count, deals: count, domains: count, documents: count}).strict(),
  finance: z.array(z.object({currency: z.enum(['BRL', 'USD']), direction: z.enum(['income', 'expense']), status: z.enum(['expected', 'recorded', 'cancelled']), amount_minor: digits}).strict()).max(12),
  llm: z.object({requests: count, tokens: digits, known_cost_microusd: digits, unpriced: count}).strict(),
}).strict();

export async function overview(admin: Admin, tenant: string) {
  return rpc('ab_aio_overview', {p_actor: admin.id, p_tenant: tenantFor(admin, tenant)}, value => Overview.parse(value));
}

export async function list(admin: Admin, tenant: string, resource: string, before: string | null, beforeId: string | null) {
  tenantFor(admin, tenant);
  if (!isResource(resource) && resource !== 'audit_log') throw new Failure('RESOURCE_INVALID', 400);
  if (Boolean(before) !== Boolean(beforeId) || (before && !z.string().datetime({offset: true}).safeParse(before).success) || (beforeId && !UUID.safeParse(beforeId).success)) throw new Failure('CURSOR_INVALID', 400);
  if (resource === 'audit_log' && (before || beforeId)) throw new Failure('CURSOR_INVALID', 400);
  return rpc('ab_aio_list', {p_actor: admin.id, p_tenant: tenant, p_resource: resource, p_before: before, p_before_id: beforeId, p_limit: 100}, value => {
    if (resource === 'audit_log') {
      const parsed = z.object({items: z.array(z.object({id: z.union([digits, count]), tenant_id: UUID, actor_id: UUID, resource: z.string(), record_id: UUID, operation: z.string(), version: count, request_id: UUID, created_at: z.string().datetime({offset: true})}).strict()).max(100), limit: z.literal(100), bounded: z.literal(true)}).strict().parse(value);
      if (parsed.items.some(row => row.tenant_id !== tenant)) throw new Error('RESPONSE_SCOPE');
      return parsed;
    }
    const parsed = z.object({items: z.array(z.unknown()).max(100), total: count, limit: z.literal(100), has_more: z.boolean()}).strict().parse(value);
    const items = parsed.items.map(row => validateRecord(row, resource, tenant));
    if (new Set(items.map(x => x.id)).size !== items.length || parsed.total < items.length) throw new Error('RESPONSE_ITEMS');
    return {...parsed, items};
  });
}

export async function lookup(admin: Admin, tenant: string, resource: string, query: string) {
  tenantFor(admin, tenant);
  if (!['clients', 'projects'].includes(resource) || query.trim().length < 2 || query.length > 120) throw new Failure('LOOKUP_INVALID', 400);
  return rpc('ab_aio_lookup', {p_actor: admin.id, p_tenant: tenant, p_resource: resource, p_query: query.trim()}, value => {
    const parsed = z.object({items: z.array(z.object({id: UUID, name: z.string().min(1).max(180)}).strict()).max(25), truncated: z.boolean(), limit: z.literal(25)}).strict().parse(value);
    if (new Set(parsed.items.map(x => x.id)).size !== parsed.items.length) throw new Error('DUPLICATE_REFERENCE');
    return parsed;
  });
}

export async function receipt(admin: Admin, tenant: string, commandId: string) {
  tenantFor(admin, tenant);
  if (!UUID.safeParse(commandId).success) throw new Failure('COMMAND_ID_INVALID', 400);
  return rpc('ab_aio_receipt', {p_actor: admin.id, p_tenant: tenant, p_command: commandId}, value => {
    const parsed = z.discriminatedUnion('state', [
      z.object({state: z.literal('not_observed'), command_id: UUID}).strict(),
      z.object({state: z.literal('committed'), command_id: UUID, result: z.unknown(), committed_at: z.string().datetime({offset: true})}).strict(),
    ]).parse(value);
    if (parsed.command_id !== commandId) throw new Error('RECEIPT_SCOPE');
    if (parsed.state === 'committed') {
      const record = Metadata.passthrough().parse(parsed.result);
      if (record.tenant_id !== tenant) throw new Error('RECEIPT_SCOPE');
      return {state: parsed.state, command_id: commandId, record_id: record.id, version: record.version, committed_at: parsed.committed_at};
    }
    return parsed;
  });
}

export async function command(admin: Admin, input: unknown, commandId: string) {
  if (admin.role === 'viewer') throw new Failure('ACCESS_DENIED', 403);
  if (!UUID.safeParse(commandId).success) throw new Failure('IDEMPOTENCY_KEY_REQUIRED', 400);
  let v: ReturnType<typeof validateCommand>;
  try { v = validateCommand(input); } catch { throw new Failure('RECORD_INVALID', 422); }
  tenantFor(admin, v.tenant_id);
  return rpc('ab_aio_command', {p_actor: admin.id, p_tenant: v.tenant_id, p_resource: v.resource, p_command: commandId, p_id: v.id, p_version: v.version, p_data: v.data}, value => validateRecord(value, v.resource, v.tenant_id, v.id, (v.version ?? 0) + 1));
}
