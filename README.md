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
