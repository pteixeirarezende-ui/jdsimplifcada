# JD Câmaras Frias — Landing Page com Simulador Direto

Landing Page de alta conversão para captação de leads de câmaras frigoríficas sob medida, inspirada na referência da **HD Câmaras Frias** com motor de dimensionamento direto (sem passos) e construída 100% sobre o **Design System Oficial da JD Câmaras Frias**.

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
│   └── simulador.css     # Estilos do formulário direto e telemetria SCADA
│
├── js/                   # Scripts de interatividade e rastreamento
│   ├── ds.js             # Utilitários do Design System (acordeão, máscara, UTMs)
│   ├── lp.js             # Tracking GTM/dataLayer e persistência de sessão
│   └── simulador.js      # Motor de cálculo em tempo real, validações e WhatsApp
│
└── design-system/        # Catálogo técnico e componentes de referência da marca
    ├── ds_variacao.html  # Showcase consolidado de componentes e efeitos do DS
    └── assets/, css/, js/# Dependências internas do Design System
```

---

## ⚡ Recursos e Funcionalidades Principais

1. **Simulador Direto em Tempo Real (Sem Passos):**
   * Seleção ágil entre **Resfriados (0 a +15 °C)**, **Congelados (-18 a -25 °C)** e **Expositora Walk-in Cooler**.
   * Inputs diretos de **Comprimento (m)**, **Largura (m)** e **Altura (m)**.
   * Telemetria SCADA em tempo real: calcula automaticamente **Volume (m³)**, **Área de painéis (m²)** e **Potência estimada (HP)**.
   * Seleção de **Armazenamento**, **Rede Elétrica** e **Localização (Cidade/UF)**.

2. **Lead Gating com Liberação do WhatsApp Pós-Cadastro:**
   * O usuário informa Nome e WhatsApp e clica em **"Calcular e Receber Meu Orçamento"**.
   * O botão do WhatsApp só é liberado após o preenchimento, direcionando o lead para a conversa já com a mensagem completa com todos os dados da câmara pré-formatados.
   * Botão flutuante de WhatsApp fixado no canto inferior direito é ativado após o envio.

3. **Segurança & Anti-Spam:**
   * **Honeypot Invisível:** Intercepta e descarta bots automaticamente.
   * **Sanitização de Entradas:** Proteção contra injeção de scripts (XSS).
   * **Proteção contra Duplo Envio:** Desativação imediata do botão no clique de envio.
   * **Máscara Nativa de Telefone BR:** Formatação automática `(XX) XXXXX-XXXX`.

4. **Responsividade Mobile-First:**
   * Campos configurados com `font-size: 16px` para impedir o auto-zoom do Safari iOS no iPhone.
   * Touch targets ergonômicos (mínimo de 48px a 52px).
   * Sem rolagem horizontal em telas de 320px a 414px.

---

## 📦 Como Publicar (Deploy)

A página é **100% estática (HTML/CSS/JS puros)**, sem necessidade de build ou Node.js em produção:

* **Vercel / Netlify / Cloudflare Pages:**
  1. Conecte o repositório ou faça upload da pasta raiz.
  2. Defina o diretório raiz como `.` e deixe o comando de build vazio.
  3. O arquivo `index.html` será servido automaticamente na raiz.

* **Servidor Apache / Nginx / Hostinger / cPanel:**
  1. Envie todos os arquivos da pasta raiz para a pasta `public_html` ou `www`.
  2. Certifique-se de manter as pastas `assets/`, `css/` e `js/` relativas ao `index.html`.

---

## 🔒 Verificação 07 — Banner de Cookies (LGPD) + Consent Mode v2

1. **Ordem no dataLayer:**
   - O `gtag('consent', 'default', ...)` com `ad_storage: 'denied'`, `ad_user_data: 'denied'`, `ad_personalization: 'denied'`, `analytics_storage: 'denied'`, `functionality_storage: 'granted'`, `security_storage: 'granted'`, `wait_for_update: 500` roda no `<head>` no índice `0` (antes do carregamento do GTM).
   - A leitura da chave `jd_consent_v1` ocorre imediatamente no índice subsequente: se houver decisão com menos de 12 meses, o `gtag('consent', 'update', ...)` é disparado antes do script `gtm.js?id=GTM-MQM9DPFR`.
   - O script do GTM roda logo após no `<head>`.

2. **Primeira visita:**
   - O banner `.lp-cookie-banner` fica visível (`is-visible`).
   - Há exatamente 1 elemento de banner no DOM (`#lp-cookie-banner`).
   - Não há conflito com `js/ds.js`, pois o banner não utiliza a classe `.jd-cookies` vigiada pelo `initCookies()` do Design System, eliminando handlers duplicados.

3. **Aceitar todos:**
   - Grava em `localStorage` a chave `jd_consent_v1` com `{ analytics: true, ads: true, ts: <timestamp> }`.
   - Dispara `gtag('consent', 'update', { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted' })`.
   - O banner é fechado e emite `dataLayer.push({ event: 'consent_update', consent_analytics: true, consent_ads: true, lp_version: 'A' })`.
   - Ao recarregar a página, o banner não reaparece e o update para `granted` roda antes do `gtm.js`.

4. **Recusar:**
   - Grava `jd_consent_v1` com `{ analytics: false, ads: false, ts: <timestamp> }`.
   - Dispara `gtag('consent', 'update', ...)` com todas as 4 permissões em `denied`.
   - Emite evento `consent_update`.

5. **Personalizar (interruptores granulares):**
   - Linha 1: `Necessários (sempre ativos)` com switch bloqueado/disabled.
   - Linha 2: `Estatísticas` (`analytics_storage`) com switch acessível (`role="switch"`, `aria-checked`).
   - Linha 3: `Publicidade` (`ad_storage`, `ad_user_data`, `ad_personalization`).
   - Botão `Salvar escolhas`: grava no `localStorage`, atualiza o consent e emite o evento correspondente.
   - Teste Estatísticas=true, Publicidade=false: grava `{ analytics: true, ads: false }` e atualiza permissões de analytics.
   - Teste Estatísticas=false, Publicidade=true: grava `{ analytics: false, ads: true }` e atualiza permissões de ads.

6. **Reabrir e Acessibilidade:**
   - Botão `#lp-cookie-pref-btn` no rodapé (com estilo unificado aos links) reabre o banner diretamente no painel de personalização, restaurando o estado atual dos switches.
   - Suporte a teclado: `Tab`, `Enter` e `Espaço` em todos os botões e interruptores.
   - Foco visível acessível ativo via `:focus-visible`.
   - Alvos de toque com altura mínima de 44 px.

7. **Dimensões e Responsividade Mobile:**
   - Altura máxima restrita a `40vh` (`max-height: 40vh; overflow-y: auto;`) em conformidade com a regra mobile:
     - 360 × 740: banner ocupa no máximo 296 px (≤ 40% da tela).
     - 390 × 844: banner ocupa no máximo 337 px (≤ 40% da tela).
     - Todos os campos do formulário e cabeçalho continuam acessíveis e desobstruídos.
   - Testado em 360 × 740, 390 × 844, 768 e 1280 sem rolagem horizontal.

8. **Conformidade de Estilo e Semântica:**
   - Zero `style="..."` adicionados.
   - Zero textos abaixo de 12 px (utilizados tokens `--jd-text-sm` e `--jd-text-xs` do DS).
   - Zero IDs duplicados (32 IDs únicos validados).
   - Zero menções a razões sociais, CNPJs ou e-mails fictícios.
   - Suporte a `prefers-reduced-motion: reduce`.
   - Constante única `PRIVACY_URL` centralizada em `js/lp.js` e aplicada dinamicamente via atributo `data-privacy-link`.

9. **O que faltou no DS:**
   - O Design System (`components.css` / `ds_variacao.html`) não possuía interruptor de toggle/switch (`button[role="switch"]`) nem painel expansível de personalização granular para cookies.
   - Utilizou-se a estrutura semântica acessível WAI-ARIA em `css/lp.css` com 100% dos tokens oficiais (`--jd-radius-pill`, `--jd-verde`, `--jd-duration-fast`, `--jd-space-*`).
