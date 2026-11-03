# Checkpoint — Site Wiseia

Workspace ativo: `C:\Users\pepe_\OneDrive\Dev_acervo\Site_Wiseia` (não usar a pasta antiga "artools Meu").
Data: 2026-11-01. Sem commit nem push feitos nesta sessão.

## Regra de preservação
- A página principal (`index.html`) e o Ciclo (`ciclo/`) estão aprovados e **devem ser preservados** (visual, conteúdo, logos exibidos).
- Não mexer nos arquivos internos de `assets/templates/` (design systems).

## Próxima tarefa
**Somente a Hero do Med**, baseada no design system **Clarix** (`assets/templates/clarix-design-system/`). Não alterar principal nem Ciclo. `/med/` ainda não existe (404 esperado).

## Estado atual

### Mídias reorganizadas
| Anterior | Novo |
|---|---|
| `wiseia-logo.png` | `assets/logos/wiseia-logo.png` |
| `Engenheiro.jpg` | `assets/imagens/engenheiro.jpg` |
| `Médica.png` | `assets/imagens/medica.png` |
| `assets/raw_files/video.mp4` | `assets/videos/video.mp4` |
| `assets/raw_files/video2.mp4` | `assets/videos/video2.mp4` |
| `assets/Logos/` | `assets/logos/` (só caixa baixa; contém também `wiseia-ciclo-logo.png` e `wiseia-med-logo.png`) |

Ficaram como estavam: `ciclo/assets/` (recortes), `assets/raw_files/` (capturas originais das ampliações), `assets/raw_files/IMG_6395 Grande.jpeg` (foto de caneta Artools, de outro projeto, sem uso), vídeos sem uso, relatórios históricos (`ciclo/preview/revisao-final.json` ainda cita o caminho antigo do logo).

### Hero principal — bolinha verde-limão
A bolinha acompanha a etapa ativa (01 Solicitação → 04 Registro) pelo mesmo progresso que conduz cartões e barras (função `render()` em `index.html`). A demonstração é conduzida pela **rolagem**, só em desktop (≥1101px de largura e ≥820px de altura, sem `prefers-reduced-motion`); abaixo disso ou com movimento reduzido a cena é estática e a bolinha fica parada no canto (some abaixo de 1000px).
- Posição: centrada sobre a etapa ativa; 44px (era 58px) e 4px acima da trilha, só no modo animado.
- Entre etapas: parada nos primeiros 30% do quarto, desliza nos 70% restantes (smootherstep), chegando quando a próxima etapa começa.
- Retorno Ciclo → Med: smootherstep em p 0,30–0,43; as barras agora zeram em 0,43 (antes 0,38) para coincidir com a chegada à etapa 01.

## Arquivos alterados
- `index.html` — caminhos das mídias; JS e CSS da bolinha (`.hero.scroll-enhanced .orbital-field:after`, `--orb-x`, `orbitAt`, `local` das barras).
- `ciclo/index.html` — caminhos do logo/favicon (`../assets/logos/wiseia-logo.png`).
- Arquivos movidos (tabela acima). Pastas novas: `assets/imagens/`, `assets/videos/`, `docs/`.

## Testes realizados (Chrome headless via CDP + servidor local)
- Principal e Ciclo: imagens e logos carregam, favicon do Ciclo 200, links `/ciclo/` e rodapé do Ciclo OK, sem erros de JS/rede (exceto `/med/` 404 esperado).
- Ampliações do Ciclo (painel, ativos, VOG): abrem, mostram imagem de `raw_files`, fecham, reabrem.
- Bolinha: percurso das 4 etapas no Ciclo e no Med; rolagem para frente/trás idêntica (0,00px de diferença); saltos rápidos de rolagem caem na posição certa; sem sobreposição com cartões/textos/barras em 1101, 1200, 1440 e 1920; resize mantém a bolinha centrada na etapa; reduced-motion deixa parada; celular (390px) sem bolinha e sem demonstração animada.
- Picos de movimento por 4px de rolagem (1440×900): Ciclo 24,6px; retorno 29,9px; Med 22,3px.

## Limitações / pendências
- Não foi possível gravar vídeo nem observar o movimento ao vivo; só quadros parados e medidas de posição.
- Testado apenas no Chrome; Firefox/Safari e celulares reais não testados.
- Durante o retorno Ciclo → Med (p 0,30–0,43) as barras ficam cheias enquanto a bolinha volta; incompatibilidade inevitável e pequena.
- Barras zeram em 0,43 em vez de 0,38 (única alteração fora da bolinha); reversível se desejado.
- Decidir o destino de `IMG_6395 Grande.jpeg` (foto da caneta), dos vídeos sem uso e do JSON histórico com caminho antigo.
- Itens ainda não rastreados pelo git: `assets/logos/`, `assets/imagens/`, `assets/videos/`, `ciclo/`, capturas em `assets/raw_files/`, `assets/templates/genlabs-design-system/`, `docs/`.
- Não publicado.
