/**
 * JD CÂMARAS FRIAS — LP A (Versão Direta) · DOBRA 1
 * lp.js: Lógica de negócio, formulário em 2 etapas, UTMs, tracking e parâmetros dinâmicos.
 * Zero dependências externas.
 */

// CONFIRMAR: política de privacidade própria da JD
const PRIVACY_URL = 'https://www.facebook.com/privacy/policy/?locale=pt_BR';

// Endpoint de envio do webhook
const LEAD_ENDPOINT = 'https://n8n-n8n.6djmf0.easypanel.host/webhook-test/b7874717-cc4b-495a-b3cb-322f3f972153';

// Número de WhatsApp da JD
const WHATSAPP_NUMBER = '5562999940769';

(function () {
  'use strict';

  // 1. TÍTULO DINÂMICO POR PARÂMETRO ?h=
  const VARIANTS = {
    preco: {
      h1: 'Quanto custa a sua câmara fria? Informe as medidas e receba o orçamento da JD',
      sub: 'Cada câmara é projetada sob medida, então o valor depende do tamanho, da temperatura e do uso. Conte o que você precisa e a JD envia o orçamento.'
    },
    mini: {
      h1: 'Mini câmara fria sob medida para o seu espaço',
      sub: 'Para quem tem pouco espaço e precisa de frio. Informe o que vai armazenar e as medidas e receba o orçamento da JD.'
    },
    walkin: {
      h1: 'Câmara fria para bebidas: walk-in cooler sob medida, entregue e instalada',
      sub: 'Informe o que vai armazenar e as medidas do espaço e receba o orçamento da JD.'
    },
    congelados: {
      h1: 'Câmara de congelados (-10 a -18 °C) sob medida, com instalação pela JD',
      sub: 'Informe o que vai armazenar e as medidas do espaço e receba o orçamento da JD.'
    },
    resfriados: {
      h1: 'Câmara fria resfriados (+10 a 0 °C) sob medida, com instalação pela JD',
      sub: 'Informe o que vai armazenar e as medidas do espaço e receba o orçamento da JD.'
    }
  };

  const DEFAULT_HEADLINE = {
    h1: 'Câmara fria sob medida, projetada e instalada para o seu negócio',
    sub: 'Mini câmaras, câmaras expositoras, resfriados e congelados. Informe o que você vai armazenar e as medidas do espaço e receba o orçamento da JD.'
  };

  let activeVariantKey = 'padrao';

  function applyDynamicHeadline() {
    const params = new URLSearchParams(window.location.search);
    const hParam = (params.get('h') || '').toLowerCase().trim();

    const h1El = document.getElementById('hero-title');
    const subEl = document.getElementById('hero-subtitle');
    const variantInput = document.getElementById('lp-field-titulo-variante');

    if (hParam && VARIANTS[hParam]) {
      activeVariantKey = hParam;
      if (h1El) h1El.textContent = VARIANTS[hParam].h1;
      if (subEl) subEl.textContent = VARIANTS[hParam].sub;
    } else {
      activeVariantKey = 'padrao';
    }

    if (variantInput) {
      variantInput.value = activeVariantKey;
    }
  }

  // 2. DATA LAYER HELPER
  window.dataLayer = window.dataLayer || [];

  function pushTrackingEvent(eventName, extraData) {
    const payload = Object.assign({
      event: eventName,
      lp_version: 'A',
      titulo_variante: activeVariantKey
    }, extraData || {});
    window.dataLayer.push(payload);
  }

  // 3. CAPTURA E PERSISTÊNCIA DE UTM E RASTREAMENTO
  const TRACKING_FIELDS = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'gclid',
    'gbraid',
    'wbraid'
  ];

  function initTrackingFields() {
    const params = new URLSearchParams(window.location.search);

    TRACKING_FIELDS.forEach(function (param) {
      let val = params.get(param);

      // Tenta salvar se veio na URL
      if (val) {
        try {
          sessionStorage.setItem('jd_lead_' + param, val);
        } catch (e) { /* noop */ }
      } else {
        // Recupera do sessionStorage se já existia na sessão
        try {
          val = sessionStorage.getItem('jd_lead_' + param) || '';
        } catch (e) {
          val = '';
        }
      }

      const input = document.getElementById('lp-field-' + param);
      if (input && val) {
        input.value = val;
      }
    });

    const lpUrlInput = document.getElementById('lp-field-landing-page');
    if (lpUrlInput) {
      lpUrlInput.value = window.location.href;
    }
  }

  // 4. MÁSCARA DE TELEFONE (XX) XXXXX-XXXX
  function applyPhoneMask(input) {
    if (!input) return;
    input.addEventListener('input', function () {
      let v = this.value.replace(/\D/g, '');
      if (v.length > 11) v = v.slice(0, 11);

      if (v.length > 6) {
        this.value = '(' + v.slice(0, 2) + ') ' + v.slice(2, 7) + '-' + v.slice(7);
      } else if (v.length > 2) {
        this.value = '(' + v.slice(0, 2) + ') ' + v.slice(2);
      } else if (v.length > 0) {
        this.value = '(' + v;
      }
    });

    input.addEventListener('keypress', function (e) {
      if (!/\d/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab') {
        e.preventDefault();
      }
    });
  }

  // 5. VALIDAÇÃO DE CAMPOS COM ÍCONE + TEXTO
  const ERROR_ICON_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex-shrink:0;margin-top:1px;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';

  function setFieldError(field, hasError, customMessage) {
    const group = field.closest('.jd-form__group');
    if (!group) return;

    let errorEl = group.querySelector('.jd-form__error');
    if (!errorEl) {
      errorEl = document.createElement('div');
      errorEl.className = 'jd-form__error';
      errorEl.style.display = 'flex';
      errorEl.style.alignItems = 'center';
      errorEl.style.gap = '6px';
      group.appendChild(errorEl);
    }

    if (hasError) {
      group.classList.add('is-error');
      field.classList.add('is-error');
      field.setAttribute('aria-invalid', 'true');
      const msg = customMessage || 'Preencha este campo para continuar.';
      errorEl.innerHTML = ERROR_ICON_SVG + '<span>' + msg + '</span>';
      errorEl.style.display = 'flex';
    } else {
      group.classList.remove('is-error');
      field.classList.remove('is-error');
      field.removeAttribute('aria-invalid');
      errorEl.innerHTML = '';
      errorEl.style.display = 'none';
    }
  }

  function validateInput(field) {
    const val = (field.value || '').trim();
    const isRequired = field.hasAttribute('required');

    if (isRequired && !val) {
      setFieldError(field, true, 'Preencha este campo para continuar.');
      return false;
    }

    if (field.type === 'tel' || field.id === 'lp-field-whatsapp') {
      const digits = val.replace(/\D/g, '');
      if (digits.length < 10) {
        setFieldError(field, true, 'Confira o WhatsApp com DDD. Exemplo: (32) 99999-9999');
        return false;
      }
    }

    if (field.id === 'lp-field-nome' && val.length < 3) {
      setFieldError(field, true, 'Preencha este campo para continuar.');
      return false;
    }

    setFieldError(field, false);
    return true;
  }

  // 6. MOTOR DO FORMULÁRIO EM 2 ETAPAS
  function initLeadForm() {
    const form = document.getElementById('lp-form-lead');
    if (!form) return;

    const etapa1 = document.getElementById('lp-etapa-1');
    const etapa2 = document.getElementById('lp-etapa-2');
    const stepInd1 = document.getElementById('lp-step-ind-1');
    const stepInd2 = document.getElementById('lp-step-ind-2');
    const stepLabel2 = document.getElementById('lp-step-label-2');
    const btnNext = document.getElementById('lp-btn-next');
    const btnPrev = document.getElementById('lp-btn-prev');
    const btnSubmit = document.getElementById('lp-btn-submit');
    const successBlock = document.getElementById('lp-form-sucesso');
    const formHeader = document.getElementById('lp-form-header');
    const formStepsNav = document.getElementById('lp-form-steps');
    const honeypot = document.getElementById('lp-field-website');
    const submitErrorWrap = document.getElementById('lp-submit-error');
    const btnRetry = document.getElementById('lp-btn-retry');

    // Rastreia primeiro foco em qualquer campo (lead_form_start)
    let formStartedTracked = false;
    const allFormInputs = form.querySelectorAll('input, select, textarea');
    allFormInputs.forEach(function (input) {
      input.addEventListener('focus', function () {
        if (!formStartedTracked) {
          formStartedTracked = true;
          pushTrackingEvent('lead_form_start');
        }
      });
      input.addEventListener('blur', function () {
        if (this.hasAttribute('required') || this.value.trim().length > 0) {
          validateInput(this);
        }
      });
      input.addEventListener('input', function () {
        if (this.classList.contains('is-error')) {
          setFieldError(this, false);
        }
      });
    });

    const phoneField = document.getElementById('lp-field-whatsapp');
    applyPhoneMask(phoneField);

    // Inicializa com data-step="1"
    form.setAttribute('data-step', '1');

    // Avançar para Etapa 2
    if (btnNext) {
      btnNext.addEventListener('click', function (e) {
        e.preventDefault();
        const nomeField = document.getElementById('lp-field-nome');
        const isNomeValid = validateInput(nomeField);
        const isPhoneValid = validateInput(phoneField);

        if (isNomeValid && isPhoneValid) {
          etapa1.classList.remove('is-active');
          etapa2.classList.add('is-active');
          form.setAttribute('data-step', '2');

          if (stepInd1) {
            stepInd1.classList.remove('is-active');
            stepInd1.classList.add('is-done');
          }
          if (stepInd2) {
            stepInd2.classList.remove('is-pending');
            stepInd2.classList.add('is-active');
          }
          if (stepLabel2) {
            stepLabel2.textContent = 'Etapa 2 de 2';
          }

          pushTrackingEvent('lead_form_step1_complete');

          // Foca no primeiro campo da etapa 2
          const firstStep2Field = etapa2.querySelector('select, input');
          if (firstStep2Field) {
            firstStep2Field.focus();
          }
        }
      });
    }

    // Voltar para Etapa 1
    if (btnPrev) {
      btnPrev.addEventListener('click', function (e) {
        e.preventDefault();
        etapa2.classList.remove('is-active');
        etapa1.classList.add('is-active');
        form.setAttribute('data-step', '1');

        if (stepInd1) {
          stepInd1.classList.remove('is-done');
          stepInd1.classList.add('is-active');
        }
        if (stepInd2) {
          stepInd2.classList.remove('is-active');
          stepInd2.classList.add('is-pending');
        }
        if (stepLabel2) {
          stepLabel2.textContent = 'Etapa 2';
        }
      });
    }

    // Tentar de novo após erro de envio
    if (btnRetry) {
      btnRetry.addEventListener('click', function (e) {
        e.preventDefault();
        if (submitErrorWrap) submitErrorWrap.style.display = 'none';
        btnSubmit.disabled = false;
        btnSubmit.classList.remove('is-loading');
        btnSubmit.focus();
      });
    }

    // Submissão do Formulário
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      handleFormSubmit();
    });

    if (btnSubmit) {
      btnSubmit.addEventListener('click', function (e) {
        e.preventDefault();
        handleFormSubmit();
      });
    }

    function handleFormSubmit() {
      // Validação da etapa 2
      const requiredInputs = etapa2.querySelectorAll('[required]');
      let allValid = true;
      let firstInvalid = null;

      requiredInputs.forEach(function (inp) {
        if (!validateInput(inp)) {
          allValid = false;
          if (!firstInvalid) firstInvalid = inp;
        }
      });

      if (!allValid) {
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      // Honeypot anti-spam
      if (honeypot && honeypot.value.trim() !== '') {
        // Descarte silencioso do spam
        showSuccessView();
        return;
      }

      // Bloqueio de duplo clique
      btnSubmit.disabled = true;
      btnSubmit.classList.add('is-loading');
      if (submitErrorWrap) submitErrorWrap.style.display = 'none';

      // Monta Payload do Lead
      const timestampIso = new Date().toISOString();
      const timestampInput = document.getElementById('lp-field-timestamp_envio');
      if (timestampInput) timestampInput.value = timestampIso;

      const payload = {
        nome: (document.getElementById('lp-field-nome') || {}).value || '',
        whatsapp: (document.getElementById('lp-field-whatsapp') || {}).value || '',
        tipo_camara: (document.getElementById('lp-field-tipo_camara') || {}).value || '',
        armazenar: (document.getElementById('lp-field-armazenar') || {}).value || '',
        largura: (document.getElementById('lp-field-largura') || {}).value || '',
        comprimento: (document.getElementById('lp-field-comprimento') || {}).value || '',
        altura: (document.getElementById('lp-field-altura') || {}).value || '',
        cidade: (document.getElementById('lp-field-cidade') || {}).value || '',
        uf: (document.getElementById('lp-field-uf') || {}).value || '',
        prazo: (document.getElementById('lp-field-prazo') || {}).value || '',
        utm_source: (document.getElementById('lp-field-utm_source') || {}).value || '',
        utm_medium: (document.getElementById('lp-field-utm_medium') || {}).value || '',
        utm_campaign: (document.getElementById('lp-field-utm_campaign') || {}).value || '',
        utm_term: (document.getElementById('lp-field-utm_term') || {}).value || '',
        utm_content: (document.getElementById('lp-field-utm_content') || {}).value || '',
        gclid: (document.getElementById('lp-field-gclid') || {}).value || '',
        gbraid: (document.getElementById('lp-field-gbraid') || {}).value || '',
        wbraid: (document.getElementById('lp-field-wbraid') || {}).value || '',
        landing_page: (document.getElementById('lp-field-landing-page') || {}).value || window.location.href,
        lp_version: 'A',
        titulo_variante: activeVariantKey,
        timestamp_envio: timestampIso
      };

      const isDebug = new URLSearchParams(window.location.search).get('debug') === '1';

      if (!LEAD_ENDPOINT) {
        if (isDebug) {
          console.group('[LP Debug Mode] Lead submetido com LEAD_ENDPOINT vazio:');
          console.log('Payload do Lead:', payload);
          console.groupEnd();
        }
        showSuccessView();
        return;
      }

      fetch(LEAD_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.json().catch(function () { return {}; });
        })
        .then(function () {
          showSuccessView();
        })
        .catch(function (err) {
          console.error('[LP Form Submit Error]', err);
          btnSubmit.disabled = false;
          btnSubmit.classList.remove('is-loading');
          if (submitErrorWrap) {
            submitErrorWrap.style.display = 'block';
          }
        });
    }

    function showSuccessView() {
      etapa1.classList.remove('is-active');
      etapa2.classList.remove('is-active');
      if (formHeader) formHeader.style.display = 'none';
      if (formStepsNav) formStepsNav.style.display = 'none';
      if (submitErrorWrap) submitErrorWrap.style.display = 'none';
      if (successBlock) successBlock.classList.add('is-visible');

      pushTrackingEvent('lead_form_submit');
    }
  }

  // 7. BOTÕES DE WHATSAPP, CABEÇALHO E ATALHOS PARA O FORMULÁRIO
  function irParaFormulario() {
    const form = document.getElementById('lp-form-lead');
    if (!form) return;

    const rect = form.getBoundingClientRect();
    const headerHeight = window.innerWidth <= 768 ? 64 : 72;
    
    // Se o topo do formulário já estiver visível na janela abaixo do cabeçalho, não role: só foque
    const isFormVisible = (rect.top >= headerHeight && rect.top <= window.innerHeight * 0.7);

    const activeEtapa = form.querySelector('.jd-form__etapa.is-active') || form;
    const firstInput = activeEtapa.querySelector('input:not([type="hidden"]), select, textarea');

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!isFormVisible) {
      form.scrollIntoView({
        behavior: prefersReduced ? 'auto' : 'smooth',
        block: 'start'
      });
    }

    if (firstInput) {
      if (!isFormVisible) {
        setTimeout(function () {
          firstInput.focus({ preventScroll: true });
        }, prefersReduced ? 50 : 350);
      } else {
        firstInput.focus({ preventScroll: true });
      }
    }
  }

  function initButtons() {
    const waButtons = document.querySelectorAll('[data-whatsapp-btn], .jd-btn--whatsapp');
    const msg = encodeURIComponent('Olá! Vim pelo site e quero um orçamento de câmara fria.');
    const isDebug = new URLSearchParams(window.location.search).get('debug') === '1';

    if (!WHATSAPP_NUMBER && isDebug) {
      console.warn('⚠ WHATSAPP_NUMBER vazio');
    }

    waButtons.forEach(function (btn) {
      if (!WHATSAPP_NUMBER) {
        btn.href = '#lp-form-lead';
        btn.setAttribute('title', 'Pedir orçamento');

        // Em modo ?debug=1, exibe a etiqueta [CONFIRMAR NÚMERO]
        if (isDebug && !btn.querySelector('.tag-confirmar-wa')) {
          const tag = document.createElement('span');
          tag.className = 'tag-exemplo tag-confirmar-wa';
          tag.style.marginLeft = '6px';
          tag.style.fontSize = '12px';
          tag.textContent = '[CONFIRMAR NÚMERO]';
          btn.appendChild(tag);
        }

        btn.addEventListener('click', function (e) {
          e.preventDefault();
          pushTrackingEvent('click_whatsapp');
          irParaFormulario();
        });
      } else {
        btn.href = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + msg;
        btn.setAttribute('target', '_blank');
        btn.setAttribute('rel', 'noopener');
        btn.addEventListener('click', function () {
          pushTrackingEvent('click_whatsapp');
        });
      }
    });

    // CTA do Cabeçalho
    const ctaHeader = document.getElementById('cta-header');
    if (ctaHeader) {
      ctaHeader.addEventListener('click', function (e) {
        e.preventDefault();
        pushTrackingEvent('click_cta_header');
        irParaFormulario();
      });
    }

    // CTA da Dobra 2 (Por que a JD)
    const ctaPorque = document.getElementById('cta-porque-jd');
    if (ctaPorque) {
      ctaPorque.addEventListener('click', function (e) {
        e.preventDefault();
        pushTrackingEvent('click_cta_porque');
        irParaFormulario();
      });
    }

    // CTAs da Dobra 3 (Produtos)
    const PRODUTO_MAP = {
      'mini': 'Mini câmara',
      'expositora': 'Câmara fria expositora (0 a -5 °C)',
      'resfriados': 'Câmara fria resfriados (+10 a 0 °C)',
      'congelados': 'Câmara de congelados (-10 a -18 °C)'
    };

    const cardCtas = document.querySelectorAll('[data-cta-produto]');
    cardCtas.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        const prodKey = btn.getAttribute('data-cta-produto');
        const tipoNome = PRODUTO_MAP[prodKey] || prodKey;

        // Pré-seleciona o tipo no select do formulário
        const selectTipo = document.getElementById('lp-field-tipo_camara');
        if (selectTipo) {
          selectTipo.value = tipoNome;
          selectTipo.dispatchEvent(new Event('change', { bubbles: true }));
        }

        pushTrackingEvent('click_cta_produto', { produto: prodKey });

        // Se o formulário já foi enviado com sucesso, não reabre
        const formSucesso = document.getElementById('lp-form-sucesso');
        if (formSucesso && formSucesso.classList.contains('is-visible')) {
          return;
        }

        irParaFormulario();
      });
    });

    // CTA da Dobra 4 (Como Funciona)
    const ctaComo = document.getElementById('cta-como');
    if (ctaComo) {
      ctaComo.addEventListener('click', function (e) {
        e.preventDefault();
        pushTrackingEvent('click_cta_como');
        irParaFormulario();
      });
    }

    // CTA da Dobra 6B (CTA Final)
    const ctaFinal = document.getElementById('cta-final-btn');
    if (ctaFinal) {
      ctaFinal.addEventListener('click', function (e) {
        e.preventDefault();
        pushTrackingEvent('click_cta_final');
        irParaFormulario();
      });
    }

    // Link do Rodapé para o Formulário (se houver)
    const ctaFooter = document.getElementById('cta-footer-form');
    if (ctaFooter) {
      ctaFooter.addEventListener('click', function (e) {
        e.preventDefault();
        irParaFormulario();
      });
    }
  }

  // 6. RASTREAMENTO DO FAQ (Dobra 6A) — Controle de abrir/fechar gerenciado exclusivamente por ds.js
  function initFAQ() {
    const faqBtns = document.querySelectorAll('.jd-faq__pergunta');
    faqBtns.forEach(function (btn, index) {
      btn.addEventListener('click', function () {
        setTimeout(function () {
          if (btn.getAttribute('aria-expanded') === 'true') {
            pushTrackingEvent('faq_open', { pergunta: String(index + 1) });
          }
        }, 0);
      });
    });
  }

  // 7. SPOTLIGHT MOUSE TRACKER (Efeito Criogênico do DS Master)
  function initSpotlight() {
    const spotlights = document.querySelectorAll('.jd-spotlight');
    spotlights.forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var rect = el.getBoundingClientRect();
        el.style.setProperty('--mouse-x', (e.clientX - rect.left) + 'px');
        el.style.setProperty('--mouse-y', (e.clientY - rect.top) + 'px');
      }, { passive: true });
    });
  }

  // 8. BANNER DE COOKIES (LGPD) + CONSENT MODE V2
  const CONSENT_STORAGE_KEY = 'jd_consent_v1';
  const CONSENT_EXPIRATION_MS = 365 * 24 * 60 * 60 * 1000; // 12 meses

  function getStoredConsent() {
    try {
      const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || typeof data.ts !== 'number') return null;
      if (Date.now() - data.ts > CONSENT_EXPIRATION_MS) {
        localStorage.removeItem(CONSENT_STORAGE_KEY);
        return null;
      }
      return data;
    } catch (e) {
      return null;
    }
  }

  function saveConsentDecision(analyticsGranted, adsGranted) {
    const data = {
      analytics: Boolean(analyticsGranted),
      ads: Boolean(adsGranted),
      ts: Date.now()
    };

    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      /* noop: fallback silencioso para modo privado */
    }

    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        'ad_storage': data.ads ? 'granted' : 'denied',
        'ad_user_data': data.ads ? 'granted' : 'denied',
        'ad_personalization': data.ads ? 'granted' : 'denied',
        'analytics_storage': data.analytics ? 'granted' : 'denied'
      });
    }

    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'consent_update',
        consent_analytics: data.analytics,
        consent_ads: data.ads,
        lp_version: 'A'
      });
    }

    const banner = document.getElementById('lp-cookie-banner');
    if (banner) {
      banner.classList.remove('is-visible');
    }
  }

  function initCookieBanner() {
    // Aplica PRIVACY_URL unificada em todos os links da página
    const privacyLinks = document.querySelectorAll('[data-privacy-link]');
    privacyLinks.forEach(function (link) {
      link.href = PRIVACY_URL;
    });

    const banner = document.getElementById('lp-cookie-banner');
    if (!banner) return;

    const btnAcceptAll = document.getElementById('lp-cookie-accept-all');
    const btnRejectAll = document.getElementById('lp-cookie-reject-all');
    const btnCustomize = document.getElementById('lp-cookie-customize');
    const panel = document.getElementById('lp-cookie-panel');
    const btnSave = document.getElementById('lp-cookie-save');
    const switchAnalytics = document.getElementById('lp-cookie-switch-analytics');
    const switchAds = document.getElementById('lp-cookie-switch-ads');
    const btnReopen = document.getElementById('lp-cookie-pref-btn');

    function syncSwitchesWithState(analyticsVal, adsVal) {
      if (switchAnalytics) {
        switchAnalytics.setAttribute('aria-checked', analyticsVal ? 'true' : 'false');
      }
      if (switchAds) {
        switchAds.setAttribute('aria-checked', adsVal ? 'true' : 'false');
      }
    }

    function toggleSwitch(switchEl) {
      if (!switchEl || switchEl.disabled) return;
      const current = switchEl.getAttribute('aria-checked') === 'true';
      switchEl.setAttribute('aria-checked', current ? 'false' : 'true');
    }

    function openCustomPanel() {
      const stored = getStoredConsent();
      const analyticsVal = stored ? stored.analytics : false;
      const adsVal = stored ? stored.ads : false;
      syncSwitchesWithState(analyticsVal, adsVal);

      if (panel) {
        panel.removeAttribute('hidden');
      }
      if (btnCustomize) {
        btnCustomize.setAttribute('aria-expanded', 'true');
      }
      banner.classList.add('is-visible');
    }

    // Se já houver decisão válida (menor que 12 meses), o banner não aparece na primeira visita
    const existingConsent = getStoredConsent();
    if (!existingConsent) {
      banner.classList.add('is-visible');
    }

    if (btnAcceptAll) {
      btnAcceptAll.addEventListener('click', function () {
        saveConsentDecision(true, true);
      });
    }

    if (btnRejectAll) {
      btnRejectAll.addEventListener('click', function () {
        saveConsentDecision(false, false);
      });
    }

    if (btnCustomize) {
      btnCustomize.addEventListener('click', function () {
        const isHidden = panel ? panel.hasAttribute('hidden') : true;
        if (isHidden) {
          openCustomPanel();
        } else if (panel) {
          panel.setAttribute('hidden', '');
          btnCustomize.setAttribute('aria-expanded', 'false');
        }
      });
    }

    if (switchAnalytics) {
      switchAnalytics.addEventListener('click', function () {
        toggleSwitch(switchAnalytics);
      });
      switchAnalytics.addEventListener('keydown', function (e) {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          toggleSwitch(switchAnalytics);
        }
      });
    }

    if (switchAds) {
      switchAds.addEventListener('click', function () {
        toggleSwitch(switchAds);
      });
      switchAds.addEventListener('keydown', function (e) {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          toggleSwitch(switchAds);
        }
      });
    }

    if (btnSave) {
      btnSave.addEventListener('click', function () {
        const analyticsVal = switchAnalytics ? switchAnalytics.getAttribute('aria-checked') === 'true' : false;
        const adsVal = switchAds ? switchAds.getAttribute('aria-checked') === 'true' : false;
        saveConsentDecision(analyticsVal, adsVal);
      });
    }

    if (btnReopen) {
      btnReopen.addEventListener('click', function () {
        openCustomPanel();
        if (switchAnalytics) {
          switchAnalytics.focus();
        }
      });
    }
  }

  // INICIALIZAÇÃO
  function init() {
    applyDynamicHeadline();
    initTrackingFields();
    initLeadForm();
    initButtons();
    initFAQ();
    initSpotlight();
    initCookieBanner();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
