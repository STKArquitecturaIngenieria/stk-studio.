/*
 * Capa aditiva de integraciones STK Studio.
 * No reemplaza ni redefine funciones del sitio original.
 * Conserva el cotizador, los filtros, los modales, WhatsApp wa.me y mailto.
 */
(() => {
  'use strict';
  const cfg = window.STK_INTEGRATIONS || {};
  const endpoint = cfg.APPS_SCRIPT_WEB_APP_URL || '';
  const $ = id => document.getElementById(id);
  const val = id => ($(id)?.value || '').trim();
  const enabled = () => endpoint && !endpoint.includes('PEGA_AQUI');

  function sendToGoogle(payload) {
    if (!enabled()) {
      console.info('[STK] Integra Google Apps Script para activar registros automáticos.');
      return Promise.resolve(false);
    }
    // text/plain evita el preflight CORS. Apps Script procesa el cuerpo como JSON.
    return fetch(endpoint, {
      method: 'POST', mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    }).then(() => true).catch(err => {
      console.error('[STK] No fue posible enviar el registro a Google:', err);
      return false;
    });
  }

  function addAppointmentFields() {
    const form = $('contact-form');
    if (!form || $('stk-appointment-fields')) return;
    const wrapper = document.createElement('div');
    wrapper.id = 'stk-appointment-fields';
    wrapper.className = 'grid sm:grid-cols-2 gap-5';
    wrapper.innerHTML = `
      <div>
        <label for="stk-date" class="block text-xs font-bold uppercase tracking-wider text-forest-900 mb-2">Fecha preferida de consulta (opcional)</label>
        <input type="date" id="stk-date" class="w-full px-4 py-3.5 rounded-xl bg-stonewarm-50 border border-forest-800/20 text-sm focus:outline-none focus:ring-2 focus:ring-forest-700" />
      </div>
      <div>
        <label for="stk-time" class="block text-xs font-bold uppercase tracking-wider text-forest-900 mb-2">Hora preferida (opcional)</label>
        <input type="time" id="stk-time" class="w-full px-4 py-3.5 rounded-xl bg-stonewarm-50 border border-forest-800/20 text-sm focus:outline-none focus:ring-2 focus:ring-forest-700" />
      </div>
      <div class="sm:col-span-2">
        <label class="flex items-start gap-2 text-xs text-charcoal/75">
          <input type="checkbox" id="stk-consent" class="mt-0.5 accent-forest-800" />
          <span>Autorizo a STK Studio a utilizar estos datos para atender mi solicitud y contactarme sobre este proyecto.</span>
        </label>
      </div>`;
    const message = $('form-message')?.closest('div');
    if (message) message.insertAdjacentElement('afterend', wrapper);
    else form.appendChild(wrapper);
  }

  function formPayload() {
    return {
      action: 'newLead', source: 'contact-form', createdAt: new Date().toISOString(),
      name: val('form-name'), phone: val('form-phone'), email: val('form-email'),
      service: val('form-service'), location: val('form-location'), message: val('form-message'),
      preferredDate: val('stk-date'), preferredTime: val('stk-time'),
      consent: Boolean($('stk-consent')?.checked),
      page: location.href
    };
  }

  function quotePayload() {
    return {
      action: 'newLead', source: 'website-quote', createdAt: new Date().toISOString(),
      service: $('calc-service')?.selectedOptions[0]?.textContent || '',
      property: $('calc-property')?.selectedOptions[0]?.textContent || '',
      areaM2: val('calc-sqm'), totalEstimate: $('calc-total')?.textContent || '',
      summary: $('calc-summary')?.textContent || '',
      extras: [ $('extra-memoria')?.checked ? 'Memoria descriptiva' : '', $('extra-instalaciones')?.checked ? 'Ingenierías' : '' ].filter(Boolean).join(', '),
      page: location.href
    };
  }

  function addMapsShortcut() {
    const locationInput = $('form-location');
    if (!locationInput || $('stk-maps-link')) return;
    const link = document.createElement('a');
    link.id = 'stk-maps-link'; link.target = '_blank'; link.rel = 'noopener noreferrer';
    link.className = 'inline-flex mt-2 text-xs font-semibold text-forest-800 underline';
    link.textContent = 'Consultar ubicación en Google Maps';
    link.href = 'https://www.google.com/maps/search/?api=1&query=';
    locationInput.insertAdjacentElement('afterend', link);
    locationInput.addEventListener('input', () => {
      link.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(locationInput.value);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    addAppointmentFields();
    addMapsShortcut();

    const form = $('contact-form');
    if (form) {
      // Listener adicional: no cancela ni sustituye el manejador original.
      form.addEventListener('submit', event => {
        const data = formPayload();
        if (data.consent) sendToGoogle(data);
        else console.info('[STK] El usuario no autorizó el registro automatizado; se conserva el envío original.');
      });
    }

    ['send-quote-wa', 'send-quote-email'].forEach(id => {
      $(id)?.addEventListener('click', () => sendToGoogle(quotePayload()));
    });

    // Enlace de agenda configurable; el acceso existente a Google Meet permanece intacto.
    const meetLink = document.querySelector('a[href="https://meet.google.com/new"]');
    if (meetLink) meetLink.setAttribute('aria-label', 'Abrir Google Meet para iniciar una videollamada');
  });
})();
