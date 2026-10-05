// App bootstrap: hash routing between views and the light/dark toggle.
(function (root) {
  'use strict';
  var UI = root.UI;
  var VIEWS = ['table', 'compare', 'molecules', 'naming', 'reactions'];

  function route() {
    var name = location.hash.replace('#', '') || 'table';
    if (VIEWS.indexOf(name) < 0) name = 'table';
    VIEWS.forEach(function (v) {
      document.getElementById('view-' + v).classList.toggle('active', v === name);
    });
    document.querySelectorAll('.tab').forEach(function (t) {
      if (t.dataset.view === name) {
        t.setAttribute('aria-current', 'page');
        if (t.scrollIntoView) t.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
      else t.removeAttribute('aria-current');
    });
  }

  function initTheme() {
    var saved = UI.store.get('theme', null);
    if (saved) document.documentElement.setAttribute('data-theme', saved);
    document.getElementById('theme-btn').addEventListener('click', function () {
      var current = document.documentElement.getAttribute('data-theme') ||
        (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      var next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      UI.store.set('theme', next);
    });
  }

  initTheme();
  VIEWS.forEach(function (v) { UI.views[v].init(); });
  window.addEventListener('hashchange', function () { route(); window.scrollTo(0, 0); });
  route();
})(this);
