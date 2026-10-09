# Handoff — AB-ALLinONE / fundação administrativa

Edição: 09/10/2026. Destino de continuidade: `/Users/alexandrebelo/Projetos/AB-Port./AB`.

## 1. Estado e limite da entrega

A central administrativa está implementada em código, com quinze áreas de navegação, dez recursos gerenciais, autenticação independente, API tipada, duas migrações PostgreSQL e testes de concorrência real. A produção do AB-Estudos permanece na base anterior, sem alteração da senha de destinatário ou das rotas do estudo.

**Não há ativação administrativa produtiva confirmada.** A ferramenta bloqueou a gravação da nova configuração sensível na hospedagem. O banco administrativo de produção também não está conectado. Não foi utilizada outra rota para contornar a restrição e não existe uma nova senha administrativa ativa a distribuir.

A configuração ausente mantém acesso fechado. Com autenticação válida, mas sem banco, o aplicativo permite apenas a consulta ao inventário privado quando esse inventário tiver sido cadastrado. Não salva dados no navegador e não exibe sucesso sem confirmação do backend.

O computador remoto estava offline. A existência deste arquivo no repositório não confirma que ele foi copiado para o diretório do Mac.

## 2. Escopo funcional

| Área | Capacidade implementada | Limite |
|---|---|---|
| Central | Contagens identificadas, fluxo e disponibilidade das fontes | Não infere receita ou saúde pela existência de um ativo |
| Inventário técnico | Snapshot privado, busca, filtro, exportação e cadastro assistido | Não é sincronização contínua nem importação sem confirmação |
| Projetos | Organização, cliente, situação, prioridade, prazo, repo e estudo | Não dispara deploy |
| Execução | Tarefas e quadro com bloqueios, versões e prazos | Não inventa progresso |
| Estudos & GeoKPI | Ponte administrativa para estudos expressamente autorizados | Senha de estudo nunca autentica administração |
| Clientes | Identificação e contato por organização | Formato do documento não prova regularidade fiscal |
| CRM | Pipeline e valor com moeda | Proposta ganha não equivale a receita recebida |
| Financeiro | Lançamentos previstos, registrados e cancelados | Não é saldo bancário, contabilidade oficial ou pagamento |
| Domínios | Inventário e vencimentos informados | Não compra nem altera DNS |
| Qualidade | Harness com commit, resultado, contadores e fonte | Não executa comandos remotos |
| Custos de IA | Eventos deduplicados, tokens, cache e custo conhecido | Não coleta prompts nem precifica automaticamente |
| Afiliados | Comissão, fonte, moeda e situação do evento | Não gera tags fictícias nem confirma recebimento |
| Documentos | Metadados e referência privada | Não faz assinatura ou emissão fiscal |
| Integrações | Gates e estado de cada capacidade | Não se apresenta como conectado sem homologação |
| Auditoria | Ator, recurso, versão e comando na transação | Não cobre ainda todos os logins ou provedores |

Uma organização, um cliente, um projeto, um repositório e um deployment são entidades distintas. Um produto pode utilizar diversos repositórios e ambientes. Não somar essas contagens como produtos, clientes ou contratos. Os aliases `AB_EDIA` e `DONE_LABS` vêm do escopo fornecido, mas não substituem cadastro jurídico validado.

## 3. Correções em relação aos anexos

O primeiro material propõe PostgreSQL/Supabase com tenants, CRM, harness, custos, NFS-e e afiliados. O segundo propõe DF-e/DDA, domínios/DNS e afiliados. A organização do produto foi preservada; exemplos incompletos não foram adotados como componentes operacionais.

- A função baseada em `current_setting('app.current_tenant_id')` não lê ou valida um JWT por si só. Nesta implementação, identidade vem do backend autenticado e membership é conferida no banco antes de criar contexto local à transação.
- Chaves estrangeiras independentes não garantem que cliente, projeto e organização sejam compatíveis. O núcleo usa referências compostas por `tenant_id` e identificador.
- Habilitar RLS não elimina bypass de proprietários ou roles privilegiadas. O executor tem NOLOGIN e NOBYPASSRLS, não é proprietário das tabelas, e grants efetivos são testados.
- As três partições mensais do anexo não cobrem todo 2026/2027. O núcleo inicial não depende de particionamento antecipado sem operação de manutenção. A adoção futura depende de medição e retenção.
- Materialized view não é agregação em tempo zero. Não foi prometida latência constante ou atualização instantânea; agregados futuros devem informar defasagem.
- Certificados PFX não entram no CRUD geral. Nenhum certificado foi usado e nenhuma taxa fiscal fixa foi assumida como regra válida da organização.
- O exemplo de domínio retorna `PROVISIONED` sem executar registro. Esta versão faz inventário; registro/DNS continuam desabilitados.
- RDAP 404 não é confirmação comercial de disponibilidade. Consulta cadastral, elegibilidade e registro são etapas separadas.
- `url.includes()` e IDs fictícios de afiliados não foram reutilizados. PA-API 5 não é a escolha para integração nova; consultar Creators API e as regras vigentes da conta.
- DDA, consentimento, conciliação e pagamento são capacidades diferentes. Menção ao CPF de terceiro não constitui autorização para consultá-lo ou pagar suas obrigações.

Essas correções são decisões desta revisão, não afirmações atribuídas aos textos originais. Nenhuma integração bancária, fiscal, de assinatura ou alteração de infraestrutura foi executada.

## 4. Arquitetura e código

Escolha: monólito modular sobre o projeto Next.js existente, com backend dedicado à interface e PostgreSQL transacional. Não há necessidade demonstrada de microsserviços, replicação ativa-ativa ou barramento externo neste estágio.

```text
Admin → /allinone → sessão/CSRF → contratos tipados
  → RPC exclusiva do backend → membership → contexto transacional → RLS
  → registro + audit_log + command_receipts + outbox

Destinatário → /estudos → senha específica → sessão apenas do estudo

Admin autorizado → POST abrir-estudo → sessão do estudo cadastrado
Não existe caminho inverso estudo → administração.
```

| Arquivo | Responsabilidade |
|---|---|
| `app/allinone/[[...path]]/route.ts` | Entrada dinâmica Node sem analytics da LP |
| `lib/allinone/auth.ts` | scrypt, sessões, escopos, CSRF e limites |
| `lib/allinone/contracts.ts` | Validação estrita de dez recursos e gates |
| `lib/allinone/service.ts` | Inventário privado e transporte RPC |
| `lib/allinone/handler.ts` | Autorização HTTP, comandos e ponte para estudo |
| `lib/allinone/ui.ts` | Login e shell privados com CSP |
| `public/allinone-assets/` | JavaScript/CSS genéricos sem dados de cliente |
| `allinone/migrations/001_core.sql` | Tabelas, índices, consistência e RPCs |
| `allinone/migrations/002_privileges.sql` | Revogação de concessões implícitas |
| `allinone/tests/database.sql` | Testes transacionais revertidos |
| `allinone/tests/concurrency.py` | Sessões concorrentes reais |
| `scripts/allinone-verify.cjs` | Contratos, autenticação e handlers |
| `scripts/allinone-browser.cjs` | Roteiro local de navegador, ainda sem aceite final |
| `tsconfig.allinone.json` | Checagem estrita separada do legado |

## 5. Banco, consistência e dinheiro

Há dezesseis tabelas: tenants, actors, memberships, dez recursos, audit_log, command_receipts e outbox. Os recursos gerenciais são clients, projects, tasks, deals, ledger_entries, domains, harness_runs, llm_usage, affiliate_events e documents.

Cada alteração recebe uma chave de idempotência. A RPC bloqueia a chave, compara o hash do comando e retorna o mesmo recibo quando o pedido é idêntico. Reutilizar a chave com outro conteúdo produz conflito. Updates exigem versão e bloqueio da linha. A versão ultrapassada não sobrescreve uma edição mais recente.

Recurso, auditoria, recibo e outbox são gravados na mesma transação. A garantia está nesse armazenamento; não implica execução exatamente uma vez em serviços externos. O worker de entrega de outbox não está implementado e nenhum evento dispara pagamento ou DNS.

Valores usam unidades mínimas inteiras e moeda identificada. Agregados monetários grandes são transportados como strings. BRL e USD não são somados sem conversão explicitamente definida. Custos de IA desconhecidos ficam nulos e aparecem como não precificados. Cache de entrada não é contado duas vezes no total de tokens.

Um lançamento `recorded` exige data e referência de evidência, mas não é confirmação bancária automática. O módulo não é um livro contábil de partidas dobradas. Documentos guardam referências e hashes informados; não é feita verificação automática de arquivo fiscal ou certificado.

Harness e uso de IA são append-only pela API. Eventos de IA são únicos por organização, provedor e ID externo. Resultados PASSED têm restrições de consistência de asserções.

## 6. Segurança e fronteiras de confiança

Cookies administrativos são independentes: `__Host-ab_aio` e `__Host-ab_aio_csrf`. São Secure, HttpOnly, Path=/ e SameSite=Lax. A sessão vale oito horas. Mudança do registro administrativo invalida tokens nos deployments que carregam a configuração nova.

CSRF liga desafio, cookie e sujeito. Abrir outra aba reutiliza o desafio válido. Origem conhecida externa é rejeitada. A política de referência preserva o formulário legítimo. Não há SQL ou nome de tabela arbitrário enviado pelo navegador; os recursos e campos são allowlists.

O limite adicional é cinco tentativas por minuto por IP em cada instância, com memória limitada. **Não é rate limiting distribuído.** MFA, SSO/passkeys, logs persistentes de autenticação e revogação por sessão individual não estão implementados. Esses controles devem preceder uso ampliado com dados sensíveis.

O banco valida actor/membership antes de estabelecer um GUC local à transação. A role executora das três RPCs é NOLOGIN/NOBYPASSRLS e as tabelas gerenciais têm RLS forçada. As roles públicas não recebem execução das RPCs. A segunda migração revoga grants herdados de `anon` e `authenticated`; executar ambas é obrigatório.

A chave de transporte do servidor é uma fronteira de alta confiança. Se o backend ou a chave forem comprometidos, um atacante pode tentar agir como ator permitido nas RPCs. Não alegar que RLS protege contra comprometimento total dessa fronteira. O banco recomendado é dedicado; não reutilizar automaticamente o serviço de artigos do blog.

O inventário é privado e, na configuração inicial, reservado ao proprietário. Assets distribuídos contêm apenas código. Nenhum dado clínico, conteúdo de prompt, certificado ou segredo de equipamento é necessário para cadastrar projetos.

## 7. Falhas e performance

A interface cancela requisições anteriores quando o escopo muda e verifica a geração da resposta. Dados atrasados não devem ser aplicados silenciosamente ao tenant novo. A leitura possui paginação limitada e índices compostos; o agregado geral não deve ser confundido com o subconjunto da página carregada.

Timeout HTTP não prova rollback. Repetir o mesmo conteúdo conserva a chave do comando; mudar conteúdo cria nova intenção. O erro identifica o comando após tentativa de gravação. Ainda falta uma tela operacional de consulta de recibos após fechamento do navegador.

Não houve benchmark produtivo, dimensionamento p95/p99, teste de carga com milhões de eventos, PITR contratado, ensaio de restauração produtiva ou topologia multirregional implantada. Invariantes verificadas não constituem SLA de capacidade.

Particionar a telemetria somente com justificativa de volume/retenção e mecanismo de criação antecipada, expiração e eventos atrasados. Agregados materializados futuros devem informar `as_of`. Workers de provedores devem separar retry, deduplicação e resultado desconhecido da transação gerencial.

## 8. Validação e limitações verificadas

- 50 verificações de autenticação, contratos e handlers aprovadas. Testam sessão, escopo, CSRF, rejeição de token de estudo, comandos inválidos e gravação sem banco retornando indisponibilidade.
- Duas migrações aplicadas em PostgreSQL 17 real de teste. Onze alterações válidas foram reconciliadas com auditoria, outbox e recibos. As fixtures transacionais foram revertidas.
- Dezesseis replays concorrentes produziram um único registro e respostas iguais. Duas edições da versão 1 produziram um vencedor e um conflito. Resultado final: uma linha na versão 2 e dois eventos em cada tabela de auditoria/outbox/recibos.
- Um ensaio local inicialmente identificou SQL_ASCII no banco de teste. A base descartável foi recriada em UTF-8; o teste passou. O CI de revisão também foi aprovado.
- Checagem TypeScript estrita do módulo aprovada. O projeto legado mantém sua configuração própria; a checagem não significa que toda a base foi auditada.
- O roteiro de navegador foi preparado, mas sua execução adicional pela ferramenta foi bloqueada. Não há novo aceite de interface em produção, nem login administrativo final confirmado. Não substituir esse aceite por testes unitários.

## 9. Ativação e operação

A restrição da ferramenta precisa ser resolvida por autorização/configuração válida, não por outro mecanismo que execute a operação recusada. Depois disso, selecionar banco dedicado, aplicar as duas migrações, cadastrar entidades e memberships reais, configurar segredos do servidor e validar um deployment antes de promover.

Variáveis previstas: `AB_ALLINONE_AUTH`, `AB_ALLINONE_INVENTORY`, `AB_ALLINONE_SUPABASE_URL` e `AB_ALLINONE_SERVICE_KEY`. Não usar prefixo NEXT_PUBLIC, não colocar valores em README, logs ou artefatos, e não reutilizar a senha de Sinop como credencial de gestão.

O endpoint planejado é `/allinone`. Não anunciar esse endereço como portal administrativo disponível enquanto configuração, banco, navegador e isolamento produtivos não tiverem sido aceitos.

## 10. Continuidade local

O Mac não foi alterado. No diretório solicitado, primeiro verificar `git status`, remote e branch. Preservar mudanças locais; preferir worktree de revisão. Não executar reset destrutivo.

```sh
cd '/Users/alexandrebelo/Projetos/AB-Port./AB'
git status --short
git remote -v
git fetch origin
```

Em checkout de revisão, Node 24:

```sh
npm ci --include=dev --ignore-scripts --no-audit --no-fund
npm run prebuild
```

`database.sql` deve rodar em banco de teste. `concurrency.py` restringe execução a loopback e nome de banco terminado em `_test`; trabalha com fixtures próprias e remove-as ao terminar. Os scripts de revisão que alteravam fonte foram removidos; o CI final apenas valida e prepara artefatos genéricos.

## 11. Ordem de evolução

P0: autorização da configuração, banco dedicado, memberships e aceite ponta a ponta. P1: inventário classificado, identidade reforçada, logs de autenticação e restauração de backup. P2: integrações de leitura próprias, ingestão deduplicada e telemetria reconciliada. P3: fiscal/DDA homologados e, em entrega separada, ações externas com aprovação explícita.

Nenhuma data de conclusão de homologação, orçamento de API, receita de afiliado ou custo de operação foi inventado. APIs disponíveis na conversa não equivalem a integrações disponíveis para o aplicativo.

## 12. Referências oficiais

Base funcional: os dois anexos de texto fornecidos pelo usuário. Verificações externas:

- PostgreSQL RLS: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- Supabase Database Functions: https://supabase.com/docs/guides/database/functions
- PostgREST RPC: https://docs.postgrest.org/en/stable/references/api/functions.html
- Amazon Creators API / PA-API: https://affiliate-program.amazon.com/creatorsapi/docs/en-us/paapiv5-deprecation
- Banco Central / DDA: https://www.bcb.gov.br/meubc/faqs/p/cadastro-no-dda-para-utilizacao-do-boleto-de-pagamento-eletronico
- NFS-e nacional, documentação atual: https://www.gov.br/nfse/pt-br/biblioteca/documentacao-tecnica/documentacao-atual
