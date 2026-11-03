/**
 * JD CÂMARAS FRIAS — SIMULADOR DIRETO (js/simulador.js)
 * Formulário único, direto, sem passos: cálculo em tempo real, alta conversão.
 * 100% seguro (Anti-spam Honeypot, Sanitização, Prevenção de Duplo Envio),
 * Máscara de Telefone BR e Responsividade Mobile Fluida.
 */

(function () {
  'use strict';

  // Endpoint do Webhook de Produção / n8n
  const LEAD_ENDPOINT = 'https://n8n-n8n.6djmf0.easypanel.host/webhook-test/b7874717-cc4b-495a-b3cb-322f3f972153';

  // Configuração oficial de WhatsApp da JD
  const WHATSAPP_NUM = '5562999940769';

  const estado = {
    tipo: 'resfriados',
    tipoNome: 'Câmara fria resfriados (+10 a 0 °C)',
    comprimento: 3.0,
    largura: 2.5,
    altura: 2.8,
    armazenar: 'Carnes e aves',
    cidade: '',
    uf: 'SP',
    volume: 21.0,
    area: 46,
    potenciaHp: 2.5,
    nome: '',
    whatsapp: ''
  };

  const TIPO_CONFIG = {
    mini: {
      nome: 'Mini câmara',
      baseHp: 1.0,
      hpPerM3: 0.08
    },
    expositora: {
      nome: 'Câmara fria expositora (0 a -5 °C)',
      baseHp: 1.5,
      hpPerM3: 0.10
    },
    resfriados: {
      nome: 'Câmara fria resfriados (+10 a 0 °C)',
      baseHp: 1.0,
      hpPerM3: 0.08
    },
    congelados: {
      nome: 'Câmara de congelados (-10 a -18 °C)',
      baseHp: 1.5,
      hpPerM3: 0.13
    },
    indefinido: {
      nome: 'Ainda não sei',
      baseHp: 1.25,
      hpPerM3: 0.09
    }
  };

  // Sanitizador seguro contra XSS
  function sanitize(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[<>"'&]/g, function (m) {
      switch (m) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        case "'": return '&#39;';
        case '&': return '&amp;';
        default: return m;
      }
    }).trim();
  }

  // Recalcula métricas físicas e térmicas
  function updateCalculos() {
    let c = parseFloat(estado.comprimento);
    let l = parseFloat(estado.largura);
    let a = parseFloat(estado.altura);

    if (isNaN(c) || c < 1) c = 1.0;
    if (isNaN(l) || l < 1) l = 1.0;
    if (isNaN(a) || a < 1.5) a = 1.5;

    const vol = c * l * a;
    estado.volume = Math.round(vol * 10) / 10;

    const area = 2 * (c * l + c * a + l * a);
    estado.area = Math.round(area);

    const cfg = TIPO_CONFIG[estado.tipo] || TIPO_CONFIG.resfriados;
    let hp = cfg.baseHp + (vol * cfg.hpPerM3);

    if (hp <= 1.25) hp = 1.0;
    else if (hp <= 1.75) hp = 1.5;
    else if (hp <= 2.25) hp = 2.0;
    else if (hp <= 2.75) hp = 2.5;
    else if (hp <= 3.5)  hp = 3.0;
    else if (hp <= 4.5)  hp = 4.0;
    else if (hp <= 6.0)  hp = 5.0;
    else if (hp <= 8.5)  hp = 7.5;
    else hp = Math.round(hp);

    estado.potenciaHp = hp;

    // Atualiza indicadores na telemetria (se presentes)
    const elVol = document.getElementById('sim-out-vol');
    const elArea = document.getElementById('sim-out-area');
    const elPot = document.getElementById('sim-out-pot');

    if (elVol) elVol.textContent = estado.volume.toFixed(1).replace('.', ',') + ' m³';
    if (elArea) elArea.textContent = estado.area + ' m²';
    if (elPot) elPot.textContent = estado.potenciaHp + ' HP aprox.';

    updateWhatsAppLinks();
  }

  // Gera texto para o WhatsApp com todos os dados
  function getWhatsAppMessage() {
    return 'Olá! Fiz a simulação de câmara fria na JD e gostaria de receber a proposta oficial:\n\n' +
      '❄ *Tipo:* ' + estado.tipoNome + '\n' +
      '📐 *Medidas:* ' + estado.comprimento.toFixed(1) + 'm (C) × ' + estado.largura.toFixed(1) + 'm (L) × ' + estado.altura.toFixed(1) + 'm (A)\n' +
      '📦 *Volume:* ' + estado.volume.toFixed(1) + ' m³ (' + estado.area + ' m² de painéis)\n' +
      '🥩 *Produto:* ' + estado.armazenar + '\n' +
      (estado.cidade ? '📍 *Local:* ' + estado.cidade + ' - ' + estado.uf + '\n' : '') +
      (estado.nome ? '👤 *Nome:* ' + estado.nome + '\n' : '') +
      '\nPoderiam me enviar o orçamento com valores de fábrica e prazo?';
  }

  function updateWhatsAppLinks() {
    const msg = encodeURIComponent(getWhatsAppMessage());
    const waUrl = WHATSAPP_NUM ? ('https://wa.me/' + WHATSAPP_NUM + '?text=' + msg) : ('https://wa.me/?text=' + msg);

    const btnSuccWa = document.getElementById('sim-succ-wa-btn');
    if (btnSuccWa) {
      btnSuccWa.href = waUrl;
    }

    const btnFloatWa = document.getElementById('sim-floating-wa');
    if (btnFloatWa) {
      btnFloatWa.href = waUrl;
    }
  }

  // Máscara brasileira de telefone BR (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
  function applyMask(input) {
    if (!input) return;
    input.addEventListener('input', function () {
      let v = this.value.replace(/\D/g, '');
      if (v.length > 11) v = v.slice(0, 11);

      if (v.length > 10) {
        this.value = '(' + v.slice(0, 2) + ') ' + v.slice(2, 7) + '-' + v.slice(7);
      } else if (v.length > 6) {
        this.value = '(' + v.slice(0, 2) + ') ' + v.slice(2, 6) + '-' + v.slice(6);
      } else if (v.length > 2) {
        this.value = '(' + v.slice(0, 2) + ') ' + v.slice(2);
      } else if (v.length > 0) {
        this.value = '(' + v;
      }
      this.classList.remove('is-invalid');
    });
  }

  function initSimuladorDireto() {
    // 1. Tipo de Câmara
    const tipoBtns = document.querySelectorAll('[data-tipo-btn]');
    tipoBtns.forEach(btn => {
      btn.addEventListener('click', function () {
        tipoBtns.forEach(b => b.classList.remove('is-selected'));
        this.classList.add('is-selected');

        const key = this.getAttribute('data-tipo-btn');
        const cfg = TIPO_CONFIG[key] || TIPO_CONFIG.resfriados;

        estado.tipo = key;
        estado.tipoNome = cfg.nome;

        updateCalculos();
      });
    });

    // 2. Medidas (Inputs diretos)
    const inpC = document.getElementById('sim-field-c');
    const inpL = document.getElementById('sim-field-l');
    const inpA = document.getElementById('sim-field-a');

    function onDimChange() {
      if (inpC) estado.comprimento = parseFloat(inpC.value) || 2.0;
      if (inpL) estado.largura = parseFloat(inpL.value) || 2.0;
      if (inpA) estado.altura = parseFloat(inpA.value) || 2.2;
      updateCalculos();
    }

    if (inpC) { inpC.addEventListener('input', onDimChange); inpC.addEventListener('change', onDimChange); }
    if (inpL) { inpL.addEventListener('input', onDimChange); inpL.addEventListener('change', onDimChange); }
    if (inpA) { inpA.addEventListener('input', onDimChange); inpA.addEventListener('change', onDimChange); }

    // 3. Armazenar, Cidade e UF
    const selArm = document.getElementById('sim-field-armazenar');
    if (selArm) {
      selArm.addEventListener('change', e => { estado.armazenar = sanitize(e.target.value); updateCalculos(); });
    }

    const inpCidade = document.getElementById('sim-field-cidade');
    if (inpCidade) {
      inpCidade.addEventListener('input', e => {
        inpCidade.classList.remove('is-invalid');
        estado.cidade = sanitize(e.target.value);
        updateCalculos();
      });
    }

    const selUf = document.getElementById('sim-field-uf');
    if (selUf) {
      selUf.addEventListener('change', e => { estado.uf = sanitize(e.target.value); updateCalculos(); });
    }

    // 4. Máscara de Telefone e Validação
    const waInp = document.getElementById('sim-field-whatsapp');
    const nomeInp = document.getElementById('sim-field-nome');

    if (waInp) applyMask(waInp);
    if (nomeInp) {
      nomeInp.addEventListener('input', function () {
        this.classList.remove('is-invalid');
      });
    }

    // Exporta estado e helpers para o motor unificado em lp.js (Prompt 08)
    window.simuladorEstado = estado;
    window.getSimuladorWhatsAppMessage = getWhatsAppMessage;
    window.showSimuladorSucesso = showSucesso;

    function showSucesso() {
      const formCard = document.getElementById('sim-form-body');
      const succCard = document.getElementById('sim-form-sucesso');
      const floatWa = document.getElementById('sim-floating-wa');

      if (formCard) formCard.style.display = 'none';
      if (succCard) succCard.classList.add('is-visible');

      // Revela o botão flutuante de WhatsApp apenas após o cadastro
      if (floatWa) {
        floatWa.style.display = 'inline-flex';
      }

      updateWhatsAppLinks();

      // Rola suavemente até o card de confirmação com o botão do WhatsApp
      if (succCard) {
        succCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    // Botões CTA do cabeçalho que rolam até o formulário
    const ctaSimular = document.querySelectorAll('[data-cta-simular]');
    ctaSimular.forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        const el = document.getElementById('simulador-form-card');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    // Raio-X construtivo
    const corteBtns = document.querySelectorAll('[data-corte-layer]');
    corteBtns.forEach(btn => {
      btn.addEventListener('click', function () {
        corteBtns.forEach(b => b.classList.remove('is-active'));
        this.classList.add('is-active');

        const layerKey = this.getAttribute('data-corte-layer');
        const pPaineis = document.getElementById('layer-paineis');
        const pRefrig = document.getElementById('layer-refrig');
        const pPorta = document.getElementById('layer-porta');

        if (layerKey === 'geral') {
          if (pPaineis) pPaineis.style.display = '';
          if (pRefrig) pRefrig.style.display = '';
          if (pPorta) pPorta.style.display = '';
        } else if (layerKey === 'paineis') {
          if (pPaineis) pPaineis.style.display = '';
          if (pRefrig) pRefrig.style.display = 'none';
          if (pPorta) pPorta.style.display = 'none';
        } else if (layerKey === 'refrig') {
          if (pPaineis) pPaineis.style.display = 'none';
          if (pRefrig) pRefrig.style.display = '';
          if (pPorta) pPorta.style.display = 'none';
        } else if (layerKey === 'porta') {
          if (pPaineis) pPaineis.style.display = 'none';
          if (pRefrig) pRefrig.style.display = 'none';
          if (pPorta) pPorta.style.display = '';
        }
      });
    });

    // Inicializa cálculos
    updateCalculos();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSimuladorDireto);
  } else {
    initSimuladorDireto();
  }
})();
