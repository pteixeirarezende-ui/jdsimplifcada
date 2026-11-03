# JD Câmaras Frias — Landing Page com Formulário Direto de Orçamento

Landing Page de alta conversão para captação de leads de câmaras frigoríficas sob medida, com formulário direto, rastreamento avançado (Consent Mode v2, Atribuição inteligente `jd_attrib`, `lead_id` idempotente, WhatsApp com código `ref` e verificação HTTP 2xx) e construída 100% sobre o **Design System Oficial da JD Câmaras Frias**.

---

## 🚀 Estrutura do Projeto (Pronta para Deploy)

```
LP - JD CAMARAS - Direto/
│
├── index.html            # Landing Page principal de produção (Pronta para Deploy)
│
├── assets/               # Logotipos oficiais da marca
│   ├── logo-jd.png       # Favicon e logo oficial
│   └── logo-jd-branco.png# Versão do logo para fundos escuros e cabeçalho fixo
│
├── css/                  # Folhas de estilo modulares e otimizadas
│   ├── tokens.css        # Variáveis e cores oficiais da marca
│   ├── base.css          # Reset, tipografia e estilos globais
│   ├── components.css    # Botões, cards, acordeão de FAQ e avisos
│   ├── lp.css            # Estilos de estrutura e micro-animações da LP
│   └── simulador.css     # Estilos do formulário direto, erro e seletores compactos
│
├── js/                   # Scripts de interatividade e rastreamento
│   ├── ds.js             # Utilitários do Design System (acordeão, spotlights)
│   ├── lp.js             # Motor unificado de rastreamento, envio 2xx, lead_id, atribuição e WhatsApp ref
│   └── simulador.js      # Seleção de tipo, dados do produto/medidas, sanitização e WhatsApp
│
└── design-system/        # Catálogo técnico e componentes de referência da marca
    ├── ds_variacao.html  # Showcase consolidado de componentes e efeitos do DS
    └── assets/, css/, js/# Dependências internas do Design System
```

---

## 📱 Verificação 09 — Ajustes da LP Direto (Sem Promessa de Cálculo, GTM Oficial, Form Curto no Mobile)

### 1. Eliminação da Promessa de Cálculo / Simulação
* **Textos na UI visível:**
  - `<title>`: `"Orçamento de Câmara Fria Sob Medida | JD Câmaras Frias"`.
  - `<meta name="description">`: `"Informe o que vai armazenar e as medidas do espaço e receba o orçamento da sua câmara fria sob medida pelo WhatsApp."`.
  - H1 padrão: `"Receba o orçamento da sua câmara fria sob medida"`.
  - Subtítulo padrão: `"Informe o que vai armazenar e as medidas do espaço. A JD monta o orçamento e envia pelo WhatsApp."`.
  - Título do card: `"Peça seu Orçamento de Fábrica"`; subtítulo: `"Preencha os dados abaixo e receba sua proposta:"`.
  - Selo `"⚡ CÁLCULO EM TEMPO REAL"`: **REMOVIDO**.
  - Botão de envio: `"Receber Meu Orçamento"` (inclusive no estado de retry em `js/lp.js`).
  - Links de cabeçalho e rodapé: `"Pedir Orçamento"`.
  - grep por `calcul`, `simul`, `tempo real`, `resultado na hora`: **Zero ocorrências na UI visível**.
* **Remoção de Potência (HP) e Área de Painéis:**
  - Removido do `js/simulador.js` o cálculo de HP, área de painéis (m²) e tabela `TIPO_CONFIG` de potência.
  - Mensagem do WhatsApp: inclui a linha "Volume" apenas se comprimento, largura e altura estiverem todos preenchidos (`Volume = C × L × A em m³`, 1 casa decimal). Nunca inclui HP nem m² de painéis. Medidas vazias omitem completamente as linhas de medidas e volume.

### 2. Snippet Oficial do GTM (Ordem Estrita & Novo Formato)
* Ordem de execução no `<head>`:
  1. `window.dataLayer = window.dataLayer || [];`
  2. `function gtag(){ dataLayer.push(arguments); }`
  3. `gtag('consent', 'default', { ... ad_storage: 'denied', analytics_storage: 'denied', ... wait_for_update: 500 });`
  4. IIFE de leitura e update antecipado de `jd_consent_v1`
  5. `gtag('js', new Date());` (declarado **exatamente 1 vez** em toda a página)
  6. `<script async src="https://www.googletagmanager.com/gtm.js?id=GTM-MQM9DPFR"></script>`
* Não há tags duplicadas nem declarações repetidas de `window.dataLayer`.

### 3. Migração para `lp_version: "B"`
* Input oculto: `<input type="hidden" id="lp-field-lp_version" name="lp_version" value="B">`.
* Payload de envio do lead: `lp_version: 'B'`.
* Todos os pushes do `dataLayer` (`pushTrackingEvent`, `lead_form_submit`, `click_whatsapp`, `consent_update`): `lp_version: 'B'`.
* Payload de beacon/ping do WhatsApp: `lp_version: 'B'`.
* grep por `'A'` / `"A"` como `lp_version`: **Zero ocorrências**.

### 4. Estado Inicial Vazio & Validação na Ordem Visual
* **Tipo de câmara:** Nenhum card vem com `is-selected`. Estado inicial `tipo: ''` e `tipoNome: ''`. Se o usuário tentar enviar sem escolher, exibe `#sim-tipo-error` e foca/rola até o grupo de tipos. Opção "Ainda não sei" continua válida.
* **Medidas opcionais:** Campos sem valor inicial (`value=""`), com placeholder `ex.: 3,0` / `ex.: 2,5` / `ex.: 2,8`. Rótulo sem asterisco: `5. Medidas aproximadas (opcional)`. Se vazias, seguem como string vazia `""` no payload. Se preenchidas, são validadas nos limites operacionais (1 a 30m, 1 a 25m, 1.5 a 8m).
* **Selects com placeholder obrigatório:**
  - Armazenar: primeira opção `<option value="" disabled selected>Selecione</option>`.
  - UF: primeira opção `<option value="" disabled selected>UF</option>`.
* **Foco no primeiro inválido na ordem visual da tela:** 1) Tipo de câmara, 2) Nome, 3) WhatsApp, 4) Armazenar, 5) Cidade, 6) UF, 7) Medidas (se fora da faixa).

### 5. Medições de Layout & Formulário Mais Curto no Mobile (Ajuste 5)
* Nova ordem dos blocos:
  1. `1. Qual tipo de câmara você procura?`
  2. `2. Seus dados para contato` (Nome + WhatsApp lado a lado no desktop, empilhados no mobile)
  3. `3. O que vai armazenar?`
  4. `4. Onde será instalada?` (Cidade + UF compactos lado a lado)
  5. `5. Medidas aproximadas (opcional)` (3 campos sempre na mesma linha, inclusive no mobile)
* Divisor tracejado removido antes do contato.
* Cards de tipo no mobile: 2 colunas com padding vertical compacto (8px 10px), altura de toque ≥ 44px (min-height: 48px), texto em até 2 linhas.

#### Tabela de Coordenadas `getBoundingClientRect()` (Banner Fechado)
Medições coletadas via Chrome Headless oficial nos 4 viewports exigidos:

| Viewport | Campo | Topo (Y) | Base (Y) | Altura | Meta < 900px? | Rolagem Horiz.? |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **360 × 740** (Mobile Pequeno) | **Nome** | **718 px** | 766 px | 48 px | ✅ **Sim** (718 < 900) | **Zero (360px)** |
| | **WhatsApp** | **800 px** | 848 px | 48 px | ✅ **Sim** (848 < 900) | |
| | Tipo Grid | 443 px | 646 px | 203 px | — | |
| | Armazenar | 896 px | 944 px | 48 px | — | |
| | Cidade / UF | 1016 px | 1064 px | 48 px | — | |
| | Medidas (3 cols) | 1110 px | 1195 px | 86 px | — | |
| | Botão Enviar | 1229 px | 1281 px | 52 px | — | Total: 1812 px |
| **390 × 844** (iPhone 12/13/14) | **Nome** | **698 px** | 746 px | 48 px | ✅ **Sim** (698 < 900) | **Zero (390px)** |
| | **WhatsApp** | **779 px** | 827 px | 48 px | ✅ **Sim** (827 < 900) | |
| | Tipo Grid | 422 px | 626 px | 203 px | — | |
| | Armazenar | 876 px | 924 px | 48 px | — | |
| | Cidade / UF | 996 px | 1044 px | 48 px | — | |
| | Medidas (3 cols) | 1089 px | 1174 px | 86 px | — | |
| | Botão Enviar | 1208 px | 1260 px | 52 px | — | Total: 1792 px |
| **768 × 1024** (Tablet) | **Nome** | **641 px** | 689 px | 48 px | ✅ **Sim** (641 < 900) | **Zero (753px)** |
| | **WhatsApp** | **641 px** | 689 px | 48 px | ✅ **Sim** (lado a lado) | |
| | Tipo Grid | 355 px | 569 px | 213 px | — | |
| | Armazenar | 737 px | 785 px | 48 px | — | |
| | Cidade / UF | 857 px | 905 px | 48 px | — | |
| | Medidas (3 cols) | 950 px | 1044 px | 94 px | — | |
| | Botão Enviar | 1078 px | 1130 px | 52 px | — | Total: 1523 px |
| **1280 × 800** (Desktop) | **Nome** | **660 px** | 708 px | 48 px | ✅ **Sim** (660 < 900) | **Zero (1265px)** |
| | **WhatsApp** | **660 px** | 708 px | 48 px | ✅ **Sim** (lado a lado) | |
| | Tipo Grid | 449 px | 588 px | 139 px | — | |
| | Armazenar | 756 px | 804 px | 48 px | — | |
| | Cidade / UF | 876 px | 924 px | 48 px | — | |
| | Medidas (3 cols) | 969 px | 1063 px | 94 px | — | |
| | Botão Enviar | 1097 px | 1149 px | 52 px | — | Total: 1555 px |

* Conclusão: Em ambos os viewports mobile (360×740 e 390×844), os campos Nome e WhatsApp começam antes de 720px e terminam antes de 850px a partir do topo do documento, atingindo com folga a meta de visibilidade antes de 900px de rolagem.

---

## 🔒 Verificação 08 — Rastreamento, lead_id, Atribuição e WhatsApp com Ref

### 1. Identificador Único `lead_id`
* **Geração:** Criado via `crypto.randomUUID()` (com fallback RFC4122 v4) imediatamente na 1ª interação (`focusin` ou `input`) com o formulário.
* **Persistência:** Gravado na variável `currentLeadId` e no input oculto `#lp-field-lead_id`.
* **Idempotência:** Em caso de erro de rede ou tentativa de reenvio com o botão **"Tentar de novo"** (`#lp-btn-retry`), o mesmo `lead_id` é preservado.
* **dataLayer:** Dispara `lead_form_start` com `{ event: 'lead_form_start', lead_id, lp_version: 'B', titulo_variante }`.

### 2. Conversão Confiável (`lead_form_submit` Somente em HTTP 2xx)
* O evento `lead_form_submit` é disparado **estritamente após** a resposta 2xx (`res.ok === true`) do webhook.
* Em falhas de rede ou status 4xx/5xx, exibe o bloco `#lp-submit-error` e **NÃO** dispara `lead_form_submit`.
* **Privacidade e Proteção de PII (GA4):**
  - **Zero PII no root:** Campos `nome`, `cidade`, `email` e `whatsapp` bruto não são enviados no objeto raiz do `dataLayer`.
  - **Formato E.164:** O telefone é normalizado em `user_data.phone_number` com prefixo `+55` (12 ou 13 dígitos): ex.: `+5562999940769`.

### 3. Atribuição Inteligente (`jd_attrib`) & Consent Mode v2
* Parâmetros capturados da URL: `gclid`, `gbraid`, `wbraid`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `matchtype`, `device`, `network`.
* Armazenamento: `localStorage` (90 dias) quando consentimento de ads for concedido; `sessionStorage` caso contrário.

### 4. Payload Final do Webhook (28 Colunas na Ordem Exata)
1. `tipo_evento` (`"lead_form"`)
2. `lead_id`
3. `timestamp_envio` (ISO com fuso São Paulo `-03:00`)
4. `nome`
5. `whatsapp` (com máscara)
6. `tipo_camara`
7. `armazenar`
8. `largura`
9. `comprimento`
10. `altura`
11. `cidade`
12. `uf`
13. `utm_source`
14. `utm_medium`
15. `utm_campaign`
16. `utm_term`
17. `utm_content`
18. `matchtype`
19. `device`
20. `network`
21. `gclid`
22. `gbraid`
23. `wbraid`
24. `landing_page`
25. `lp_version` (`"B"`)
26. `titulo_variante`
27. `consent_ads`
28. `consent_analytics`

---

## 🔒 Verificação 07 — Banner de Cookies (LGPD) + Consent Mode v2

1. **Ordem no dataLayer:**
   - O `gtag('consent', 'default', ...)` roda antes do GTM.
   - Decisão salva em `jd_consent_v1` atualizada antes do carregamento do GTM.
2. **Banner Acessível:**
   - Compatível com WAI-ARIA, foco visível e alvos de toque ≥ 44px.
