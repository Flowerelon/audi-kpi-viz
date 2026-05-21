/**
 * Audi KPI Tree v3 — Looker Studio Community Visualization
 * Pixel-accurate port of kpi-tree-v3.html
 *
 * XSS-safe: built via createElement + textContent (no innerHTML on dynamic data).
 * Static CSS injected once via <style> textContent.
 *
 * Data contract:
 *   tables.DEFAULT rows = { pillar_id, sub_category, kpi_name, variant, value, unit, value_previous, period, source }
 *
 * Static metadata (titles, descriptions, exec defaults) is hard-coded.
 */

(function () {
  'use strict';

  const SVG_NS = 'http://www.w3.org/2000/svg';

  // ─────────────────────────────────────────────────────────────
  // STYLES — inlined from kpi-tree-v3.html
  // ─────────────────────────────────────────────────────────────
  const STYLES = [
    "@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');",
    ".audi-viz{--bg:#000;--bg-card:#0E0E0E;--border:#1F1F1F;--border-strong:#2A2A2A;--text:#FFF;--text-dim:#9CA3AF;--text-faint:#5C5C5C;--accent:#F50537;--primary:#3FA9F5;--primary-soft:rgba(63,169,245,0.5);--up:#4ADE80;--down:#F87171;--flat:#9CA3AF;--font-display:'DM Sans','Inter',system-ui,sans-serif;--font-body:'Inter',system-ui,sans-serif;box-sizing:border-box;background:var(--bg);color:var(--text);font-family:var(--font-body);-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;width:100%;min-height:100vh;padding:48px 56px 64px;max-width:1440px;margin:0 auto;}",
    ".audi-viz *,.audi-viz *::before,.audi-viz *::after{box-sizing:border-box}",
    ".audi-viz .top{display:flex;justify-content:space-between;align-items:flex-end;padding-bottom:28px;border-bottom:1px solid var(--border);margin-bottom:40px}",
    ".audi-viz .brand{display:flex;align-items:center;gap:18px}",
    ".audi-viz .rings svg{display:block}",
    ".audi-viz .brand-text{line-height:1}",
    ".audi-viz .brand-text .sup{font-family:var(--font-display);font-size:10px;letter-spacing:.22em;color:var(--text-dim);text-transform:uppercase;margin-bottom:6px}",
    ".audi-viz .brand-text h1{font-family:var(--font-display);font-size:22px;font-weight:500;margin:0;letter-spacing:-.01em}",
    ".audi-viz .meta{display:flex;align-items:center;gap:24px;color:var(--text-dim);font-size:12px;letter-spacing:.08em;text-transform:uppercase}",
    ".audi-viz .meta .pill{border:1px solid var(--border-strong);padding:8px 14px;border-radius:999px;color:var(--text);display:inline-flex;align-items:center;gap:8px}",
    ".audi-viz .meta .pill::before{content:'';width:6px;height:6px;background:var(--accent);border-radius:50%;display:inline-block}",
    ".audi-viz .northstar{margin-bottom:56px}",
    ".audi-viz .northstar .label{font-family:var(--font-display);font-size:11px;letter-spacing:.24em;color:var(--accent);text-transform:uppercase;margin-bottom:14px}",
    ".audi-viz .northstar h2{font-family:var(--font-display);font-weight:500;font-size:clamp(28px,3.6vw,48px);line-height:1.1;letter-spacing:-.025em;margin:0;max-width:920px}",
    ".audi-viz .northstar h2 em{font-style:normal;color:var(--accent)}",
    ".audi-viz .summary{margin-bottom:64px}",
    ".audi-viz .summary .label{font-family:var(--font-display);font-size:11px;letter-spacing:.24em;color:var(--accent);text-transform:uppercase;margin-bottom:18px;display:flex;justify-content:space-between;align-items:baseline}",
    ".audi-viz .summary .label .sub{color:var(--text-faint);letter-spacing:.18em;font-size:10px}",
    ".audi-viz .summary-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}",
    ".audi-viz .sum-card{background:var(--bg-card);border:1px solid var(--border);border-radius:6px;padding:22px 22px 20px;position:relative;min-height:188px;display:flex;flex-direction:column}",
    ".audi-viz .sum-card .idx{font-family:var(--font-display);font-size:10px;letter-spacing:.24em;color:var(--text-faint);margin-bottom:8px}",
    ".audi-viz .sum-card .name{font-family:var(--font-display);font-size:12px;font-weight:600;color:var(--text-dim);letter-spacing:.16em;text-transform:uppercase;margin-bottom:18px;line-height:1.2}",
    ".audi-viz .sum-card .score{font-family:var(--font-display);font-size:56px;font-weight:500;line-height:1;letter-spacing:-.03em;color:var(--text);margin-top:auto}",
    ".audi-viz .sum-card .score .denom{font-size:18px;color:var(--text-faint);font-weight:400;margin-left:2px;letter-spacing:0}",
    ".audi-viz .sum-card .meta-row{display:flex;align-items:center;justify-content:space-between;margin-top:14px;gap:8px}",
    ".audi-viz .sum-card .status{font-size:10px;letter-spacing:.14em;text-transform:uppercase;padding:4px 9px;border-radius:4px;border:1px solid var(--border-strong);color:var(--text-dim)}",
    ".audi-viz .sum-card .status.strong{color:var(--up);border-color:rgba(74,222,128,.3);background:rgba(74,222,128,.06)}",
    ".audi-viz .sum-card .status.risk{color:var(--down);border-color:rgba(248,113,113,.3);background:rgba(248,113,113,.06)}",
    ".audi-viz .sum-card .delta{display:inline-flex;align-items:center;gap:3px;font-size:11px;font-weight:600;letter-spacing:.02em}",
    ".audi-viz .sum-card .delta.up{color:var(--up)}",
    ".audi-viz .sum-card .delta.down{color:var(--down)}",
    ".audi-viz .sum-card .delta.flat{color:var(--flat)}",
    ".audi-viz .sum-card.featured::before{content:'';position:absolute;inset:0 auto 0 0;width:2px;background:var(--accent)}",
    ".audi-viz .pillar{display:grid;grid-template-columns:280px 1fr;gap:56px;padding:36px 0;border-top:1px solid var(--border)}",
    ".audi-viz .pillar:last-of-type{border-bottom:1px solid var(--border)}",
    ".audi-viz .pillar-head .index{font-family:var(--font-display);font-size:11px;color:var(--text-faint);letter-spacing:.24em;margin-bottom:10px}",
    ".audi-viz .pillar-head h3{font-family:var(--font-display);font-size:22px;font-weight:500;line-height:1.15;margin:0 0 12px 0;letter-spacing:-.01em}",
    ".audi-viz .pillar-head p{font-size:13px;color:var(--text-dim);line-height:1.5;margin:0 0 22px 0;max-width:240px}",
    ".audi-viz .pillar-head .tags{display:flex;flex-wrap:wrap;gap:6px}",
    ".audi-viz .pillar-head .tag{border:1px solid var(--border-strong);padding:4px 10px;border-radius:4px;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--text-dim)}",
    ".audi-viz .pillar-head .tag.primary{border-color:var(--primary-soft);color:var(--primary)}",
    ".audi-viz .pillar-body{display:flex;flex-direction:column;gap:22px}",
    ".audi-viz .sub-section{display:flex;flex-direction:column;gap:12px}",
    ".audi-viz .sub-head{display:flex;align-items:center;gap:10px;font-family:var(--font-display);font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--text-dim)}",
    ".audi-viz .sub-head .dot{width:6px;height:6px;border-radius:50%;background:var(--text-faint)}",
    ".audi-viz .sub-head.primary{color:var(--primary)}",
    ".audi-viz .sub-head.primary .dot{background:var(--primary)}",
    ".audi-viz .sub-head .rule{flex:1;height:1px;background:var(--border)}",
    ".audi-viz .kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}",
    ".audi-viz .kpis.cols-4{grid-template-columns:repeat(4,1fr)}",
    ".audi-viz .kpis.cols-3{grid-template-columns:repeat(3,1fr)}",
    ".audi-viz .kpi{background:var(--bg-card);border:1px solid var(--border);border-radius:6px;padding:18px 18px 16px;min-height:132px;display:flex;flex-direction:column;justify-content:space-between;position:relative;overflow:hidden}",
    ".audi-viz .kpi.primary{border-color:var(--primary-soft)}",
    ".audi-viz .kpi.primary::before{content:'';position:absolute;inset:0 auto 0 0;width:2px;background:var(--primary)}",
    ".audi-viz .kpi.strategic{border-color:rgba(245,5,55,.55);background:linear-gradient(180deg,rgba(245,5,55,.06) 0%,var(--bg-card) 60%)}",
    ".audi-viz .kpi.strategic::before{content:'';position:absolute;inset:0 auto 0 0;width:2px;background:var(--accent)}",
    ".audi-viz .kpi .name{font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--text-dim);line-height:1.3;min-height:28px}",
    ".audi-viz .kpi .value{font-family:var(--font-display);font-size:30px;font-weight:500;line-height:1;letter-spacing:-.02em;margin-top:8px}",
    ".audi-viz .kpi .value .unit{font-size:16px;color:var(--text-dim);font-weight:400;margin-left:2px}",
    ".audi-viz .kpi .trend{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text-dim);margin-top:10px;letter-spacing:.02em}",
    ".audi-viz .kpi .trend .delta{display:inline-flex;align-items:center;gap:3px;font-weight:600}",
    ".audi-viz .kpi .trend .delta.up{color:var(--up)}",
    ".audi-viz .kpi .trend .delta.down{color:var(--down)}",
    ".audi-viz .kpi .trend .delta.flat{color:var(--flat)}",
    ".audi-viz .foot{display:flex;justify-content:space-between;align-items:center;margin-top:48px;padding-top:24px;border-top:1px solid var(--border);color:var(--text-faint);font-size:11px;letter-spacing:.08em;text-transform:uppercase}",
    ".audi-viz .foot .legend{display:flex;gap:18px;align-items:center}",
    ".audi-viz .foot .legend .swatch{display:inline-flex;align-items:center;gap:6px}",
    ".audi-viz .foot .legend .swatch .chip{width:10px;height:10px;border-radius:2px;border:1.5px solid var(--text-faint);background:var(--bg-card);display:inline-block}",
    ".audi-viz .foot .legend .swatch.primary .chip{border-color:var(--primary)}",
    ".audi-viz .foot .legend .swatch.strategic .chip{border-color:var(--accent)}"
  ].join('\n');

  // ─────────────────────────────────────────────────────────────
  // STATIC METADATA
  // ─────────────────────────────────────────────────────────────
  const PILLAR_META = {
    1: {
      title: 'A brand that inspires aspiration',
      desc: 'Captures attention and fuels imagination.',
      tags: [{ label: 'Distinctiveness', primary: true }, { label: 'Aspiration', primary: false }],
      subOrder: ['Distinctiveness', 'Aspiration'],
      primarySubs: ['Distinctiveness']
    },
    2: {
      title: 'A brand that drives conversations',
      desc: 'Becomes a reference, widely discussed and shared.',
      tags: [{ label: 'Share of conversations', primary: false }],
      subOrder: ['Share of conversations'],
      primarySubs: []
    },
    3: {
      title: 'A brand that influences choice',
      desc: 'Emerges as the spontaneous answer.',
      tags: [{ label: 'Consideration', primary: true }, { label: 'Preference', primary: false }],
      subOrder: ['Consideration', 'Preference'],
      primarySubs: ['Consideration']
    },
    4: {
      title: 'A brand that drives purchase',
      desc: 'Generates leads, intent and conversion.',
      tags: [{ label: 'Share of market', primary: false }],
      subOrder: ['Share of market'],
      primarySubs: []
    },
    5: {
      title: 'A brand that fosters loyalty',
      desc: 'Nurtures long-term preference.',
      tags: [{ label: 'Recommendation', primary: true }],
      subOrder: ['Recommendation'],
      primarySubs: ['Recommendation']
    }
  };

  const EXEC_DEFAULTS = [
    { idx: '01 / 05', name: 'Aspiration',    score: 7.5, status: 'track',  delta: '0.3', featured: false, trend: 'up' },
    { idx: '02 / 05', name: 'Conversations', score: 8.2, status: 'strong', delta: '0.6', featured: true,  trend: 'up' },
    { idx: '03 / 05', name: 'Choice',        score: 8.5, status: 'strong', delta: '0.4', featured: true,  trend: 'up' },
    { idx: '04 / 05', name: 'Purchase',      score: 7.8, status: 'track',  delta: '0.1', featured: false, trend: 'down' },
    { idx: '05 / 05', name: 'Loyalty',       score: 8.4, status: 'strong', delta: '0.2', featured: true,  trend: 'up' }
  ];

  // ─────────────────────────────────────────────────────────────
  // DOM HELPERS
  // ─────────────────────────────────────────────────────────────
  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        if (k === 'class') node.className = attrs[k];
        else if (k === 'text') node.textContent = attrs[k];
        else node.setAttribute(k, attrs[k]);
      }
    }
    if (children) {
      const arr = Array.isArray(children) ? children : [children];
      arr.forEach((c) => {
        if (c == null) return;
        if (typeof c === 'string') node.appendChild(document.createTextNode(c));
        else node.appendChild(c);
      });
    }
    return node;
  }

  function elSvg(tag, attrs) {
    const node = document.createElementNS(SVG_NS, tag);
    if (attrs) {
      for (const k in attrs) node.setAttribute(k, attrs[k]);
    }
    return node;
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  // ─────────────────────────────────────────────────────────────
  // DATA PROCESSING
  // ─────────────────────────────────────────────────────────────
  function getVal(field) {
    if (field === null || field === undefined) return '';
    if (Array.isArray(field)) return field[0];
    return field;
  }

  function buildTree(rows) {
    const tree = {};
    rows.forEach((row) => {
      const pid = String(getVal(row.pillar_id) || '').trim();
      const sub = String(getVal(row.sub_category) || 'default').trim();
      if (!pid) return;
      if (!tree[pid]) tree[pid] = {};
      if (!tree[pid][sub]) tree[pid][sub] = [];
      tree[pid][sub].push({
        name: getVal(row.kpi_name) || '',
        variant: (getVal(row.variant) || 'standard').toString().toLowerCase(),
        value: getVal(row.value),
        unit: getVal(row.unit) || '',
        valuePrev: getVal(row.value_previous),
        period: getVal(row.period) || '',
        source: getVal(row.source) || ''
      });
    });
    return tree;
  }

  function formatValue(value, unit) {
    if (value === null || value === undefined || value === '') {
      return { num: '—', unit: '' };
    }
    const n = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(n)) return { num: String(value), unit: '' };
    if (unit === 'count' || unit === 'EUR') {
      if (n >= 1000000) return { num: (n / 1000000).toFixed(1).replace('.0', ''), unit: unit === 'EUR' ? 'M€' : 'M' };
      if (n >= 1000) return { num: (n / 1000).toFixed(1).replace('.0', ''), unit: 'k' };
    }
    return { num: String(n), unit: unit || '' };
  }

  function computeDelta(current, previous) {
    if (current === null || previous === null || current === undefined || previous === undefined || previous === '' || current === '') {
      return { trend: 'flat', label: '— —' };
    }
    const c = parseFloat(current);
    const p = parseFloat(previous);
    if (isNaN(c) || isNaN(p)) return { trend: 'flat', label: '— —' };
    const diff = c - p;
    const pct = p !== 0 ? (diff / p) * 100 : 0;
    const trend = diff > 0.01 ? 'up' : diff < -0.01 ? 'down' : 'flat';
    const arrow = trend === 'up' ? '▲' : trend === 'down' ? '▼' : '—';
    let label;
    if (Math.abs(diff) < 1 && Math.abs(diff) > 0) label = arrow + ' ' + Math.abs(diff).toFixed(2);
    else if (Math.abs(pct) >= 5) label = arrow + ' ' + Math.abs(pct).toFixed(0) + '%';
    else label = arrow + ' ' + Math.abs(diff).toFixed(1);
    return { trend, label };
  }

  // ─────────────────────────────────────────────────────────────
  // RENDERERS — return DOM nodes
  // ─────────────────────────────────────────────────────────────
  function buildRings() {
    const svg = elSvg('svg', { width: '92', height: '22', viewBox: '0 0 184 44', fill: 'none' });
    const positions = [22, 62, 102, 142];
    positions.forEach((cx) => {
      const c = elSvg('circle', { cx: String(cx), cy: '22', r: '20', stroke: '#FFFFFF', 'stroke-width': '2.2' });
      svg.appendChild(c);
    });
    return svg;
  }

  function buildHeader(s) {
    const rings = el('div', { class: 'rings', 'aria-label': 'Audi' }, [buildRings()]);
    const brandText = el('div', { class: 'brand-text' }, [
      el('div', { class: 'sup', text: s.supTitle }),
      el('h1', { text: s.title })
    ]);
    const brand = el('div', { class: 'brand' }, [rings, brandText]);

    const meta = el('div', { class: 'meta' }, [
      el('span', { text: s.period }),
      el('span', { class: 'pill', text: 'Live · Community Viz' })
    ]);

    return el('header', { class: 'top' }, [brand, meta]);
  }

  function buildNorthStar(s) {
    const text = s.northStar || '';
    const highlight = s.northStarHighlight || '';
    const h2 = el('h2', {});
    if (highlight && text.indexOf(highlight) !== -1) {
      const parts = text.split(highlight);
      h2.appendChild(document.createTextNode(parts[0]));
      h2.appendChild(el('em', { text: highlight }));
      h2.appendChild(document.createTextNode(parts.slice(1).join(highlight)));
    } else {
      h2.textContent = text;
    }
    return el('section', { class: 'northstar' }, [
      el('div', { class: 'label', text: 'North Star' }),
      h2
    ]);
  }

  function buildSumCard(c) {
    const cardClass = 'sum-card' + (c.featured ? ' featured' : '');
    const idx = el('div', { class: 'idx', text: c.idx });
    const name = el('div', { class: 'name', text: c.name });
    const score = el('div', { class: 'score' }, [
      document.createTextNode(String(c.score)),
      el('span', { class: 'denom', text: '/10' })
    ]);
    const statusLabel = c.status === 'strong' ? 'Strong' : c.status === 'risk' ? 'Risk' : 'On track';
    const status = el('span', { class: 'status ' + c.status, text: statusLabel });
    const arrow = c.trend === 'up' ? '▲' : c.trend === 'down' ? '▼' : '—';
    const delta = el('span', { class: 'delta ' + c.trend, text: arrow + ' ' + c.delta });
    const metaRow = el('div', { class: 'meta-row' }, [status, delta]);
    return el('div', { class: cardClass }, [idx, name, score, metaRow]);
  }

  function buildExecutiveSummary(cards) {
    const grid = el('div', { class: 'summary-grid' }, cards.map(buildSumCard));
    const labelMain = el('span', { text: 'Executive Summary' });
    const labelSub = el('span', { class: 'sub', text: 'Overall score · weighted avg' });
    const label = el('div', { class: 'label' }, [labelMain, labelSub]);
    return el('section', { class: 'summary' }, [label, grid]);
  }

  function buildKpiCard(kpi) {
    const variantClass = kpi.variant === 'standard' ? '' : (' ' + kpi.variant);
    const name = el('div', { class: 'name', text: kpi.name });
    const formatted = formatValue(kpi.value, kpi.unit);
    const valueNode = el('div', { class: 'value' }, [
      document.createTextNode(formatted.num),
      formatted.unit ? el('span', { class: 'unit', text: formatted.unit }) : null
    ]);
    const delta = computeDelta(kpi.value, kpi.valuePrev);
    const trend = el('div', { class: 'trend' }, [
      el('span', { class: 'delta ' + delta.trend, text: delta.label }),
      el('span', { text: 'vs prev' })
    ]);
    return el('div', { class: 'kpi' + variantClass }, [name, valueNode, trend]);
  }

  function buildSubSection(subName, kpis, isPrimary) {
    const colsClass = kpis.length <= 3 ? ' cols-3' : kpis.length === 4 ? ' cols-4' : '';
    const dot = el('span', { class: 'dot' });
    const rule = el('span', { class: 'rule' });
    const headClass = 'sub-head' + (isPrimary ? ' primary' : '');
    const head = el('div', { class: headClass }, [dot, document.createTextNode(subName), rule]);
    const grid = el('div', { class: 'kpis' + colsClass }, kpis.map(buildKpiCard));
    return el('div', { class: 'sub-section' }, [head, grid]);
  }

  function buildPillar(pid, subCats) {
    const meta = PILLAR_META[pid];
    if (!meta) return null;
    const idx = '0' + pid + ' / 05';

    const tagNodes = meta.tags.map((t) =>
      el('span', { class: 'tag' + (t.primary ? ' primary' : ''), text: t.label })
    );
    const tags = el('div', { class: 'tags' }, tagNodes);

    const head = el('div', { class: 'pillar-head' }, [
      el('div', { class: 'index', text: idx }),
      el('h3', { text: meta.title }),
      el('p', { text: meta.desc }),
      tags
    ]);

    const subSections = [];
    meta.subOrder.forEach((subName) => {
      const kpis = (subCats && subCats[subName]) ? subCats[subName] : [];
      if (kpis.length === 0) return;
      const isPrimary = meta.primarySubs.indexOf(subName) !== -1;
      subSections.push(buildSubSection(subName, kpis, isPrimary));
    });
    const body = el('div', { class: 'pillar-body' }, subSections);

    return el('section', { class: 'pillar' }, [head, body]);
  }

  function buildFooter(s) {
    const left = el('div', { text: s.footerLeft });
    const swatches = [
      el('span', { class: 'swatch' }, [el('span', { class: 'chip' }), document.createTextNode('Standard KPI')]),
      el('span', { class: 'swatch primary' }, [el('span', { class: 'chip' }), document.createTextNode('Primary KPI')]),
      el('span', { class: 'swatch strategic' }, [el('span', { class: 'chip' }), document.createTextNode('Strategic KPI')])
    ];
    const legend = el('div', { class: 'legend' }, swatches);
    const right = el('div', { text: s.footerRight });
    return el('footer', { class: 'foot' }, [left, legend, right]);
  }

  // ─────────────────────────────────────────────────────────────
  // STYLE INJECTION + MAIN DRAW
  // ─────────────────────────────────────────────────────────────
  function ensureStyles() {
    if (document.getElementById('audi-viz-style')) return;
    const styleEl = document.createElement('style');
    styleEl.id = 'audi-viz-style';
    styleEl.textContent = STYLES;
    document.head.appendChild(styleEl);
  }

  function getStyleValue(styleObj, id, fallback) {
    if (!styleObj || !styleObj[id]) return fallback;
    const v = styleObj[id].value;
    if (v && typeof v === 'object' && v.color) return v.color;
    return v !== undefined && v !== null ? v : fallback;
  }

  function drawViz(data) {
    ensureStyles();

    const styleConf = (data && data.style) || {};
    const s = {
      title: getStyleValue(styleConf, 'title', 'KPI Tree v3'),
      supTitle: getStyleValue(styleConf, 'supTitle', 'Brand Performance'),
      period: getStyleValue(styleConf, 'period', 'Q2 2026'),
      northStar: getStyleValue(styleConf, 'northStar', 'Make Audi the most desirable brand in premium mobility.'),
      northStarHighlight: getStyleValue(styleConf, 'northStarHighlight', 'desirable'),
      footerLeft: getStyleValue(styleConf, 'footerLeft', 'Audi France · BBDO · KPI Tree v3'),
      footerRight: getStyleValue(styleConf, 'footerRight', 'Source: Brand Tracker · GA4 · Social Listening · CRM'),
      accentColor: getStyleValue(styleConf, 'accentColor', '#F50537'),
      primaryColor: getStyleValue(styleConf, 'primaryVariantColor', '#3FA9F5')
    };

    const rows = (data && data.tables && data.tables.DEFAULT) || [];
    const tree = buildTree(rows);

    let root = document.getElementById('audi-viz-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'audi-viz-root';
      root.className = 'audi-viz';
      document.body.appendChild(root);
    }
    root.style.setProperty('--accent', s.accentColor);
    root.style.setProperty('--primary', s.primaryColor);

    clear(root);
    root.appendChild(buildHeader(s));
    root.appendChild(buildNorthStar(s));
    root.appendChild(buildExecutiveSummary(EXEC_DEFAULTS));
    [1, 2, 3, 4, 5].forEach((pid) => {
      const pillarNode = buildPillar(pid, tree[pid] || {});
      if (pillarNode) root.appendChild(pillarNode);
    });
    root.appendChild(buildFooter(s));
  }

  // ─────────────────────────────────────────────────────────────
  // BOOTSTRAP
  // ─────────────────────────────────────────────────────────────
  function bootstrap() {
    if (typeof window !== 'undefined' && window.dscc && typeof window.dscc.subscribeToData === 'function') {
      window.dscc.subscribeToData(drawViz, { transform: window.dscc.objectTransform });
    } else {
      // Local test mode: expose drawViz so wrapper can call manually
      window.__audiVizDraw = drawViz;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
