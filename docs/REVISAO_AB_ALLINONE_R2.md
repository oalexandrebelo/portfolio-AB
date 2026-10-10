# AB-ALLinONE — revisão R2 de arquitetura, correção e oportunidades

Data: 10/10/2026. Base comparada: `df61e6cda0fd2847e2e7a17fa2c3659414d66ccc`. Branch de trabalho: `feat/ab-allinone-foundation`. Continuidade: `/Users/alexandrebelo/Projetos/AB-Port./AB`.

Este relatório acrescenta uma revisão ao handoff inicial; não reescreve os anexos como se as correções já estivessem neles. As evidências são os arquivos do módulo, as migrações, os ensaios locais e os logs do CI. O `COMMIT.txt` do pacote identifica o checkout efetivamente testado; em execução de PR, ele pode identificar o commit sintético de integração, não um merge de produção.

## 1. Decisão técnica e estado da entrega

O ALLinONE pode evoluir como central administrativa modular sobre a base existente, mas não deve ser tratado como ERP fiscal, executor bancário ou plataforma operacional de todos os produtos apenas por possuir seções com esses nomes.

A R2 corrige problemas de transação, escopo, integridade financeira, interface e validação. A revisão identifica 60 itens: 19 corrigidos no código, 8 parcialmente tratados, 19 abertos, 7 bloqueios externos e 7 oportunidades de produto. Essa taxonomia não mede uma porcentagem de segurança e não equivale a 60 vulnerabilidades exploráveis. P0 significa prioridade de integridade ou condição de ativação; vários P0 dizem respeito a capacidades que permanecem desabilitadas.

Não houve ativação administrativa em produção, migração de banco produtivo, troca de senha de Sinop, emissão fiscal, pagamento, compra de domínio ou mudança de DNS. A restrição anterior sobre a configuração sensível não foi contornada. O PR deve permanecer em revisão até existir configuração autorizada, banco de destino, identidade, validação no domínio e aceitação dos riscos residuais.

A revisão local não prova ausência de falhas desconhecidas. O propósito operacional do registro é permitir priorização, dono responsável, aceite e regressão verificável para cada item identificado.

## 2. Base documental versus alterações desta revisão

O primeiro anexo descreve tenants `AB_EDIA` e `DONE_LABS`, clientes, repositórios, CRM, harness, telemetria, NFS-e e afiliados. O segundo acrescenta captura de DF-e/DDA, domínios/DNS e geração de links de afiliados. Essas são intenções de produto fornecidas pelo usuário, não integrações comprovadas.

O núcleo inicial já havia substituído exemplos problemáticos por contratos mais restritos. Nesta rodada, testei o próprio código produzido: não presumi que a aprovação anterior das 50 verificações significava correção de todas as operações.

Diferenças relevantes permanecem documentadas: `current_setting` não valida um JWT por si; referências independentes não garantem compatibilidade entre cliente e projeto; uma tabela com PFX e comentário de criptografia não constitui cofre; três partições não cobrem dois anos; materialized view não tem atualização instantânea implícita; RDAP não executa compra; e um retorno `PROVISIONED` após um trecho de registro apenas comentado não prova provisionamento.

Essas constatações são análise do código e dos anexos. Os contratos fiscais, consentimentos, autorizações de representação, escopos de APIs e credenciais de provedores não foram fornecidos ou homologados nesta execução. A implementação não inventa esses elementos.

## 3. Transação correta inclui a confirmação e sua ausência

### 3.1 Commit sem confirmação de rede

O caso crítico é: o banco grava, a conexão cai antes de entregar a resposta e o operador tenta novamente. Se a interface gerar outra chave ou permitir alterar o payload antes de reconciliar, a segunda solicitação pode produzir outro registro válido. Idempotência no banco não resolve uma nova intenção criada acidentalmente pelo cliente.

A R2 introduz uma máquina explícita de intenção: `draft`, `pending`, `unknown`, `rejected` e `committed`. Uma intenção em estado pendente ou desconhecido conserva o UUID e o corpo serializado. O operador pode consultar seu recibo ou repetir o mesmo comando. Não pode transformar silenciosamente a tentativa inconclusiva em outra gravação com novos campos.

O transporte valida tipo de conteúdo, limite de bytes, JSON, contrato de recurso, organização, identidade e versão esperada. Uma resposta 200 com `null`, um corpo truncado ou um objeto de outra organização não confirma sucesso. Em mutações, uma resposta impossível de validar é classificada como incerta. Erros transacionais reconhecidos retornam rejeição ou repetição explícita sem divulgar mensagens SQL internas.

O teste integrado não substituiu o banco por um stub. O PostgreSQL confirmou a criação; um proxy exclusivamente de ensaio destruiu o ACK real devolvido pelo PostgREST. A API retornou 503 com `uncertain=true`, o formulário bloqueou seus campos e a consulta ao recibo reconciliou a gravação. A contagem permaneceu em uma linha.

### 3.2 Recibos acessíveis e restritos

A nova RPC `ab_aio_receipt` exige ator, organização e chave de comando. Um ator não consulta o recibo de outro apenas por pertencer ao mesmo tenant. A resposta administrativa é reduzida a identificador, versão e instante, evitando entregar o snapshot completo na consulta de suporte.

`not_observed` significa exatamente que nenhum recibo foi observado naquela consulta. Não significa que uma operação concorrente foi cancelada. Não há botão que converta esse estado em autorização automática para duplicar a solicitação.

Há um limite ainda aberto: a intenção congelada vive na memória da página. Após fechar o navegador, o operador precisa ter conservado o UUID para usar a reconciliação manual. Uma próxima entrega deverá oferecer journal durável de intenções autenticadas ou recuperação pelo histórico autorizado, sem deslocar dados pessoais ou segredos para localStorage.

### 3.3 Revogação e operações em andamento

O banco passa a adquirir bloqueios compartilhados nos registros de ator, vínculo e organização durante a conferência de autorização. O ensaio de revogação verificou a ordem: uma operação já autorizada termina; a atualização que revoga o vínculo aguarda; depois de a revogação confirmar, novas operações são negadas.

Essa garantia é uma ordenação transacional, não cancelamento retroativo. A autorização de estudos ainda é configurada separadamente; revogar membership do banco não deve ser descrito como revogação automática do acesso a todos os estudos e sessões já emitidos.

## 4. Integridade financeira e comercial

A primeira modelagem impedia ligar objetos de organizações diferentes, mas permitia uma proposta para o cliente A associada ao projeto do cliente B dentro do mesmo tenant. A R2 adiciona a referência composta `(tenant_id, project_id, client_id)` e impede reatribuições do projeto que quebrem propostas existentes. Quando ambos os vínculos são informados, precisam ser compatíveis.

Lançamentos registrados não permitem mais reescrever valor, moeda, natureza, projeto ou evidência. O cancelamento exige justificativa; o estado cancelado é terminal. Isso preserva a história declarada, mas não transforma o módulo em contabilidade de partidas dobradas nem executa devolução financeira. Uma correção posterior deve ser documentada como outra intenção autorizada, e um diário de ajustes com vínculo explícito permanece uma oportunidade.

Comissões confirmadas de afiliados têm identidade e valor protegidos, admitindo apenas reversão compatível. A existência de um evento confirmado não prova liquidação pela plataforma, recebimento bancário ou tratamento tributário.

A apresentação e leitura de dinheiro usam conversão exata de unidades mínimas por inteiros. Foram executados 600 roundtrips determinísticos, além dos formatos inválidos e limites. Esses 600 casos são testes de propriedade monetária; não devem inflar a contagem de cenários independentes de segurança.

A interface integrada gravou 129,99 como 12999 no PostgreSQL. Moedas continuam separadas. Telemetria sem custo permanece nula, com cobertura de precificação explícita; cache não é somado outra vez ao total de tokens.

## 5. Interface: trocar de organização também troca o contexto assíncrono

O risco não estava apenas no endpoint. Um carregamento de clientes podia começar na organização A, o operador selecionar B e a resposta tardia abrir um formulário de A depois da troca.

A R2 captura tenant, view e geração do editor antes das leituras. O resultado só altera a tela quando esses valores continuam válidos. Salvar bloqueia mudanças de escopo durante a operação. O ensaio atrasou uma resposta verdadeira de lookup e mudou a organização antes de liberá-la; o modal antigo foi descartado.

O seletor inicial de relacionamentos mantinha somente os primeiros 100 registros. Foi acrescentada busca autenticada de clientes e projetos, com tratamento literal de `%` e `_`, limite 25 e indicação de truncamento. O teste encontrou um cliente fora da primeira página. Isso não significa que a pesquisa por infixo tenha custo baixo em qualquer volume; seu plano de execução deve ser medido.

A listagem utiliza `limit+1` para informar `has_more` real. Contagem e página são produzidas na mesma consulta. A existência de uma centésima linha já não presume outra página. Entretanto, uma sequência de páginas permanece mutável sob atualizações concorrentes e não deve servir como exportação integral auditável sem snapshot.

A data de corte para atrasos pertence à organização. O fuso é configurado e retornado junto com a data; o default UTC é um valor operacional explícito, não inferência sobre o endereço ou CNPJ da empresa.

Há uma lacuna visual mantida no registro: ausência de inventário ainda pode aparecer como zero em cartões. O backend já informa `missing`, idade e `stale`; a UI deve apresentar desconhecido como travessão e zero apenas após consulta válida. Também há cobertura limitada de acessibilidade e navegadores: teste Chromium e ausência de overflow não certificam WCAG nem comportamento em Safari.

## 6. Autenticação: reduzir ambiguidades sem prometer uma solução de identidade completa

A seleção administrativa por credencial agora rejeita mais de um match, inclusive quando a mesma credencial tiver sido derivada com salts diferentes. O limite de configuração impede payload excessivo; scopes duplicados e tokens malformados são rejeitados. A derivação scrypt tem parâmetros explícitos e admissão de duas verificações simultâneas por instância, sem fila ilimitada.

Essa escolha preserva a compatibilidade dos códigos aleatórios da primeira versão. Não é uma recomendação para aceitar senhas humanas fracas. Comprimento mínimo não comprova entropia e o limitador local não protege sozinho uma frota de instâncias.

MFA, passkeys, recuperação de fator, sessões revogáveis individualmente, timeout por inatividade, logs persistentes de autenticação e permissões por projeto continuam abertos. O produto deve incorporá-los antes de ampliar a exposição de dados sensíveis ou habilitar executores externos.

Cookies independentes protegem a separação entre senha de estudo e sessão de gestão, mas não são uma fronteira contra todo script executado no mesmo origin. `HttpOnly` impede leitura direta do cookie pelo JavaScript; não impede que um script comprometido naquele origin faça solicitações usando a sessão. Recomendo origin e deployment administrativos separados, com política de conteúdo restrita e identidade reforçada. Essa mudança não foi implantada nesta revisão.

A chave de transporte do backend continua sendo fronteira privilegiada. A RPC recebe o ator que o servidor autenticado informa. RLS não é garantia contra comprometimento total desse servidor ou credencial. Papéis restritos, banco dedicado, grants conferidos e segredos fora do navegador reduzem o risco, mas não substituem o modelo de identidade completo.

## 7. A revisão encontrou falhas no próprio processo de validação

Ao recuperar um artefato intermediário, o workflow constava como aprovado, mas `validation/build.log` continha `Build error occurred`. A saída de `npm run build` havia sido encadeada a `tee` sem propagação da falha da etapa anterior. Portanto, esse run não comprova build completo bem-sucedido, embora seus testes posteriores tenham executado.

Corrigi o pipeline com Bash explícito, `set -euo pipefail` e um controle negativo `false | tee`. Uma falha na construção deve impedir as etapas de aceite e o upload do pacote validado. A aprovação final precisa vir de um run novo, não da etiqueta verde intermediária.

O build completo também expôs uma dependência indevida: o cliente Supabase do blog era instanciado na importação e exigia um segredo mesmo para compilar módulos independentes. A correção de compatibilidade torna a ausência de cliente explícita. Rotas administrativas preservam a autenticação e retornam 503 quando não há conexão; newsletter não confirma inscrição; leitura pública mantém o fallback existente de nenhum artigo. Isso não recupera o banco do blog nem constitui auditoria completa de suas rotas.

Outra falha estava no empacotamento: o manifesto listava `.github/workflows/allinone-review.yml`, mas o upload omitira o diretório oculto. O pacote passa a incluir arquivos ocultos somente a partir de um diretório de release montado por allowlist e é conferido por hash antes e depois da recuperação. Segredos, dependências, fontes tipográficas e `.env` não fazem parte desse diretório.

As três ações usadas no pipeline foram fixadas por SHA, o binário PostgREST por hash e a imagem PostgreSQL do ensaio por digest observado. Isso não equivale a uma cadeia inteira de software imutável: runtime, transitivas, política de atualização e SBOM ainda exigem acompanhamento.

## 8. Ensaios e interpretação dos resultados

A bateria está versionada e separa validação local, integração e produção. Os logs do pacote final precisam ser confrontados com o status do último workflow. O handoff inicial é histórico: a indisponibilidade anterior do teste de navegador foi superada localmente nesta R2, mas não houve login administrativo produtivo.

| Ensaio | Escopo e resultado esperado no pacote aceito |
|---|---|
| Contratos existentes | 50 verificações de autenticação, contratos e handlers |
| Hardening R2 | 636 assertions; 600 monetárias e 36 de outros invariantes/falhas |
| SQL inicial | 11 alterações válidas conciliadas com auditoria, recibos e outbox |
| SQL R2 | Relações de negócio, estado finalizado, recibos, lookup, paginação e fuso |
| Concorrência | 16 replays: uma criação; 2 updates da mesma versão: um vencedor |
| Revogação | 5 verificações de ordenação e negação após revogação |
| Navegador sem banco | 34 verificações, incluindo 16 áreas e indisponibilidade explícita |
| E2E conectado | 20 verificações, dez recursos criados por formulário e perda de ACK |
| Build integrado | next build sem segredos e smoke do Next start; conferir run final |

O E2E conectado usa Chromium, HTTPS local, handlers reais, outro canal HTTPS, PostgREST 16.4 e PostgreSQL 17. Há proxy de injeção de falhas no transporte, não um banco simulado. O servidor final do domínio, WAF, Supabase hospedado e provedores externos não foram exercitados por esse ensaio.

Os screenshots do pacote contêm dados sintéticos persistidos no banco descartável, com identidade de teste explícita. Não representam clientes ou receita de AB. Parte das capturas móveis pode registrar uma transição de navegação; não substituir a inspeção visual e o aceite cross-browser pela contagem de testes automatizados.

Um experimento de timeout merece ressalva: uma função declarando `statement_timeout=50ms` executou um `pg_sleep(0.2)` por cerca de 203ms quando chamada diretamente. Isso não prova falha do timeout no PostgREST: o gateway documenta a promoção de configurações de função para a transação. É obrigatório verificar o setting efetivo no transporte produtivo, e não presumir equivalência entre chamada direta e HTTP.

## 9. Arquitetura de execução recomendada

A decisão é manter monólito modular e transações no PostgreSQL enquanto não existir volume ou autonomia organizacional que justifique decomposição. Migrar agora para microsserviços multiplicaria fronteiras de identidade, deploys, rastreamento e reconciliação sem uma necessidade demonstrada.

Fluxo atual de comando:

```text
Identidade administrativa → autorização de organização → contrato validado
→ chave de intenção → RPC → membership e RLS
→ alteração + auditoria + recibo + outbox na mesma transação
→ confirmação validada ou resultado explicitamente incerto
```

Fluxo futuro de efeito externo, ainda não implementado:

```text
Plano imutável → aprovação do conteúdo exato → despacho autorizado
→ confirmação externa identificada → reconciliação periódica
                  ↘ resultado desconhecido: suspender decisões incompatíveis
```

Aprovar uma intenção deve significar aprovar organização, beneficiário/recurso, valor ou alteração, moeda, conta do provedor, validade e hash. Uma edição invalida a aprovação. Não basta esconder um botão na UI. A autorização precisa ser conferida novamente no executor.

Uma outbox exige lease e fencing token para consumidores, limite de tentativas, backoff com jitter, dead-letter queue e diagnóstico. Uma inbox exige autenticação do evento bruto, conta emissora, timestamp, chave externa e proteção contra replay. Consumidor morto depois de enviar e antes de confirmar deve reconciliar pelo ID externo, não repetir cegamente um pagamento ou compra de domínio.

Não existe garantia global de exatamente uma vez decorrente da transação local. Reconciliação é parte do produto, não um script de emergência opcional.

## 10. Performance, custo e cenários de escala

O núcleo é pequeno o suficiente para priorizar correção de limites, escopo e consultas. Foram eliminados problemas de lookup truncado, comparação monetária, respostas sem limite e trabalho assíncrono aplicado ao escopo errado. Não houve medição de capacidade produtiva e não há número de latência ou custo a anunciar como observado.

As consultas de visão geral ainda contam e agregam o conjunto do tenant. Um índice não transforma `count(*)`, soma histórica ou pesquisa por `%texto%` em O(log N). O próximo ensaio deve fixar volume por tabela, cardinalidade por organização, proporção de escrita/leitura, rede, duração e recurso computacional. Deve registrar planos, buffers, p50/p95/p99, filas, erros e custo, e comparar alternativas com a mesma carga.

Antes de particionar telemetria, definir retenção, eventos atrasados, manutenção e criação antecipada de partições. Antes de materializar indicadores, definir janela, tolerância de defasagem e `as_of`. Informação incompleta não deve parecer instantânea por estar em cache.

O orçamento de conexões deve somar todos os pools de PostgREST e serviços, reservando capacidade administrativa e de manutenção. A camada Next usa HTTP para o gateway, não uma conexão PostgreSQL por função, mas a multiplicação de gateways e workers continua relevante. Backpressure e limites precisam ocorrer antes da saturação do banco.

Prazos de leitura HTTP são explícitos; limite de corpo, prazo de derivação, consulta e renderização precisam compor um orçamento. Cancelamento do navegador não é confirmação de cancelamento da transação. Migrações usam lock timeout curto e devem falhar sem corrigir silenciosamente dados incompatíveis.

## 11. Continuidade e falhas de causa comum

| Falha | Resposta necessária | Estado atual |
|---|---|---|
| Banco indisponível | Negar mutações; não salvar no navegador; diferenciar não enviado e resultado incerto | Implementado no módulo e testado localmente |
| ACK perdido após commit | Conservar intenção, consultar recibo e evitar duplicação | Implementado e exercitado com banco real |
| Revogação concorrente | Ordenar operação já autorizada e negar as posteriores | Testado no banco; não unifica escopos de estudos |
| Chave de transporte comprometida | Revogar acesso, restringir executor, reconciliar comandos e investigar | Runbook e infraestrutura produtiva pendentes |
| Restauração de backup | Recuperar dados e chaves e reconciliar efeitos externos depois do ponto restaurado | Não ensaiado em produção |
| Deploy com assets incompatíveis | Manifesto de assets versionados e retenção de versões ativas | Não implementado |
| Provedor externo responde de modo ambíguo | Estado desconhecido, bloqueio de repetição incompatível e reconciliação | Modelo proposto; executores desabilitados |

RPO e RTO devem ser metas aprovadas e depois medidas. Não foram contratados ou medidos aqui. Restaurar um banco não desfaz um pagamento, um domínio registrado ou um documento fiscal emitido fora dele. O inventário de efeitos externos e seus IDs precisa sobreviver ao processo de recuperação.

## 12. Oportunidades de produto com métricas utilizáveis

### 12.1 Portfólio ligado à execução

Adicionar responsáveis, marcos, dependências e histórico de estado. O tempo de ciclo deve medir um episódio de trabalho a partir de eventos; não `updated_at-created_at`. Tempo bloqueado é soma de intervalos bloqueados dentro do período. Taxa de entrega no prazo exige prazo versionado antes do encerramento, para impedir melhoria artificial alterando datas depois.

Dependências formam um DAG por projeto. A inclusão de aresta precisa verificar ciclo sob uma estratégia de concorrência que não permita dois inserts individualmente válidos produzirem ciclo juntos. Uma serialização por projeto e verificação topológica é uma opção inicial mensurável; não é necessário construir um sistema distribuído de grafos para esse volume.

### 12.2 Margem e caixa por projeto

Margem operacional por projeto, na mesma moeda e período, deve subtrair da receita reconhecida os custos humanos aprovados, terceiros, infraestrutura alocada e consumo de IA reconciliado. Sem horas, taxa válida no período ou critério de rateio, o indicador é incompleto. Comissão esperada e proposta ganha não devem entrar como caixa recebido.

Uma projeção de 13 semanas depende de saldo inicial confirmado com instante, recebimentos classificados por grau de confirmação, obrigações e moeda. Não há saldo bancário nesta entrega. Portanto, não se deve exibir runway real a partir de lançamentos manuais isolados.

### 12.3 FinOps de IA

Criar catálogo de preços versionado por vigência e unidade, distinguindo custo estimado, faturado e alocado. Cobertura de precificação = eventos com custo identificável / eventos válidos do período; denominador zero produz indisponível, não 100%.

Reservas de orçamento precisam ser atômicas para chamadas concorrentes. O fechamento utiliza consumo real, tratando cancelamento, uso atrasado e resposta duplicada. Tokens de cache podem ter tarifa própria; não há fator universal de economia presumido. O conteúdo do prompt não é necessário para governar custos.

### 12.4 Fábrica de estudos e evidências

Conectar Estudo, Versão, Dataset, Método, Aprovação e Concessão de Acesso. Alterar uma hipótese não deve reescrever um estudo já compartilhado. Uma nova versão pode referenciar a anterior e registrar diferenças de dados, método e decisão.

Os indicadores GeoKPI devem carregar grão territorial, unidade, data da fonte, fórmula, ausência e aprovação. Um ponto comercial não vira cliente validado. O ALLinONE deve administrar a coleta e o aceite das evidências de execução, não apenas abrir o mapa.

### 12.5 Inventário operacional e releases

Normalizar produto, repositório, ambiente, deployment, domínio e titularidade. Um projeto pode ter vários repos e um ambiente pode servir vários componentes. A importação precisa ser idempotente, identificada por provedor/conta/ID e revisável antes de atribuir titularidade.

Release aceito exige commit, artefato, resultado de testes e observação de saúde no ambiente. `READY` significa conclusão de implantação na plataforma, não comprovação funcional do aplicativo. A central deve exibir a evidência e sua idade.

### 12.6 Comercial e documentação

Ligar oportunidade, versão de proposta, escopo, capacidade, contrato e projeto. Métricas de conversão exigem coortes históricas; não introduzir probabilidade arbitrária por etapa. Contratos devem ter versões e evidência do provedor de assinatura. Documento recebido, hash informado e documento verificado são estados diferentes.

Antes de ingestão automática, implementar storage privado, URLs temporárias, limites, quarentena e parser seguro. XML, arquivos compactados, anexos de e-mail e URLs externas precisam de políticas próprias. Certificados e chaves não entram no cadastro genérico de documentos.

### 12.7 Integrações como capacidades explícitas

DDA, DF-e, NFS-e, DNS, registradores, afiliados, assinatura e telemetria devem ter conexão, conta, organização, escopo, validade, ambiente e situação de homologação. A conexão disponível nesta conversa não é uma credencial automaticamente disponível para o aplicativo.

A fase inicial deve priorizar leitura, normalização e reconciliação. Ações externas exigem aprovação e controle do resultado. Os exemplos com tag de afiliado fictícia, domínio disponível por ausência de RDAP ou pagamento de obrigação de terceiro não são aceites de integração.

## 13. Registro de 60 itens

Estados: C = corrigido no código, P = parcial, A = aberto, B = bloqueio externo, O = oportunidade. Os detalhes de ação, evidência e aceite constam também do registro JSON entregue com o relatório. Correção no código não significa liberação em produção.

| ID | Prioridade | Estado | Tema |
|---|---|---|---|
| 01 | P0 | C | Confirmação inválida após mutação |
| 02 | P0 | C | Nova intenção depois de ACK perdido |
| 03 | P1 | C | Consulta operacional de recibos |
| 04 | P0 | C | Cliente incompatível com projeto da proposta |
| 05 | P0 | C | Reescrita de lançamento finalizado |
| 06 | P1 | C | Comissão confirmada mutável |
| 07 | P1 | C | Stream, prazo, UTF-8 e preservação de 413 |
| 08 | P0 | C | Editor assíncrono com escopo antigo |
| 09 | P1 | C | Referências fora dos primeiros 100 registros |
| 10 | P1 | C | Próxima página presumida |
| 11 | P1 | C | Fuso e data de corte dos indicadores |
| 12 | P1 | C | Roundtrip monetário por ponto flutuante |
| 13 | P0 | C | Credencial ambígua entre administradores |
| 14 | P1 | C | Derivações caras sem admissão local |
| 15 | P1 | C | Resposta confiada sem contrato de saída |
| 16 | P1 | P | Snapshot ausente versus zero e freshness na UI |
| 17 | P0 | P | Revogação concorrente e fontes separadas de permissão |
| 18 | P1 | P | Cadeia de fornecimento parcialmente fixada |
| 19 | P0 | C | Build mascarado por tee |
| 20 | P1 | C | Arquivo omitido do pacote apesar do manifesto |
| 21 | P0 | C | Segredo do blog exigido para compilar a base |
| 22 | P0 | C | Falta de ensaio integrado com banco real |
| 23 | P0 | B | Configuração administrativa produtiva |
| 24 | P0 | B | Banco administrativo produtivo |
| 25 | P0 | A | Conteúdo público e administração no mesmo origin |
| 26 | P0 | A | MFA, recuperação e identidade individual |
| 27 | P1 | A | Revogação individual e timeout ocioso |
| 28 | P1 | A | Auditoria de autenticação, leitura e exportação |
| 29 | P0 | P | Backend privilegiado informa p_actor |
| 30 | P0 | A | Retenção e PII nos recibos |
| 31 | P1 | P | Cadastro jurídico e representação não verificados |
| 32 | P1 | A | Namespace de conta de provedor nos eventos |
| 33 | P1 | O | Responsáveis, dependências e histórico de execução |
| 34 | P1 | A | Registro gerencial versus livro contábil |
| 35 | P1 | O | Margem e caixa com custos completos |
| 36 | P0 | A | Outbox sem consumidor operacional |
| 37 | P0 | A | Inbox autenticada e reconciliação de webhooks |
| 38 | P0 | A | Limites distribuídos e proxy confiável |
| 39 | P1 | A | Assets estáticos durante rollout concorrente |
| 40 | P1 | O | Relações de inventário normalizadas |
| 41 | P1 | O | Tarifas, faturas e reservas de IA |
| 42 | P1 | O | Ciclo de execução de harness |
| 43 | P1 | O | Fábrica de estudos, versões e aprovação |
| 44 | P0 | B | Fiscal/DDA e autorização de representação |
| 45 | P0 | B | Compra de domínio e DNS homologados |
| 46 | P1 | B | Programas de afiliados conectados |
| 47 | P0 | B | Storage privado, assinatura e certificados |
| 48 | P0 | B | Backup, PITR e restauração produtiva |
| 49 | P1 | A | Benchmark de capacidade e custo |
| 50 | P1 | A | Agregados históricos e pesquisa por infixo |
| 51 | P1 | P | Runner completo de migrações e recuperação |
| 52 | P0 | P | Timeout dependente do contexto de execução |
| 53 | P1 | P | Intenção desconhecida após fechar o navegador |
| 54 | P1 | A | Cross-browser e acessibilidade completa |
| 55 | P0 | A | Revisão de segurança do blog legado |
| 56 | P1 | A | Correlação de erro sem tracing durável |
| 57 | P1 | A | Exportação integral consistente |
| 58 | P0 | A | Permissões finas e dupla aprovação |
| 59 | P1 | O | Catálogo de métricas executivas |
| 60 | P0 | A | Minimização de dados dos produtos setoriais |

## 14. Ordem de implantação e critérios de saída

Primeiro, aceitar o núcleo como revisão técnica: compilar, executar todas as migrações em base isolada, rodar negativos de tenant e versão, validar intenções incertas e conferir o pacote. Não inserir credenciais reais em fixtures ou artefatos.

Segundo, selecionar e autorizar a configuração produtiva. Cadastrar identidade, organizações, memberships e fuso. Confirmar o isolamento no domínio, a configuração de banco, os limites de tráfego e o mecanismo de recuperação. O destinatário de Sinop continua sem acesso administrativo.

Terceiro, habilitar um piloto de metadados de portfólio, sem dados clínicos, prompts, certificados, comandos remotos ou operações bancárias. Classificar o inventário antes de importá-lo. Exibir cobertura e origem dos dados e tratar unknown como unknown.

Quarto, reforçar identidade e fronteiras de origem, registrar o ciclo de autenticação, testar restore e controlar retenção. A ausência desses controles não deve ser mascarada por um dashboard visualmente pronto.

Quinto, executar integrações de leitura por conexão/conta e registrar eventos com assinatura e deduplicação. Somente depois de reconciliação aceita considerar fiscal, assinatura ou ações de infraestrutura. Pagamentos e uso de certificados exigem etapa de aprovação própria.

## 15. Handoff técnico e referências

Os arquivos novos principais são `fault.ts`, `io.ts`, `transport.ts`, `state.js`, a migração `003_hardening.sql`, `hardening.cjs`, `hardening.sql`, `revocation.py`, `allinone-e2e.cjs` e `allinone-build-smoke.cjs`. As alterações em `auth.ts`, `service.ts`, `handler.ts`, UI e workflow estão na mesma branch. A compatibilidade de build do blog foi uma ampliação limitada do escopo e não deve ser confundida com mudança da produção.

Não houve escrita direta no caminho do Mac. O pacote deve ser integrado ao repositório existente, preservando alterações locais. Não executar migrações em produção sem identificar banco, revisão atual, backup e responsáveis. A terceira migração é transacional e deliberadamente falha diante de registros incompatíveis; não executa limpeza automática.

Fontes oficiais consultadas para verificar os mecanismos, além do código e dos anexos:

- PostgreSQL, Row Security Policies: https://www.postgresql.org/docs/current/ddl-rowsecurity.html — fronteiras de RLS e papéis privilegiados.
- Supabase, Database Functions: https://supabase.com/docs/guides/database/functions — privilégios de execução e funções de banco.
- PostgREST, Transactions: https://docs.postgrest.org/en/stable/references/transactions.html — transações e hoisting de configurações.
- PostgREST, Configuration: https://docs.postgrest.org/en/stable/references/configuration.html — settings efetivos do gateway.
- OWASP, Session Management: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html — ciclo de sessão e limite de HttpOnly.
- OWASP, Transaction Authorization: https://cheatsheetseries.owasp.org/cheatsheets/Transaction_Authorization_Cheat_Sheet.html — vínculo entre aprovação e operação exata.
- Workflow Syntax: https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax — semântica do shell e pipelines de build.
- NFS-e, documentação atual: https://www.gov.br/nfse/pt-br/biblioteca/documentacao-tecnica/documentacao-atual — contratos de integração a homologar, não configuração já executada.
- Amazon, Creators API/PA-API: https://affiliate-program.amazon.com/creatorsapi/docs/en-us/paapiv5-deprecation — referência para uma integração futura, sem inferir elegibilidade da conta.

A versão produtiva, a prontidão de APIs e a situação jurídica não foram deduzidas das fontes públicas. O aceite final usa as evidências do projeto e as autorizações do responsável.
