# JD Câmaras Frias — Landing Page com Simulador Direto

Landing Page de alta conversão para captação de leads de câmaras frigoríficas sob medida, com motor de dimensionamento direto (sem passos), rastreamento avançado (Consent Mode v2, Atribuição com persistência inteligente, `lead_id` idempotente, WhatsApp com código `ref` e verificação HTTP 2xx) e construída 100% sobre o **Design System Oficial da JD Câmaras Frias**.

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
│   └── simulador.css     # Estilos do formulário direto, erro e telemetria SCADA
│
├── js/                   # Scripts de interatividade e rastreamento
│   ├── ds.js             # Utilitários do Design System (acordeão, spotlights)
│   ├── lp.js             # Motor unificado de rastreamento, envio 2xx, lead_id, atribuição e WhatsApp ref
│   └── simulador.js      # Motor de cálculo físico/térmico e telemetria
│
└── design-system/        # Catálogo técnico e componentes de referência da marca
    ├── ds_variacao.html  # Showcase consolidado de componentes e efeitos do DS
    └── assets/, css/, js/# Dependências internas do Design System
```

---

## 📋 Como o Envio Funcionava Antes do Prompt 08 (Análise da Regra 1)

Antes da unificação do Prompt 08, a submissão de dados apresentava o seguinte cenário:
* **Método e Headers:** `POST`, com `headers: { 'Content-Type': 'application/json' }`.
* **URL do Webhook (`LEAD_ENDPOINT`):** `https://n8n-n8n.6djmf0.easypanel.host/webhook-test/b7874717-cc4b-495a-b3cb-322f3f972153`.
* **Comportamento dos Handlers:** `js/lp.js` continha o método legado para o formulário de 2 etapas (`#lp-form-lead`), enquanto `js/simulador.js` possuía um handler direto no formulário `#jd-sim-direto-form`. O disparo de `lead_simulador_direto` ocorria antes da confirmação de rede e enviava dados de PII abertos no dataLayer (`lead_nome` e `lead_whatsapp`), o que infringia boas práticas do GA4. Além disso, se o webhook respondesse 4xx/5xx ou caísse em falha de rede, o formulário podia marcar sucesso indevido no `.finally()`.
* **Reaproveitamento no Prompt 08:** O envio foi totalmente centralizado em `js/lp.js` em um único handler idempotente sobre `#jd-sim-direto-form`. O `simulador.js` agora apenas gerencia o estado técnico/dimensional e a mensagem do WhatsApp, eliminando qualquer risco de duplo envio ou concorrência de scripts.

---

## 🔒 Verificação 08 — Rastreamento, lead_id, Atribuição e WhatsApp com Ref

### 1. Identificador Único `lead_id`
* **Geração:** Criado via `crypto.randomUUID()` (com fallback RFC4122 v4) imediatamente na 1ª interação (`focusin` ou `input`) com o formulário.
* **Persistência:** Gravado na variável `currentLeadId` e no input oculto `#lp-field-lead_id`.
* **Idempotência:** Em caso de erro de rede ou tentativa de reenvio com o botão **"Tentar de novo"** (`#lp-btn-retry`), o mesmo `lead_id` é preservado, garantindo desduplicação no n8n e nas ferramentas de conversão (GA4/Meta CAPI).
* **dataLayer:** Dispara `lead_form_start` com `{ event: 'lead_form_start', lead_id, lp_version: 'A', titulo_variante }`.

### 2. Conversão Confiável (`lead_form_submit` Somente em HTTP 2xx)
* O evento `lead_form_submit` é disparado **estritamente após** a resposta 2xx (`res.ok === true`) do webhook.
* Em falhas de rede ou status 4xx/5xx, o erro é interceptado pelo `.catch()`, exibe o bloco `#lp-submit-error` com visual do Design System e **NÃO** dispara `lead_form_submit`.
* **Privacidade e Proteção de PII (GA4):**
  - **Zero PII no root:** Campos `nome`, `cidade`, `email` e `whatsapp` bruto não são enviados no objeto raiz do `dataLayer`.
  - **Formato E.164:** O telefone é normalizado em `user_data.phone_number` com prefixo `+55` (12 ou 13 dígitos): ex.: `+5562999940769`.
  - Payload emitido no `dataLayer`:
    ```javascript
    {
      event: 'lead_form_submit',
      lead_id: '...',
      event_id: '...', // Idêntico ao lead_id para desduplicação
      tipo_camara: 'Câmara fria resfriados (+10 a 0 °C)',
      armazenar: 'Carnes e aves',
      uf: 'SP',
      lp_version: 'A',
      titulo_variante: 'padrao',
      user_data: {
        phone_number: '+5562999940769'
      }
    }
    ```

### 3. Atribuição Inteligente (`jd_attrib`) & Consent Mode v2
* Parâmetros capturados da URL: `gclid`, `gbraid`, `wbraid`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `matchtype`, `device`, `network`.
* **Regra de Armazenamento sob Consentimento LGPD:**
  - Se consentimento de publicidade (`ads`) concedido em `jd_consent_v1`: armazenado em `localStorage` sob a chave `jd_attrib` com validade de 90 dias (`90 * 24 * 60 * 60 * 1000`).
  - Se consentimento de publicidade pendente ou negado: mantido apenas em `sessionStorage`.
  - Novos parâmetros na URL sobrescrevem os salvos (modelo Last Click).
* **Campos Ocultos:** Preenchimento automático de `matchtype`, `device`, `network`, `consent_ads`, `consent_analytics`, `lead_id`, `landing_page` (URL completa com `?h=` e parâmetros).

### 4. Payload Final do Webhook (28 Colunas na Ordem Exata)
O webhook do n8n recebe exatamente as 28 chaves abaixo na ordem solicitada (sem campo `prazo`):
1. `tipo_evento` (`"lead_form"`)
2. `lead_id`
3. `timestamp_envio` (Formato ISO com fuso São Paulo `-03:00`: `YYYY-MM-DDTHH:mm:ss.sss-03:00`)
4. `nome`
5. `whatsapp` (Exatamente como o usuário digitou com máscara)
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
25. `lp_version` (`"A"`)
26. `titulo_variante`
27. `consent_ads` (`"granted"` | `"denied"` | `"pending"`)
28. `consent_analytics` (`"granted"` | `"denied"` | `"pending"`)

* Em modo `?debug=1`, o payload completo e o objeto `jd_attrib` são impressos de forma estruturada no console via `console.group()` e a requisição de rede não é enviada.

### 5. WhatsApp com Código de Referência (`ref`) e Ping Silencioso
* **Geração do `ref`:** Código de 6 caracteres alfanuméricos em maiúsculas (alfabeto seguro: `A–Z` e `2–9`, sem caracteres ambíguos `0`, `O`, `1`, `I`).
  - Se o formulário já foi submetido, utiliza os primeiros 6 caracteres do `lead_id` em maiúsculas (`lead_id.slice(0, 6)`).
* **Mensagem:** O texto pré-preenchido recebe o sufixo ` (ref: <REF>)`.
* **Ping Silencioso no Webhook:** Ao clicar em qualquer botão com `data-whatsapp-btn` (`sucesso`, `erro`, `cta_final`), dispara uma requisição POST leve ao mesmo webhook com `keepalive: true` contendo `{ tipo_evento: 'click_whatsapp', ref, origem, timestamp_envio, ...atribuição, consent_ads, consent_analytics }`, sem travar a navegação e falhando em silêncio caso a rede oscile.
* **dataLayer:** Dispara `{ event: 'click_whatsapp', origem, ref, lp_version: 'A', titulo_variante }` 1 vez por clique.
* **Fallback se `WHATSAPP_NUMBER` vazio:** Rola suavemente até o simulador e exibe aviso `⚠ WHATSAPP_NUMBER vazio` em modo `?debug=1`.

---

## 🔒 Verificação 07 — Banner de Cookies (LGPD) + Consent Mode v2

1. **Ordem no dataLayer:**
   - O `gtag('consent', 'default', ...)` com `ad_storage: 'denied'`, `ad_user_data: 'denied'`, `ad_personalization: 'denied'`, `analytics_storage: 'denied'`, `functionality_storage: 'granted'`, `security_storage: 'granted'`, `wait_for_update: 500` roda no `<head>` no índice `0` (antes do carregamento do GTM).
   - A leitura da chave `jd_consent_v1` ocorre imediatamente no índice subsequente: se houver decisão com menos de 12 meses, o `gtag('consent', 'update', ...)` é disparado antes do script `gtm.js?id=GTM-MQM9DPFR`.
   - O script do GTM roda logo após no `<head>`.

2. **Primeira visita:**
   - O banner `.lp-cookie-banner` fica visível (`is-visible`).
   - Há exatamente 1 elemento de banner no DOM (`#lp-cookie-banner`).
   - Sem conflito com `js/ds.js`, pois o banner não utiliza a classe `.jd-cookies` do Design System, eliminando handlers duplicados.

3. **Aceitar todos:**
   - Grava em `localStorage` a chave `jd_consent_v1` com `{ analytics: true, ads: true, ts: <timestamp> }`.
   - Dispara `gtag('consent', 'update', { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted' })`.
   - O banner é fechado e emite `dataLayer.push({ event: 'consent_update', consent_analytics: true, consent_ads: true, lp_version: 'A' })`.

4. **Recusar:**
   - Grava `jd_consent_v1` com `{ analytics: false, ads: false, ts: <timestamp> }`.
   - Dispara `gtag('consent', 'update', ...)` com todas as 4 permissões em `denied`.
   - Emite evento `consent_update`.

5. **Personalizar (interruptores granulares):**
   - Linha 1: `Necessários (sempre ativos)` com switch bloqueado/disabled.
   - Linha 2: `Estatísticas` (`analytics_storage`) com switch acessível (`role="switch"`, `aria-checked`).
   - Linha 3: `Publicidade` (`ad_storage`, `ad_user_data`, `ad_personalization`).
   - Botão `Salvar escolhas`: grava no `localStorage`, atualiza o consent e emite o evento correspondente.

6. **Reabrir e Acessibilidade:**
   - Botão `#lp-cookie-pref-btn` no rodapé reabre o banner diretamente no painel de personalização, restaurando o estado atual dos switches.
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
   - Zero IDs duplicados.
   - Zero menções a razões sociais, CNPJs ou e-mails fictícios.
   - Suporte a `prefers-reduced-motion: reduce`.
   - Constante única `PRIVACY_URL` centralizada em `js/lp.js` e aplicada dinamicamente via atributo `data-privacy-link`.
