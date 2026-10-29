/* Spectra catalog: routing between Overview (the page in a borderless frame) and Components
   (specimens over the page's live ground). The header keeps the page's own two states. */
(function () {
  var COMPONENTS_ENABLED = true;   /* Overview approved (orchestrated run) */
  var body = document.body, nav = document.getElementById('ds-nav'), frame = document.getElementById('overview-frame');
  var linkO = document.getElementById('nav-overview'), linkC = document.getElementById('nav-components');
  var view = document.getElementById('view-components'), main = document.getElementById('ds-main'), side = document.getElementById('ds-side');
  var win = document.getElementById('ds-window');
  var isComp = function (h) { return h === '#components' || h.indexOf('#components-') === 0; };
  var mode = 'overview', pageY = 0;
  if (!COMPONENTS_ENABLED) linkC.setAttribute('aria-disabled', 'true');

  function send(m) { try { frame.contentWindow.postMessage(m, '*'); } catch (e) {} }

  /* the page's header script: scrollY > 20 → bg-black/95 backdrop-blur-xl border-b border-white/10,
     otherwise mix-blend-difference. Components always shows the scrolled state. */
  var SCROLLED = ['bg-black/95', 'backdrop-blur-xl', 'border-b', 'border-white/10'];
  function headerState() {
    var stuck = mode === 'components' || pageY > 20;
    SCROLLED.forEach(function (c) { nav.classList.toggle(c, stuck); });
    nav.classList.toggle('mix-blend-difference', !stuck);
  }
  function setNavH() { document.documentElement.style.setProperty('--ds-nav-h', nav.offsetHeight + 'px'); }

  function post() { send({ ds: mode === 'components' ? 'bg' : 'page' }); }
  function route() {
    var h = location.hash;
    if (isComp(h) && !COMPONENTS_ENABLED) { history.replaceState(null, '', location.pathname + location.search); h = ''; }
    mode = isComp(h) ? 'components' : 'overview';
    body.classList.toggle('is-components', mode === 'components');
    linkO.classList.toggle('is-active', mode === 'overview');
    linkC.classList.toggle('is-active', mode === 'components');
    headerState();
    setNavH();
    post();
    if (mode === 'components') {
      if (h === '#components') main.scrollTop = 0;
      else { var el = document.getElementById(h.slice(1)); if (el) main.scrollTop = el.offsetTop - 24; }
    }
    spy();
  }
  addEventListener('message', function (e) {
    if (e.source !== frame.contentWindow || !e.data) return;
    if (e.data.ds === 'ready') { body.classList.add('ds-overview-ready'); return; }
    if (e.data.ds === 'scroll') { pageY = e.data.y; if (mode === 'overview') headerState(); }
  });
  frame.addEventListener('load', post);
  addEventListener('resize', function () { setNavH(); spy(); }, { passive: true });

  /* the Backgrounds window: the scrim gets an even-odd hole exactly over it, so the live ground
     shows at full strength there while every label keeps its dark backing */
  function hole() {
    if (!win || mode !== 'components') { view.style.removeProperty('--ds-hole'); return; }
    var r = win.getBoundingClientRect(), W = innerWidth, H = innerHeight;
    if (r.bottom < 0 || r.top > H) { view.style.removeProperty('--ds-hole'); return; }
    var x = r.left, y = r.top, w = r.width, h = r.height, k = Math.min(24, w / 2, h / 2);
    var p = 'M0 0H' + W + 'V' + H + 'H0Z M' + (x + k) + ' ' + y + 'H' + (x + w - k) + 'A' + k + ' ' + k + ' 0 0 1 ' + (x + w) + ' ' + (y + k) +
      'V' + (y + h - k) + 'A' + k + ' ' + k + ' 0 0 1 ' + (x + w - k) + ' ' + (y + h) + 'H' + (x + k) + 'A' + k + ' ' + k + ' 0 0 1 ' + x + ' ' + (y + h - k) +
      'V' + (y + k) + 'A' + k + ' ' + k + ' 0 0 1 ' + (x + k) + ' ' + y + 'Z';
    view.style.setProperty('--ds-hole', 'path(evenodd, "' + p + '")');
  }

  /* sidebar follows the scroll */
  var groups = [].slice.call(main.querySelectorAll('.ds-group'));
  var sideLinks = [].slice.call(side.querySelectorAll('a'));
  var queued = false;
  function spy() {
    hole();
    if (!groups.length) return;
    var y = main.scrollTop + 160, cur = groups[0];
    groups.forEach(function (g) { if (g.offsetTop <= y) cur = g; });
    sideLinks.forEach(function (a) {
      var on = a.getAttribute('href') === '#' + cur.id;
      if (on && !a.classList.contains('is-current') && innerWidth < 768) side.scrollLeft = a.offsetLeft - 16;
      a.classList.toggle('is-current', on);
    });
  }
  main.addEventListener('scroll', function () {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; spy(); });
  }, { passive: true });

  /* sidebar links scroll the view without leaving a history entry per group */
  side.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#components-"]');
    if (!a) return;
    e.preventDefault();
    history.replaceState(null, '', a.getAttribute('href'));
    route();
  });

  /* the logo returns to Overview; the header's Account / Pre-order stay decorative */
  var logo = nav.querySelector('[role="button"]');
  if (logo) { logo.classList.add('ds-logo'); logo.addEventListener('click', function () { if (location.hash !== '#overview') location.hash = '#overview'; else send({ ds: 'top' }); }); }
  nav.addEventListener('click', function (e) { if (e.target.closest('.ds-inert a')) e.preventDefault(); });

  /* specimens stay put: links and form submits never navigate */
  main.addEventListener('click', function (e) { if (e.target.closest('a')) e.preventDefault(); }, true);
  main.addEventListener('submit', function (e) { e.preventDefault(); }, true);

  addEventListener('hashchange', route);
  route();
})();
