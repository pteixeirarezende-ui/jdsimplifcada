/**
 * JD CÂMARAS FRIAS — SIMULADOR DIRETO (js/simulador.js)
 * Formulário único, direto, sem passos: cálculo em tempo real, alta conversão.
 * 100% seguro (Anti-spam Honeypot, Sanitização, Prevenção de Duplo Envio),
 * Máscara de Telefone BR e Responsividade Mobile Fluida.
 */

(function () {
  'use strict';

  // Configuração opcional de WhatsApp
  const WHATSAPP_NUM = ''; // TODO: inserir número oficial se houver (ex: 5532999999999)

  const estado = {
    tipo: 'resfriados',
    tipoNome: 'Câmara de Resfriados (0 a +15 °C)',
    tempText: '0 a +15 °C',
    tempVal: 2.0,
    comprimento: 3.0,
    largura: 2.5,
    altura: 2.8,
    armazenar: 'Carnes e aves',
    cidade: '',
    uf: 'SP',
    energia: '220V - Bifásico / Monofásico',
    volume: 21.0,
    area: 46,
    potenciaHp: 2.5,
    nome: '',
    whatsapp: ''
  };

  const TIPO_CONFIG = {
    resfriados: {
      nome: 'Câmara de Resfriados (0 a +15 °C)',
      tempText: '0 a +15 °C',
      tempVal: 2.0,
      baseHp: 1.0,
      hpPerM3: 0.08
    },
    congelados: {
      nome: 'Câmara de Congelados (-18 °C)',
      tempText: '-18 a -25 °C',
      tempVal: -18.0,
      baseHp: 1.5,
      hpPerM3: 0.14
    },
    expositora: {
      nome: 'Câmara Expositora Walk-in Cooler',
      tempText: '0 a +5 °C',
      tempVal: 1.5,
      baseHp: 1.5,
      hpPerM3: 0.11
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

    // Atualiza indicadores na telemetria
    const elVol = document.getElementById('sim-out-vol');
    const elArea = document.getElementById('sim-out-area');
    const elPot = document.getElementById('sim-out-pot');

    if (elVol) elVol.textContent = estado.volume.toFixed(1).replace('.', ',') + ' m³';
    if (elArea) elArea.textContent = estado.area + ' m²';
    if (elPot) elPot.textContent = estado.potenciaHp + ' HP aprox.';

    // Termostato Danfoss no topo
    const ledTemp = document.getElementById('live-temp-display');
    if (ledTemp) {
      ledTemp.textContent = estado.tempVal > 0 ? '+' + estado.tempVal.toFixed(1).replace('.', ',') : estado.tempVal.toFixed(1).replace('.', ',');
    }

    updateWhatsAppLinks();
  }

  // Gera texto para o WhatsApp com todos os dados
  function getWhatsAppMessage() {
    return encodeURIComponent(
      'Olá! Fiz a simulação de câmara fria na JD e gostaria de receber a proposta oficial:\n\n' +
      '❄ *Tipo:* ' + estado.tipoNome + '\n' +
      '📐 *Medidas:* ' + estado.comprimento.toFixed(1) + 'm (C) × ' + estado.largura.toFixed(1) + 'm (L) × ' + estado.altura.toFixed(1) + 'm (A)\n' +
      '📦 *Volume Calculado:* ' + estado.volume.toFixed(1) + ' m³ (' + estado.area + ' m² de painéis)\n' +
      '🥩 *Produto:* ' + estado.armazenar + '\n' +
      '⚡ *Rede Elétrica:* ' + estado.energia + '\n' +
      (estado.cidade ? '📍 *Local:* ' + estado.cidade + ' - ' + estado.uf + '\n' : '') +
      (estado.nome ? '👤 *Nome:* ' + estado.nome + '\n' : '') +
      '\nPoderiam me enviar o orçamento com valores de fábrica e prazo?'
    );
  }

  function updateWhatsAppLinks() {
    const msg = getWhatsAppMessage();
    const waUrl = WHATSAPP_NUM ? ('https://wa.me/' + WHATSAPP_NUM + '?text=' + msg) : ('https://wa.me/?text=' + msg);

    const btnSuccWa = document.getElementById('sim-succ-wa-btn');
    if (btnSuccWa) {
      btnSuccWa.href = waUrl;
      btnSuccWa.target = '_blank';
      btnSuccWa.onclick = function (e) {
        e.stopPropagation();
      };
    }

    const btnFloatWa = document.getElementById('sim-floating-wa');
    if (btnFloatWa) {
      btnFloatWa.href = waUrl;
      btnFloatWa.target = '_blank';
      btnFloatWa.onclick = function (e) {
        e.stopPropagation();
      };
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
    // 1. Tipo de Câmara (Resfriados, Congelados, Expositora)
    const tipoBtns = document.querySelectorAll('[data-tipo-btn]');
    tipoBtns.forEach(btn => {
      btn.addEventListener('click', function () {
        tipoBtns.forEach(b => b.classList.remove('is-selected'));
        this.classList.add('is-selected');

        const key = this.getAttribute('data-tipo-btn');
        const cfg = TIPO_CONFIG[key] || TIPO_CONFIG.resfriados;

        estado.tipo = key;
        estado.tipoNome = cfg.nome;
        estado.tempText = cfg.tempText;
        estado.tempVal = cfg.tempVal;

        // Sincroniza botões do termostato no topo
        const btnCong = document.getElementById('btn-temp-cong');
        const btnResf = document.getElementById('btn-temp-resf');
        if (key === 'congelados') {
          if (btnCong) btnCong.classList.add('is-active');
          if (btnResf) btnResf.classList.remove('is-active');
        } else {
          if (btnResf) btnResf.classList.add('is-active');
          if (btnCong) btnCong.classList.remove('is-active');
        }

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

    // 3. Armazenar, Rede, Cidade e UF
    const selArm = document.getElementById('sim-field-armazenar');
    if (selArm) {
      selArm.addEventListener('change', e => { estado.armazenar = sanitize(e.target.value); updateCalculos(); });
    }

    const selEnergia = document.getElementById('sim-field-energia');
    if (selEnergia) {
      selEnergia.addEventListener('change', e => { estado.energia = sanitize(e.target.value); updateCalculos(); });
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

    // 5. Submissão do Formulário com Proteção Anti-Spam e Duplo Envio
    const form = document.getElementById('jd-sim-direto-form');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Honeypot Anti-Spam
        const honey = document.getElementById('sim-honeypot-field');
        if (honey && honey.value.trim() !== '') {
          // Descarte silencioso de bots
          showSucesso();
          return;
        }

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
        if (!inpCidade || inpCidade.value.trim().length < 2) {
          if (inpCidade) {
            inpCidade.classList.add('is-invalid');
            if (!hasError) inpCidade.focus();
          }
          hasError = true;
        }

        if (hasError) return;

        estado.nome = sanitize(nomeInp.value);
        estado.whatsapp = sanitize(waInp.value);
        estado.cidade = sanitize(inpCidade ? inpCidade.value : '');

        const btnSubmit = document.getElementById('sim-btn-submit');
        if (btnSubmit) {
          btnSubmit.disabled = true;
          btnSubmit.textContent = 'Enviando Orçamento...';
        }

        const payload = {
          origem: 'simulador_direto',
          nome: estado.nome,
          whatsapp: estado.whatsapp,
          tipo: estado.tipoNome,
          temperatura: estado.tempText,
          comprimento: estado.comprimento,
          largura: estado.largura,
          altura: estado.altura,
          volume_m3: estado.volume,
          area_m2: estado.area,
          potencia_hp: estado.potenciaHp,
          armazenar: estado.armazenar,
          energia: estado.energia,
          cidade: estado.cidade,
          uf: estado.uf,
          utm_source: sessionStorage.getItem('jd_lead_utm_source') || '',
          utm_medium: sessionStorage.getItem('jd_lead_utm_medium') || '',
          utm_campaign: sessionStorage.getItem('jd_lead_utm_campaign') || '',
          timestamp: new Date().toISOString()
        };

        if (window.dataLayer) {
          window.dataLayer.push({
            event: 'lead_simulador_direto',
            lead_nome: estado.nome,
            lead_whatsapp: estado.whatsapp,
            sim_tipo: estado.tipoNome,
            sim_volume: estado.volume
          });
        }

        const endpoint = window.LEAD_ENDPOINT || '';
        if (endpoint) {
          fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          }).finally(() => showSucesso());
        } else {
          setTimeout(() => showSucesso(), 350);
        }
      });
    }

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

    // Termostato botões superiores
    const btnCong = document.getElementById('btn-temp-cong');
    const btnResf = document.getElementById('btn-temp-resf');

    if (btnCong) {
      btnCong.addEventListener('click', function () {
        const btn = document.querySelector('[data-tipo-btn="congelados"]');
        if (btn) btn.click();
      });
    }

    if (btnResf) {
      btnResf.addEventListener('click', function () {
        const btn = document.querySelector('[data-tipo-btn="resfriados"]');
        if (btn) btn.click();
      });
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
