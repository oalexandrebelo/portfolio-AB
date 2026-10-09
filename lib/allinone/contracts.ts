import {z} from 'zod';
const uuid=z.string().uuid(), short=z.string().trim().min(1).max(180), note=z.string().max(4000).default('');
const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s=>!Number.isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s,'Data inválida').nullable().default(null);
const optionalUUID=uuid.nullable().default(null), currency=z.enum(['BRL','USD']).default('BRL');
const amount=z.number().int().min(0).max(9000000000000);
const https=z.string().url().max(500).refine(s=>{const u=new URL(s);return u.protocol==='https:'&&!u.username&&!u.password;}).nullable().default(null);
export const resources={
 clients:z.object({name:short,document:z.string().trim().toUpperCase().regex(/^(?:\d{11}|[A-Z0-9]{12}\d{2})$/).nullable().default(null),email:z.string().email().max(250).nullable().default(null),notes:note,is_active:z.boolean().default(true)}).strict(),
 projects:z.object({name:short,description:note,client_id:optionalUUID,state:z.enum(['idea','discovery','building','operating','paused','archived']).default('discovery'),priority:z.number().int().min(1).max(4).default(2),due_date:date,repository_url:https,study_slug:z.string().regex(/^[a-z0-9-]{1,64}$/).nullable().default(null)}).strict(),
 tasks:z.object({project_id:uuid,title:short,notes:note,state:z.enum(['backlog','in_progress','blocked','done','cancelled']).default('backlog'),priority:z.number().int().min(1).max(4).default(2),due_date:date}).strict(),
 deals:z.object({client_id:optionalUUID,project_id:optionalUUID,title:short,amount_minor:amount.default(0),currency,stage:z.enum(['LEAD','QUALIFIED','PROPOSAL','CONTRACT_PENDING','WON','LOST']).default('LEAD'),notes:note}).strict(),
 ledger_entries:z.object({project_id:optionalUUID,title:short,direction:z.enum(['income','expense']),amount_minor:amount.min(1),currency,due_date:date,recorded_date:date,status:z.enum(['expected','recorded','cancelled']).default('expected'),evidence_ref:z.string().max(500).nullable().default(null),notes:note}).strict(),
 domains:z.object({project_id:optionalUUID,name:z.string().trim().toLowerCase().max(253).regex(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/),registrar:z.string().max(120).default(''),dns_provider:z.string().max(120).default(''),expires_on:date,notes:note}).strict(),
 harness_runs:z.object({project_id:uuid,commit_sha:z.string().regex(/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/),status:z.enum(['QUEUED','RUNNING','PASSED','FAILED','CANCELLED']),total_assertions:z.number().int().min(0).max(10000000),passed_assertions:z.number().int().min(0).max(10000000),failed_assertions:z.number().int().min(0).max(10000000),skipped_assertions:z.number().int().min(0).max(10000000).default(0),execution_time_ms:z.number().int().min(0).max(2147483647),source_ref:z.string().max(500)}).strict(),
 llm_usage:z.object({project_id:uuid,provider:short,model_name:short,event_id:short,prompt_tokens:amount,completion_tokens:amount,cached_input_tokens:amount.default(0),cost_microusd:amount.nullable().default(null),latency_ms:z.number().int().min(0).max(2147483647),occurred_at:z.string().datetime({offset:true})}).strict(),
 affiliate_events:z.object({project_id:optionalUUID,platform:z.enum(['SHOPEE','MERCADO_LIVRE','AMAZON','ALIEXPRESS']),event_id:short,commission_minor:amount,currency,status:z.enum(['provisional','confirmed','reversed']),occurred_at:z.string().datetime({offset:true}),source_ref:z.string().max(500)}).strict(),
 documents:z.object({project_id:optionalUUID,title:short,kind:z.enum(['study','contract','fiscal','evidence']),status:z.enum(['draft','received','archived']).default('received'),external_ref:z.string().max(500),sha256:z.string().regex(/^[a-f0-9]{64}$/).nullable().default(null)}).strict(),
};
export type Resource=keyof typeof resources;
export function isResource(s:string):s is Resource{return Object.hasOwn(resources,s);}
export const Command=z.object({tenant_id:uuid,resource:z.string(),id:uuid.nullable().default(null),version:z.number().int().min(1).nullable().default(null),data:z.record(z.unknown())}).strict();
export function validateCommand(input:unknown){
 const v=Command.parse(input);if(!isResource(v.resource))throw new Error('RESOURCE_INVALID');
 if(Boolean(v.id)!==Boolean(v.version))throw new Error('VERSION_REQUIRED');
 const schema=resources[v.resource];const data=v.id?schema.partial().parse(v.data):schema.parse(v.data);
 if(v.id&&!Object.keys(data).length)throw new Error('EMPTY_COMMAND');
 return {...v,resource:v.resource,data};
}
export const moduleGates=[
 {id:'postgres',name:'Persistência administrativa',state:'configuration_required',scope:'Cadastros, versões, auditoria e comandos idempotentes',gate:'Aplicar a migração isolada e cadastrar a identidade e organizações. Configurar endpoint e chave de transporte do banco.'},
 {id:'github',name:'Repositórios e entregas',state:'snapshot',scope:'Inventário verificado na implantação',gate:'Para atualização contínua, instalar uma GitHub App com acesso somente aos repositórios autorizados. O conector desta conversa não é uma credencial da aplicação.'},
 {id:'vercel',name:'Publicações e infraestrutura',state:'snapshot',scope:'Projetos de hospedagem descobertos',gate:'Registrar integração de leitura própria, escopo da equipe e fonte temporal. READY não equivale a aplicação saudável.'},
 {id:'fiscal',name:'DF-e e NFS-e',state:'not_connected',scope:'Catálogo de documentos; sem emissão ou manifestação',gate:'Identidade fiscal, certificado em cofre, procuração quando cabível, contratos de API, regras municipais e homologação.'},
 {id:'dda',name:'DDA e conciliação',state:'not_connected',scope:'Gestão de obrigações separada de pagamento',gate:'Adesão do titular, API efetivamente contratada, consentimento verificável, reconciliação e política de aprovação. Nenhum pagamento habilitado.'},
 {id:'domains',name:'Registro.br e Cloudflare',state:'not_connected',scope:'Inventário e vencimentos; sem mutação DNS',gate:'Credenciais com menor privilégio, plano de alterações, aprovação e confirmação externa. RDAP 404 não confirma disponibilidade comercial.'},
 {id:'affiliates',name:'Afiliados',state:'not_connected',scope:'Registro de comissões com fonte',gate:'Cadastro de cada programa, identificação de afiliado válida e consulta às APIs vigentes; Amazon Creators API em lugar de PA-API 5 descontinuada.'},
 {id:'telemetry',name:'Harness e custos de IA',state:'not_connected',scope:'Ingestão autenticada de métricas identificadas',gate:'Registrar eventos com identificador único e fonte. Custo desconhecido fica nulo, nunca zero. Não ingerir prompts, dados clínicos ou logs secretos.'},
 {id:'contracts',name:'Contratos e assinatura',state:'not_connected',scope:'Registro documental',gate:'Habilitar provedor, webhook verificado e trilha de consentimento antes de tratar um documento como assinado.'},
];
