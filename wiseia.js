/* WISEIA home. Progressive enhancement only: the page is complete without JS. */
(() => {
  'use strict';
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Entrada do hero e revelação das seções ao rolar. */
  const Reveal = {
    init() {
      if (reducedMotion) return;
      root.classList.add('motion-ready');
      const targets = document.querySelectorAll('[data-reveal]');
      if (!('IntersectionObserver' in window) || !targets.length) return;
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
      targets.forEach((el) => io.observe(el));
      root.classList.add('reveal-ready');
    },
  };

  /* Leve deslocamento dos cartões do hero acompanhando o cursor (como no Ciclo). */
  const Parallax = {
    init() {
      const area = document.querySelector('[data-parallax]');
      if (!area || reducedMotion || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
      const target = area.querySelector('.paths');
      area.addEventListener('pointermove', (e) => {
        const r = area.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width - 0.5) * 10;
        const y = ((e.clientY - r.top) / r.height - 0.5) * 8;
        target.style.setProperty('--cursor-x', `${x.toFixed(1)}px`);
        target.style.setProperty('--cursor-y', `${y.toFixed(1)}px`);
      });
      area.addEventListener('pointerleave', () => {
        target.style.setProperty('--cursor-x', '0px');
        target.style.setProperty('--cursor-y', '0px');
      });
    },
  };

  /* Formulário: abre o app de e-mail com a mensagem pronta (sem backend).
     Troque submit() por um fetch() quando houver uma API. */
  const ContactForm = {
    init() {
      this.form = document.querySelector('[data-contact-form]');
      if (!this.form) return;
      this.status = this.form.querySelector('[data-form-status]');
      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (this.validate()) this.submit();
      });
      this.form.addEventListener('input', (e) => e.target.removeAttribute('aria-invalid'));

      // Botões "Solicitar demonstração" levam ao formulário e focam o primeiro campo.
      document.querySelectorAll('a[href="#contato"][data-interest]').forEach((a) => {
        a.addEventListener('click', () => {
          setTimeout(() => this.form.elements.nome.focus({ preventScroll: true }), reducedMotion ? 0 : 600);
        });
      });
    },

    validate() {
      let firstInvalid = null;
      for (const field of this.form.querySelectorAll('[required]')) {
        const ok = field.value.trim() !== '' && field.checkValidity();
        field.setAttribute('aria-invalid', String(!ok));
        if (!ok && !firstInvalid) firstInvalid = field;
      }
      if (firstInvalid) {
        this.say('Preencha nome e um e-mail válido.');
        firstInvalid.focus();
        return false;
      }
      return true;
    },

    async submit() {
      const data = new FormData(this.form);
      const get = (k) => String(data.get(k) || '').trim();
      if (data.get('botcheck')) return; // robô preencheu o campo escondido
      const button = this.form.querySelector('button[type="submit"]');
      const subject = `Demonstração ${get('interesse')} — ${get('empresa') || get('nome')}`;
      const payload = {
        access_key: this.form.dataset.key,
        subject,
        from_name: 'Site WISEIA',
        replyto: get('email'),
        Nome: get('nome'),
        Empresa: get('empresa') || '-',
        'E-mail': get('email'),
        Interesse: get('interesse'),
        Mensagem: get('mensagem') || '-',
      };
      button.disabled = true;
      this.say('Enviando…');
      try {
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload),
        });
        const out = await res.json().catch(() => ({}));
        if (!res.ok || out.success === false) throw new Error(out.message || res.status);
        this.form.reset();
        this.form.classList.add('is-sent');
        this.say('Mensagem enviada! Retornaremos em breve.');
      } catch (err) {
        this.say('Não foi possível enviar agora. Escreva para contato@wiseia.com.br ou tente de novo em instantes.');
      } finally {
        button.disabled = false;
      }
    },

    say(text) {
      if (this.status) this.status.textContent = text;
    },
  };

  /* Vídeo do hero: parado para quem prefere menos movimento. */
  const HeroVideo = {
    init() {
      const video = document.querySelector('[data-hero-video]');
      if (video && reducedMotion) {
        video.removeAttribute('autoplay');
        video.pause();
      }
    },
  };

  const Year = {
    init() {
      const y = String(new Date().getFullYear());
      document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = y; });
    },
  };

  const boot = () => {
    Reveal.init();
    Parallax.init();
    HeroVideo.init();
    ContactForm.init();
    Year.init();
  };

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', boot, { once: true })
    : boot();
})();
