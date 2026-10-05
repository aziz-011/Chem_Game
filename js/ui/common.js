// Shared UI helpers: DOM building, formula formatting, Bohr models and a
// tiny SVG 3D molecule viewer.
(function (root) {
  'use strict';
  var SVGNS = 'http://www.w3.org/2000/svg';

  function h(tag, attrs, children) {
    var el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'class') el.className = v;
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'text') el.textContent = v;
        else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
        else if (k === 'style' && typeof v === 'object') {
          Object.keys(v).forEach(function (sk) {
            if (sk.slice(0, 2) === '--') el.style.setProperty(sk, v[sk]);
            else el.style[sk] = v[sk];
          });
        }
        else el.setAttribute(k, v === true ? '' : v);
      });
    }
    [].concat(children || []).forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
    });
    return el;
  }

  function svg(tag, attrs) {
    var el = document.createElementNS(SVGNS, tag);
    Object.keys(attrs || {}).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    return el;
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // "Ca(OH)2" → "Ca(OH)<sub>2</sub>". Leading numbers (coefficients) and the
  // number after a hydrate dot stay full size.
  function formula(text) {
    return esc(text).replace(/([A-Za-z)\]])(\d+)/g, '$1<sub>$2</sub>').replace(/[*.](?=\d*[A-Z])/g, '·');
  }

  function fmt(n, digits) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    if (digits === undefined) digits = 2;
    return Number(n).toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: 0 });
  }

  var CATEGORIES = [
    { key: 'alkali', label: 'Alkali metals', test: /alkali metal/ },
    { key: 'alkaline', label: 'Alkaline earth metals', test: /alkaline earth/ },
    { key: 'transition', label: 'Transition metals', test: /(^|[^-])transition metal/ },
    { key: 'post', label: 'Post-transition metals', test: /post-transition/ },
    { key: 'metalloid', label: 'Metalloids', test: /metalloid/ },
    { key: 'nonmetal', label: 'Nonmetals', test: /nonmetal/ },
    { key: 'noble', label: 'Noble gases', test: /noble gas/ },
    { key: 'lanthanide', label: 'Lanthanides', test: /lanthanide/ },
    { key: 'actinide', label: 'Actinides', test: /actinide/ }
  ];

  function category(el) {
    // Element 113+ are "unknown, probably …": use the predicted family.
    for (var i = 0; i < CATEGORIES.length; i++) {
      if (CATEGORIES[i].test.test(el.category)) return CATEGORIES[i];
    }
    return { key: 'unknown', label: 'Unknown' };
  }

  function neutrons(el) { return Math.round(el.mass) - el.number; }

  function kelvinToC(k) { return k === null || k === undefined ? null : k - 273.15; }

  // Animated Bohr model: nucleus plus electrons on circular shells.
  function bohr(el, size) {
    size = size || 220;
    var c = size / 2;
    var shells = el.shells || [];
    var nucleusR = Math.max(14, size * 0.08);
    var step = (c - nucleusR - 8) / Math.max(shells.length, 1);
    var s = svg('svg', { viewBox: '0 0 ' + size + ' ' + size, width: size, height: size, class: 'bohr', role: 'img',
      'aria-label': 'Bohr model of ' + el.name + ': shells ' + shells.join(', ') });
    shells.forEach(function (count, i) {
      var r = nucleusR + step * (i + 1);
      s.appendChild(svg('circle', { class: 'shell', cx: c, cy: c, r: r }));
      var g = svg('g', { class: 'orbit' });
      g.style.animationDuration = (6 + i * 4) + 's';
      if (i % 2) g.style.animationDirection = 'reverse';
      for (var k = 0; k < count; k++) {
        var a = (2 * Math.PI * k) / count;
        g.appendChild(svg('circle', { class: 'electron', cx: c + r * Math.cos(a), cy: c + r * Math.sin(a), r: Math.max(2, Math.min(4, size / 60)) }));
      }
      s.appendChild(g);
    });
    s.appendChild(svg('circle', { class: 'nucleus', cx: c, cy: c, r: nucleusR }));
    var t = svg('text', { class: 'nucleus-text', x: c, y: c });
    t.textContent = el.symbol;
    s.appendChild(t);
    return s;
  }

  function atomColor(sym) {
    var e = root.Chem.bySymbol[sym];
    var hex = e && e.color ? '#' + e.color : '#ff69b4';
    return hex;
  }

  function textOn(hex) {
    var n = parseInt(hex.slice(1), 16);
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? '#1c2233' : '#ffffff';
  }

  var RADIUS = { H: 0.28, C: 0.4, N: 0.4, O: 0.4, Cl: 0.5, Na: 0.42 };

  // Draggable 3D ball-and-stick viewer rendered in SVG.
  function viewer3d(mol) {
    var W = 400, H = 300;
    var s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'viewer', role: 'img', 'aria-label': '3D model of ' + mol.name });
    var defs = svg('defs');
    var used = {};
    mol.atoms.forEach(function (a) { used[a[0]] = true; });
    Object.keys(used).forEach(function (sym) {
      var grad = svg('radialGradient', { id: 'g3d-' + sym, cx: '35%', cy: '35%', r: '65%' });
      grad.appendChild(svg('stop', { offset: '0%', 'stop-color': '#ffffff', 'stop-opacity': '.9' }));
      grad.appendChild(svg('stop', { offset: '35%', 'stop-color': atomColor(sym) }));
      grad.appendChild(svg('stop', { offset: '100%', 'stop-color': shade(atomColor(sym), -0.45) }));
      defs.appendChild(grad);
    });
    s.appendChild(defs);
    var scene = svg('g');
    s.appendChild(scene);

    var maxR = 0;
    mol.atoms.forEach(function (a) { maxR = Math.max(maxR, Math.hypot(a[1], a[2], a[3])); });
    var scale = Math.min(W, H) * 0.38 / Math.max(maxR + 0.4, 1);
    var yaw = 0.6, pitch = -0.35, auto = true, dragging = null, raf = null;

    function project(p) {
      var x = p[1], y = p[2], z = p[3];
      var cy = Math.cos(yaw), sy = Math.sin(yaw);
      var x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
      var cp = Math.cos(pitch), sp = Math.sin(pitch);
      var y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
      var persp = 1 + z2 * 0.06;
      return { x: W / 2 + x1 * scale * persp, y: H / 2 - y2 * scale * persp, z: z2, k: persp };
    }

    function draw() {
      while (scene.firstChild) scene.removeChild(scene.firstChild);
      var pts = mol.atoms.map(project);
      var items = [];
      mol.bonds.forEach(function (b) {
        var p = pts[b[0]], q = pts[b[1]];
        items.push({ z: (p.z + q.z) / 2 - 0.05, draw: function () { drawBond(p, q, b[2]); } });
      });
      mol.atoms.forEach(function (a, i) {
        var p = pts[i];
        items.push({ z: p.z, draw: function () {
          var r = (RADIUS[a[0]] || 0.42) * scale * 0.9 * p.k;
          scene.appendChild(svg('circle', { cx: p.x, cy: p.y, r: r, fill: 'url(#g3d-' + a[0] + ')', stroke: 'rgba(0,0,0,.35)', 'stroke-width': 1 }));
          if (r > 11) {
            var t = svg('text', { x: p.x, y: p.y, 'text-anchor': 'middle', 'dominant-baseline': 'central',
              'font-size': Math.min(14, r * 0.8), 'font-weight': 700, fill: textOn(atomColor(a[0])), 'pointer-events': 'none' });
            t.textContent = a[0];
            scene.appendChild(t);
          }
        } });
      });
      items.sort(function (a, b) { return a.z - b.z; }).forEach(function (it) { it.draw(); });
    }

    function drawBond(p, q, order) {
      var dx = q.x - p.x, dy = q.y - p.y, len = Math.hypot(dx, dy) || 1;
      var nx = -dy / len, ny = dx / len;
      var offsets = order === 2 ? [-3.5, 3.5] : order === 3 ? [-5, 0, 5] : [0];
      offsets.forEach(function (o) {
        scene.appendChild(svg('line', {
          x1: p.x + nx * o, y1: p.y + ny * o, x2: q.x + nx * o, y2: q.y + ny * o,
          stroke: order === 0 ? '#8a93a8' : '#9aa1b2', 'stroke-width': order === 0 ? 2 : (order > 1 ? 3 : 6),
          'stroke-linecap': 'round', 'stroke-dasharray': order === 0 ? '4 4' : null
        }));
      });
    }

    var reduced = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function loop() {
      if (!s.isConnected) { raf = null; return; }
      if (auto && !reduced) { yaw += 0.008; draw(); }
      raf = requestAnimationFrame(loop);
    }

    s.addEventListener('pointerdown', function (e) {
      dragging = { x: e.clientX, y: e.clientY }; auto = false;
      if (s.setPointerCapture) s.setPointerCapture(e.pointerId);
    });
    s.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      yaw += (e.clientX - dragging.x) * 0.01;
      pitch = Math.max(-1.5, Math.min(1.5, pitch + (e.clientY - dragging.y) * 0.01));
      dragging = { x: e.clientX, y: e.clientY };
      draw();
    });
    function stop() { dragging = null; }
    s.addEventListener('pointerup', stop);
    s.addEventListener('pointercancel', stop);
    s.addEventListener('dblclick', function () { auto = !auto; });

    draw();
    setTimeout(function () { if (!raf) raf = requestAnimationFrame(loop); }, 0);
    return s;
  }

  function shade(hex, amt) {
    var n = parseInt(hex.slice(1), 16);
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    function f(c) { return Math.round(Math.max(0, Math.min(255, amt < 0 ? c * (1 + amt) : c + (255 - c) * amt))); }
    return 'rgb(' + f(r) + ',' + f(g) + ',' + f(b) + ')';
  }

  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('chemlab:' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('chemlab:' + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
  };

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  root.UI = {
    h: h, svg: svg, esc: esc, formula: formula, fmt: fmt, category: category, CATEGORIES: CATEGORIES,
    neutrons: neutrons, kelvinToC: kelvinToC, bohr: bohr, atomColor: atomColor, textOn: textOn,
    viewer3d: viewer3d, store: store, shuffle: shuffle, pick: pick, views: {}
  };
})(this);
