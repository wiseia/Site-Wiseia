/* WISEIA Med. Melhoria progressiva: a página funciona sem JS (acordeões são <details>). */
(() => {
  'use strict';
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Entrada do topo e revelação das seções ao rolar (igual à home). */
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
      }, { rootMargin: '0px 0px 15% 0px', threshold: 0 });
      targets.forEach((el) => io.observe(el));
      root.classList.add('reveal-ready');
    },
  };

  /* Links para um acordeão (#comparar, #tudo) abrem o acordeão. */
  const OpenDetails = {
    init() {
      const open = (hash) => {
        const el = hash && document.getElementById(hash.slice(1));
        if (el && el.tagName === 'DETAILS') el.open = true;
      };
      open(location.hash);
      window.addEventListener('hashchange', () => open(location.hash));
      document.querySelectorAll('a[href^="#"]').forEach((a) => {
        a.addEventListener('click', () => open(a.getAttribute('href')));
      });
    },
  };

  /* Formulário "Quero entrar": envio pelo Web3Forms ao e-mail da WISEIA
     (até existir a rota de leads no Superuser). Guarda o ?ref= da indicação. */
  const LeadForm = {
    init() {
      this.box = document.querySelector('[data-lead]');
      if (!this.box) return;
      this.form = this.box.querySelector('form');
      this.status = this.form.querySelector('[data-form-status]');
      this.pick = this.form.querySelector('.plan-pick');

      const ref = new URLSearchParams(location.search).get('ref');
      if (ref) {
        const clean = ref.replace(/[^\w-]/g, '').slice(0, 40);
        this.form.elements.indicacao.value = clean;
        try { sessionStorage.setItem('wiseia-med-ref', clean); } catch (e) { /* sem storage */ }
      } else {
        try { this.form.elements.indicacao.value = sessionStorage.getItem('wiseia-med-ref') || ''; } catch (e) { /* sem storage */ }
      }

      // Botões dos planos já marcam o plano no formulário.
      document.querySelectorAll('[data-plan]').forEach((a) => {
        a.addEventListener('click', () => {
          const radio = this.form.querySelector(`input[name="plano"][value="${a.dataset.plan}"]`);
          if (radio) radio.checked = true;
          this.pick.removeAttribute('aria-invalid');
          setTimeout(() => this.form.elements.nome.focus({ preventScroll: true }), reducedMotion ? 0 : 600);
        });
      });

      // Selo "Teste grátis": rola até o formulário e foca o Nome.
      document.querySelectorAll('[data-focus-nome]').forEach((a) => {
        a.addEventListener('click', () => {
          setTimeout(() => this.form.elements.nome.focus({ preventScroll: true }), reducedMotion ? 0 : 600);
        });
      });

      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (this.validate()) this.submit();
      });
      this.form.addEventListener('input', (e) => {
        e.target.removeAttribute('aria-invalid');
        if (e.target.name === 'plano') this.pick.removeAttribute('aria-invalid');
      });
      this.form.addEventListener('change', (e) => e.target.removeAttribute('aria-invalid'));
    },

    validate() {
      const f = this.form.elements;
      const checks = [
        [f.nome, f.nome.value.trim().length >= 3],
        [f.crm, /\d{3,}/.test(f.crm.value)],
        [f.uf, f.uf.value !== ''],
        [f.whatsapp, f.whatsapp.value.replace(/\D/g, '').length >= 10],
        [f.email, f.email.value.trim() !== '' && f.email.checkValidity()],
        [this.pick, !!this.form.querySelector('input[name="plano"]:checked')],
        [f.aceite, f.aceite.checked],
      ];
      let first = null;
      checks.forEach(([el, ok]) => {
        el.setAttribute('aria-invalid', String(!ok));
        if (!ok && !first) first = el;
      });
      if (!first) return true;
      this.say(first === f.aceite
        ? 'Para continuar, aceite a Política de Privacidade.'
        : 'Confira os campos destacados.', true);
      (first === this.pick ? this.pick.querySelector('input') : first).focus();
      return false;
    },

    async submit() {
      const data = new FormData(this.form);
      if (data.get('botcheck')) return; // robô preencheu o campo escondido
      const get = (k) => String(data.get(k) || '').trim();
      const button = this.form.querySelector('button[type="submit"]');
      const payload = {
        access_key: this.form.dataset.key,
        subject: `WISEIA Med — Turma de fundadores — ${get('nome')}`,
        from_name: 'Site WISEIA Med',
        replyto: get('email'),
        Nome: get('nome'),
        CRM: `${get('crm')}/${get('uf')}`,
        WhatsApp: get('whatsapp'),
        'E-mail': get('email'),
        Plano: get('plano'),
        'Código de indicação': get('indicacao') || '-',
        'Aceite da Política de Privacidade': `sim, ${new Date().toLocaleString('pt-BR')}`,
        Origem: location.href,
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
        this.box.classList.add('is-sent');
        const done = this.box.querySelector('.form-done');
        done.focus();
      } catch (err) {
        this.say('Não foi possível enviar agora. Tente de novo em instantes ou escreva para contato@wiseia.com.br.', true);
      } finally {
        button.disabled = false;
      }
    },

    say(text, error = false) {
      if (!this.status) return;
      this.status.textContent = text;
      this.status.classList.toggle('is-error', error);
    },
  };

  /* Lista de espera dos planos ("Em breve"): Web3Forms, mesma chave do formulário principal. */
  const Waitlist = {
    init() {
      this.box = document.querySelector('[data-waitlist]');
      if (!this.box) return;
      this.form = this.box.querySelector('form');
      this.status = this.form.querySelector('[data-form-status]');
      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (this.validate()) this.submit();
      });
      this.form.addEventListener('input', (e) => e.target.removeAttribute('aria-invalid'));
      this.form.addEventListener('change', (e) => e.target.removeAttribute('aria-invalid'));
    },
    validate() {
      const f = this.form.elements;
      const checks = [
        [f.nome, f.nome.value.trim().length >= 3],
        [f.email, f.email.value.trim() !== '' && f.email.checkValidity()],
        [f.celular, f.celular.value.replace(/\D/g, '').length >= 10],
        [f.especialidade, f.especialidade.value.trim().length >= 3],
        [f.aceite, f.aceite.checked],
      ];
      let first = null;
      checks.forEach(([el, ok]) => {
        el.setAttribute('aria-invalid', String(!ok));
        if (!ok && !first) first = el;
      });
      if (!first) return true;
      this.say(first === f.aceite ? 'Para continuar, aceite a Política de Privacidade.' : 'Confira os campos destacados.', true);
      first.focus();
      return false;
    },
    async submit() {
      const data = new FormData(this.form);
      if (data.get('botcheck')) return;
      const get = (k) => String(data.get(k) || '').trim();
      const button = this.form.querySelector('button[type="submit"]');
      const payload = {
        access_key: this.form.dataset.key,
        subject: `WISEIA Med — Lista de espera — ${get('nome')}`,
        from_name: 'Site WISEIA Med',
        replyto: get('email'),
        Nome: get('nome'),
        'E-mail': get('email'),
        Celular: get('celular'),
        Especialidade: get('especialidade'),
        'Aceite da Política de Privacidade': `sim, ${new Date().toLocaleString('pt-BR')}`,
        Origem: location.href,
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
        this.box.classList.add('is-sent');
        this.box.querySelector('.form-done').focus();
      } catch (err) {
        this.say('Não foi possível enviar agora. Tente de novo em instantes ou escreva para contato@wiseia.com.br.', true);
      } finally {
        button.disabled = false;
      }
    },
    say(text, error = false) {
      this.status.textContent = text;
      this.status.classList.toggle('is-error', error);
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
    OpenDetails.init();
    LeadForm.init();
    Waitlist.init();
    Year.init();
  };

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', boot, { once: true })
    : boot();
})();
