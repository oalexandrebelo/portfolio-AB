# AB Estudos — GeoKPI V3

por AB | www.alexandrebelo.com.br

Versão do motor: `AB-IOT-3.0`. Referência desta revisão: 07/10/2026.

## 1. Objeto e preservação do estudo

A V3 substitui o mapa anterior de concentração de pontos por um workspace de priorização territorial, com geometrias censitárias, indicadores explicáveis, simulação econômica incremental, ranking, gráficos vinculados e rastreabilidade. MapCN/MapLibre continua sendo a tecnologia do mapa. A organização visual usa painéis de camadas, inspeção de objetos, gráficos e evidências; não é uma implantação, integração ou certificação da plataforma Palantir.

O EVTEO integral e seus fluxos originais foram preservados. O diagnóstico incremental de um setor NÃO substitui nem pode ser somado ao VPL do projeto completo. As premissas e o escopo dos dois motores são diferentes.

Rotas: `/estudos`, `/estudos/sinop`, `/estudos/sinop/mapa`. A última é a versão expandida da aba Mapa de oportunidades. Todas as rotas com conteúdo exigem a sessão do estudo. O fluxo por senha, os cookies e os segredos existentes não foram modificados nesta revisão.

Destino local de referência: `/Users/alexandrebelo/Projetos/AB-Port./AB`. A existência desta documentação no repositório não comprova sincronização do computador local.

## 2. Nova fonte primária e recorte exato

Fonte: malha de setores com atributos do Censo Demográfico 2022, IBGE.

Arquivo oficial: https://ftp.ibge.gov.br/Censos/Censo_Demografico_2022/Agregados_por_Setores_Censitarios/malha_com_atributos/setores/shp/UF/MT/MT_setores_CD2022.zip

Dicionário: https://ftp.ibge.gov.br/Censos/Censo_Demografico_2022/Agregados_por_Setores_Censitarios/malha_com_atributos/Dicionario_de_dados_malha_agregados.ods

SHA-256 aceito: `6c83cf0d0e2cdff4e70c4c4fbf9937c19ba9d8deef6dfea1e4d04c900f4444e0`.

Critério de seleção: `NM_MUN ∈ {Sinop, Sorriso}`, `NM_DIST = NM_MUN` e `SITUACAO = Urbana`.

| Recorte urbano do distrito-sede | Setores | Domicílios particulares ocupados | Pessoas |
|---|---:|---:|---:|
| Sinop | 329 | 66.569 | 190.451 |
| Sorriso | 141 | 34.515 | 103.010 |
| Total selecionado | 470 | 101.084 | 293.461 |

Esses resultados são somas dos atributos dos setores selecionados. Não são totais municipais, estimativas de 2026, assinantes, imóveis disponíveis ou demanda reprimida. Os limites históricos de 2022 não foram projetados para alterações territoriais posteriores. Loteamentos ocupados depois do Censo podem exigir diligência prioritária mesmo quando aparecem com baixa pontuação histórica.

Variáveis: `v0001` pessoas; `v0007` domicílios particulares ocupados, DPPO + DPIO; `v0003` domicílios particulares totais; `v0005` moradores por domicílio ocupado; `v0006` fração de DPO imputados; `AREA_KM2 × 100` área em hectares. O campo de imputação é exibido como percentual, não confundido com quantidade de domicílios.

A área é a superfície TOTAL do setor, incluindo porções não edificadas. O indicador calculado é DPO/ha, não acessos Anatel/ha nem domicílios por hectare útil. Os nomes de bairro são os atributos oficiais; campos ausentes permanecem ausentes.

As geometrias originais usam coordenadas geográficas SIRGAS 2000. São adequadas à leitura estratégica na escala apresentada, não a projetos topográficos, cadastro executivo de postes ou medição de distâncias de engenharia.

## 3. Atividades OSM e associação espacial

O estudo mantém a coleta editorial anterior: 313 objetos OSM, 101 na janela de Sinop e 212 na janela de Sorriso, com base temporal 06/10/2026. Não houve alegação de nova coleta integral do cadastro empresarial nesta revisão.

Janelas [oeste, sul, leste, norte]: Sinop `[-55.56,-11.92,-55.45,-11.80]`; Sorriso `[-55.78,-12.58,-55.66,-12.49]`.

Cada objeto é associado a no máximo um setor, por teste ponto-no-polígono sobre a geometria censitária. IDs OSM repetidos são deduplicados; pontos de fronteira usam desempate pelo menor código censitário. Objetos fora da coorte ficam fora dos totais territoriais e sua quantidade é mostrada na seção de evidências. Polígonos com ilhas e buracos são tratados explicitamente.

Uma coordenada de nó e o centro de uma geometria OSM têm precisões semânticas diferentes. A associação não comprova que a entrada física, a matrícula, o CNPJ ou a ligação elétrica do estabelecimento pertençam ao mesmo endereço. Um hospital representado como campus e prédio pode ter múltiplos objetos com IDs distintos; deduplicação por ID não é resolução cadastral de entidades.

A cobertura editorial é desigual. Um município com mais contribuidores OSM não é automaticamente um mercado maior ou melhor. A comparação empresarial deve ser lida junto à tese residencial e à disponibilidade dos insumos.

## 4. Índice de oportunidade territorial — IOT

O IOT é uma regra de TRIAGEM, não uma probabilidade de sucesso, taxa de retorno ou modelo calibrado com vendas.

Para densidade, escala e âncoras: `N(x; R) = 100 × min[ln(1 + max(x, 0))/ln(1 + R), 1]`.

Componentes:

1. Densidade residencial: `x = DPO/ha`, referência analítica R = 30.
2. Escala histórica: `x = DPO`, R = 800.
3. Âncoras ponderadas: `x = soma dos pesos das atividades / km²`, R = 40.
4. Diversidade: `100 × [−Σ p_i ln(p_i)/ln(5)] × n/(n+5)`; n = objetos classificados no setor. O fator de estabilidade reduz amostras pequenas, mas não representa intervalo estatístico.

Pesos por atividade: educação 2; saúde 3; serviços 2; comércio/alimentação 1; comunidade 0,5. São hipóteses de criticidade e prospecção, não ARPU atribuído a cada objeto.

| Perfil | Densidade | Escala | Âncoras | Diversidade |
|---|---:|---:|---:|---:|
| Misto | 40% | 20% | 25% | 15% |
| Residencial | 60% | 30% | 5% | 5% |
| Empresarial | 15% | 10% | 55% | 20% |

`IOT identificado = Σ peso_i × indicador_normalizado_i` para insumos disponíveis.

Âncoras e diversidade entram no índice somente quando toda a caixa envolvente do setor está dentro da janela de coleta OSM. Isso evita comparar um setor cortado pela janela como se tivesse coleta integral. A verificação é conservadora; não afirma que o cadastro OSM dentro da janela esteja completo.

O peso ausente NÃO é distribuído entre outros indicadores. `IOT superior = IOT identificado + 100 × peso não identificado`. A faixa é um intervalo de identificação, não intervalo de confiança. Disponibilidade de 100% dos quatro insumos NÃO significa prontidão de investimento ou precisão de 100%.

Densidade e escala são relacionadas entre si. Os pesos não significam evidências estatisticamente independentes. A validação futura deve confrontar ranking, conversão, custo real de traçado, concorrência e retenção. Não ajustar pesos apenas para favorecer uma cidade.

## 5. Como mapa e gráficos se relacionam

A camada de calor é coroplética: cada polígono recebe a cor do KPI do setor, sem inventar pontos residenciais ou distribuir casas uniformemente pelo território. Há quatro leituras: IOT, DPO/ha, VPL incremental e disponibilidade ponderada dos insumos. As escalas são fixas; aproximar o mapa não transforma automaticamente uma região em mais promissora.

O clique no mapa, no ranking ou no gráfico de dispersão seleciona o mesmo código censitário. O inspetor mostra os insumos, quatro contribuições, base histórica, área, imputação e lacunas. O ranking acompanha a métrica escolhida e suas barras continuam mostrando a decomposição do IOT.

Dispersão: eixo X log(1 + DPO/ha), eixo Y VPL incremental; linha zero demarca somente o resultado financeiro do cenário. Pareto: percentual acumulado dos domicílios em função dos setores na ordem atual. Alterar a ordenação muda a curva; não se trata de uma lei empírica fixa de 80/20.

Bairros são agregados pelos setores filtrados, com IOT ponderado por DPO. Uma linha de setor com o nome de um bairro não significa que todo o bairro tenha a mesma prioridade.

A seleção dos primeiros N setores constitui um lote de triagem. Não é um algoritmo de roteamento, expansão contígua, orçamento ótimo ou solução de localização de instalações.

## 6. Simulação econômica incremental de 120 meses

Premissas de referência, todas editáveis e não cotadas localmente: ARPU residencial R$129; B2B R$450; penetração de 30% no HP; fração atendível de 70% dos DPO; CAPEX passivo R$24.000/km; 120 HP/km; setup R$30.000/setor; OPEX fixo R$2.500/mês/setor; variável residencial R$25 e B2B R$95 por mês; churn residencial 1,5% a.m.; deduções efetivas 24% da receita; TMA 18% a.a.; rampa de 18 meses.

Outras premissas visíveis no painel avançado: qualificação de 50% dos objetos e conversão B2B de 20% dos qualificáveis; ativação residencial R$650/B2B R$1.800; CAC residencial R$200/B2B R$500; recuperação de 30% do custo de ativação na reposição elegível; aluguel de R$10/ponto/mês; 25 pontos/km; manutenção anual de 2% da ODN.

Equações: `HP = DPO × fração atendível`; `km equivalentes = HP / (HP/km)`; `residencial alvo = HP × penetração`; `B2B esperado = objetos × qualificação × conversão`.

Quilômetros equivalentes NÃO são uma rota construída ou medida. Valores fracionários de clientes B2B são expectativas matemáticas, não contratos. O traçado não é deduzido do perímetro censitário.

No mês zero entram ODN e setup. A receita mensal usa média entre base de abertura e fechamento. Adições brutas incluem reposição de churn. Custos de aquisição, ativação e recuperação de equipamentos são separados. B2B usa churn equivalente à metade do residencial como hipótese explícita do motor. No mês 60 ocorre reposição parcial de 50% do custo de terminais da base; não é reposição integral anual.

`VPL = Σ FC_m / (1 + TMA)^(m/12)`. Pico de capital = maior exposição negativa acumulada. Payback sustentado = primeiro mês a partir do qual o acumulado permanece não negativo até o término; não apenas primeiro cruzamento de zero. Não é apresentado um número de TIR ambíguo para fluxos não convencionais.

Preços e custos permanecem sem reajustes. Não se afirma que a TMA seja WACC aferida ou que os fluxos incorporem inflação corretamente estimada. Deduções são uma hipótese agregada, não apuração individual de ICMS, IRPJ, CSLL, contribuições, créditos ou regime tributário. Reservas, capital de giro adicional, financiamento, covenants e a estrutura integral do ISP precisam ser tratados no EVTEO completo.

O equilíbrio residencial calcula clientes necessários para absorver os custos fixos após variável e reposição. Não inclui B2B e não remunera a rede. Capacidade indicativa = residencial × 3,5 Mbps + B2B × 20 Mbps; não é CIR vendido ou telemetria aferida.

O lote agrega os fluxos mensais ANTES de calcular o pico de caixa. Setup e custos fixos são cobrados por setor; eventuais sinergias de rota e equipe não são presumidas.

## 7. Estresse e contingência

O estresse combinado reduz ARPU em 10%, adesão em 5 pontos percentuais, eleva churn em 0,7 ponto percentual, CAPEX/km em 25% e variável em 15%, e insere no M24 um dia de receita perdida mais reparo de R$15.000. Não representa probabilidade, frequência de rompimentos locais ou SLA contratual comprovado.

Para a decisão real, validar grupos de risco compartilhado no transporte, capacidade remanescente após falha N−1, autonomia elétrica, tempo de restabelecimento, estoques, mobilização e multas de SLA. Três contratos não comprovam três rotas físicas. Cache local não mantém aplicações dependentes de autenticação ou transações remotas quando o transporte externo cai.

A matriz 5 × 5 de ARPU e penetração recalcula o mesmo setor e aplica o par selecionado ao cenário e à camada de VPL. As demais variáveis ficam constantes. Não é uma elasticidade de demanda medida.

## 8. Os 20 KPIs e o que não foi medido

O infográfico mantém a matriz dos 20 KPIs originais, com situação e método de coleta. DPO/ha não substitui DYH de acessos. Contagens OSM não substituem CAS, HHI, renda ou contratos B2B. Praticar um preço de vitrine não demonstra ARPU. Reclamações por mil não são NPS. Cabos drop não certificam portas ativas. Outorga SCM não comprova propriedade de rede. Critérios de engenharia não podem ser inventados a partir de imagens ou do score.

Continuam pendentes: aprovação de postes, sobreposição de fibra, disponibilidade de CTO, participações locais reconciliadas, MTTR, latência por sondas consentidas, CGNAT/IPv6 medidos no terminal, frequência e riscos físicos de falhas, custo real das rotas, demanda atual, renda e disposição a pagar. A interface NÃO preenche essas lacunas com números simulados rotulados como observados.

## 9. Arquivos, desempenho e segurança

`study-map/analytics.mjs` contém cálculo puro; `analytics.d.mts` e `types.ts` definem contratos. `workspace.tsx` coordena filtros/seleção; `charts.tsx` renderiza gráficos SVG; `layers.tsx` gerencia fontes/layers MapCN/MapLibre; `workspace.css` define o layout responsivo. `scripts/studies-census-prepare.mjs` prepara a fonte oficial; `lib/estudos/census.ts` e `map.ts` entregam dados depois da autorização.

Os 470 polígonos têm aproximadamente 13 mil vértices. As camadas usam GeoJSON no renderizador em vez de centenas de marcadores DOM. Os cálculos reutilizam resultados com memoização e parâmetros diferidos. A atualização dos inputs aplica validação numérica antes de entrar no motor. Não há telemetria privada, localStorage ou IndexedDB para persistir dados do estudo.

A coleta externa não ocorre durante requisições do visitante. O download IBGE acontece no build com limite de tamanho, timeout, tentativa limitada e SHA-256. Alteração inesperada do arquivo interrompe a construção; nunca altera a base silenciosamente. A versão de produção anterior continua disponível quando um novo build falha. O cache é derivado da fonte verificada, não bypass de integridade.

A base OSM continua cifrada e o estudo completo protegido. O módulo gerado do Censo é importado somente no servidor. Apesar de a fonte IBGE ser pública, seu payload não foi colocado em endpoint público do estudo. Assets públicos são código/CSS/worker, não a senha ou o conjunto privado de dados. A política de conteúdo permite os recursos necessários ao mapa-base; a senha não é enviada ao fornecedor cartográfico. Esse fornecedor ainda recebe o IP e as solicitações de tiles, uma limitação normal da dependência externa documentada.

Falha do mapa-base não deve alterar KPIs ou gerar uma camada fictícia. O catálogo e os cálculos permanecem disponíveis; WebGL indisponível requer fallback textual. Não prometer modo geográfico offline sem provisionar tiles e direitos correspondentes.

## 10. Construção, testes e manutenção

Em Node compatível com o projeto: `npm ci --include=dev --ignore-scripts` seguido de `npm run build`. O prebuild instala dependências travadas do submódulo, prepara/verifica o Censo, executa TypeScript estrito, testes matemáticos, bundle e testes de segurança. A configuração privada é necessária para os testes reais do conteúdo, nunca deve ser colocada no código ou em logs.

Motor: 1.821 verificações aprovadas na revisão, incluindo geometrias, contagem de setores, pesos, intervalos, dados ausentes, fluxos mensais e invariantes. Os testes de origem, senha e isolamento anteriores foram preservados. `scripts/studies-geokpi-browser.cjs` testa entradas direta/blog/www, rejeição de senha, filtros, inspeção, parâmetros, sensibilidade, exportação, layout móvel, sessão e CSP.

Execução do navegador: fornecer `PLAYWRIGHT_MODULE` quando a biblioteca não estiver no projeto e `AB_STUDY_TEST_CODE` somente por ambiente; usar `AB_TEST_OUTPUT` para resultados. `AB_LOCAL_UI_ROOT` é exclusivamente instrumentação de desenvolvimento com assets locais e Censo público; sua execução NÃO comprova publicação. A validação de produção deve omitir essa variável e conferir o domínio após o deploy READY.

Exportações: JSON da análise contém fontes, versão, filtros, componentes e premissas; GeoJSON mantém os polígonos; CSV mensal conserva números financeiros e neutraliza strings de fórmula. Arquivos exportados por alguém autorizado são cópias locais sem DRM; a senha não impede captura de tela ou redistribuição por destinatários autorizados.

Para atualizar a base: conferir nova edição/dicionário, atualizar hash e testes de coorte, revisar limites territoriais e anos, construir e validar em separado, então publicar. Para melhorar a recomendação: adicionar dados atuais por endereço e rota com origem, licença, denominador e data. A geração de um novo índice precisa de versão própria e comparação com resultados reais; não mudar a definição de KPI retroativamente.
