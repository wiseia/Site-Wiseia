const panelDialog = document.querySelector('#panel-dialog');
let panelOpener;

// Each capture retains its own title, image and keyboard focus destination.
document.querySelectorAll('[data-open-screen]').forEach(control => {
  const dialog = document.getElementById(control.getAttribute('aria-controls'));
  control.addEventListener('click', event => {
    if (!dialog || typeof dialog.showModal !== 'function') return;
    event.preventDefault();
    dialog.screenOpener = control;
    dialog.showModal();
    document.body.classList.add('panel-is-open');
  });
});
const assetsDialog = document.querySelector('#assets-dialog');
assetsDialog.querySelector('.dialog-close').addEventListener('click', () => assetsDialog.close());
assetsDialog.addEventListener('close', () => {
  document.body.classList.remove('panel-is-open');
  assetsDialog.screenOpener?.focus({preventScroll: true});
});
document.querySelectorAll('[data-open-panel]').forEach(control => {
  control.addEventListener('click', event => {
    if (typeof panelDialog.showModal !== 'function') return;
    event.preventDefault();
    panelOpener = control;
    panelDialog.showModal();
    document.body.classList.add('panel-is-open');
  });
});
document.querySelector('.dialog-close').addEventListener('click', () => panelDialog.close());
panelDialog.addEventListener('close', () => {
  document.body.classList.remove('panel-is-open');
  panelOpener?.focus({preventScroll: true});
});

// One short, illustrative sequence. No live regions or simulated product actions.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mouse = matchMedia('(min-width: 901px) and (hover: hover) and (pointer: fine)');
  const visual = document.querySelector('.visual');
  const card = document.querySelector('.hermes-card');
  const scene = document.querySelector('.product-scene');
  let observer;
  function finish() {
    observer?.disconnect();
    document.documentElement.classList.remove('motion-ready');
    visual.classList.remove('demo-ready', 'demo-started');
    scene.style.removeProperty('--cursor-x');
    scene.style.removeProperty('--cursor-y');
  }
  if (!reduced.matches && 'IntersectionObserver' in window) {
    observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        visual.classList.add('demo-started');
        observer.disconnect();
      }
    }, {threshold: 0.25});
    // Observe the reserved slot; hidden messages never collapse its dimensions.
    observer.observe(card);
    visual.classList.add('demo-ready');
    document.documentElement.classList.add('motion-ready');
  }
  visual.addEventListener('pointermove', event => {
    if (reduced.matches || !mouse.matches || event.pointerType !== 'mouse') return;
    const rect = visual.getBoundingClientRect();
    const clamp = value => Math.max(-4, Math.min(4, value));
    scene.style.setProperty('--cursor-x', `${clamp(((event.clientX - rect.left) / rect.width - 0.5) * 8)}px`);
    scene.style.setProperty('--cursor-y', `${clamp(((event.clientY - rect.top) / rect.height - 0.5) * 8)}px`);
  });
  function resetCursor() {
    scene.style.removeProperty('--cursor-x');
    scene.style.removeProperty('--cursor-y');
  }
  visual.addEventListener('pointerleave', resetCursor);
  mouse.addEventListener('change', resetCursor);
  reduced.addEventListener('change', event => { if (event.matches) finish(); });
})();

// Reveal once, with a fully visible fallback when scripts or motion are disabled.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const section = document.querySelector('.operation');
  const targets = [...section.querySelectorAll('[data-operation-reveal]')];
  let observer;
  if (!reduced.matches && 'IntersectionObserver' in window) {
    observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }), {threshold: 0.08});
    targets.forEach(target => observer.observe(target));
    section.classList.add('operation-enhanced');
  }
  reduced.addEventListener('change', event => {
    if (event.matches) {
      observer?.disconnect();
      section.classList.remove('operation-enhanced');
    }
  });
})();

// Agent example: whole messages, one viewport-triggered run, explicit replay only.
// Native animations preserve every message's layout slot and accessible text.
(() => {
  const demo = document.querySelector('.agent-demo');
  const replay = demo.querySelector('.agent-replay');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const turns = [...demo.querySelectorAll('.agent-turn')];
  const thinking = [...demo.querySelectorAll('.agent-thinking')];
  let observer;
  let animations = [];
  let run = 0;
  function finish() {
    run += 1;
    animations.forEach(animation => animation.cancel());
    animations = [];
    demo.dataset.state = 'complete';
  }
  function play() {
    observer?.disconnect();
    finish();
    if (reduced.matches || typeof demo.animate !== 'function') return;
    demo.dataset.state = 'playing';
    const currentRun = run;
    const delays = [0, 1800, 4800, 6500];
    turns.forEach((turn, index) => {
      animations.push(turn.animate([
        {opacity: 0, transform: 'translateY(8px)'},
        {opacity: 1, transform: 'translateY(0)'}
      ], {duration: 450, delay: delays[index], easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both'}));
    });
    thinking.forEach((indicator, index) => {
      animations.push(indicator.animate([
        {opacity: 0}, {opacity: 1, offset: 0.15},
        {opacity: 1, offset: 0.8}, {opacity: 0}
      ], {duration: index === 0 ? 850 : 600, delay: index === 0 ? 950 : 5900, fill: 'both'}));
    });
    Promise.all(animations.map(animation => animation.finished)).then(() => {
      if (run === currentRun) demo.dataset.state = 'complete';
    }).catch(() => {}); // Cancellation on replay or reduced motion is intentional.
  }
  if (typeof demo.animate === 'function') {
    replay.hidden = false;
    replay.addEventListener('click', play);
    if (!reduced.matches && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) play();
      }, {threshold: 0.15});
      observer.observe(demo);
    }
  }
  reduced.addEventListener('change', event => {
    if (event.matches) {
      observer?.disconnect();
      finish();
    }
  });
})();

// VOG reuses data-open-screen, the native dialog and its original-image fallback.
(() => {
  const dialog = document.querySelector('#vog-dialog');
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    document.body.classList.remove('panel-is-open');
    dialog.screenOpener?.focus({preventScroll: true});
  });
  const section = document.querySelector('.vog-section');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let observer;
  if (!reduced.matches && 'IntersectionObserver' in window) {
    observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }), {threshold: 0.08});
    section.querySelectorAll('[data-vog-reveal]').forEach(target => observer.observe(target));
    section.classList.add('vog-enhanced');
  }
  reduced.addEventListener('change', event => {
    if (event.matches) {
      observer?.disconnect();
      section.classList.remove('vog-enhanced');
    }
  });
})();
