/**
 * JD CÂMARAS FRIAS — FORMULÁRIO DIRETO (js/simulador.js)
 * Seleção de tipo, dados do produto/medidas, sanitização, máscara BR e links de WhatsApp.
 * Zero promessa de cálculo em tempo real.
 */

(function () {
  'use strict';

  // Configuração oficial de WhatsApp da JD
  const WHATSAPP_NUM = '5562999940769';

  const estado = {
    tipo: '',
    tipoNome: '',
    comprimento: '',
    largura: '',
    altura: '',
    armazenar: '',
    cidade: '',
    uf: '',
    volume: '',
    nome: '',
    whatsapp: ''
  };

  const TIPO_NOMES = {
    mini: 'Mini câmara',
    expositora: 'Câmara expositora (walk-in cooler)',
    resfriados: 'Câmara de resfriados (0 a +15 °C)',
    congelados: 'Câmara de congelados (-18 °C)',
    indefinido: 'Ainda não sei'
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

  // Recalcula volume somente se todas as medidas estiverem preenchidas
  function updateVolume() {
    const c = parseFloat(String(estado.comprimento).replace(',', '.'));
    const l = parseFloat(String(estado.largura).replace(',', '.'));
    const a = parseFloat(String(estado.altura).replace(',', '.'));

    if (!isNaN(c) && !isNaN(l) && !isNaN(a) && c > 0 && l > 0 && a > 0) {
      estado.volume = (c * l * a).toFixed(1);
    } else {
      estado.volume = '';
    }

    updateWhatsAppLinks();
  }

  // Gera texto para o WhatsApp com os dados preenchidos
  function getWhatsAppMessage(ref) {
    let msg = 'Olá! Gostaria de receber um orçamento de câmara fria da JD:\n\n';

    if (estado.tipoNome) {
      msg += '❄ *Tipo:* ' + estado.tipoNome + '\n';
    }

    const c = parseFloat(String(estado.comprimento).replace(',', '.'));
    const l = parseFloat(String(estado.largura).replace(',', '.'));
    const a = parseFloat(String(estado.altura).replace(',', '.'));

    if (!isNaN(c) && !isNaN(l) && !isNaN(a) && c > 0 && l > 0 && a > 0) {
      const vol = (c * l * a).toFixed(1).replace('.', ',');
      msg += '📐 *Medidas:* ' + c.toFixed(1) + 'm (C) × ' + l.toFixed(1) + 'm (L) × ' + a.toFixed(1) + 'm (A)\n';
      msg += '📦 *Volume:* ' + vol + ' m³\n';
    }

    if (estado.armazenar) {
      msg += '🥩 *Produto:* ' + estado.armazenar + '\n';
    }

    if (estado.cidade) {
      msg += '📍 *Local:* ' + estado.cidade + (estado.uf ? ' - ' + estado.uf : '') + '\n';
    }

    if (estado.nome) {
      msg += '👤 *Nome:* ' + estado.nome + '\n';
    }

    msg += '\nPoderiam me enviar o orçamento com valores de fábrica e prazo?';

    if (ref) {
      msg += ' (ref: ' + ref + ')';
    }

    return msg;
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
    const tipoErrorEl = document.getElementById('sim-tipo-error');

    tipoBtns.forEach(btn => {
      btn.addEventListener('click', function () {
        tipoBtns.forEach(b => b.classList.remove('is-selected'));
        this.classList.add('is-selected');

        const key = this.getAttribute('data-tipo-btn');
        estado.tipo = key;
        estado.tipoNome = TIPO_NOMES[key] || '';

        if (tipoErrorEl) {
          tipoErrorEl.classList.remove('is-visible');
        }

        updateVolume();
      });

      btn.addEventListener('keydown', function (e) {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          btn.click();
        }
      });
    });

    // 2. Medidas (Inputs diretos opcionais)
    const inpC = document.getElementById('sim-field-c');
    const inpL = document.getElementById('sim-field-l');
    const inpA = document.getElementById('sim-field-a');

    function onDimChange() {
      if (inpC) estado.comprimento = inpC.value.trim();
      if (inpL) estado.largura = inpL.value.trim();
      if (inpA) estado.altura = inpA.value.trim();
      updateVolume();
    }

    if (inpC) { inpC.addEventListener('input', onDimChange); inpC.addEventListener('change', onDimChange); }
    if (inpL) { inpL.addEventListener('input', onDimChange); inpL.addEventListener('change', onDimChange); }
    if (inpA) { inpA.addEventListener('input', onDimChange); inpA.addEventListener('change', onDimChange); }

    // 3. Armazenar, Cidade e UF
    const selArm = document.getElementById('sim-field-armazenar');
    if (selArm) {
      selArm.addEventListener('change', e => {
        selArm.classList.remove('is-invalid');
        estado.armazenar = sanitize(e.target.value);
        updateVolume();
      });
    }

    const inpCidade = document.getElementById('sim-field-cidade');
    if (inpCidade) {
      inpCidade.addEventListener('input', e => {
        inpCidade.classList.remove('is-invalid');
        estado.cidade = sanitize(e.target.value);
        updateVolume();
      });
    }

    const selUf = document.getElementById('sim-field-uf');
    if (selUf) {
      selUf.addEventListener('change', e => {
        selUf.classList.remove('is-invalid');
        estado.uf = sanitize(e.target.value);
        updateVolume();
      });
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

    // Exporta estado e helpers para o motor unificado em lp.js
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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSimuladorDireto);
  } else {
    initSimuladorDireto();
  }
})();