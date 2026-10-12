// jerry-ui: renders Jerry's panel and checklists inside a Claude widget.
// Reads JSON from <div id="jerry" data-j="..."> - no data lives in this file.
(function () {
  var root = document.getElementById('jerry');
  if (!root) return;
  var j = JSON.parse(root.getAttribute('data-j') || '{}');
  var css = document.createElement('style');
  css.textContent =
    '#jerry{direction:rtl;padding:.4rem 0}' +
    '.jc{background:var(--surface-1);border-radius:12px;padding:1rem 1.25rem;cursor:pointer;border:.5px solid var(--border)}' +
    '.jc:hover{border-color:var(--border-strong)}' +
    '.jw{background:var(--bg-warning);border-color:var(--border-warning);margin-bottom:12px;display:flex;align-items:center;gap:14px}' +
    '.jw p{color:var(--text-warning);margin:0}' +
    '.jgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px}' +
    '.jl{font-size:13px;color:var(--text-secondary);margin:0}.jn{font-size:22px;font-weight:500;margin:2px 0 0}' +
    '.js{font-size:12px;color:var(--text-muted);margin:2px 0 0}' +
    '.g{font-size:13px;color:var(--text-secondary);margin:1rem 0 6px;font-weight:500}' +
    '.r{display:flex;align-items:center;gap:10px;padding:10px 4px;border-bottom:.5px solid var(--border)}' +
    '.r input{flex:none}.b{flex:1;min-width:0}.t{font-size:15px;line-height:1.5}' +
    '.m{font-size:12px;color:var(--text-muted)}.m.late{color:var(--text-warning)}' +
    '.r.done .t{text-decoration:line-through;color:var(--text-muted)}' +
    '.r.start{background:var(--bg-accent)}.r.start .t{color:var(--text-accent)}' +
    '.s{font-size:12px;padding:4px 10px;flex:none}' +
    '.r.start .s{background:var(--fill-accent);color:var(--on-accent);border-color:var(--fill-accent)}' +
    '.err{font-size:13px;color:var(--text-danger)}';
  document.head.appendChild(css);

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function icon(name) {
    var i = el('i', 'ti ti-' + name);
    i.setAttribute('aria-hidden', 'true');
    return i;
  }
  var ask = function (t) { if (typeof sendPrompt === 'function') sendPrompt(t); };

  function panel() {
    var w = el('div', 'jc jw');
    var wi = icon('alarm'); wi.style.cssText = 'font-size:24px;color:var(--text-warning)';
    var wt = el('div');
    var big = el('p', null, j.late + ' באיחור · ' + j.today + ' להיום');
    big.style.cssText = 'font-size:26px;font-weight:500';
    var hint = el('p', null, 'לחץ להצגת המשימות ↗'); hint.style.fontSize = '13px';
    wt.appendChild(big); wt.appendChild(hint);
    w.appendChild(wi); w.appendChild(wt);
    w.onclick = function () { ask("ג'רי, תציג לי את המשימות שבאיחור ולהיום"); };
    root.appendChild(w);
    var t = j.tools || [0, 0, 0, 0];
    var cards = [
      ['checklist', 'תזכורות', j.rem, j.lists + ' רשימות', "ג'רי, תציג לי את כל התזכורות לפי רשימה"],
      ['tool', "בקלוג ג'רי", j.bl, j.next ? 'הבא: ' + j.next : 'אין משימות', "ג'רי, תציג לי את הבקלוג"],
      ['bulb', 'רעיונות', j.ideas, 'מחכים לביצוע', "ג'רי, תציג לי את הרעיונות"],
      ['history', 'היסטוריה', j.hist, 'נושאים שסוכמו', "ג'רי, תציג לי את היסטוריית השיחות"],
      ['gavel', 'החלטות', j.dec, 'מה הוחלט ולמה', "ג'רי, תציג לי את ההחלטות"],
      ['puzzle', 'כלים', t.join(' · '), 'סקילים · סוכנים · מודים · שגרות', "ג'רי, תסביר לי מה יש בסקילים, בסוכנים, במודים ובשגרות"]
    ];
    var grid = el('div', 'jgrid');
    cards.forEach(function (c) {
      var card = el('div', 'jc');
      var l = el('p', 'jl'); l.appendChild(icon(c[0])); l.appendChild(document.createTextNode(' ' + c[1]));
      card.appendChild(l); card.appendChild(el('p', 'jn', String(c[2]))); card.appendChild(el('p', 'js', c[3]));
      card.onclick = function () { ask(c[4]); };
      grid.appendChild(card);
    });
    root.appendChild(grid);
  }

  function list() {
    var rows = [];
    (j.g || []).forEach(function (grp) {
      root.appendChild(el('p', 'g', grp[0]));
      grp[1].forEach(function (it) {
        var r = el('div', 'r');
        var c = el('input'); c.type = 'checkbox'; c.setAttribute('aria-label', 'בוצע');
        var b = el('div', 'b');
        b.appendChild(el('div', 't', it.d));
        if (it.m) b.appendChild(el('div', 'm' + (it.l ? ' late' : ''), it.m));
        var s = el('button', 's', 'להתחיל');
        r.appendChild(c); r.appendChild(b); r.appendChild(s);
        r._line = '- [' + it.s + '] ' + it.t;
        rows.push(r);
        root.appendChild(r);
      });
    });
    var bar = el('div'); bar.style.cssText = 'display:flex;align-items:center;gap:12px;margin-top:1rem';
    var go = el('button', null, 'עדכן ↗'); var err = el('span', 'err');
    bar.appendChild(go); bar.appendChild(err); root.appendChild(bar);
    var checked = function () { return rows.filter(function (r) { return r.querySelector('input').checked; }); };
    rows.forEach(function (r) {
      var c = r.querySelector('input');
      c.onchange = function () { r.classList.toggle('done', c.checked); if (c.checked) r.classList.remove('start'); err.textContent = ''; };
      r.querySelector('.s').onclick = function () {
        if (!checked().length) { ask("ג'רי, מתחילים לעבוד על:\n" + r._line); return; }
        var on = !r.classList.contains('start');
        rows.forEach(function (x) { x.classList.remove('start'); });
        if (on) { r.classList.add('start'); }
        err.textContent = '';
      };
    });
    go.onclick = function () {
      var d = checked(), st = rows.filter(function (r) { return r.classList.contains('start'); });
      if (!d.length && !st.length) { err.textContent = 'לא סומן כלום'; return; }
      var p = [];
      if (d.length) p.push("ג'רי, סמן כבוצע:\n" + d.map(function (r) { return r._line; }).join('\n'));
      if (st.length) p.push("ג'רי, מתחילים לעבוד על:\n" + st[0]._line);
      ask(p.join('\n'));
    };
  }

  if (j.v === 'panel') panel(); else list();
})();
