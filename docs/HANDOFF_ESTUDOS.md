# Handoff — AB Estudos reservados e inteligência geográfica

Destino local: `/Users/alexandrebelo/Projetos/AB-Port./AB`

Edição: 06/10/2026. Este documento é operacional; não substitui o EVTEO. Não contém senhas, chaves de dados ou cookies. O caminho acima é o destino solicitado: a existência do documento no repositório não confirma sincronização com o Mac.

## 1. Contrato de funcionamento

O blog contém o texto discreto **Estudos**, apontando para `/estudos`. A entrada direta em `/estudos/sinop` também mostra o formulário quando não há autorização. O domínio com `www` é redirecionado para o domínio canônico sem `www`. A senha identifica o projeto no servidor; o navegador não escolhe o estudo por parâmetro de redirecionamento. Uma senha diferente só abre outro estudo se ele estiver cadastrado e habilitado. Não há catálogo público.

Após senha válida, o servidor retorna HTTP 303 para o estudo correspondente e cria uma sessão de oito horas. Abrir `/estudos` com sessão válida reaproveita essa autorização. Para trocar de estudo, encerrar a sessão e informar a outra senha. Senha desconhecida recebe 401; ausência de autorização não entrega o relatório, o mapa ou os arquivos. Cookies são necessários. Não é uma solução DRM: um destinatário autorizado pode copiar ou exportar conteúdo.

## 2. Incidentes corrigidos

A política `Referrer-Policy: no-referrer` fazia um formulário legítimo enviar `Origin: null`. O verificador anterior rejeitava a requisição antes de verificar a senha, produzindo uma página branca com 403. A política agora é `same-origin`. Formulários antigos com origem opaca só são aceitos quando o desafio CSRF assinado corresponde ao cookie e não há indicação de origem externa. Origem externa conhecida continua bloqueada.

Além disso, a senha informada ao destinatário não correspondia à configuração anterior. O cadastro `AB_STUDIES_ACCESS_CODES`, restrito ao servidor, estabelece a credencial efetiva por slug. O hash da credencial integra a validação da sessão: alterar a senha revoga sessões anteriores no novo deployment. Não realizar rollback para builds anteriores à correção dessas duas causas.

O mapa tem compilação independente. O build inclui explicitamente ferramentas de desenvolvimento (`npm ci --include=dev` no pacote do mapa), porque o ambiente de produção omite essas ferramentas por padrão. A CSP do mapa permite seu CSS, JavaScript e worker locais; a CSP do relatório principal permite apenas o iframe de mesma origem necessário ao mapa.

## 3. Arquivos e responsabilidades

| Caminho | Responsabilidade |
|---|---|
| `app/blog/page.tsx` | Link discreto de entrada, sem alterar o conteúdo dos artigos |
| `app/estudos/[[...path]]/route.ts` | Route Handler Node, dinâmico, sem herdar analytics da LP |
| `lib/estudos/security.ts` | Cadastro, credenciais, HMAC, sessões, CSRF, cookies, limites e headers |
| `lib/estudos/handler.ts` | Autorização central antes de qualquer conteúdo ou exportação |
| `lib/estudos/ui.ts` / `brand.ts` | Formulário e marca AB |
| `lib/estudos/vault.ts` / `envelopes.ts` | Abertura dos documentos cifrados e catálogo interno |
| `lib/estudos/map.ts` | Abertura da camada cifrada, resposta privada e inserção da aba no dashboard |
| `private-studies/` | Documentos e camada geográfica cifrados; nunca mover para `public/` |
| `study-map/index.tsx` / `map.css` | Workspace geográfico, filtros, heatmap, catálogo e inspeção |
| `study-map/vendor/` | Componente MapCN fixado, licença MIT e procedência |
| `study-map/build.mjs` | Bundle IIFE, CSS e workers hospedados na mesma origem |
| `public/study-assets/` | Saídas genéricas geradas no build; sem dados dos estudos |
| `scripts/studies-verify.mjs` | Testes do controle de acesso e do conteúdo cifrado no build |
| `scripts/studies-map-test.mjs` | Testes de credenciais isoladas, origem e dados geográficos |
| `scripts/studies-browser-test.cjs` | Percursos reais de navegação e login com credencial fornecida por ambiente |
| `scripts/studies-geo-collect.mjs` | Seleção editorial, normalização e cifra de nova coleta geográfica |

## 4. Configuração privada

Variáveis exclusivamente do servidor, configuradas como sensíveis no ambiente de produção:

- `AB_STUDIES_SESSION_KEY`: chave HMAC com 64 caracteres hexadecimais.
- `AB_STUDIES_REGISTRY`: array de `{slug, revision, accessHash, dataKey, enabled}`. `dataKey` é a chave do documento; slugs e hashes devem ser únicos.
- `AB_STUDIES_ACCESS_CODES`: objeto privado `slug → credencial aleatória` que define os códigos efetivos. Nunca prefixar com `NEXT_PUBLIC_`.
- `AB_STUDIES_GEO_KEY`: chave AES-256-GCM da camada cartográfica de Sinop.

O conteúdo utiliza AES-256-GCM e compressão Brotli. O AAD associa os documentos e a camada ao slug; a camada possui AAD `ab-study-map:v1:sinop`. Não trocar uma chave de dados sem recifrar seu envelope. Alterar variáveis na plataforma exige novo deployment. Não usar credenciais reais em arquivos versionados, capturas de logs, fixtures ou issues.

O limitador local permite dez tentativas por minuto por IP em cada instância e limita a memória. Ele não é um limitador distribuído. Uma regra WAF global só deve ser declarada ativa após inspeção da configuração real; não há dependência funcional de um bucket externo. As credenciais são aleatórias de alta entropia, não senhas humanas curtas.

## 5. Construção e testes locais

No diretório solicitado, conferir primeiro `git status` e o remote. Não usar `reset --hard`, não sobrescrever mudanças locais e não inserir arquivos de produção em diretórios públicos. Atualizar a branch por fast-forward somente quando a árvore local estiver limpa e o remote for o projeto correto.

```sh
cd '/Users/alexandrebelo/Projetos/AB-Port./AB'
git status --short
git remote -v
node --version
npm ci --include=dev
node scripts/studies-map-prepare.mjs
npm run build
```

Node 24. O `prebuild` instala o pacote isolado do mapa com lockfile, gera os assets, compila a área de estudos e executa testes. Sem as variáveis privadas, testes unitários continuam disponíveis, mas não comprovam acesso ao conteúdo real. O build de produção exige configuração válida e testa o envelope real. A validação TypeScript específica cobre a camada servidor de estudos; o projeto legado mantém `ignoreBuildErrors`, portanto não declarar o repositório inteiro livre de erros de tipos.

Para o teste de navegador, instalar Playwright em um diretório de ferramentas separado, instalar Chromium e fornecer o caminho do módulo em `PLAYWRIGHT_MODULE`. Informar a credencial apenas em `AB_STUDY_TEST_CODE`, por leitura silenciosa no terminal ou gerenciador de segredos. Executar `node scripts/studies-browser-test.cjs`. Nunca inserir a senha como literal no script. As evidências são privadas em `/tmp/ab-studies-evidence`, ou no diretório indicado por `AB_TEST_OUTPUT`.

O teste cobre entrada genérica, link direto, `www`, blog, caminho pela home, recuperação de URL de ação, senha incorreta, mapa, filtros, busca, exportação, bloqueio de outro estudo, logout e acesso anônimo. A bateria real deve ser executada após o deployment, não substituída apenas por GET da tela de senha.

## 6. Mapa de oportunidades: significado dos dados

A nova camada deriva de uma coleta real OpenStreetMap/Overpass, base de 06/10/2026 às 21:09:27 UTC. A consulta obteve 432 objetos com tag `amenity` em duas janelas urbanas. A seleção editorial contém 313 registros: 101 na janela de Sinop e 212 na janela de Sorriso. As categorias são educação, saúde, serviços, comércio/alimentação e equipamentos/comunidade.

A unidade é **objeto cartográfico**, não empresa única, cliente, domicílio, lead qualificado ou demanda reprimida. Deduplicação por tipo/id do OSM; objetos distintos da mesma instituição podem permanecer. Nós usam suas coordenadas; áreas e vias usam o centro retornado pela consulta. A precisão e atualidade não foram verificadas em campo.

Janelas, em longitude/latitude:

- Sinop: oeste −55,56; sul −11,92; leste −55,45; norte −11,80.
- Sorriso: oeste −55,78; sul −12,58; leste −55,66; norte −12,49.

Não representam o território municipal inteiro. A maior quantidade de registros em uma cidade não demonstra maior mercado: há vieses de contribuição cartográfica e área de recorte. O heatmap usa peso unitário, com raio visual em pixels e escala dependente do zoom. Ele não equivale a densidade demográfica por hectare, renda ou cobertura concorrente.

As teses comerciais e etapas de qualificação são propostas de investigação, não resultados de entrevistas. Os indicadores financeiros lidos do dashboard são do cenário completo do EVTEO, sem alocação inventada por ponto ou bairro. As premissas e conclusões do estudo original não foram alteradas para tornar o mapa mais otimista.

O workspace utiliza MapCN real e MapLibre GL. A referência Palantir Foundry/Blueprint orienta a composição visual de camadas, inspeção e evidências; não há integração com a plataforma Palantir nem uso de seus serviços. O mapa-base usa CARTO/OSM; tiles são externos e o provedor da base recebe consultas geográficas, mas não a senha ou o conteúdo privado. Se tiles/WebGL falharem, o catálogo e os filtros continuam úteis. Preservar atribuição © OpenStreetMap contributors, ODbL e licença MIT do componente.

## 7. Atualizar a camada

A coleta é editorial, não acontece a cada visita. Exportar a resposta completa do Overpass e guardar a evidência original em armazenamento privado. Usar o coletor com `AB_STUDIES_GEO_KEY` no ambiente e saída absoluta dentro do repositório:

```sh
node scripts/studies-geo-collect.mjs /caminho/privado/coleta-osm.json \
  '/Users/alexandrebelo/Projetos/AB-Port./AB/private-studies/sinop/geo.json'
```

O coletor verifica resposta incompleta, limites, IDs, coordenadas e tipos; cifra a saída antes do versionamento. Conferir contagens, data, categorias, recorte e atribuições. Rodar build e navegador. Não publicar o JSON bruto em `public/` nem substituir valores ausentes por estimativas sem identificação.

O componente MapCN está fixado no commit `d160bd767bc6388618720c6038a4dd9948c97362`; sua única adaptação de infraestrutura é o worker na mesma origem. O build não depende do servidor temporário usado no transporte inicial da camada cifrada.

## 8. Adicionar, trocar senha ou revogar outro estudo

Preparar um bundle no formato esperado por `vault.ts`, com slug exclusivo e conteúdo real. Gerar uma chave de dados e credencial aleatórias; cifrar o bundle usando o mesmo formato e AAD, registrar seus chunks em `envelopes.ts`, adicionar a entrada privada ao registry e o código em `AB_STUDIES_ACCESS_CODES`. Não cadastrar dois estudos com a mesma senha. Novo mapa requer um envelope e roteamento próprios: não reutilizar automaticamente a camada de Sinop.

Não há painel administrativo de publicação implementado. O processo é uma alteração operacional versionada e uma atualização de segredos de servidor. Testar senha A → estudo A, senha B → estudo B, acesso A ao conteúdo de B negado, acesso anônimo negado e código inválido negado. O redirecionamento deve continuar vindo exclusivamente do cadastro autorizado.

Para revogar: `enabled:false` e novo deployment. Para trocar senha: alterar o código no objeto privado e fazer redeploy; a validação da sessão inclui o hash atual. Para revogar todas as sessões: rotacionar a chave de sessão com compatibilidade dos hashes/códigos e novo deployment. Nunca divulgar a chave de dados ao destinatário.

## 9. Operação, falhas e rollback

Respostas de estudo, mapa e exportações usam `private, no-store`; indexação é desabilitada como medida complementar, nunca como autenticação. As rotas verificam a sessão antes de abrir os dados. Assets públicos contêm apenas código reutilizável.

Verificar a publicação pelo estado READY, alias do domínio e login real. Não promover build ERROR ou um build apenas com testes unitários. Registrar o commit e deployment efetivamente aceitos no relatório da entrega. Em regressão, retornar ao último deployment comprovadamente funcional com as variáveis compatíveis; versões antigas anteriores à correção de origem e credencial não são base segura de rollback.

Problema preexistente separado: o backend de artigos do blog apresentou falha de DNS do endpoint Supabase. A área reservada foi desacoplada desse armazenamento; corrigir o cadastro/backend dos artigos em tarefa separada, sem afrouxar a autorização dos estudos. Não declarar recuperação de artigos nesta entrega.

## 10. Critérios de aceite

Credencial válida abre somente o estudo cadastrado, por qualquer entrada pública suportada. Nenhum conteúdo ou mapa é entregue anonimamente. O fluxo não depende de uma visita anterior à home. O mapa utiliza dados rastreáveis, respeita seus limites, tem atribuição e mantém contraste, filtros, inspector e comportamento móvel. O build usa fonte e lockfiles versionados. A entrega no repositório e a cópia no Mac devem ser verificadas separadamente.
