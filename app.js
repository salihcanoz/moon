(() => {
  // ================= Astronomy =================
  const DEG = Math.PI / 180;
  const norm = a => ((a % 360) + 360) % 360;
  const wrap180 = a => { a = norm(a); return a > 180 ? a - 360 : a; };
  const sin = d => Math.sin(d * DEG), cos = d => Math.cos(d * DEG);
  const DELTA_T = 69.2 / 86400;               // TT − UTC, in days (approx.)
  const SYNODIC = 29.530588853;

  const jdOf = ms => ms / 86400000 + 2440587.5 + DELTA_T;
  const msOf = jd => (jd - 2440587.5 - DELTA_T) * 86400000;

  function sun(jd) {
    const T = (jd - 2451545) / 36525;
    const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
    const e = 0.016708634 - 0.000042037 * T;
    const C = (1.914602 - 0.004817 * T) * sin(M) + (0.019993 - 0.000101 * T) * sin(2 * M) + 0.000289 * sin(3 * M);
    const omega = 125.04 - 1934.136 * T;
    const lon = norm(L0 + C - 0.00569 - 0.00478 * sin(omega)); // apparent longitude
    const v = M + C;
    const R = 1.000001018 * (1 - e * e) / (1 + e * cos(v));
    return { lon, R };
  }

  function moon(jd) {
    const T = (jd - 2451545) / 36525;
    const Lp = 218.3164477 + 481267.88123421 * T;
    const D  = 297.8501921 + 445267.1114034 * T;
    const M  = 357.5291092 + 35999.0502909 * T;
    const Mp = 134.9633964 + 477198.8675055 * T;
    const F  = 93.2720950 + 483202.0175233 * T;
    const E  = 1 - 0.002516 * T;

    // [D, M, M', F, coeff_lon, coeff_dist]
    const LR = [
      [0,0,1,0, 6288774,-20905355],[2,0,-1,0,1274027,-3699111],[2,0,0,0,658314,-2955968],
      [0,0,2,0,213618,-569925],[0,1,0,0,-185116,48888],[0,0,0,2,-114332,-3149],
      [2,0,-2,0,58793,246158],[2,-1,-1,0,57066,-152138],[2,0,1,0,53322,-170733],
      [2,-1,0,0,45758,-204586],[0,1,-1,0,-40923,-129620],[1,0,0,0,-34720,108743],
      [0,1,1,0,-30383,104755],[2,0,0,-2,15327,10321],[0,0,1,2,-12528,0],
      [0,0,1,-2,10980,79661],[4,0,-1,0,10675,-34782],[0,0,3,0,10034,-23210],
      [4,0,-2,0,8548,-21636],[2,1,-1,0,-7888,24208],[2,1,0,0,-6766,30824],
      [1,0,-1,0,-5163,-8379],[1,1,0,0,4987,-16675],[2,-1,1,0,4036,-12831],
      [2,0,2,0,3994,-10445],[4,0,0,0,3861,-11650],[2,0,-3,0,3665,14403],
      [0,1,-2,0,-2689,-7003],[2,0,-1,2,-2602,0],[2,-1,-2,0,2390,10056],
      [1,0,1,0,-2348,6322],[2,-2,0,0,2236,-9884],[0,1,2,0,-2120,5751],
      [0,2,0,0,-2069,0],[2,-2,-1,0,2048,-4950],[2,0,1,-2,-1773,4130],
      [2,0,0,2,-1595,0],[4,-1,-1,0,1215,-3958],[0,0,2,2,-1110,0],
      [3,0,-1,0,-892,3258],[2,1,1,0,-810,2616],[4,-1,-2,0,759,-1897],
      [0,2,-1,0,-713,-2117],[2,2,-1,0,-700,2354],[2,1,-2,0,691,0],
      [2,-1,0,-2,596,0],[4,0,1,0,549,-1423],[0,0,4,0,537,-1117],
      [4,-1,0,0,520,-1571],[1,0,-2,0,-487,-1739],[2,1,0,-2,-399,0],
      [0,0,2,-2,-381,-4421],[1,1,1,0,351,0],[3,0,-2,0,-340,0],
      [4,0,-3,0,330,0],[2,-1,2,0,327,0],[0,2,1,0,-323,1165],
      [1,1,-1,0,299,0],[2,0,3,0,294,0],[2,0,-1,-2,0,8752]
    ];
    const B = [
      [0,0,0,1,5128122],[0,0,1,1,280602],[0,0,1,-1,277693],[2,0,0,-1,173237],
      [2,0,-1,1,55413],[2,0,-1,-1,46271],[2,0,0,1,32573],[0,0,2,1,17198],
      [2,0,1,-1,9266],[0,0,2,-1,8822],[2,-1,0,-1,8216],[2,0,-2,-1,4324],
      [2,0,1,1,4200],[2,1,0,-1,-3359],[2,-1,-1,1,2463],[2,-1,0,1,2211],
      [2,-1,-1,-1,2065],[0,1,-1,-1,-1870],[4,0,-1,-1,1828],[0,1,0,1,-1794],
      [0,0,0,3,-1749],[0,1,-1,1,-1565],[1,0,0,1,-1491],[0,1,1,1,-1475],
      [0,1,1,-1,-1410],[0,1,0,-1,-1344],[1,0,0,-1,-1335],[0,0,3,1,1107],
      [4,0,0,-1,1021],[4,0,-1,1,833]
    ];

    let sl = 0, sr = 0, sb = 0;
    for (const [d, m, mp, f, cl, cr] of LR) {
      const arg = d * D + m * M + mp * Mp + f * F;
      const ef = Math.abs(m) === 1 ? E : Math.abs(m) === 2 ? E * E : 1;
      sl += cl * ef * sin(arg);
      sr += cr * ef * cos(arg);
    }
    for (const [d, m, mp, f, cb] of B) {
      const ef = Math.abs(m) === 1 ? E : Math.abs(m) === 2 ? E * E : 1;
      sb += cb * ef * sin(d * D + m * M + mp * Mp + f * F);
    }
    const A1 = 119.75 + 131.849 * T, A2 = 53.09 + 479264.29 * T, A3 = 313.45 + 481266.484 * T;
    sl += 3958 * sin(A1) + 1962 * sin(Lp - F) + 318 * sin(A2);
    sb += -2235 * sin(Lp) + 382 * sin(A3) + 175 * sin(A1 - F) + 175 * sin(A1 + F) + 127 * sin(Lp - Mp) - 115 * sin(Lp + Mp);

    const omega = 125.04 - 1934.136 * T;
    return {
      lon: norm(Lp + sl / 1e6 - 0.00478 * sin(omega)),
      lat: sb / 1e6,
      dist: 385000.56 + sr / 1000
    };
  }

  const elongation = jd => norm(moon(jd).lon - sun(jd).lon);

  const obliquity = jd => 23.439291 - 0.0130042 * (jd - 2451545) / 36525;
  // ecliptic → equatorial (right ascension, declination), degrees
  function eclToEq(lon, lat, eps) {
    const ra = Math.atan2(sin(lon) * cos(eps) - Math.tan(lat * DEG) * sin(eps), cos(lon)) / DEG;
    const dec = Math.asin(sin(lat) * cos(eps) + cos(lat) * sin(eps) * sin(lon)) / DEG;
    return { ra: norm(ra), dec };
  }
  // Greenwich mean sidereal time (degrees) for a UT Julian date
  function gmst(jdUT) {
    const d = jdUT - 2451545, T = d / 36525;
    return norm(280.46061837 + 360.98564736629 * d + 0.000387933 * T * T);
  }

  // Points on Earth where the Sun and Moon are directly overhead, as [longitude, latitude]
  function overheadAt(jd, s = sun(jd), m = moon(jd)) {
    const eps = obliquity(jd), st = gmst(jd - DELTA_T);
    const sEq = eclToEq(s.lon, 0, eps), mEq = eclToEq(m.lon, m.lat, eps);
    return {
      sun: [wrap180(sEq.ra - st), sEq.dec],
      moon: [wrap180(mEq.ra - st), mEq.dec],
      // Viewpoint of the close-up: the Sun is kept on the right, so the viewer is 90° behind the
      // Sun in ecliptic longitude, raised VIEW_EL degrees above the orbital plane.
      view: (v => [wrap180(v.ra - st), v.dec])(eclToEq(norm(s.lon - 90), VIEW_EL, eps)),
      // where the ecliptic north pole (RA 270°, dec 90° − ε) sits on Earth; it must point up on screen
      eclPole: [wrap180(270 - st), 90 - eps],
      // How far (degrees) from the point below the Moon it is still above the horizon: 90°, less the
      // Moon's parallax (it is close enough that Earth's size matters), plus atmospheric refraction.
      moonReach: 90 - Math.asin(6378.14 / m.dist) / DEG + 0.57
    };
  }

  // Find the moment the elongation equals `target` (0 = new, 180 = full).
  // dir = -1 → most recent at/before jd, +1 → first strictly after jd.
  function findPhase(jd, target, dir) {
    const refine = t => {
      for (let i = 0; i < 12; i++) {
        const d = wrap180(elongation(t) - target);
        const rate = wrap180(elongation(t + 0.01) - elongation(t)) / 0.01;
        t -= d / rate;
        if (Math.abs(d) < 1e-6) break;
      }
      return t;
    };
    // Solve for the occurrence nearest to jd, then step one lunation if it is on the wrong side.
    // EPS (~1 s) absorbs rounding noise, so sitting exactly on a new moon counts as "at" it.
    const EPS = 1e-5;
    let t = refine(jd - wrap180(elongation(jd) - target) / 12.19);
    if (dir < 0) { while (t > jd + EPS) t = refine(t - SYNODIC); }
    else { while (t <= jd + EPS) t = refine(t + SYNODIC); }
    return t;
  }

  // ================= Languages =================
  // The texts themselves live in translations.js (loaded before this file) as the global I18N.
  // Start in the browser's language when it is one we have; a choice made in the picker is remembered.
  const browserLangs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en'];
  let LANG = 'en', LOCALE = 'en';
  function chooseLang(lang) {
    LANG = I18N[lang] ? lang : 'en';
    // keep the visitor's own regional format (e.g. en-GB, nl-BE) when it matches the language
    // (English without an English browser uses day-first dates and the 24-hour clock)
    LOCALE = browserLangs.find(l => l.toLowerCase().split('-')[0] === LANG) || (LANG === 'en' ? 'en-GB' : LANG);
  }
  let savedLang = null;
  try { savedLang = localStorage.getItem('moon-lang'); } catch (e) { /* storage unavailable */ }
  chooseLang(I18N[savedLang] ? savedLang
    : (browserLangs.map(l => l.toLowerCase().split('-')[0]).find(l => I18N[l]) || 'en'));
  // text for the current language (falls back to English); functions take their values as arguments
  const L = (key, ...args) => {
    const v = key in I18N[LANG] ? I18N[LANG][key] : I18N.en[key];
    return typeof v === 'function' ? v(...args) : v;
  };
  // number in the current language's format, with a fixed number of decimals
  const num = (v, digits = 0) => v.toLocaleString(LOCALE, { minimumFractionDigits: digits, maximumFractionDigits: digits });

  // ================= Formatting =================
  const fmtLocal = ms => new Date(ms).toLocaleString(LOCALE, {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
  const fmtShort = ms => new Date(ms).toLocaleString(LOCALE, {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
  const fmtUtc = ms => new Date(ms).toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
  const fmtDeg = d => num(d, 2) + '°';
  const pad = n => String(n).padStart(2, '0');
  const toInputValue = ms => {
    const d = new Date(ms);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  function relDays(ms, ref) {
    const d = (ms - ref) / 86400000;
    const a = Math.abs(d);
    const s = a < 1 ? `${num(a * 24, 1)} ${L('hUnit')}` : `${num(a, 1)} ${L('dUnit')}`;
    return d >= 0 ? L('relIn', s) : L('relAgo', s);
  }

  function phaseName(e) {
    const names = L('phases');
    if (e < 6 || e > 354) return names[0];
    if (e < 84) return names[1];
    if (e < 96) return names[2];
    if (e < 174) return names[3];
    if (e < 186) return names[4];
    if (e < 264) return names[5];
    if (e < 276) return names[6];
    return names[7];
  }

  // ================= SVG helpers =================
  const NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs = {}, parent) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  // ecliptic longitude → SVG coords (counter-clockwise, y up)
  const polar = (r, lonDeg) => [r * cos(lonDeg), -r * sin(lonDeg)];
  // The close-up is one consistent 3-D view: Sun to the right, seen from VIEW_EL degrees above
  // Earth's orbital plane. `a` = angle from the Sun around Earth, `lat` = height above the plane.
  const VIEW_EL = 30;
  const proj3 = (r, a, lat = 0) => [
    r * cos(lat) * cos(a),
    -(r * cos(lat) * sin(a) * sin(VIEW_EL) + r * sin(lat) * cos(VIEW_EL))
  ];
  const halfDisk = r => `M0 ${-r} A${r} ${r} 0 0 1 0 ${r} Z`; // right half (+x)

  function addStars(svg, n, seed) {
    let s = seed;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const g = el('g', { opacity: .7 }, svg);
    for (let i = 0; i < n; i++) {
      el('circle', { cx: rnd() * 460 - 230, cy: rnd() * 460 - 230, r: rnd() * 0.9 + 0.2, fill: '#fff', opacity: rnd() * .6 + .2 }, g);
    }
  }

  function addDefs(svg) {
    const defs = el('defs', {}, svg);
    const sg = el('radialGradient', { id: svg.id + '-sun' }, defs);
    el('stop', { offset: '0%', 'stop-color': '#fff6d0' }, sg);
    el('stop', { offset: '45%', 'stop-color': '#ffc94a' }, sg);
    el('stop', { offset: '100%', 'stop-color': '#ff9a1f', 'stop-opacity': 0 }, sg);
    const mk = el('marker', { id: svg.id + '-arrow', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' }, defs);
    el('path', { d: 'M0 0 L10 5 L0 10 z', fill: '#ffc94a' }, mk);
  }

  // ---------- Geocentric view ----------
  const geo = document.getElementById('geo');
  addDefs(geo); addStars(geo, 90, 99);
  const G = { ORBIT: 150, EARTH: 48, MOON: 15 };
  const gSunG = el('g', {}, geo);               // sunlight side: the Sun is always on the right
  for (let y = -100; y <= 100; y += 50) {
    el('line', { x1: 228, y1: y, x2: 190, y2: y, stroke: '#ffc94a', 'stroke-width': 1.4, 'marker-end': 'url(#geo-arrow)', opacity: .75 }, gSunG);
  }
  el('text', { x: 228, y: -113, fill: '#ffc94a', 'font-size': 8, 'text-anchor': 'end', 'data-i18n': 'toSun' }, gSunG);
  const gNewMark = el('circle', { cx: G.ORBIT, cy: 0, r: 5, fill: 'none', stroke: '#ff6b8b', 'stroke-width': 2 }, gSunG);
  const gNewLbl = el('text', { y: 2.3, fill: '#ff6b8b', 'font-size': 6.5, 'text-anchor': 'start', 'data-i18n': 'svgNew' }, gSunG);
  const gFullLbl = el('text', { y: 2.3, fill: '#8b93b3', 'font-size': 6.5, 'text-anchor': 'end', 'data-i18n': 'svgFull' }, gSunG);
  const gShadow = el('rect', { x: -230, y: -G.EARTH, width: 230, height: G.EARTH * 2, fill: '#000', opacity: .35 }, gSunG);
  // The Moon's real path over one sidereal month (true distances, Earth off-centre), redrawn each frame
  const gOrbit = el('path', { fill: 'none', stroke: '#3a4366', 'stroke-dasharray': '3 5' }, geo);
  const apsis = () => {
    const g = el('g', {}, geo);
    el('circle', { r: 2.2, fill: '#8b93b3' }, g);
    const txt = el('text', { fill: '#8b93b3', 'font-size': 6 }, g);
    el('tspan', {}, txt); el('tspan', { dy: 7 }, txt);
    return g;
  };
  const gPeri = apsis(), gApo = apsis();
  const gAlign = el('line', { stroke: '#ff6b8b', 'stroke-width': 2, 'stroke-dasharray': '5 4', opacity: 0 }, geo);
  const gEarthG = el('g', {}, geo);
  el('circle', { r: G.EARTH, fill: '#0f2a55' }, gEarthG);
  el('path', { d: halfDisk(G.EARTH), fill: '#3d8bff' }, gEarthG);
  const gGlobeG = el('g', {}, geo);             // real globe (filled in when d3 is available)
  el('circle', { r: G.EARTH + 4, fill: 'none', stroke: '#7fb0ff', 'stroke-width': 3, opacity: .18 }, geo); // atmosphere
  el('circle', { r: G.EARTH, fill: 'none', stroke: '#7fb0ff', opacity: .5 }, geo);
  el('text', { y: G.EARTH + 13, fill: '#9fb8ff', 'font-size': 7, 'text-anchor': 'middle', 'font-weight': 600, 'data-i18n': 'earth' }, geo);
  const gMoonG = el('g', {}, geo);
  el('circle', { r: G.MOON, fill: '#2b2e38' }, gMoonG);
  const gMoonDayG = el('g', {}, gMoonG);
  el('path', { d: halfDisk(G.MOON), fill: '#e6e8f0' }, gMoonDayG);
  el('circle', { r: G.MOON, fill: 'none', stroke: '#9aa0b5', opacity: .5 }, gMoonG);
  const gMoonLbl = el('text', { fill: '#cfd3e3', 'font-size': 7, 'text-anchor': 'middle', 'data-i18n': 'moon' }, geo);
  const gElongTxt = el('text', { x: -222, y: 124, fill: '#8b93b3', 'font-size': 7 }, geo);

  // ---------- Phase disk ----------
  const phaseSvg = document.getElementById('phaseSvg');
  const pr = 48;
  el('circle', { r: pr, fill: '#24262f' }, phaseSvg);
  const pLit = el('path', { fill: '#eceef4' }, phaseSvg);
  el('circle', { r: pr, fill: 'none', stroke: '#565c73' }, phaseSvg);

  function phasePath(e) {
    const k = cos(e);                    // +1 new, −1 full
    const litRight = e < 180;            // waxing → right side lit (N. hemisphere)
    const rx = Math.abs(k) * pr;
    const s1 = litRight ? 1 : 0;
    const s2 = litRight ? (k > 0 ? 0 : 1) : (k > 0 ? 1 : 0);
    return `M0 ${-pr} A${pr} ${pr} 0 0 ${s1} 0 ${pr} A${rx} ${pr} 0 0 ${s2} 0 ${-pr} Z`;
  }

  // ================= Real Earth (globe + world map) =================
  const HAS_D3 = typeof d3 !== 'undefined' && typeof topojson !== 'undefined';
  const mapSvg = document.getElementById('worldMap');
  const earth = {};
  const LAND = '#4f9a63', OCEAN = '#16406e', BORDER = 'rgba(255,255,255,.28)';

  if (HAS_D3) {
    // --- Globe: orthographic, seen from the same viewpoint as the orbit (VIEW_EL above the orbital
    //     plane, Sun to the right) with its true 23.4° axis tilt.
    gEarthG.style.display = 'none';
    const gp = d3.geoOrthographic().scale(G.EARTH).translate([0, 0]).clipAngle(90);
    earth.gPath = d3.geoPath(gp);
    earth.globeProj = gp;
    earth.graticule = d3.geoGraticule10();

    const gg = gGlobeG;
    el('path', { d: earth.gPath({ type: 'Sphere' }), fill: OCEAN }, gg);
    earth.gGrat = el('path', { fill: 'none', stroke: 'rgba(255,255,255,.12)', 'stroke-width': .5 }, gg);
    earth.gLand = el('path', { fill: LAND }, gg);
    earth.gBorders = el('path', { fill: 'none', stroke: BORDER, 'stroke-width': .4 }, gg);
    earth.gTwilight = el('path', { fill: '#000', opacity: .25 }, gg);
    earth.gNight = el('path', { fill: '#000814', opacity: .55 }, gg);
    // part of Earth where the Moon is above the horizon right now
    earth.gMoonVis = el('path', { fill: 'rgba(196, 170, 255, .26)', stroke: '#c4aaff', 'stroke-width': .9 }, gg);

    // paths traced over the ground by the points where the Sun / Moon are overhead
    earth.gSunTrack = el('path', { fill: 'none', stroke: '#ffc94a', 'stroke-width': 1, opacity: .9 }, gg);
    earth.gMoonTrack = el('path', { fill: 'none', stroke: '#e6e8f0', 'stroke-width': 1, opacity: .9 }, gg);
    earth.gSunDot = el('circle', { r: 3, fill: '#ffc94a', stroke: '#000', 'stroke-width': .5 }, gg);
    earth.gMoonDot = el('circle', { r: 2.6, fill: '#e6e8f0', stroke: '#000', 'stroke-width': .5 }, gg);
    earth.gN = el('text', { fill: '#cfd8ff', 'font-size': 6.5, 'text-anchor': 'middle', 'font-weight': 600, 'data-i18n': 'north' }, gg);

    // --- Flat world map (equirectangular)
    const mp = d3.geoEquirectangular().fitSize([720, 360], { type: 'Sphere' });
    earth.mPath = d3.geoPath(mp);
    earth.mapProj = mp;
    el('path', { d: earth.mPath({ type: 'Sphere' }), fill: OCEAN }, mapSvg);
    el('path', { d: earth.mPath(d3.geoGraticule10()), fill: 'none', stroke: 'rgba(255,255,255,.1)', 'stroke-width': .5 }, mapSvg);
    earth.mLand = el('path', { fill: LAND }, mapSvg);
    earth.mBorders = el('path', { fill: 'none', stroke: BORDER, 'stroke-width': .5 }, mapSvg);
    // night = everywhere more than 90° from the subsolar point; extra layers for twilight depth
    earth.mNight = [90, 84, 78, 72].map(() => el('path', { fill: '#050a18', opacity: .22 }, mapSvg));
    earth.mMoonVis = el('path', { fill: 'rgba(196, 170, 255, .22)', stroke: '#c4aaff', 'stroke-width': 1.2 }, mapSvg);
    // each view has its own checkbox for its Moon-visibility layer
    for (const [id, layer] of [['moonVis', earth.gMoonVis], ['moonVisMap', earth.mMoonVis]]) {
      const box = document.getElementById(id);
      const show = () => { layer.style.display = box.checked ? '' : 'none'; };
      box.addEventListener('change', show); show();
    }
    earth.mSunTrack = el('path', { fill: 'none', stroke: '#ffc94a', 'stroke-width': 1.2, opacity: .75 }, mapSvg);
    earth.mMoonTrack = el('path', { fill: 'none', stroke: '#e6e8f0', 'stroke-width': 1.2, opacity: .75 }, mapSvg);
    el('path', { d: earth.mPath({ type: 'Sphere' }), fill: 'none', stroke: '#3a4570' }, mapSvg);
    const marker = (fill, label) => {
      const g = el('g', {}, mapSvg);
      el('circle', { r: 11, fill, opacity: .25 }, g);
      el('circle', { r: 6, fill, stroke: '#000', 'stroke-width': 1 }, g);
      el('text', { x: 10, y: -10, fill, 'font-size': 12, 'font-weight': 600, 'data-i18n': label }, g);
      return g;
    };
    earth.mSun = marker('#ffc94a', 'sunOver');
    earth.mMoon = marker('#e6e8f0', 'moonOver');

    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      // The message below is only for a failed download; errors while drawing are not caught here.
      .catch(() => { $('mapNote').dataset.i18n = 'mapErr'; $('mapNote').textContent = L('mapErr'); })
      .then(w => {
        if (!w) return;
        const land = topojson.feature(w, w.objects.land);
        const borders = topojson.mesh(w, w.objects.countries, (a, b) => a !== b);
        earth.land = land;
        earth.borders = borders;
        render();
        earth.mLand.setAttribute('d', earth.mPath(land));
        earth.mBorders.setAttribute('d', earth.mPath(borders));
      });
  } else {
    mapSvg.closest('.card').style.display = 'none';
  }

  function updateEarth(jd, oh) {
    if (!HAS_D3) return;
    const subSun = oh.sun, subMoon = oh.moon;
    // Centre the globe on the point facing the viewer, then roll it so the ecliptic north pole is
    // straight up. The Sun is then exactly on the right, and the 23.4° axis tilt leans toward,
    // away or sideways with the seasons.
    const gp = earth.globeProj;
    gp.rotate([-oh.view[0], -oh.view[1], 0]);
    const [ex, ey] = gp(oh.eclPole);
    gp.rotate([-oh.view[0], -oh.view[1], Math.atan2(ex, -ey) / DEG]);
    // "N" label just outside the limb, in the direction of the geographic North Pole
    const [nx, ny] = gp([0, 90]), nr = Math.hypot(nx, ny) || 1;
    earth.gN.setAttribute('x', nx / nr * (G.EARTH + 8));
    earth.gN.setAttribute('y', ny / nr * (G.EARTH + 8) + 2.3);
    earth.gGrat.setAttribute('d', earth.gPath(earth.graticule));
    if (earth.land) {
      earth.gLand.setAttribute('d', earth.gPath(earth.land) || '');
      earth.gBorders.setAttribute('d', earth.gPath(earth.borders) || '');
    }
    const anti = [wrap180(subSun[0] + 180), -subSun[1]];
    const circle = r => d3.geoCircle().center(anti).radius(r)();
    earth.gTwilight.setAttribute('d', earth.gPath(circle(90)) || '');  // sun below horizon
    earth.gNight.setAttribute('d', earth.gPath(circle(84)) || '');     // past civil twilight
    const moonVis = d3.geoCircle().center(subMoon).radius(oh.moonReach)();
    earth.gMoonVis.setAttribute('d', earth.gPath(moonVis) || '');
    earth.mMoonVis.setAttribute('d', earth.mPath(moonVis) || '');
    earth.mNight.forEach((p, i) => p.setAttribute('d', earth.mPath(circle([90, 84, 78, 72][i])) || ''));

    // Overhead paths: half-hour steps from 12 h before to 12 h after the current time
    const sunTrack = [], moonTrack = [];
    for (let k = -24; k <= 24; k++) {
      const o = k ? overheadAt(jd + k / 48) : oh;
      sunTrack.push(o.sun); moonTrack.push(o.moon);
    }
    const line = pts => ({ type: 'LineString', coordinates: pts });
    earth.gSunTrack.setAttribute('d', earth.gPath(line(sunTrack)) || '');
    earth.gMoonTrack.setAttribute('d', earth.gPath(line(moonTrack)) || '');
    earth.mSunTrack.setAttribute('d', earth.mPath(line(sunTrack)) || '');
    earth.mMoonTrack.setAttribute('d', earth.mPath(line(moonTrack)) || '');

    const place = (dot, ll) => {
      const r = earth.globeProj.rotate();
      const visible = d3.geoDistance(ll, [-r[0], -r[1]]) < Math.PI / 2;
      dot.style.display = visible ? '' : 'none';
      if (visible) { const [x, y] = earth.globeProj(ll); dot.setAttribute('cx', x); dot.setAttribute('cy', y); }
    };
    place(earth.gSunDot, subSun);
    place(earth.gMoonDot, subMoon);
    for (const [g, ll] of [[earth.mSun, subSun], [earth.mMoon, subMoon]]) {
      const [x, y] = earth.mapProj(ll);
      g.setAttribute('transform', `translate(${x} ${y})`);
      g.querySelector('text').setAttribute('text-anchor', x > 600 ? 'end' : 'start');
      g.querySelector('text').setAttribute('x', x > 600 ? -10 : 10);
    }
  }

  const fmtLL = ([lon, lat]) =>
    `${lat.toFixed(5)}, ${lon.toFixed(5)}`;   // signed decimal degrees (latitude, longitude), always with a dot so they can be pasted into a map

  // ================= State & UI =================
  const $ = id => document.getElementById(id);
  const dtInput = $('dt'), slider = $('slider');
  const RANGE_H = 360;           // slider spans ±15 days (in hours)
  let baseMs = Date.now();
  let curMs = baseMs;

  function setBase(ms) {
    baseMs = ms; curMs = ms;
    slider.value = 0;
    dtInput.value = toInputValue(ms);
    setEdges();
    render();
  }
  function setEdges() {
    $('edgeL').textContent = new Date(baseMs - RANGE_H * 3600e3).toLocaleDateString(LOCALE, { month: 'short', day: 'numeric' });
    $('edgeR').textContent = new Date(baseMs + RANGE_H * 3600e3).toLocaleDateString(LOCALE, { month: 'short', day: 'numeric' });
  }

  let listAnchor = null;
  function render() {
    const jd = jdOf(curMs);
    const s = sun(jd), m = moon(jd);
    const e = norm(m.lon - s.lon);
    const prevNew = findPhase(jd, 0, -1), nextNew = findPhase(jd, 0, 1), nextFull = findPhase(jd, 180, 1);
    const age = jd - prevNew;
    const isNew = Math.abs(wrap180(e)) < 6;

    // Geo view
    // The Sun is always on the right, so the Moon's angle on screen is its elongation.
    // Orbit: the Moon's actual positions at true relative distance (mean distance = G.ORBIT),
    // against the current Sun direction. The real path never quite closes: one month on, the Moon
    // is a little nearer/farther and higher/lower at the same spot. So we take the lap ahead of the
    // Moon and the lap behind it and fade from one to the other around the loop. The curve is then
    // closed, passes exactly through the Moon, and changes smoothly from frame to frame.
    const KM = G.ORBIT / 385000.56, MONTH = 27.321662, HALF = 180, STEP = MONTH / (2 * HALF);
    const wide = [];
    for (let k = -2 * HALF; k <= 2 * HALF + 10; k++) {
      const mk = moon(jd + k * STEP);
      wide.push({ k, a: norm(mk.lon - s.lon), lat: mk.lat, dist: mk.dist });
    }
    const at = o => proj3(o.dist * KM, o.a, o.lat);
    const loop = [];                               // j = 0 … 360: once around, starting at the Moon
    for (let j = 0; j <= 2 * HALF; j++) {
      const ahead = wide[j + 2 * HALF], behind = wide[j], w = j / (2 * HALF);
      const [x1, y1] = at(ahead), [x2, y2] = at(behind);
      loop.push({ a: ahead.a + w * wrap180(behind.a - ahead.a), x: x1 + w * (x2 - x1), y: y1 + w * (y2 - y1) });
    }
    gOrbit.setAttribute('d', 'M' + loop.map(o => o.x.toFixed(1) + ' ' + o.y.toFixed(1)).join('L') + 'Z');
    // point of the loop at a given angle from the Sun, interpolated between samples
    const onLoop = target => {
      for (let j = 0; j < loop.length - 1; j++) {
        const d0 = wrap180(loop[j].a - target), d1 = wrap180(loop[j + 1].a - target);
        if (d0 <= 0 && d1 > 0 && d1 - d0 < 20) {
          const f = -d0 / (d1 - d0);
          return [loop[j].x + f * (loop[j + 1].x - loop[j].x), loop[j].y + f * (loop[j + 1].y - loop[j].y)];
        }
      }
      return [loop[0].x, loop[0].y];
    };
    // next closest (sign = 1) or farthest (sign = −1) point the Moon will reach, refined between samples
    const apsisAt = sign => {
      for (let i = 2 * HALF; i < wide.length - 1; i++) {
        const [p, c, n] = [wide[i - 1], wide[i], wide[i + 1]].map(o => sign * o.dist);
        if (c <= p && c < n) {
          const x = (p - n) / (2 * (p - 2 * c + n));            // vertex of the parabola through 3 samples
          const mk = moon(jd + (wide[i].k + x) * STEP);
          return { a: norm(mk.lon - s.lon), lat: mk.lat, dist: mk.dist };
        }
      }
      return wide[2 * HALF];
    };
    const [nwx, nwy] = onLoop(0), [flx, fly] = onLoop(180);
    gNewMark.setAttribute('cx', nwx); gNewMark.setAttribute('cy', nwy);
    gNewLbl.setAttribute('x', nwx + 8); gNewLbl.setAttribute('y', nwy + 2.3);   // labels sit outside the orbit
    gFullLbl.setAttribute('x', flx - 8); gFullLbl.setAttribute('y', fly + 2.3);
    for (const [g, o, name] of [[gPeri, apsisAt(1), L('perigee')], [gApo, apsisAt(-1), L('apogee')]]) {
      const [ax, ay] = at(o);
      g.setAttribute('transform', `translate(${ax} ${ay})`);
      const txt = g.querySelector('text'), [l1, l2] = txt.children;
      // label above the far half of the orbit, below the near half: always clear of the globe
      txt.setAttribute('y', ay < 0 ? -12 : 10);
      txt.setAttribute('text-anchor', 'middle');
      l1.setAttribute('x', 0); l2.setAttribute('x', 0);
      l1.textContent = name;
      l2.textContent = `${num(Math.round(o.dist / 100) * 100)} km`;
    }
    const [gx, gy] = proj3(m.dist * KM, e, m.lat), gr = Math.hypot(gx, gy) || 1;
    gMoonG.setAttribute('transform', `translate(${gx} ${gy})`);
    // on the far half of its orbit the Moon is drawn behind Earth, on the near half in front
    geo.insertBefore(gMoonG, sin(e) > 0 ? gEarthG : gMoonLbl);
    gMoonLbl.setAttribute('x', gx + 25 * gx / gr); gMoonLbl.setAttribute('y', gy + 25 * gy / gr + 2.5);
    gAlign.setAttribute('x1', 0); gAlign.setAttribute('y1', 0);
    gAlign.setAttribute('x2', 220); gAlign.setAttribute('y2', 0);
    gAlign.setAttribute('opacity', isNew ? 1 : 0);
    gNewMark.setAttribute('fill', isNew ? '#ff6b8b' : 'none');
    gElongTxt.textContent = L('elong', num(e, 1));

    // Earth's rotation & the points where the Sun / Moon are overhead
    const oh = overheadAt(jd, s, m);
    const subSun = oh.sun, subMoon = oh.moon;
    updateEarth(jd, oh);
    $('sSubSun').textContent = fmtLL(subSun);
    $('sSubMoon').textContent = fmtLL(subMoon);

    // Phase
    pLit.setAttribute('d', phasePath(e));
    const illum = (1 - cos(e)) / 2 * 100;
    $('phaseName').textContent = phaseName(e);
    $('phaseMeta').textContent = L('phaseMeta', num(illum, 1), num(age, 1), num(SYNODIC, 1));
    $('cycleMarker').style.left = (e / 360 * 100) + '%';
    const banner = $('nmBanner');
    banner.classList.toggle('show', isNew);
    if (isNew) {
      const nearest = Math.abs(jd - prevNew) < Math.abs(nextNew - jd) ? prevNew : nextNew;
      banner.textContent = L('banner', fmtShort(msOf(nearest)), relDays(msOf(nearest), curMs));
    }

    // Stats
    $('sLocal').textContent = fmtLocal(curMs);
    $('sUtc').textContent = fmtUtc(curMs);
    $('sAge').textContent = `${num(age, 2)} ${L('days')}`;
    $('sElong').textContent = fmtDeg(e);
    $('sSun').textContent = fmtDeg(s.lon);
    $('sMoon').textContent = fmtDeg(m.lon);
    $('sLat').textContent = (m.lat >= 0 ? '+' : '') + fmtDeg(m.lat);
    $('sDist').textContent = num(Math.round(m.dist)) + ' km';
    $('sAU').textContent = num(s.R, 4) + ' ' + L('au');
    $('sPrev').textContent = `${fmtShort(msOf(prevNew))}`;
    $('sNext').textContent = `${fmtShort(msOf(nextNew))} (${relDays(msOf(nextNew), curMs)})`;
    $('sFull').textContent = `${fmtShort(msOf(nextFull))}`;

    // New-moon list (rebuild only when the anchor new moon changes)
    const anchorKey = prevNew.toFixed(3);
    if (anchorKey !== listAnchor) { listAnchor = anchorKey; buildList(prevNew); }
    else markPast();
  }

  function buildList(startJd) {
    const ul = $('nmList');
    ul.innerHTML = '';
    let t = startJd;
    for (let i = 0; i < 13; i++) {
      const lat = moon(t).lat;
      const ms = msOf(t);
      const li = document.createElement('li');
      li.dataset.ms = ms;
      const left = document.createElement('span');
      left.textContent = '🌑 ' + fmtShort(ms);
      li.appendChild(left);
      if (Math.abs(lat) < 1.58) {
        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.textContent = L(Math.abs(lat) < 1.0 ? 'eclLikely' : 'eclPartial');
        chip.title = L('eclTitle', num(lat, 2));
        li.appendChild(chip);
      }
      li.addEventListener('click', () => { stop(); setBase(ms); });
      ul.appendChild(li);
      t = findPhase(t + 1, 0, 1);
    }
    markPast();
  }
  function markPast() {
    for (const li of $('nmList').children) li.classList.toggle('past', +li.dataset.ms < curMs - 60000);
  }

  // ---------- Controls ----------
  dtInput.addEventListener('change', () => {
    const ms = new Date(dtInput.value).getTime();
    if (!isNaN(ms)) setBase(ms);
  });
  slider.addEventListener('input', () => {
    curMs = baseMs + slider.value * 3600e3;
    dtInput.value = toInputValue(curMs);
    render();
  });
  $('nowBtn').addEventListener('click', () => { stop(); setBase(Date.now()); });
  $('prevNew').addEventListener('click', () => {
    stop();
    // step back slightly so repeated clicks keep going back
    setBase(msOf(findPhase(jdOf(curMs) - 0.01, 0, -1)));
  });
  $('nextNew').addEventListener('click', () => { stop(); setBase(msOf(findPhase(jdOf(curMs) + 0.001, 0, 1))); });

  let playing = false, last = 0, raf = 0;
  const playBtn = $('playBtn');
  function stop() { playing = false; cancelAnimationFrame(raf); playBtn.textContent = L('play'); }
  function tick(ts) {
    if (!playing) return;
    const dt = last ? (ts - last) / 1000 : 0;
    last = ts;
    curMs += dt * (+$('speed').value) * 86400000;
    let off = (curMs - baseMs) / 3600e3;
    if (off > RANGE_H) {           // recentre the slider window when we run off the end
      const keep = curMs;
      setBase(keep - RANGE_H * 3600e3 * 0.9);
      curMs = keep;
      off = (curMs - baseMs) / 3600e3;
    }
    slider.value = off;
    dtInput.value = toInputValue(curMs);
    render();
    raf = requestAnimationFrame(tick);
  }
  playBtn.addEventListener('click', () => {
    if (playing) return stop();
    playing = true; last = 0;
    playBtn.textContent = L('pause');
    raf = requestAnimationFrame(tick);
  });

  document.addEventListener('keydown', ev => {
    if (ev.target.tagName === 'INPUT' && ev.target.type !== 'range') return;
    if (ev.key === ' ') { ev.preventDefault(); playBtn.click(); }
  });

  // ---------- Language ----------
  function applyLang() {
    document.documentElement.lang = LANG;
    document.title = L('title');
    for (const n of document.querySelectorAll('[data-i18n]')) n.textContent = L(n.dataset.i18n);
    for (const n of document.querySelectorAll('[data-i18n-html]')) n.innerHTML = L(n.dataset.i18nHtml);
    for (const n of document.querySelectorAll('[data-i18n-aria]')) n.setAttribute('aria-label', L(n.dataset.i18nAria));
    playBtn.textContent = L(playing ? 'pause' : 'play');
    for (const b of document.querySelectorAll('button.flag')) b.setAttribute('aria-pressed', b.dataset.lang === LANG);
  }
  for (const b of document.querySelectorAll('button.flag')) b.addEventListener('click', () => {
    chooseLang(b.dataset.lang);
    try { localStorage.setItem('moon-lang', LANG); } catch (e) { /* storage unavailable */ }
    applyLang();
    setEdges();
    listAnchor = null;              // rebuild the new-moon list in the new language
    render();
  });

  applyLang();
  setBase(Date.now());

  // ---------- Installable app (PWA) ----------
  // The service worker keeps a copy of the page for offline use. Browsers only allow it on
  // https:// or localhost, not when the file is opened straight from disk.
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
  }
})();
