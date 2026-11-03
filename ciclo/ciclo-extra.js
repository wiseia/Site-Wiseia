/* Ciclo, rodada 2: diagrama do Ciclo, revelação das seções novas e fechamento das ampliações novas.
   Aprimoramento progressivo: sem JS, todo o conteúdo aparece estático. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  /* Fechar as ampliações novas (a abertura já é feita pelo ciclo.js via data-open-screen). */
  ['receiving-dialog', 'finance-dialog'].forEach((id) => {
    const dialog = document.getElementById(id);
    if (!dialog) return;
    dialog.querySelector('.dialog-close')?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => {
      document.body.classList.remove('panel-is-open');
      dialog.screenOpener?.focus({ preventScroll: true });
    });
  });

  /* Revelação suave das seções novas ao rolar. */
  const targets = document.querySelectorAll('[data-cx-reveal]');
  if (!reduced.matches && 'IntersectionObserver' in window && targets.length) {
    const io = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      io.unobserve(entry.target);
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    targets.forEach((el) => io.observe(el));
    document.documentElement.classList.add('cx-enhanced');
  }

  /* Diagrama do Ciclo: a bolinha percorre o anel e acende a etapa por onde passa. */
  const cycle = document.querySelector('[data-cycle]');
  if (!cycle || reduced.matches) return;
  const runner = cycle.querySelector('.cycle-runner');
  const steps = [...cycle.querySelectorAll('.cycle-steps li')];
  const period = 16000; // uma volta completa em 16 s
  const slice = 360 / steps.length;
  let start = null, raf = 0, active = -1, offset = 0;

  const frame = (t) => {
    if (start === null) start = t - offset;
    const deg = (((t - start) / period) * 360) % 360;
    runner.style.transform = `rotate(${deg.toFixed(2)}deg)`;
    const idx = Math.floor((deg + slice / 2) / slice) % steps.length;
    if (idx !== active) {
      steps[active]?.classList.remove('is-active');
      steps[idx].classList.add('is-active');
      active = idx;
    }
    raf = requestAnimationFrame(frame);
  };
  const play = () => { if (!raf) { start = null; raf = requestAnimationFrame(frame); } };
  const pause = () => {
    if (!raf) return;
    cancelAnimationFrame(raf);
    raf = 0;
    offset = start === null ? offset : performance.now() - start;
  };

  let inView = !('IntersectionObserver' in window);
  cycle.classList.add('is-animated');
  if (!inView) {
    new IntersectionObserver((entries) => entries.forEach((e) => {
      inView = e.isIntersecting;
      inView ? play() : pause();
    })).observe(cycle);
  } else {
    play();
  }
  document.addEventListener('visibilitychange', () => (document.hidden || !inView ? pause() : play()));
})();

/* Vídeo da retirada no topo: etiquetas do sistema sincronizadas e pausa fora da tela. */
(() => {
  const box = document.querySelector('[data-swap-video]');
  if (!box) return;
  const video = box.querySelector('video');
  const os = box.querySelector('.vtag-os');
  const ok = box.querySelector('.vtag-ok:not(.vtag-in)');
  const inst = box.querySelector('.vtag-in');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { video.pause(); return; }
  video.addEventListener('timeupdate', () => {
    const t = video.currentTime;
    os.classList.toggle('is-on', t > 0.4 && t < 4.2);
    ok.classList.toggle('is-on', t > 9.0 && t < 13.5);
    inst.classList.toggle('is-on', t > 14.5 && t < 16.9);
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) video.play().catch(() => {}); else video.pause();
    })).observe(box);
  }
})();

/* Formulário de demonstração do Ciclo: envio direto pelo Web3Forms, sem abrir o e-mail do visitante. */
(() => {
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;
  const status = form.querySelector('[data-form-status]');
  const say = (t) => { if (status) status.textContent = t; };
  form.addEventListener('input', (e) => e.target.removeAttribute('aria-invalid'));
  document.querySelectorAll('a[href="#contato"]').forEach((a) => a.addEventListener('click', () => {
    setTimeout(() => form.elements.nome.focus({ preventScroll: true }), 650);
  }));
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let firstInvalid = null;
    for (const f of form.querySelectorAll('[required]')) {
      const ok = f.value.trim() !== '' && f.checkValidity();
      f.setAttribute('aria-invalid', String(!ok));
      if (!ok && !firstInvalid) firstInvalid = f;
    }
    if (firstInvalid) { say('Preencha nome e um e-mail válido.'); firstInvalid.focus(); return; }
    const d = new FormData(form);
    const get = (k) => String(d.get(k) || '').trim();
    if (d.get('botcheck')) return;
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true; say('Enviando…');
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: form.dataset.key,
          subject: `Demonstração WISEIA Ciclo — ${get('empresa') || get('nome')}`,
          from_name: 'Site WISEIA · Ciclo',
          replyto: get('email'),
          Nome: get('nome'), Empresa: get('empresa') || '-', 'E-mail': get('email'),
          Telefone: get('telefone') || '-', Interesse: 'WISEIA Ciclo', 'Operação': get('mensagem') || '-',
        }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || out.success === false) throw new Error(out.message || res.status);
      form.reset(); say('Mensagem enviada! Retornaremos em breve.');
    } catch (err) {
      say('Não foi possível enviar agora. Escreva para contato@wiseia.com.br ou tente de novo em instantes.');
    } finally { button.disabled = false; }
  });
})();
