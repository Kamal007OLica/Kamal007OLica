/* Open source Love, as a self-playing SVG for the GitHub profile README.
   A port of the portfolio's transit map (kamalraaj-portfolio/oss.js + oss.css):
   CSS keyframes draw the map once, then SMIL trains ride each line in turn, forever.
   Usage: node gen.mjs <outdir>  →  oss-light.svg, oss-dark.svg, oss-light-sm.svg, oss-dark-sm.svg */
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const A = JSON.parse(fs.readFileSync(path.join(here, 'assets.json'), 'utf8'));
const WID = JSON.parse(fs.readFileSync(path.join(here, 'widths.json'), 'utf8'));
const out = process.argv[2] || here;

const measure = (s, table, size, track = 0) => [...s].reduce((w, c) => w + (WID[table][c] ?? .6) * size + track, 0);

/* the data, as on the portfolio (pulled from the GitHub API on 29 Oct 2026) */
const START = Date.UTC(2025, 1, 2), WEEKS = 91, TOTAL = 1007;  // since Feb 2024, from the portfolio index (30 Oct 2026)
const HEAT = '00000014332223424433423324443443111141121214414341411111111321122211111111141111111111000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000310000000000000000000000004000000000000000000000000000000000000000000000000000000000000000000001000000000000000000003300300000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000200000100000000000000000000000000000000130012000000010000001001012012102210000411104443400013134222123110443..';
const LINES = [
  { key: 'pp', name: 'Design contributions', c: '#2fd9a8', logo: 'proof', chips: ['10 issues', '1 PR', '4 projects'], upstream: true,
    groups: [[3, 2, 'deepseek'], [3, 7, 'penpot'], [5, 1, 'posthog'], [5, 1, 'codecademy'], [42, 8], [90, 1]] },
  { key: 'uki', name: 'Uki AI', c: '#f2b705', logo: 'uki', chips: ['Figma plugin', '★ 3', 'JavaScript'], groups: [[4, 6], [6, 6], [88, 4]] },
  { key: 'zen', name: 'ZenMode OS', c: '#c6f432', logo: 'zenmode', chips: ['★ 25', 'GPL-3.0', '6 forks', 'Kotlin'],
    groups: [[58, 6], [59, 23], [60, 7], [61, 4], [62, 6], [63, 2], [85, 10], [86, 2]] },
  { key: 'tg', name: 'Night link cleaner', c: '#2aabee', icon: 'tg', chips: ['Telegram bot', '★ 1', 'Python'], groups: [[59, 17]] },
  { key: 'obs', name: 'Obspec', c: '#7c5cff', logo: 'obspec', chips: ['Figma plugin', 'MIT', 'TypeScript'], groups: [[88, 27], [89, 1]] },
  { key: 'taste', name: 'Taste MCP', c: '#ee46d3', logo: 'taste', chips: ['MCP server', 'MIT'], groups: [[90, 6]] },
  { key: 'mozhi', name: 'Mozhi', c: '#d01c22', logo: 'mozhi', chips: ['Apache-2.0', 'macOS', 'Windows'], groups: [[90, 8]] }
];
const ORGS = { deepseek: 'DeepSeek: 2 issues, one shipped', penpot: 'Penpot: 6 issues and a pull request', posthog: 'PostHog: 1 issue', codecademy: 'Codecademy: 1 issue' };

const THEMES = {
  light: { ink: '#111111', ink2: '#424242', muted: '#8a8a8a', line2: 'rgba(17,17,17,.22)', sheet: '#ffffff', sheet2: '#f4f4f2', edge: '#111111', heat: a => `rgba(17,17,17,${a})` },
  dark: { ink: '#f2f1ec', ink2: 'rgba(242,241,236,.72)', muted: '#8e8e95', line2: 'rgba(255,255,255,.22)', sheet: '#17171a', sheet2: '#1f1f23', edge: 'rgba(242,241,236,.86)', heat: a => `rgba(242,241,236,${a})` }
};

/* two layouts: the full map for desktop, and a taller, larger-type one for phones */
const LAYOUTS = {
  lg: { VW: 1240, HEAD: 96, PAD: 20, W: 1200, H: 560, X0: 40, XE: 862, TRUNK: 410, LANE0: 64, LANE: 50, XB0: 74, XBS: 92, SLOPE: 1, R: 16, HY: 452,
        B: 34, NAME: 19, CHIPS: 4, SNAPS: true, ORGS: true, TITLE: 48, BLURB: true, MO: 11 },
  sm: { VW: 640, HEAD: 118, PAD: 14, W: 612, H: 446, X0: 16, XE: 380, TRUNK: 330, LANE0: 34, LANE: 42, XB0: 30, XBS: 32, SLOPE: 2.1, R: 12, HY: 368,
        B: 30, NAME: 19, CHIPS: 0, SNAPS: false, ORGS: false, TITLE: 54, BLURB: false, MO: 13 }
};

const ease = '.2 .7 .2 1', easeOut = '.33 1 .68 1';
const f1 = n => +n.toFixed(1);
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&#39;');
const fmt = w => new Date(START + w * 7 * 864e5).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

function build(themeName, layoutName) {
  const T = THEMES[themeName], L = LAYOUTS[layoutName];
  const { W, H, X0, XE, TRUNK, LANE0, LANE, R, HY, B } = L;
  const CELL = (XE - X0) / WEEKS, GAP = 26;
  const weekX = w => X0 + w * CELL + CELL / 2;
  const MX = (L.VW - W) / 2, MY = L.HEAD + L.PAD;            // where the map sits inside the image
  const VH = MY + H + L.PAD + 6;
  const css = [], defs = [];
  const heat = [], plumbs = [], trunk = [], lines = [], signs = [], top = [], trains = [];

  /* timeline: draw-in first, then one ride per line, then a rest with every line lit */
  const RIDE0 = 3.4, SLOT = 2.6, MOVE = 1.3, REST = 3.6, CYCLE = LINES.length * SLOT + REST;
  const kt = t => +(t / CYCLE).toFixed(4);

  /* the contribution ribbon */
  const HA = [.06, .24, .44, .66, 1];
  for (let i = 0; i < HEAT.length; i++) {
    const v = HEAT[i]; if (v === '.') continue;
    const w = Math.floor(i / 7), d = i % 7;
    heat.push(`<rect x="${f1(X0 + w * CELL + CELL * .1)}" y="${f1(HY + d * CELL)}" width="${f1(CELL * .8)}" height="${f1(CELL * .8)}" rx="${f1(CELL * .2)}" fill="${T.heat(HA[v])}"/>`);
  }
  let firstLabel = true;
  for (let w = 0; w < WEEKS; w++) {
    const t = new Date(START + w * 7 * 864e5), prev = new Date(START + (w - 1) * 7 * 864e5);
    if (w && t.getUTCMonth() === prev.getUTCMonth()) continue;
    if (t.getUTCMonth() % 3) continue;
    if (layoutName === 'sm' && t.getUTCMonth() % 6) continue;
    const label = t.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' }) + (t.getUTCMonth() === 0 || firstLabel ? ' ’' + String(t.getUTCFullYear()).slice(2) : '');
    firstLabel = false;
    heat.push(`<text x="${f1(X0 + w * CELL)}" y="${f1(HY + 7 * CELL + L.MO + 8)}" class="mo">${label}</text>`);
  }

  /* the trunk */
  const tk = `M${X0 - 14} ${TRUNK}H${XE}`;
  trunk.push(`<path d="${tk}" class="tk-case draw" pathLength="1" style="animation-duration:.9s;animation-delay:.1s"/>`,
             `<path d="${tk}" class="tk-core draw" pathLength="1" style="animation-duration:.9s;animation-delay:.1s"/>`);

  LINES.forEach((ln, i) => {
    const y = LANE0 + i * LANE, xb = L.XB0 + i * L.XBS, xd = xb + (TRUNK - y) / L.SLOPE;
    const ang = Math.atan2(TRUNK - y, xd - xb), kx = R * Math.cos(ang) * .75, ky = R * Math.sin(ang) * .75;
    const d = `M${f1(xb - R)} ${TRUNK}Q${f1(xb)} ${TRUNK} ${f1(xb + kx)} ${f1(TRUNK - ky)}L${f1(xd - kx)} ${f1(y + ky)}Q${f1(xd)} ${y} ${f1(xd + R)} ${y}H${XE}`;
    const base = .6 + i * .14;
    const id = `ln-${ln.key}`;
    const dim = dimAnim(i);

    /* the plumb line down to the week it began */
    const px = weekX(ln.groups[0][0]);
    plumbs.push(`<g>${dim}<path d="M${f1(xb)} ${TRUNK + 6}C${f1(xb)} ${TRUNK + 26} ${f1(px)} ${HY - 22} ${f1(px)} ${HY - 5}" class="plumb fade" stroke="${ln.c}" style="animation-delay:${(.9 + i * .14).toFixed(2)}s"/>` +
      `<circle cx="${f1(px)}" cy="${HY - 4}" r="3.2" class="pin fade" fill="${ln.c}" style="animation-delay:${(1.1 + i * .14).toFixed(2)}s"/></g>`);
    trunk.push(`<circle cx="${f1(xb)}" cy="${TRUNK}" r="5.5" class="junc fade" style="animation-duration:.3s;animation-delay:${(.5 + i * .14).toFixed(2)}s"/>`);

    const g = [`<path d="${d}" class="ln-case draw" pathLength="1" style="animation-delay:${base.toFixed(2)}s"/>`,
               `<path id="${id}" d="${d}" class="ln-core draw" stroke="${ln.c}" pathLength="1" style="animation-delay:${base.toFixed(2)}s"/>`];

    /* one tick per commit, a station per week, long silences drawn hollow */
    const runA = xd + R + 10, runB = XE - (layoutName === 'sm' ? 22 : 34), slots = [];
    ln.groups.forEach(([w, n, org], gi) => {
      if (gi && w - ln.groups[gi - 1][0] > GAP) slots.push({ quiet: true });
      else if (gi && org && L.ORGS) slots.push({ pad: true }, { pad: true });
      for (let c = 0; c < n; c++) slots.push({ gi, c });
    });
    const step = (runB - runA) / Math.max(slots.length - 1, 1);
    const frac = x => (x - xb) / (XE - xb);
    const quiet = [];
    slots.forEach((s, si) => {
      const x = runA + si * step;
      if (s.quiet) { quiet.push(x); return; }
      if (s.pad) return;
      g.push(`<path d="M${f1(x)} ${y - 2.6}v5.2" class="tick fade" style="animation-duration:.3s;animation-delay:${(base + frac(x)).toFixed(2)}s"/>`);
    });
    if (ln.upstream) g.push(`<path d="M${f1(xd + R)} ${y}H${XE - 8}" class="hollow fade" style="animation-delay:${(1.5 + i * .14).toFixed(2)}s"/>`);
    quiet.forEach(x => g.push(`<path d="M${f1(x - step * 1.6)} ${y}H${f1(x + step * 1.6)}" class="hollow fade" style="animation-delay:${(1.5 + i * .14).toFixed(2)}s"/>`));
    ln.groups.forEach(([w, n, org], gi) => {
      const mine = slots.map((s, si) => s.gi === gi ? si : -1).filter(si => si >= 0);
      const x = runA + (mine[0] + mine[mine.length - 1]) / 2 * step;
      const r = Math.min(4.2 + Math.sqrt(n) * 1.35, 11) * (layoutName === 'sm' ? .85 : 1);
      if (!org || !L.ORGS) {
        g.push(`<circle cx="${f1(x)}" cy="${y}" r="${f1(r)}" class="st pop" style="animation-delay:${(base + frac(x)).toFixed(2)}s"><title>${org ? esc(ORGS[org]) : `${n} commit${n > 1 ? 's' : ''}, week of ${fmt(w)}`}</title></circle>`);
        return;
      }
      const cy = y - 31, ro = 12.5, cid = `clip-${org}`;
      defs.push(`<clipPath id="${cid}"><circle cx="${f1(x)}" cy="${cy}" r="${ro - 1}"/></clipPath>`);
      g.push(`<circle cx="${f1(x)}" cy="${y}" r="${f1(r)}" class="st pop" style="animation-delay:${(base + frac(x)).toFixed(2)}s"/>`);
      g.push(`<g class="org pop" style="animation-delay:${(base + .15 + frac(x)).toFixed(2)}s"><title>${esc(ORGS[org])}</title>` +
        `<path d="M${f1(x)} ${f1(y - r)}V${cy + ro}" class="org-link"/><circle cx="${f1(x)}" cy="${cy}" r="${ro}" fill="#fff"/>` +
        `<image href="${A['logo_' + org]}" x="${f1(x - ro)}" y="${cy - ro}" width="${ro * 2}" height="${ro * 2}" clip-path="url(#${cid})" preserveAspectRatio="xMidYMid slice"/>` +
        `<circle cx="${f1(x)}" cy="${cy}" r="${ro}" class="org-ring"/></g>`);
    });
    lines.push(`<g>${dim}${g.join('')}</g>`);

    /* the sign at the terminus: a bullet that rings when the train pulls in, the name, the chips */
    const arrive = RIDE0 + i * SLOT + MOVE;
    const ring = `<animateTransform attributeName="transform" type="scale" begin="${RIDE0}s" dur="${CYCLE.toFixed(2)}s" repeatCount="indefinite" calcMode="spline"
      values="1;1;1.32;1.12;1.12;1;1" keyTimes="0;${kt(arrive - RIDE0)};${kt(arrive - RIDE0 + .2)};${kt(arrive - RIDE0 + .5)};${kt(arrive - RIDE0 + SLOT - MOVE - .3)};${kt(arrive - RIDE0 + SLOT - MOVE)};1"
      keySplines="0 0 1 1;.34 1 .64 1;${ease};0 0 1 1;${ease};0 0 1 1"/>`;
    const sx = XE + 12 + B / 2 + 10;
    const s = [`<g transform="translate(${XE} ${y})"><g>${ring}<circle r="${B / 2}" fill="${ln.c}" class="bul"/>${bulletInner(ln, B)}</g></g>`];
    const nameY = L.CHIPS ? y - 5 : y + L.NAME * .36;
    const tx = XE + B / 2 + 10;
    s.push(`<text x="${tx}" y="${f1(nameY)}" class="nm">${esc(ln.name)}</text>`);
    if (L.CHIPS) {
      let cx = tx;
      ln.chips.slice(0, L.CHIPS).forEach(c => {
        const w = c.length * 10.5 * .6 + 12;
        s.push(`<rect x="${f1(cx + .5)}" y="${y + 4.5}" width="${f1(w - 1)}" height="16" rx="8" class="chip"/><text x="${f1(cx + 6)}" y="${y + 16}" class="cht">${esc(c)}</text>`);
        cx += w + 4;
      });
    }
    signs.push(`<g>${dim}<g class="fade" style="animation-delay:${(1.4 + i * .14).toFixed(2)}s">${s.join('')}</g></g>`);

    /* the train for this line */
    const t0 = i * SLOT, t1 = t0 + MOVE, t2 = t1 + .02, t3 = t1 + .28;
    const kp = i === 0 ? { p: '0;1;1', t: `0;${kt(t1)};1`, s: `${easeOut};0 0 1 1` } : { p: '0;0;1;1', t: `0;${kt(t0)};${kt(t1)};1`, s: `0 0 1 1;${easeOut};0 0 1 1` };
    trains.push(`<g opacity="0" class="car"><animateMotion begin="${RIDE0}s" dur="${CYCLE.toFixed(2)}s" repeatCount="indefinite" rotate="auto" calcMode="spline" keyPoints="${kp.p}" keyTimes="${kp.t}" keySplines="${kp.s}"><mpath href="#${id}"/></animateMotion>` +
      `<animate attributeName="opacity" begin="${RIDE0}s" dur="${CYCLE.toFixed(2)}s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;${kt(Math.max(t0 - .001, 0))};${kt(t0 + .1)};${kt(t2)};${kt(t3)};1"/>` +
      `<rect x="-13" y="-7" width="26" height="14" rx="7" fill="${ln.c}" class="car-b"/><path d="M-6 -2.4h4M2 -2.4h4" class="car-w"/></g>`);
  });

  /* every other line dims while one rides, then all come back for the rest */
  function dimAnim(i) {
    const pts = [[0, 1]];
    let prev = 1;
    LINES.forEach((_, j) => {
      const v = j === i ? 1 : .22, t = j * SLOT;
      pts.push([t, prev], [t + .3, v]);
      prev = v;
    });
    const end = LINES.length * SLOT;
    pts.push([end, prev], [end + .45, 1], [CYCLE, 1]);
    const clean = pts.filter((p, k) => !k || p[0] > pts[k - 1][0] + 1e-6);
    return `<animate attributeName="opacity" begin="${RIDE0}s" dur="${CYCLE.toFixed(2)}s" repeatCount="indefinite" values="${clean.map(p => p[1]).join(';')}" keyTimes="${clean.map(p => kt(p[0])).join(';')}"/>`;
  }

  function bulletInner(ln, b) {
    if (ln.icon === 'tg') {
      const s = b * .56 / 24;
      return `<path transform="translate(${f1(-12 * s)} ${f1(-12 * s)}) scale(${s.toFixed(3)})" d="M3 11.2 20.4 4.1c.8-.3 1.5.4 1.3 1.2l-3 14.2c-.2.9-1.2 1.2-1.9.7l-4.6-3.4-2.3 2.2c-.3.3-.8.1-.8-.3v-3.4l8.3-7.6-10.2 6.4-4.1-1.3c-.9-.3-.9-1.5-.1-1.8z" fill="#fff"/>`;
    }
    const s = b * .62, h = s / 2, id = `bc-${ln.key}`;
    defs.push(`<clipPath id="${id}"><rect x="${f1(-h)}" y="${f1(-h)}" width="${f1(s)}" height="${f1(s)}" rx="${f1(s * .24)}"/></clipPath>`);
    return `<rect x="${f1(-h)}" y="${f1(-h)}" width="${f1(s)}" height="${f1(s)}" rx="${f1(s * .24)}" fill="#fff"/>` +
      `<image href="${A['logo_' + ln.logo]}" x="${f1(-h)}" y="${f1(-h)}" width="${f1(s)}" height="${f1(s)}" clip-path="url(#${id})" preserveAspectRatio="xMidYMid slice"/>` +
      `<rect x="${f1(-h)}" y="${f1(-h)}" width="${f1(s)}" height="${f1(s)}" rx="${f1(s * .24)}" class="bul-ring"/>`;
  }

  /* the trunk's sign, and the ribbon's key */
  const gh = 'M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.38v-1.33c-2.23.48-2.7-1.07-2.7-1.07-.36-.92-.89-1.17-.89-1.17-.73-.5.06-.49.06-.49.8.06 1.23.83 1.23.83.71 1.22 1.87.87 2.33.66.07-.52.28-.87.5-1.07-1.78-.2-3.65-.89-3.65-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0 0 8 0z';
  const hx = XE + 12, gs = B * .56 / 16;
  top.push(`<g class="fade" style="animation-delay:.9s"><circle cx="${hx}" cy="${TRUNK}" r="${B / 2}" class="home-bul"/>` +
    `<path transform="translate(${f1(hx - 8 * gs)} ${f1(TRUNK - 8 * gs)}) scale(${gs.toFixed(3)})" d="${gh}" fill="${T.ink}"/>` +
    `<text x="${hx + B / 2 + 10}" y="${TRUNK - 3}" class="home">justkamal07</text>` +
    `<text x="${hx + B / 2 + 10}" y="${TRUNK + 13}" class="home-s">the trunk every line leaves from</text></g>`);
  const ky = HY - 3, kx = XE + 10;
  const big = layoutName === 'sm' ? 30 : 36;
  const scale = [0, 1, 2, 3, 4].map((v, k) => `<rect x="${f1(kx + 34 + k * 13)}" y="${f1(ky + big + 30)}" width="10" height="10" rx="2" fill="${T.heat(HA[v])}"/>`).join('');
  top.push(`<g class="fade" style="animation-delay:.9s"><text x="${kx}" y="${ky + big * .86}" class="big">${TOTAL.toLocaleString('en-GB')}</text>` +
    `<text x="${kx}" y="${f1(ky + big + 17)}" class="key">${layoutName === 'sm' ? 'contributions' : 'contributions since Feb 2024'}</text>` +
    `<text x="${kx}" y="${f1(ky + big + 38.5)}" class="sc">less</text>${scale}<text x="${f1(kx + 34 + 5 * 13 + 3)}" y="${f1(ky + big + 38.5)}" class="sc">more</text></g>`);

  /* two ZenMode moments, pinned in the corner the lines leave empty */
  const snaps = [];
  if (L.SNAPS) {
    snaps.push(polaroid(40, 30, 160, -4, A.snapA, 'FOSS United meetup, IIT Madras', ['Our ZenMode OS booth'], 1.9));
    snaps.push(polaroid(42, 176, 108, 5, A.snapB, "TOSS '26", ['We sponsored the', 'problem statement'], 2.0));
  }
  function polaroid(x, y, w, rot, src, title, cap, delay) {
    const p = 6, iw = w - p * 2, ih = iw * 9 / 16;
    const titleLines = measure(title, 'display700', 12) > iw ? wrap(title, iw, 'display700', 12) : [title];
    const h = p + ih + 7 + titleLines.length * 14 + cap.length * 13 + 8;
    const id = `snap-${x}`;
    defs.push(`<clipPath id="${id}"><rect x="${x + p}" y="${y + p}" width="${f1(iw)}" height="${f1(ih)}" rx="1"/></clipPath>`);
    let ty = y + p + ih + 7 + 11;
    const tl = titleLines.map(t => { const r = `<text x="${x + p + 1}" y="${f1(ty)}" class="pt">${esc(t)}</text>`; ty += 14; return r; }).join('');
    ty -= 1;
    const cl = cap.map(t => { const r = `<text x="${x + p + 1}" y="${f1(ty)}" class="pc">${esc(t)}</text>`; ty += 13; return r; }).join('');
    const cx = x + w / 2, cy = y + h / 2, bx = x + w - 4, by = y + 4;
    return `<g class="snap" style="animation-delay:${delay}s"><g transform="rotate(${rot} ${f1(cx)} ${f1(cy)})">` +
      `<rect x="${x}" y="${y}" width="${w}" height="${f1(h)}" rx="3" fill="#fff" filter="url(#sh)"/>` +
      `<image href="${src}" x="${x + p}" y="${y + p}" width="${f1(iw)}" height="${f1(ih)}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"/>${tl}${cl}` +
      `<circle cx="${bx}" cy="${by}" r="12" fill="#c6f432" stroke="#111" stroke-width="2"/>` +
      `<clipPath id="${id}-b"><rect x="${f1(bx - 7.4)}" y="${f1(by - 7.4)}" width="14.8" height="14.8" rx="3.6"/></clipPath>` +
      `<rect x="${f1(bx - 7.4)}" y="${f1(by - 7.4)}" width="14.8" height="14.8" rx="3.6" fill="#fff"/>` +
      `<image href="${A.logo_zenmode}" x="${f1(bx - 7.4)}" y="${f1(by - 7.4)}" width="14.8" height="14.8" clip-path="url(#${id}-b)"/>` +
      `<rect x="${f1(bx - 7.4)}" y="${f1(by - 7.4)}" width="14.8" height="14.8" rx="3.6" fill="none" stroke="#111" stroke-width="1.5"/></g></g>`;
  }
  function wrap(s, max, table, size) {
    const words = s.split(' '), out = [''];
    words.forEach(w => { const t = out[out.length - 1] ? out[out.length - 1] + ' ' + w : w; if (measure(t, table, size) > max && out[out.length - 1]) out.push(w); else out[out.length - 1] = t; });
    return out;
  }

  /* the header: kicker, title with its drawn heart, and the blurb */
  const TS = L.TITLE, tY = layoutName === 'sm' ? 96 : 76;
  const tw = measure('Open source Love', 'display800', TS, -.045 * TS);
  const bw = measure('!', 'display800', TS, -.045 * TS);
  const hw = TS * .86, hh = hw * 66 / 72, hx2 = MX - 2 + tw + bw + TS * .14, hy2 = tY - TS * .82;
  const head = [
    `<g class="fade" style="animation-delay:0s"><circle cx="${MX + 6}" cy="${tY - TS - 12}" r="6" class="kd-o"/><circle cx="${MX + 6}" cy="${tY - TS - 12}" r="3" fill="#ef5533"/>` +
    `<text x="${MX + 20}" y="${tY - TS - 7.5}" class="kick">BUILT IN THE OPEN</text></g>`,
    `<text x="${MX - 2}" y="${tY}" class="title rise">Open source Love<tspan fill="#ef5533">!</tspan></text>`,
    `<g transform="translate(${f1(hx2)} ${f1(hy2)}) rotate(12 ${f1(hw / 2)} ${f1(hh * .6)})"><g class="heart"><svg width="${f1(hw)}" height="${f1(hh)}" viewBox="0 0 72 66" overflow="visible">` +
    `<path d="M37 61C20 50 6 39 5 24 4 12 13 5 22 6c6 .6 10 4.4 13.6 9.8C39.4 9.7 44.6 5.4 51.5 5.6 61 6 68 13.6 66.6 25.4 65 39.6 52.4 50.6 37 61z" fill="${T.edge}"/>` +
    `<path d="M33 57C16 46 2 35 1 20 0 8 9 1 18 2c6 .6 10 4.4 13.6 9.8C35.4 5.7 40.6 1.4 47.5 1.6 57 2 64 9.6 62.6 21.4 61 35.6 48.4 46.6 33 57z" fill="#ff3d5e" stroke="${T.edge}" stroke-width="2.6" stroke-linejoin="round"/>` +
    `<path d="M11 14c1.6-4 5.2-6 9-5.4" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".85"/></svg></g></g>`
  ];
  if (L.BLURB) {
    const blurb = ['Seven lines, all public. Each tick is a commit', 'or an issue, each logo a project I filed into.', 'A little train rides every line, one at a time.'];
    head.push(`<g class="fade" style="animation-delay:.2s">${blurb.map((t, k) => `<text x="${L.VW - MX - 48 * 7.2}" y="${34 + k * 19}" class="blurb">${esc(t)}</text>`).join('')}</g>`);
  }

  const hpx = (HY + 7 * CELL) / H;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${L.VW} ${f1(VH)}" width="${L.VW}" height="${f1(VH)}" role="img" aria-labelledby="t d">
<title id="t">Open source Love!</title>
<desc id="d">Seven open-source projects by justkamal07 drawn as transit lines leaving one trunk: Design contributions, Uki AI, ZenMode OS, Night link cleaner, Obspec, Taste MCP and Mozhi, over 1,007 contributions since February 2024.</desc>
<style>
@font-face{font-family:'D';font-weight:500 800;src:url(${A.fDisplay}) format('woff2')}
@font-face{font-family:'S';font-weight:400 600;src:url(${A.fSans}) format('woff2')}
@font-face{font-family:'M';font-weight:400 500;src:url(${A.fMono}) format('woff2')}
text{font-family:'S',-apple-system,'Segoe UI',Helvetica,Arial,sans-serif}
.title{font:800 ${TS}px 'D',-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;letter-spacing:-.045em;fill:${T.ink}}
.kick{font:500 ${layoutName === 'sm' ? 15 : 13}px 'M',ui-monospace,Menlo,monospace;letter-spacing:.12em;fill:${T.ink2}}
.kd-o{fill:none;stroke:${T.line2};stroke-width:1.5}
.blurb{font:400 12px 'M',ui-monospace,Menlo,monospace;fill:${T.ink2}}
.mo{font:500 ${L.MO}px 'M',ui-monospace,Menlo,monospace;fill:${T.muted}}
.tk-case{fill:none;stroke:${T.edge};stroke-width:12;stroke-linecap:round}
.tk-core{fill:none;stroke:${T.sheet};stroke-width:7.5;stroke-linecap:round}
.junc{fill:${T.sheet};stroke:${T.edge};stroke-width:2.4}
.ln-case{fill:none;stroke:${T.edge};stroke-width:11;stroke-linecap:round;stroke-linejoin:round}
.ln-core{fill:none;stroke-width:7.4;stroke-linecap:round;stroke-linejoin:round}
.tick{stroke:${T.edge};stroke-width:1.3;stroke-linecap:round;opacity:.55}
.hollow{fill:none;stroke:${T.sheet};stroke-width:3;stroke-dasharray:5 5}
.st{fill:${T.sheet};stroke:${T.edge};stroke-width:2.4}
.org-link{stroke:${T.edge};stroke-width:2.2}
.org-ring{fill:none;stroke:${T.edge};stroke-width:2}
.plumb{fill:none;stroke-width:1.6;stroke-dasharray:2.5 3.5;opacity:.75}
.pin{stroke:${T.edge};stroke-width:1.4}
.bul{stroke:${T.edge};stroke-width:2}
.bul-ring{fill:none;stroke:${T.edge};stroke-width:1.5}
.home-bul{fill:${T.sheet};stroke:${T.edge};stroke-width:2}
.nm{font:700 ${L.NAME}px 'D',-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;letter-spacing:-.02em;fill:${T.ink}}
.chip{fill:none;stroke:${T.line2};stroke-width:1}
.cht{font:500 10.5px 'M',ui-monospace,Menlo,monospace;fill:${T.ink2}}
.home{font:700 16px 'D',-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;letter-spacing:-.01em;fill:${T.ink}}
.home-s{font:400 12px 'S',-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;fill:${T.muted}}
.big{font:800 ${big}px 'D',-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;letter-spacing:-.03em;fill:${T.ink}}
.key{font:400 13px 'S',-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;fill:${T.ink2}}
.sc{font:500 10px 'M',ui-monospace,Menlo,monospace;fill:${T.muted}}
.pt{font:700 12px 'D',-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;letter-spacing:-.01em;fill:#111}
.pc{font:400 11px 'S',-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;fill:#555}
.car-b{stroke:${T.edge};stroke-width:2}
.car-w{stroke:${T.edge};stroke-width:1.8;stroke-linecap:round}

/* the one moment: trunk first, then every line in the order it began.
   Every rule animates *from* empty, so a viewer that skips CSS animation still shows the finished map */
.draw{stroke-dasharray:1 1;animation:draw 1.1s cubic-bezier(${ease.replace(/ /g, ',')}) both}
@keyframes draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
.fade{animation:fade .45s ease both}
@keyframes fade{from{opacity:0}}
.pop{transform-box:fill-box;transform-origin:50% 50%;animation:pop .45s cubic-bezier(.34,1.56,.64,1) both}
.org.pop{transform-origin:50% 100%}
@keyframes pop{from{transform:scale(0)}}
.heat{animation:fade .6s ease both}
.rise{animation:rise .7s cubic-bezier(${ease.replace(/ /g, ',')}) both}
@keyframes rise{from{opacity:0;transform:translateY(14px)}}
.snap{animation:drop .6s cubic-bezier(.34,1.56,.64,1) both}
@keyframes drop{from{opacity:0;transform:translateY(-14px)}}
.heart{transform-box:fill-box;transform-origin:50% 60%;animation:beat 6s cubic-bezier(${ease.replace(/ /g, ',')}) 2.2s infinite both}
@keyframes beat{0%,18%,100%{transform:none}2.6%{transform:scale(1.22)}5.2%{transform:scale(.96)}7.8%{transform:scale(1.14)}11%{transform:scale(1)}}
@media (prefers-reduced-motion:reduce){.draw,.fade,.pop,.heat,.rise,.snap,.heart{animation:none}}
</style>
<defs>
<radialGradient id="sheet" cx=".3" cy="0" r="1.2" fx=".3" fy="0" gradientTransform="translate(.3 0) scale(1 .9) translate(-.3 0)"><stop offset="0" stop-color="${T.sheet}"/><stop offset=".75" stop-color="${T.sheet2}"/></radialGradient>
<filter id="sh" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="9" stdDeviation="7" flood-color="#000" flood-opacity=".28"/></filter>
${defs.join('\n')}
</defs>
${head.join('\n')}
<rect x="${MX - L.PAD + 1}" y="${L.HEAD + 1}" width="${W + L.PAD * 2 - 2}" height="${H + L.PAD * 2 - 2}" rx="${layoutName === 'sm' ? 22 : 28}" fill="url(#sheet)" stroke="${T.edge}" stroke-width="1.5"/>
<g transform="translate(${MX} ${MY})">
<g class="heat">${heat.join('')}</g>
<g>${plumbs.join('')}</g>
<g>${trunk.join('')}</g>
<g>${lines.join('\n')}</g>
${snaps.join('\n')}
<g>${signs.join('\n')}</g>
${top.join('\n')}
${trains.join('\n')}
</g>
</svg>`;
}

/* the README shows only the desktop layout: GitHub's theme switcher ignores width queries, so the phone layout stays opt-in */
for (const t of Object.keys(THEMES)) for (const l of process.argv.includes('--sm') ? Object.keys(LAYOUTS) : ['lg']) {
  const file = path.join(out, `oss-${t}${l === 'sm' ? '-sm' : ''}.svg`);
  fs.writeFileSync(file, build(t, l));
  console.log(file, (fs.statSync(file).size / 1024).toFixed(0) + ' KB');
}
/* Open source Love, as a self-playing SVG for the GitHub profile README.
   A port of the portfolio's transit map (kamalraaj-portfolio/oss.js + oss.css):
   CSS keyframes draw the map once, then SMIL trains ride each line in turn, forever.
   Usage: node gen.mjs <outdir>  →  oss-light.svg, oss-dark.svg, oss-light-sm.svg, oss-dark-sm.svg */
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const A = JSON.parse(fs.readFileSync(path.join(here, 'assets.json'), 'utf8'));
const WID = JSON.parse(fs.readFileSync(path.join(here, 'widths.json'), 'utf8'));
const out = process.argv[2] || here;

const measure = (s, table, size, track = 0) => [...s].reduce((w, c) => w + (WID[table][c] ?? .6) * size + track, 0);

/* the data, as on the portfolio (pulled from the GitHub API on 29 Oct 2026) */
const START = Date.UTC(2025, 1, 2), WEEKS = 91, TOTAL = 1007;  // since Feb 2024, from the portfolio index (30 Oct 2026)
const HEAT = '00000014332223424433423324443443111141121214414341411111111321122211111111141111111111000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000310000000000000000000000004000000000000000000000000000000000000000000000000000000000000000000001000000000000000000003300300000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000200000100000000000000000000000000000000130012000000010000001001012012102210000411104443400013134222123110443..';
const LINES = [
  { key: 'pp', name: 'Design contributions', c: '#2fd9a8', logo: 'proof', chips: ['10 issues', '1 PR', '4 projects'], upstream: true,
    groups: [[3, 2, 'deepseek'], [3, 7, 'penpot'], [5, 1, 'posthog'], [5, 1, 'codecademy'], [42, 8], [90, 1]] },
  { key: 'uki', name: 'Uki AI', c: '#f2b705', logo: 'uki', chips: ['Figma plugin', '★ 3', 'JavaScript'], groups: [[4, 6], [6, 6], [88, 4]] },
  { key: 'zen', name: 'ZenMode OS', c: '#c6f432', logo: 'zenmode', chips: ['★ 25', 'GPL-3.0', '6 forks', 'Kotlin'],
    groups: [[58, 6], [59, 23], [60, 7], [61, 4], [62, 6], [63, 2], [85, 10], [86, 2]] },
  { key: 'tg', name: 'Night link cleaner', c: '#2aabee', icon: 'tg', chips: ['Telegram bot', '★ 1', 'Python'], groups: [[59, 17]] },
  { key: 'obs', name: 'Obspec', c: '#7c5cff', logo: 'obspec', chips: ['Figma plugin', 'MIT', 'TypeScript'], groups: [[88, 27], [89, 1]] },
  { key: 'taste', name: 'Taste MCP', c: '#ee46d3', logo: 'taste', chips: ['MCP server', 'MIT'], groups: [[90, 6]] },
  { key: 'mozhi', name: 'Mozhi', c: '#d01c22', logo: 'mozhi', chips: ['Apache-2.0', 'macOS', 'Windows'], groups: [[90, 8]] }
];
const ORGS = { deepseek: 'DeepSeek: 2 issues, one shipped', penpot: 'Penpot: 6 issues and a pull request', posthog: 'PostHog: 1 issue', codecademy: 'Codecademy: 1 issue' };

const THEMES = {
  light: { ink: '#111111', ink2: '#424242', muted: '#8a8a8a', line2: 'rgba(17,17,17,.22)', sheet: '#ffffff', sheet2: '#f4f4f2', edge: '#111111', heat: a => `rgba(17,17,17,${a})` },
  dark: { ink: '#f2f1ec', ink2: 'rgba(242,241,236,.72)', muted: '#8e8e95', line2: 'rgba(255,255,255,.22)', sheet: '#17171a', sheet2: '#1f1f23', edge: 'rgba(242,241,236,.86)', heat: a => `rgba(242,241,236,${a})` }
};

/* two layouts: the full map for desktop, and a taller, larger-type one for phones */
const LAYOUTS = {
  lg: { VW: 1240, HEAD: 96, PAD: 20, W: 1200, H: 560, X0: 40, XE: 862, TRUNK: 410, LANE0: 64, LANE: 50, XB0: 74, XBS: 92, SLOPE: 1, R: 16, HY: 452,
        B: 34, NAME: 19, CHIPS: 4, SNAPS: true, ORGS: true, TITLE: 48, BLURB: true, MO: 11 },
  sm: { VW: 640, HEAD: 118, PAD: 14, W: 612, H: 446, X0: 16, XE: 380, TRUNK: 330, LANE0: 34, LANE: 42, XB0: 30, XBS: 32, SLOPE: 2.1, R: 12, HY: 368,
        B: 30, NAME: 19, CHIPS: 0, SNAPS: false, ORGS: false, TITLE: 54, BLURB: false, MO: 13 }
};

const ease = '.2 .7 .2 1', easeOut = '.33 1 .68 1';
const f1 = n => +n.toFixed(1);
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&#39;');
const fmt = w => new Date(START + w * 7 * 864e5).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

function build(themeName, layoutName) {
  const T = THEMES[themeName], L = LAYOUTS[layoutName];
  const { W, H, X0, XE, TRUNK, LANE0, LANE, R, HY, B } = L;
  const CELL = (XE - X0) / WEEKS, GAP = 26;
  const weekX = w => X0 + w * CELL + CELL / 2;
  const MX = (L.VW - W) / 2, MY = L.HEAD + L.PAD;            // where the map sits inside the image
  const VH = MY + H + L.PAD + 6;
  const css = [], defs = [];
  const heat = [], plumbs = [], trunk = [], lines = [], signs = [], top = [], trains = [];

  /* timeline: draw-in first, then one ride per line, then a rest with every line lit */
  const RIDE0 = 3.4, SLOT = 2.6, MOVE = 1.3, REST = 3.6, CYCLE = LINES.length * SLOT + REST;
  const kt = t => +(t / CYCLE).toFixed(4);

  /* the contribution ribbon */
  const HA = [.06, .24, .44, .66, 1];
  for (let i = 0; i < HEAT.length; i++) {
    const v = HEAT[i]; if (v === '.') continue;
    const w = Math.floor(i / 7), d = i % 7;
    heat.push(`<rect x="${f1(X0 + w * CELL + CELL * .1)}" y="${f1(HY + d * CELL)}" width="${f1(CELL * .8)}" height="${f1(CELL * .8)}" rx="${f1(CELL * .2)}" fill="${T.heat(HA[v])}"/>`);
  }
  let firstLabel = true;
  for (let w = 0; w < WEEKS; w++) {
    const t = new Date(START + w * 7 * 864e5), prev = new Date(START + (w - 1) * 7 * 864e5);
    if (w && t.getUTCMonth() === prev.getUTCMonth()) continue;
    if (t.getUTCMonth() % 3) continue;
    if (layoutName === 'sm' && t.getUTCMonth() % 6) continue;
    const label = t.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' }) + (t.getUTCMonth() === 0 || firstLabel ? ' ’' + String(t.getUTCFullYear()).slice(2) : '');
    firstLabel = false;
    heat.push(`<text x="${f1(X0 + w * CELL)}" y="${f1(HY + 7 * CELL + L.MO + 8)}" class="mo">${label}</text>`);
  }

  /* the trunk */
  const tk = `M${X0 - 14} ${TRUNK}H${XE}`;
  trunk.push(`<path d="${tk}" class="tk-case draw" pathLength="1" style="animation-duration:.9s;animation-delay:.1s"/>`,
             `<path d="${tk}" class="tk-core draw" pathLength="1" style="animation-duration:.9s;animation-delay:.1s"/>`);

  LINES.forEach((ln, i) => {
    const y = LANE0 + i * LANE, xb = L.XB0 + i * L.XBS, xd = xb + (TRUNK - y) / L.SLOPE;
    const ang = Math.atan2(TRUNK - y, xd - xb), kx = R * Math.cos(ang) * .75, ky = R * Math.sin(ang) * .75;
    const d = `M${f1(xb - R)} ${TRUNK}Q${f1(xb)} ${TRUNK} ${f1(xb + kx)} ${f1(TRUNK - ky)}L${f1(xd - kx)} ${f1(y + ky)}Q${f1(xd)} ${y} ${f1(xd + R)} ${y}H${XE}`;
    const base = .6 + i * .14;
    const id = `ln-${ln.key}`;
    const dim = dimAnim(i);

    /* the plumb line down to the week it began */
    const px = weekX(ln.groups[0][0]);
    plumbs.push(`<g>${dim}<path d="M${f1(xb)} ${TRUNK + 6}C${f1(xb)} ${TRUNK + 26} ${f1(px)} ${HY - 22} ${f1(px)} ${HY - 5}" class="plumb fade" stroke="${ln.c}" style="animation-delay:${(.9 + i * .14).toFixed(2)}s"/>` +
      `<circle cx="${f1(px)}" cy="${HY - 4}" r="3.2" class="pin fade" fill="${ln.c}" style="animation-delay:${(1.1 + i * .14).toFixed(2)}s"/></g>`);
    trunk.push(`<circle cx="${f1(xb)}" cy="${TRUNK}" r="5.5" class="junc fade" style="animation-duration:.3s;animation-delay:${(.5 + i * .14).toFixed(2)}s"/>`);

    const g = [`<path d="${d}" class="ln-case draw" pathLength="1" style="animation-delay:${base.toFixed(2)}s"/>`,
               `<path id="${id}" d="${d}" class="ln-core draw" stroke="${ln.c}" pathLength="1" style="animation-delay:${base.toFixed(2)}s"/>`];

    /* one tick per commit, a station per week, long silences drawn hollow */
    const runA = xd + R + 10, runB = XE - (layoutName === 'sm' ? 22 : 34), slots = [];
    ln.groups.forEach(([w, n, org], gi) => {
      if (gi && w - ln.groups[gi - 1][0] > GAP) slots.push({ quiet: true });
      else if (gi && org && L.ORGS) slots.push({ pad: true }, { pad: true });
      for (let c = 0; c < n; c++) slots.push({ gi, c });
    });
    const step = (runB - runA) / Math.max(slots.length - 1, 1);
    const frac = x => (x - xb) / (XE - xb);
    const quiet = [];
    slots.forEach((s, si) => {
      const x = runA + si * step;
      if (s.quiet) { quiet.push(x); return; }
      if (s.pad) return;
      g.push(`<path d="M${f1(x)} ${y - 2.6}v5.2" class="tick fade" style="animation-duration:.3s;animation-delay:${(base + frac(x)).toFixed(2)}s"/>`);
    });
    if (ln.upstream) g.push(`<path d="M${f1(xd + R)} ${y}H${XE - 8}" class="hollow fade" style="animation-delay:${(1.5 + i * .14).toFixed(2)}s"/>`);
    quiet.forEach(x => g.push(`<path d="M${f1(x - step * 1.6)} ${y}H${f1(x + step * 1.6)}" class="hollow fade" style="animation-delay:${(1.5 + i * .14).toFixed(2)}s"/>`));
    ln.groups.forEach(([w, n, org], gi) => {
      const mine = slots.map((s, si) => s.gi === gi ? si : -1).filter(si => si >= 0);
      const x = runA + (mine[0] + mine[mine.length - 1]) / 2 * step;
      const r = Math.min(4.2 + Math.sqrt(n) * 1.35, 11) * (layoutName === 'sm' ? .85 : 1);
      if (!org || !L.ORGS) {
        g.push(`<circle cx="${f1(x)}" cy="${y}" r="${f1(r)}" class="st pop" style="animation-delay:${(base + frac(x)).toFixed(2)}s"><title>${org ? esc(ORGS[org]) : `${n} commit${n > 1 ? 's' : ''}, week of ${fmt(w)}`}</title></circle>`);
        return;
      }
      const cy = y - 31, ro = 12.5, cid = `clip-${org}`;
      defs.push(`<clipPath id="${cid}"><circle cx="${f1(x)}" cy="${cy}" r="${ro - 1}"/></clipPath>`);
      g.push(`<circle cx="${f1(x)}" cy="${y}" r="${f1(r)}" class="st pop" style="animation-delay:${(base + frac(x)).toFixed(2)}s"/>`);
      g.push(`<g class="org pop" style="animation-delay:${(base + .15 + frac(x)).toFixed(2)}s"><title>${esc(ORGS[org])}</title>` +
        `<path d="M${f1(x)} ${f1(y - r)}V${cy + ro}" class="org-link"/><circle cx="${f1(x)}" cy="${cy}" r="${ro}" fill="#fff"/>` +
        `<image href="${A['logo_' + org]}" x="${f1(x - ro)}" y="${cy - ro}" width="${ro * 2}" height="${ro * 2}" clip-path="url(#${cid})" preserveAspectRatio="xMidYMid slice"/>` +
        `<circle cx="${f1(x)}" cy="${cy}" r="${ro}" class="org-ring"/></g>`);
    });
    lines.push(`<g>${dim}${g.join('')}</g>`);

    /* the sign at the terminus: a bullet that rings when the train pulls in, the name, the chips */
    const arrive = RIDE0 + i * SLOT + MOVE;
    const ring = `<animateTransform attributeName="transform" type="scale" begin="${RIDE0}s" dur="${CYCLE.toFixed(2)}s" repeatCount="indefinite" calcMode="spline"
      values="1;1;1.32;1.12;1.12;1;1" keyTimes="0;${kt(arrive - RIDE0)};${kt(arrive - RIDE0 + .2)};${kt(arrive - RIDE0 + .5)};${kt(arrive - RIDE0 + SLOT - MOVE - .3)};${kt(arrive - RIDE0 + SLOT - MOVE)};1"
      keySplines="0 0 1 1;.34 1 .64 1;${ease};0 0 1 1;${ease};0 0 1 1"/>`;
    const sx = XE + 12 + B / 2 + 10;
    const s = [`<g transform="translate(${XE} ${y})"><g>${ring}<circle r="${B / 2}" fill="${ln.c}" class="bul"/>${bulletInner(ln, B)}</g></g>`];
    const nameY = L.CHIPS ? y - 5 : y + L.NAME * .36;
    const tx = XE + B / 2 + 10;
    s.push(`<text x="${tx}" y="${f1(nameY)}" class="nm">${esc(ln.name)}</text>`);
    if (L.CHIPS) {
      let cx = tx;
      ln.chips.slice(0, L.CHIPS).forEach(c => {
        const w = c.length * 10.5 * .6 + 12;
        s.push(`<rect x="${f1(cx + .5)}" y="${y + 4.5}" width="${f1(w - 1)}" height="16" rx="8" class="chip"/><text x="${f1(cx + 6)}" y="${y + 16}" class="cht">${esc(c)}</text>`);
        cx += w + 4;
      });
    }
    signs.push(`<g>${dim}<g class="fade" style="animation-delay:${(1.4 + i * .14).toFixed(2)}s">${s.join('')}</g></g>`);

    /* the train for this line */
    const t0 = i * SLOT, t1 = t0 + MOVE, t2 = t1 + .02, t3 = t1 + .28;
    const kp = i === 0 ? { p: '0;1;1', t: `0;${kt(t1)};1`, s: `${easeOut};0 0 1 1` } : { p: '0;0;1;1', t: `0;${kt(t0)};${kt(t1)};1`, s: `0 0 1 1;${easeOut};0 0 1 1` };
    trains.push(`<g opacity="0" class="car"><animateMotion begin="${RIDE0}s" dur="${CYCLE.toFixed(2)}s" repeatCount="indefinite" rotate="auto" calcMode="spline" keyPoints="${kp.p}" keyTimes="${kp.t}" keySplines="${kp.s}"><mpath href="#${id}"/></animateMotion>` +
      `<animate attributeName="opacity" begin="${RIDE0}s" dur="${CYCLE.toFixed(2)}s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;${kt(Math.max(t0 - .001, 0))};${kt(t0 + .1)};${kt(t2)};${kt(t3)};1"/>` +
      `<rect x="-13" y="-7" width="26" height="14" rx="7" fill="${ln.c}" class="car-b"/><path d="M-6 -2.4h4M2 -2.4h4" class="car-w"/></g>`);
  });

  /* every other line dims while one rides, then all come back for the rest */
  function dimAnim(i) {
    const pts = [[0, 1]];
    let prev = 1;
    LINES.forEach((_, j) => {
      const v = j === i ? 1 : .22, t = j * SLOT;
      pts.push([t, prev], [t + .3, v]);
      prev = v;
    });
    const end = LINES.length * SLOT;
    pts.push([end, prev], [end + .45, 1], [CYCLE, 1]);
    const clean = pts.filter((p, k) => !k || p[0] > pts[k - 1][0] + 1e-6);
    return `<animate attributeName="opacity" begin="${RIDE0}s" dur="${CYCLE.toFixed(2)}s" repeatCount="indefinite" values="${clean.map(p => p[1]).join(';')}" keyTimes="${clean.map(p => kt(p[0])).join(';')}"/>`;
  }

  function bulletInner(ln, b) {
    if (ln.icon === 'tg') {
      const s = b * .56 / 24;
      return `<path transform="translate(${f1(-12 * s)} ${f1(-12 * s)}) scale(${s.toFixed(3)})" d="M3 11.2 20.4 4.1c.8-.3 1.5.4 1.3 1.2l-3 14.2c-.2.9-1.2 1.2-1.9.7l-4.6-3.4-2.3 2.2c-.3.3-.8.1-.8-.3v-3.4l8.3-7.6-10.2 6.4-4.1-1.3c-.9-.3-.9-1.5-.1-1.8z" fill="#fff"/>`;
    }
    const s = b * .62, h = s / 2, id = `bc-${ln.key}`;
    defs.push(`<clipPath id="${id}"><rect x="${f1(-h)}" y="${f1(-h)}" width="${f1(s)}" height="${f1(s)}" rx="${f1(s * .24)}"/></clipPath>`);
    return `<rect x="${f1(-h)}" y="${f1(-h)}" width="${f1(s)}" height="${f1(s)}" rx="${f1(s * .24)}" fill="#fff"/>` +
      `<image href="${A['logo_' + ln.logo]}" x="${f1(-h)}" y="${f1(-h)}" width="${f1(s)}" height="${f1(s)}" clip-path="url(#${id})" preserveAspectRatio="xMidYMid slice"/>` +
      `<rect x="${f1(-h)}" y="${f1(-h)}" width="${f1(s)}" height="${f1(s)}" rx="${f1(s * .24)}" class="bul-ring"/>`;
  }

  /* the trunk's sign, and the ribbon's key */
  const gh = 'M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.38v-1.33c-2.23.48-2.7-1.07-2.7-1.07-.36-.92-.89-1.17-.89-1.17-.73-.5.06-.49.06-.49.8.06 1.23.83 1.23.83.71 1.22 1.87.87 2.33.66.07-.52.28-.87.5-1.07-1.78-.2-3.65-.89-3.65-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0 0 8 0z';
  const hx = XE + 12, gs = B * .56 / 16;
  top.push(`<g class="fade" style="animation-delay:.9s"><circle cx="${hx}" cy="${TRUNK}" r="${B / 2}" class="home-bul"/>` +
    `<path transform="translate(${f1(hx - 8 * gs)} ${f1(TRUNK - 8 * gs)}) scale(${gs.toFixed(3)})" d="${gh}" fill="${T.ink}"/>` +
    `<text x="${hx + B / 2 + 10}" y="${TRUNK - 3}" class="home">Kamal007OLica</text>` +
    `<text x="${hx + B / 2 + 10}" y="${TRUNK + 13}" class="home-s">the trunk every line leaves from</text></g>`);
  const ky = HY - 3, kx = XE + 10;
  const big = layoutName === 'sm' ? 30 : 36;
  const scale = [0, 1, 2, 3, 4].map((v, k) => `<rect x="${f1(kx + 34 + k * 13)}" y="${f1(ky + big + 30)}" width="10" height="10" rx="2" fill="${T.heat(HA[v])}"/>`).join('');
  top.push(`<g class="fade" style="animation-delay:.9s"><text x="${kx}" y="${ky + big * .86}" class="big">${TOTAL.toLocaleString('en-GB')}</text>` +
    `<text x="${kx}" y="${f1(ky + big + 17)}" class="key">${layoutName === 'sm' ? 'contributions' : 'contributions since Feb 2024'}</text>` +
    `<text x="${kx}" y="${f1(ky + big + 38.5)}" class="sc">less</text>${scale}<text x="${f1(kx + 34 + 5 * 13 + 3)}" y="${f1(ky + big + 38.5)}" class="sc">more</text></g>`);

  /* two ZenMode moments, pinned in the corner the lines leave empty */
  const snaps = [];
  if (L.SNAPS) {
    snaps.push(polaroid(40, 30, 160, -4, A.snapA, 'FOSS United meetup, IIT Madras', ['Our ZenMode OS booth'], 1.9));
    snaps.push(polaroid(42, 176, 108, 5, A.snapB, "TOSS '26", ['We sponsored the', 'problem statement'], 2.0));
  }
  function polaroid(x, y, w, rot, src, title, cap, delay) {
    const p = 6, iw = w - p * 2, ih = iw * 9 / 16;
    const titleLines = measure(title, 'display700', 12) > iw ? wrap(title, iw, 'display700', 12) : [title];
    const h = p + ih + 7 + titleLines.length * 14 + cap.length * 13 + 8;
    const id = `snap-${x}`;
    defs.push(`<clipPath id="${id}"><rect x="${x + p}" y="${y + p}" width="${f1(iw)}" height="${f1(ih)}" rx="1"/></clipPath>`);
    let ty = y + p + ih + 7 + 11;
    const tl = titleLines.map(t => { const r = `<text x="${x + p + 1}" y="${f1(ty)}" class="pt">${esc(t)}</text>`; ty += 14; return r; }).join('');
    ty -= 1;
    const cl = cap.map(t => { const r = `<text x="${x + p + 1}" y="${f1(ty)}" class="pc">${esc(t)}</text>`; ty += 13; return r; }).join('');
    const cx = x + w / 2, cy = y + h / 2, bx = x + w - 4, by = y + 4;
    return `<g class="snap" style="animation-delay:${delay}s"><g transform="rotate(${rot} ${f1(cx)} ${f1(cy)})">` +
      `<rect x="${x}" y="${y}" width="${w}" height="${f1(h)}" rx="3" fill="#fff" filter="url(#sh)"/>` +
      `<image href="${src}" x="${x + p}" y="${y + p}" width="${f1(iw)}" height="${f1(ih)}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"/>${tl}${cl}` +
      `<circle cx="${bx}" cy="${by}" r="12" fill="#c6f432" stroke="#111" stroke-width="2"/>` +
      `<clipPath id="${id}-b"><rect x="${f1(bx - 7.4)}" y="${f1(by - 7.4)}" width="14.8" height="14.8" rx="3.6"/></clipPath>` +
      `<rect x="${f1(bx - 7.4)}" y="${f1(by - 7.4)}" width="14.8" height="14.8" rx="3.6" fill="#fff"/>` +
      `<image href="${A.logo_zenmode}" x="${f1(bx - 7.4)}" y="${f1(by - 7.4)}" width="14.8" height="14.8" clip-path="url(#${id}-b)"/>` +
      `<rect x="${f1(bx - 7.4)}" y="${f1(by - 7.4)}" width="14.8" height="14.8" rx="3.6" fill="none" stroke="#111" stroke-width="1.5"/></g></g>`;
  }
  function wrap(s, max, table, size) {
    const words = s.split(' '), out = [''];
    words.forEach(w => { const t = out[out.length - 1] ? out[out.length - 1] + ' ' + w : w; if (measure(t, table, size) > max && out[out.length - 1]) out.push(w); else out[out.length - 1] = t; });
    return out;
  }

  /* the header: kicker, title with its drawn heart, and the blurb */
  const TS = L.TITLE, tY = layoutName === 'sm' ? 96 : 76;
  const tw = measure('Open source Love', 'display800', TS, -.045 * TS);
  const bw = measure('!', 'display800', TS, -.045 * TS);
  const hw = TS * .86, hh = hw * 66 / 72, hx2 = MX - 2 + tw + bw + TS * .14, hy2 = tY - TS * .82;
  const head = [
    `<g class="fade" style="animation-delay:0s"><circle cx="${MX + 6}" cy="${tY - TS - 12}" r="6" class="kd-o"/><circle cx="${MX + 6}" cy="${tY - TS - 12}" r="3" fill="#ef5533"/>` +
    `<text x="${MX + 20}" y="${tY - TS - 7.5}" class="kick">BUILT IN THE OPEN</text></g>`,
    `<text x="${MX - 2}" y="${tY}" class="title rise">Open source Love<tspan fill="#ef5533">!</tspan></text>`,
    `<g transform="translate(${f1(hx2)} ${f1(hy2)}) rotate(12 ${f1(hw / 2)} ${f1(hh * .6)})"><g class="heart"><svg width="${f1(hw)}" height="${f1(hh)}" viewBox="0 0 72 66" overflow="visible">` +
    `<path d="M37 61C20 50 6 39 5 24 4 12 13 5 22 6c6 .6 10 4.4 13.6 9.8C39.4 9.7 44.6 5.4 51.5 5.6 61 6 68 13.6 66.6 25.4 65 39.6 52.4 50.6 37 61z" fill="${T.edge}"/>` +
    `<path d="M33 57C16 46 2 35 1 20 0 8 9 1 18 2c6 .6 10 4.4 13.6 9.8C35.4 5.7 40.6 1.4 47.5 1.6 57 2 64 9.6 62.6 21.4 61 35.6 48.4 46.6 33 57z" fill="#ff3d5e" stroke="${T.edge}" stroke-width="2.6" stroke-linejoin="round"/>` +
    `<path d="M11 14c1.6-4 5.2-6 9-5.4" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".85"/></svg></g></g>`
  ];
  if (L.BLURB) {
    const blurb = ['Seven lines, all public. Each tick is a commit', 'or an issue, each logo a project I filed into.', 'A little train rides every line, one at a time.'];
    head.push(`<g class="fade" style="animation-delay:.2s">${blurb.map((t, k) => `<text x="${L.VW - MX - 48 * 7.2}" y="${34 + k * 19}" class="blurb">${esc(t)}</text>`).join('')}</g>`);
  }

  const hpx = (HY + 7 * CELL) / H;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${L.VW} ${f1(VH)}" width="${L.VW}" height="${f1(VH)}" role="img" aria-labelledby="t d">
<title id="t">Open source Love!</title>
<desc id="d">Seven open-source projects by Kamal007OLica drawn as transit lines leaving one trunk: Design contributions, Uki AI, ZenMode OS, Night link cleaner, Obspec, Taste MCP and Mozhi, over 1,007 contributions since February 2024.</desc>
<style>
@font-face{font-family:'D';font-weight:500 800;src:url(${A.fDisplay}) format('woff2')}
@font-face{font-family:'S';font-weight:400 600;src:url(${A.fSans}) format('woff2')}
@font-face{font-family:'M';font-weight:400 500;src:url(${A.fMono}) format('woff2')}
text{font-family:'S',-apple-system,'Segoe UI',Helvetica,Arial,sans-serif}
.title{font:800 ${TS}px 'D',-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;letter-spacing:-.045em;fill:${T.ink}}
.kick{font:500 ${layoutName === 'sm' ? 15 : 13}px 'M',ui-monospace,Menlo,monospace;letter-spacing:.12em;fill:${T.ink2}}
.kd-o{fill:none;stroke:${T.line2};stroke-width:1.5}
.blurb{font:400 12px 'M',ui-monospace,Menlo,monospace;fill:${T.ink2}}
.mo{font:500 ${L.MO}px 'M',ui-monospace,Menlo,monospace;fill:${T.muted}}
.tk-case{fill:none;stroke:${T.edge};stroke-width:12;stroke-linecap:round}
.tk-core{fill:none;stroke:${T.sheet};stroke-width:7.5;stroke-linecap:round}
.junc{fill:${T.sheet};stroke:${T.edge};stroke-width:2.4}
.ln-case{fill:none;stroke:${T.edge};stroke-width:11;stroke-linecap:round;stroke-linejoin:round}
.ln-core{fill:none;stroke-width:7.4;stroke-linecap:round;stroke-linejoin:round}
.tick{stroke:${T.edge};stroke-width:1.3;stroke-linecap:round;opacity:.55}
.hollow{fill:none;stroke:${T.sheet};stroke-width:3;stroke-dasharray:5 5}
.st{fill:${T.sheet};stroke:${T.edge};stroke-width:2.4}
.org-link{stroke:${T.edge};stroke-width:2.2}
.org-ring{fill:none;stroke:${T.edge};stroke-width:2}
.plumb{fill:none;stroke-width:1.6;stroke-dasharray:2.5 3.5;opacity:.75}
.pin{stroke:${T.edge};stroke-width:1.4}
.bul{stroke:${T.edge};stroke-width:2}
.bul-ring{fill:none;stroke:${T.edge};stroke-width:1.5}
.home-bul{fill:${T.sheet};stroke:${T.edge};stroke-width:2}
.nm{font:700 ${L.NAME}px 'D',-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;letter-spacing:-.02em;fill:${T.ink}}
.chip{fill:none;stroke:${T.line2};stroke-width:1}
.cht{font:500 10.5px 'M',ui-monospace,Menlo,monospace;fill:${T.ink2}}
.home{font:700 16px 'D',-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;letter-spacing:-.01em;fill:${T.ink}}
.home-s{font:400 12px 'S',-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;fill:${T.muted}}
.big{font:800 ${big}px 'D',-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;letter-spacing:-.03em;fill:${T.ink}}
.key{font:400 13px 'S',-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;fill:${T.ink2}}
.sc{font:500 10px 'M',ui-monospace,Menlo,monospace;fill:${T.muted}}
.pt{font:700 12px 'D',-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;letter-spacing:-.01em;fill:#111}
.pc{font:400 11px 'S',-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;fill:#555}
.car-b{stroke:${T.edge};stroke-width:2}
.car-w{stroke:${T.edge};stroke-width:1.8;stroke-linecap:round}

/* the one moment: trunk first, then every line in the order it began.
   Every rule animates *from* empty, so a viewer that skips CSS animation still shows the finished map */
.draw{stroke-dasharray:1 1;animation:draw 1.1s cubic-bezier(${ease.replace(/ /g, ',')}) both}
@keyframes draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
.fade{animation:fade .45s ease both}
@keyframes fade{from{opacity:0}}
.pop{transform-box:fill-box;transform-origin:50% 50%;animation:pop .45s cubic-bezier(.34,1.56,.64,1) both}
.org.pop{transform-origin:50% 100%}
@keyframes pop{from{transform:scale(0)}}
.heat{animation:fade .6s ease both}
.rise{animation:rise .7s cubic-bezier(${ease.replace(/ /g, ',')}) both}
@keyframes rise{from{opacity:0;transform:translateY(14px)}}
.snap{animation:drop .6s cubic-bezier(.34,1.56,.64,1) both}
@keyframes drop{from{opacity:0;transform:translateY(-14px)}}
.heart{transform-box:fill-box;transform-origin:50% 60%;animation:beat 6s cubic-bezier(${ease.replace(/ /g, ',')}) 2.2s infinite both}
@keyframes beat{0%,18%,100%{transform:none}2.6%{transform:scale(1.22)}5.2%{transform:scale(.96)}7.8%{transform:scale(1.14)}11%{transform:scale(1)}}
@media (prefers-reduced-motion:reduce){.draw,.fade,.pop,.heat,.rise,.snap,.heart{animation:none}}
</style>
<defs>
<radialGradient id="sheet" cx=".3" cy="0" r="1.2" fx=".3" fy="0" gradientTransform="translate(.3 0) scale(1 .9) translate(-.3 0)"><stop offset="0" stop-color="${T.sheet}"/><stop offset=".75" stop-color="${T.sheet2}"/></radialGradient>
<filter id="sh" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="9" stdDeviation="7" flood-color="#000" flood-opacity=".28"/></filter>
${defs.join('\n')}
</defs>
${head.join('\n')}
<rect x="${MX - L.PAD + 1}" y="${L.HEAD + 1}" width="${W + L.PAD * 2 - 2}" height="${H + L.PAD * 2 - 2}" rx="${layoutName === 'sm' ? 22 : 28}" fill="url(#sheet)" stroke="${T.edge}" stroke-width="1.5"/>
<g transform="translate(${MX} ${MY})">
<g class="heat">${heat.join('')}</g>
<g>${plumbs.join('')}</g>
<g>${trunk.join('')}</g>
<g>${lines.join('\n')}</g>
${snaps.join('\n')}
<g>${signs.join('\n')}</g>
${top.join('\n')}
${trains.join('\n')}
</g>
</svg>`;
}

/* the README shows only the desktop layout: GitHub's theme switcher ignores width queries, so the phone layout stays opt-in */
for (const t of Object.keys(THEMES)) for (const l of process.argv.includes('--sm') ? Object.keys(LAYOUTS) : ['lg']) {
  const file = path.join(out, `oss-${t}${l === 'sm' ? '-sm' : ''}.svg`);
  fs.writeFileSync(file, build(t, l));
  console.log(file, (fs.statSync(file).size / 1024).toFixed(0) + ' KB');
}
