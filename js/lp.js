/**
 * JD CÂMARAS FRIAS — LP A (Versão Direta)
 * lp.js: Lógica de negócio, formulário direto, Consent Mode v2, Atribuição jd_attrib,
 * lead_id único, envio seguro ao Webhook n8n (HTTP 2xx) e WhatsApp com código de referência (ref).
 * Zero dependências externas.
 */

// CONFIRMAR: política de privacidade própria da JD
const PRIVACY_URL = 'https://www.facebook.com/privacy/policy/?locale=pt_BR';

// Endpoint de envio do webhook
const LEAD_ENDPOINT = 'https://n8n-n8n.6djmf0.easypanel.host/webhook-test/b7874717-cc4b-495a-b3cb-322f3f972153';

// Número de WhatsApp oficial da JD
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

  let activeVariantKey = 'padrao';

  function applyDynamicHeadline() {
    const params = new URLSearchParams(window.location.search);
    const hParam = (params.get('h') || '').toLowerCase().trim();

    const h1El = document.getElementById('hero-title');
    const subEl = document.getElementById('hero-subtitle');
    const variantInput = document.getElementById('lp-field-titulo_variante');

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

  // 3. ESTADO DE CONSENTIMENTO (Consent Mode v2)
  const CONSENT_STORAGE_KEY = 'jd_consent_v1';
  const CONSENT_EXPIRATION_MS = 365 * 24 * 60 * 60 * 1000; // 12 meses

  function getConsentStatus() {
    try {
      const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (!raw) return { ads: 'pending', analytics: 'pending' };
      const data = JSON.parse(raw);
      if (!data || typeof data.ts !== 'number' || (Date.now() - data.ts > CONSENT_EXPIRATION_MS)) {
        return { ads: 'pending', analytics: 'pending' };
      }
      return {
        ads: data.ads === true ? 'granted' : (data.ads === false ? 'denied' : 'pending'),
        analytics: data.analytics === true ? 'granted' : (data.analytics === false ? 'denied' : 'pending')
      };
    } catch (e) {
      return { ads: 'pending', analytics: 'pending' };
    }
  }

  // 4. ATRIBUIÇÃO (jd_attrib) COM REGRAS DE CONSENTIMENTO E ÚLTIMO CLIQUE
  const ATTRIB_STORAGE_KEY = 'jd_attrib';
  const ATTRIB_EXPIRATION_MS = 90 * 24 * 60 * 60 * 1000; // 90 dias

  const ATTRIB_PARAMS = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'matchtype',
    'device',
    'network',
    'gclid',
    'gbraid',
    'wbraid'
  ];

  let currentAttrib = {};

  function loadStoredAttrib() {
    let stored = null;
    const consent = getConsentStatus();

    // Se publicidade estiver CONCEDIDA, lê de localStorage com validade de 90 dias
    if (consent.ads === 'granted') {
      try {
        const raw = localStorage.getItem(ATTRIB_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed.ts === 'number') {
            if (Date.now() - parsed.ts < ATTRIB_EXPIRATION_MS) {
              stored = parsed;
            } else {
              localStorage.removeItem(ATTRIB_STORAGE_KEY);
            }
          }
        }
      } catch (e) { /* noop */ }
    }

    // Se não encontrou no localStorage, tenta no sessionStorage
    if (!stored) {
      try {
        const rawSession = sessionStorage.getItem(ATTRIB_STORAGE_KEY);
        if (rawSession) {
          stored = JSON.parse(rawSession);
        }
      } catch (e) { /* noop */ }
    }

    return stored || {};
  }

  function saveAttrib(attribObj) {
    const consent = getConsentStatus();
    attribObj.ts = Date.now();

    if (consent.ads === 'granted') {
      try {
        localStorage.setItem(ATTRIB_STORAGE_KEY, JSON.stringify(attribObj));
      } catch (e) { /* noop */ }
    } else {
      try {
        sessionStorage.setItem(ATTRIB_STORAGE_KEY, JSON.stringify(attribObj));
      } catch (e) { /* noop */ }
    }
  }

  function initAttribution() {
    const params = new URLSearchParams(window.location.search);
    const stored = loadStoredAttrib();
    const merged = {};

    ATTRIB_PARAMS.forEach(function (param) {
      const urlVal = params.get(param);
      if (urlVal !== null && urlVal !== '') {
        merged[param] = urlVal;
      } else if (stored[param]) {
        merged[param] = stored[param];
      } else {
        merged[param] = '';
      }

      // Preenche os campos ocultos do formulário
      const input = document.getElementById('lp-field-' + param);
      if (input) {
        input.value = merged[param];
      }
    });

    currentAttrib = merged;
    saveAttrib(merged);

    // Landing Page completa (com query params e hash)
    const lpUrlInput = document.getElementById('lp-field-landing_page');
    if (lpUrlInput) {
      lpUrlInput.value = window.location.href;
    }

    updateHiddenConsentFields();
  }

  function updateHiddenConsentFields() {
    const consent = getConsentStatus();
    const inputAds = document.getElementById('lp-field-consent_ads');
    const inputAnalytics = document.getElementById('lp-field-consent_analytics');
    if (inputAds) inputAds.value = consent.ads;
    if (inputAnalytics) inputAnalytics.value = consent.analytics;
  }

  // 5. GERAÇÃO E PERSISTÊNCIA DO LEAD_ID
  let currentLeadId = null;
  let formStartedTracked = false;
  let leadSubmittedSuccessfully = false;

  function generateUUID() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      try {
        return crypto.randomUUID();
      } catch (e) { /* fallback */ }
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function getOrCreateLeadId() {
    if (!currentLeadId) {
      currentLeadId = generateUUID();
      const input = document.getElementById('lp-field-lead_id');
      if (input) input.value = currentLeadId;
    }
    return currentLeadId;
  }

  // 6. NORMALIZAÇÃO DO TELEFONE (E.164 SEM PII EXTRA)
  function normalizePhoneE164(rawPhone) {
    if (!rawPhone) return '';
    let digits = String(rawPhone).replace(/\D/g, '');
    digits = digits.replace(/^0+/, '');
    if (!digits.startsWith('55')) {
      digits = '55' + digits;
    }
    if (digits.length === 12 || digits.length === 13) {
      return '+' + digits;
    }
    return '';
  }

  // 7. TIMEZONE COM FUSO HORÁRIO -03:00 (ISO 8601)
  function getIsoTimestampSaoPaulo() {
    const now = new Date();
    const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
    const spMs = utcMs - (3 * 3600000); // UTC - 3 hours
    const spDate = new Date(spMs);

    const pad = function (n, z) { z = z || 2; return ('00' + n).slice(-z); };
    const yyyy = spDate.getFullYear();
    const MM = pad(spDate.getMonth() + 1);
    const dd = pad(spDate.getDate());
    const HH = pad(spDate.getHours());
    const mm = pad(spDate.getMinutes());
    const ss = pad(spDate.getSeconds());
    const ms = pad(spDate.getMilliseconds(), 3);

    return yyyy + '-' + MM + '-' + dd + 'T' + HH + ':' + mm + ':' + ss + '.' + ms + '-03:00';
  }

  // 8. CÓDIGO DE REFERÊNCIA WHATSAPP (ref)
  function generateWhatsAppRef() {
    if (leadSubmittedSuccessfully && currentLeadId) {
      // 6 primeiros caracteres em maiúsculas do lead_id
      const clean = currentLeadId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      return clean.slice(0, 6);
    }
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sem 0, O, 1, I
    let ref = '';
    for (let i = 0; i < 6; i++) {
      ref += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return ref;
  }

  // 9. MOTOR DO FORMULÁRIO DIRETO DE SIMULAÇÃO (Com validação e retry)
  function initDirectLeadForm() {
    const form = document.getElementById('jd-sim-direto-form');
    if (!form) return;

    const btnSubmit = document.getElementById('sim-btn-submit');
    const submitErrorWrap = document.getElementById('lp-submit-error');
    const btnRetry = document.getElementById('lp-btn-retry');
    const honeypot = document.getElementById('sim-honeypot-field');

    // Primeira interação com o formulário -> gera lead_id e dispara lead_form_start
    form.addEventListener('focusin', handleFirstInteraction);
    form.addEventListener('input', handleFirstInteraction);

    function handleFirstInteraction() {
      if (!formStartedTracked) {
        formStartedTracked = true;
        const id = getOrCreateLeadId();
        pushTrackingEvent('lead_form_start', { lead_id: id });
      }
    }

    // Tentar de novo após erro de envio (preserva o mesmo lead_id)
    if (btnRetry) {
      btnRetry.addEventListener('click', function (e) {
        e.preventDefault();
        if (submitErrorWrap) submitErrorWrap.classList.remove('is-visible');
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.classList.remove('is-loading');
          btnSubmit.innerHTML = '<span>Calcular e Receber Meu Orçamento</span>';
          btnSubmit.focus();
        }
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      handleFormSubmit();
    });

    function handleFormSubmit() {
      // Honeypot anti-spam (descarte silencioso)
      if (honeypot && honeypot.value.trim() !== '') {
        showSuccessView('Câmara fria', 'Outro produto', 'SP', '5511999999999');
        return;
      }

      const nomeInp = document.getElementById('sim-field-nome');
      const waInp = document.getElementById('sim-field-whatsapp');
      const cidInp = document.getElementById('sim-field-cidade');
      const ufInp = document.getElementById('sim-field-uf');
      const armInp = document.getElementById('sim-field-armazenar');
      const inpC = document.getElementById('sim-field-c');
      const inpL = document.getElementById('sim-field-l');
      const inpA = document.getElementById('sim-field-a');

      let hasError = false;

      // Validação Nome
      if (!nomeInp || nomeInp.value.trim().length < 3) {
        if (nomeInp) {
          nomeInp.classList.add('is-invalid');
          nomeInp.focus();
        }
        hasError = true;
      }

      // Validação WhatsApp
      const waDigits = (waInp ? waInp.value : '').replace(/\D/g, '');
      if (waDigits.length < 10) {
        if (waInp) {
          waInp.classList.add('is-invalid');
          if (!hasError) waInp.focus();
        }
        hasError = true;
      }

      // Validação Cidade
      if (!cidInp || cidInp.value.trim().length < 2) {
        if (cidInp) {
          cidInp.classList.add('is-invalid');
          if (!hasError) cidInp.focus();
        }
        hasError = true;
      }

      if (hasError) return;

      // Assegura que o lead_id existe e é preservado em retentativas
      const leadId = getOrCreateLeadId();

      // Atualiza consentimento no momento do envio
      const consentStatus = getConsentStatus();
      updateHiddenConsentFields();

      // Recupera dados do simulador
      const simData = (window.simuladorEstado) || {};
      const tipoSelected = document.querySelector('[data-tipo-btn].is-selected');
      const tipoNome = tipoSelected ? (tipoSelected.querySelector('.jd-sim-tipo-btn__name') || {}).textContent.trim() : (simData.tipoNome || 'Câmara fria resfriados (+10 a 0 °C)');

      const nomeVal = (nomeInp ? nomeInp.value : '').trim();
      const whatsappVal = (waInp ? waInp.value : '').trim();
      const cidadeVal = (cidInp ? cidInp.value : '').trim();
      const ufVal = (ufInp ? ufInp.value : 'SP').trim();
      const armazenarVal = (armInp ? armInp.value : 'Carnes e aves').trim();
      const compVal = inpC ? inpC.value : (simData.comprimento || '3.0');
      const largVal = inpL ? inpL.value : (simData.largura || '2.5');
      const altVal = inpA ? inpA.value : (simData.altura || '2.8');

      const timestampEnvio = getIsoTimestampSaoPaulo();
      const timestampInput = document.getElementById('lp-field-timestamp_envio');
      if (timestampInput) timestampInput.value = timestampEnvio;

      // Monta Payload final do webhook com 28 colunas exatas na ordem estrita solicitada (sem prazo)
      const payload = {
        tipo_evento: 'lead_form',
        lead_id: leadId,
        timestamp_envio: timestampEnvio,
        nome: nomeVal,
        whatsapp: whatsappVal,
        tipo_camara: tipoNome,
        armazenar: armazenarVal,
        largura: largVal,
        comprimento: compVal,
        altura: altVal,
        cidade: cidadeVal,
        uf: ufVal,
        utm_source: currentAttrib.utm_source || '',
        utm_medium: currentAttrib.utm_medium || '',
        utm_campaign: currentAttrib.utm_campaign || '',
        utm_term: currentAttrib.utm_term || '',
        utm_content: currentAttrib.utm_content || '',
        matchtype: currentAttrib.matchtype || '',
        device: currentAttrib.device || '',
        network: currentAttrib.network || '',
        gclid: currentAttrib.gclid || '',
        gbraid: currentAttrib.gbraid || '',
        wbraid: currentAttrib.wbraid || '',
        landing_page: window.location.href,
        lp_version: 'A',
        titulo_variante: activeVariantKey,
        consent_ads: consentStatus.ads,
        consent_analytics: consentStatus.analytics
      };

      const isDebug = new URLSearchParams(window.location.search).get('debug') === '1';

      if (isDebug) {
        console.group('🔍 [LP Debug Mode] Webhook Payload & Attribution');
        console.log('Webhook Payload (28 campos):', payload);
        console.log('Objeto jd_attrib:', currentAttrib);
        console.groupEnd();
        // Em modo debug, não envia para o servidor real
        return;
      }

      // Bloqueio de duplo envio
      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.classList.add('is-loading');
        btnSubmit.innerHTML = '<span>Enviando Orçamento...</span>';
      }
      if (submitErrorWrap) submitErrorWrap.classList.remove('is-visible');

      fetch(LEAD_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          if (!res.ok) {
            throw new Error('HTTP ' + res.status);
          }
          return res.json().catch(function () { return {}; });
        })
        .then(function () {
          // HTTP 2xx confirmado com sucesso
          leadSubmittedSuccessfully = true;
          showSuccessView(tipoNome, armazenarVal, ufVal, whatsappVal);
        })
        .catch(function (err) {
          console.error('[LP Webhook Error]', err);
          if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.classList.remove('is-loading');
            btnSubmit.innerHTML = '<span>Calcular e Receber Meu Orçamento</span>';
          }
          if (submitErrorWrap) {
            submitErrorWrap.classList.add('is-visible');
            submitErrorWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        });
    }

    function showSuccessView(tipoCamara, armazenar, uf, rawPhone) {
      if (submitErrorWrap) submitErrorWrap.classList.remove('is-visible');

      if (typeof window.showSimuladorSucesso === 'function') {
        window.showSimuladorSucesso();
      } else {
        const formBody = document.getElementById('sim-form-body');
        const succBox = document.getElementById('sim-form-sucesso');
        const floatWa = document.getElementById('sim-floating-wa');
        if (formBody) formBody.style.display = 'none';
        if (succBox) succBox.classList.add('is-visible');
        if (floatWa) floatWa.style.display = 'inline-flex';
        if (succBox) succBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      // Dispara lead_form_submit SOMENTE após resposta 2xx confirmada
      const normalizedPhone = normalizePhoneE164(rawPhone);
      window.dataLayer.push({
        event: 'lead_form_submit',
        lead_id: currentLeadId,
        event_id: currentLeadId,
        tipo_camara: tipoCamara,
        armazenar: armazenar,
        uf: uf,
        lp_version: 'A',
        titulo_variante: activeVariantKey,
        user_data: {
          phone_number: normalizedPhone
        }
      });
    }
  }

  // 10. BOTÕES DE WHATSAPP COM CÓDIGO DE REFERÊNCIA (ref)
  function initWhatsAppButtons() {
    const waButtons = document.querySelectorAll('[data-whatsapp-btn]');
    const isDebug = new URLSearchParams(window.location.search).get('debug') === '1';

    waButtons.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();

        const origem = btn.getAttribute('data-whatsapp-btn') || 'cta_final';
        const ref = generateWhatsAppRef();
        const consentStatus = getConsentStatus();

        // Obtém o texto base do simulador ou fallback
        let baseMsg = '';
        if (typeof window.getSimuladorWhatsAppMessage === 'function') {
          baseMsg = window.getSimuladorWhatsAppMessage();
        } else {
          baseMsg = 'Olá! Vim pelo site e quero um orçamento de câmara fria.';
        }

        // Limpa sufixo ref anterior caso existisse e insere o ref atual
        baseMsg = baseMsg.replace(/\s*\(ref:\s*[A-Z0-9]+\)$/i, '');
        const fullMsg = baseMsg + ' (ref: ' + ref + ')';

        // 3. Registro leve no mesmo webhook (keepalive: true, falha em silêncio)
        const waPayload = {
          tipo_evento: 'click_whatsapp',
          ref: ref,
          origem: origem,
          timestamp_envio: getIsoTimestampSaoPaulo(),
          utm_source: currentAttrib.utm_source || '',
          utm_medium: currentAttrib.utm_medium || '',
          utm_campaign: currentAttrib.utm_campaign || '',
          utm_term: currentAttrib.utm_term || '',
          utm_content: currentAttrib.utm_content || '',
          matchtype: currentAttrib.matchtype || '',
          device: currentAttrib.device || '',
          network: currentAttrib.network || '',
          gclid: currentAttrib.gclid || '',
          gbraid: currentAttrib.gbraid || '',
          wbraid: currentAttrib.wbraid || '',
          landing_page: window.location.href,
          lp_version: 'A',
          titulo_variante: activeVariantKey,
          consent_ads: consentStatus.ads,
          consent_analytics: consentStatus.analytics
        };

        if (isDebug) {
          console.group('🔍 [LP Debug Mode] WhatsApp Click Webhook Ping');
          console.log('Payload Webhook Click:', waPayload);
          console.log('Código ref:', ref);
          console.groupEnd();
        } else if (LEAD_ENDPOINT) {
          try {
            fetch(LEAD_ENDPOINT, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(waPayload),
              keepalive: true
            }).catch(function () { /* fail silently */ });
          } catch (err) { /* fail silently */ }
        }

        // 4. dataLayer (1 disparo por clique)
        window.dataLayer.push({
          event: 'click_whatsapp',
          origem: origem,
          ref: ref,
          lp_version: 'A',
          titulo_variante: activeVariantKey
        });

        // 5. Redirecionamento ou scroll se WHATSAPP_NUMBER estiver vazio
        if (!WHATSAPP_NUMBER) {
          if (isDebug) {
            console.warn('⚠ WHATSAPP_NUMBER vazio');
          }
          const formCard = document.getElementById('simulador-form-card');
          if (formCard) {
            formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        } else {
          const waUrl = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(fullMsg);
          window.open(waUrl, '_blank', 'noopener,noreferrer');
        }
      });
    });
  }

  // 11. DEMAIS CTAS DA PÁGINA (Scroll Suave até o Simulador)
  function initHeaderAndNavCtas() {
    const ctas = document.querySelectorAll('[data-cta-simular]');
    ctas.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        const formCard = document.getElementById('simulador-form-card');
        if (formCard) {
          formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  // 12. BANNER DE COOKIES (LGPD) + CONSENT MODE V2
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
      const consent = getConsentStatus();
      const analyticsVal = consent.analytics === 'granted';
      const adsVal = consent.ads === 'granted';
      syncSwitchesWithState(analyticsVal, adsVal);

      if (panel) {
        panel.removeAttribute('hidden');
      }
      if (btnCustomize) {
        btnCustomize.setAttribute('aria-expanded', 'true');
      }
      banner.classList.add('is-visible');
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
        /* noop: fallback gracioso para modo privado */
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

      // Reavalia persistência da atribuição com base no novo consentimento de ads
      saveAttrib(currentAttrib);
      updateHiddenConsentFields();

      banner.classList.remove('is-visible');
    }

    // Se já houver decisão válida (menor que 12 meses), não exibe o banner na visita inicial
    try {
      const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.ts === 'number' && (Date.now() - parsed.ts < CONSENT_EXPIRATION_MS)) {
          banner.classList.remove('is-visible');
        } else {
          banner.classList.add('is-visible');
        }
      } else {
        banner.classList.add('is-visible');
      }
    } catch (e) {
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

  // 13. SPOTLIGHT MOUSE TRACKER
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

  // INICIALIZAÇÃO
  function init() {
    applyDynamicHeadline();
    initAttribution();
    initDirectLeadForm();
    initWhatsAppButtons();
    initHeaderAndNavCtas();
    initSpotlight();
    initCookieBanner();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();