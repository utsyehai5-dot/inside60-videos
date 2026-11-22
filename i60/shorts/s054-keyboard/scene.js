// Inside 60 — Keyboard. Steps: 0 hook (one grid), 1 rows x columns matrix, 2 press: rubber dome + membranes, 3 contact row<->column, 4 controller scans rows, 5 key code -> computer, 6 recap
export async function setup({ THREE, scene, camera }) {
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const ss = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x555555, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x111a30); scene.fog = new THREE.Fog(0x111a30, 30, 80);
  scene.add(new THREE.HemisphereLight(0xf4f6ff, 0x40404c, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.9); key.position.set(5, 10, 9); scene.add(key);
  const rim = new THREE.DirectionalLight(0xa0c8ff, .8); rim.position.set(-6, 2, -6); scene.add(rim);

  // ===== Keyboard (origin): 5 rows x 8 cols of keys, lifts to reveal the grid =====
  const NR = 5, NC = 6, P = .95;
  const kb = new THREE.Group(); scene.add(kb);
  const caseM = Mat({ color: 0x3a4050, shininess: 50 });
  const body = new THREE.Mesh(new RoundedBoxGeometry(NC * P + .8, .5, NR * P + .8, 3, .15), caseM); body.position.y = -.35; kb.add(body);
  const keysG = new THREE.Group(); kb.add(keysG);
  const capM = Mat({ color: 0xe8ecf4, shininess: 60 });
  const hitM = Mat({ color: 0xffe040, emissive: 0xffb000, emissiveIntensity: .6 });
  const caps = [];
  for (let r = 0; r < NR; r++) for (let c = 0; c < NC; c++) {
    const k = new THREE.Mesh(new RoundedBoxGeometry(.8, .35, .8, 2, .1), capM); k.position.set((c - (NC - 1) / 2) * P, .2, (r - (NR - 1) / 2) * P); keysG.add(k); caps.push(k);
  }
  const ROW = 2, COL = 4; const hitCap = caps[ROW * NC + COL];
  // grid traces on sheet below keys
  const rowMs = [], colMs = [];
  const sheet = new THREE.Mesh(new THREE.BoxGeometry(NC * P + .4, .04, NR * P + .4), Mat({ color: 0xc8d8e8, transparent: true, opacity: .9 })); sheet.position.y = -.08; kb.add(sheet);
  for (let r = 0; r < NR; r++) { const m = Mat({ color: 0x3080ff, emissive: 0x3080ff, emissiveIntensity: .2 }); rowMs.push(m); const b = new THREE.Mesh(new THREE.BoxGeometry(NC * P + .2, .05, .09), m); b.position.set(0, -.04, (r - (NR - 1) / 2) * P); kb.add(b); }
  for (let c = 0; c < NC; c++) { const m = Mat({ color: 0xff6030, emissive: 0xff6030, emissiveIntensity: .2 }); colMs.push(m); const b = new THREE.Mesh(new THREE.BoxGeometry(.09, .05, NR * P + .2), m); b.position.set((c - (NC - 1) / 2) * P, -.01, 0); kb.add(b); }
  const xM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false });
  const xs = new THREE.Mesh(new THREE.SphereGeometry(.22, 16, 12), xM); xs.position.set((COL - (NC - 1) / 2) * P, 0, (ROW - (NR - 1) / 2) * P); kb.add(xs);
  // controller chip + cable to computer
  const ctrlM = Mat({ color: 0x22252e, emissive: 0x30ff90, emissiveIntensity: .1 });
  const ctrl = new THREE.Mesh(new RoundedBoxGeometry(1.1, .25, .8, 2, .05), ctrlM); ctrl.position.set(-(NC * P) / 2 - 1.2, -.3, -(NR * P) / 2 + .4); kb.add(ctrl);
  const scanM = new THREE.MeshBasicMaterial({ color: 0x80c0ff, transparent: true, opacity: 0, depthWrite: false });
  const scanBar = new THREE.Mesh(new THREE.BoxGeometry(NC * P + .6, .25, .3), scanM); kb.add(scanBar);
  const curve = new THREE.CatmullRomCurve3([V(-(NC * P) / 2 - 1.2, -.3, -(NR * P) / 2), V(-4.2, -.4, -4.5), V(-2.5, -.4, -7.5), V(0, .2, -9.8)]);
  kb.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 40, .08, 8), Mat({ color: 0x202430 })));
  const pkM = Mat({ color: 0x40ff90, emissive: 0x30ff80, emissiveIntensity: 1 });
  const pks = [0, 1, 2].map(() => { const m = new THREE.Mesh(new RoundedBoxGeometry(.35, .2, .35, 1, .05), pkM); kb.add(m); return m; });
  // monitor
  const mon = new THREE.Group(); mon.position.set(0, 1.6, -10.2); kb.add(mon);
  mon.add(new THREE.Mesh(new RoundedBoxGeometry(4.6, 3.0, .3, 2, .1), Mat({ color: 0x1a1d24 })));
  const scrM = Mat({ color: 0x203050, emissive: 0x2050a0, emissiveIntensity: .3 });
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.6), scrM); scr.position.z = .16; mon.add(scr);
  const letterM = new THREE.MeshBasicMaterial({ color: 0xffe040 });
  const letters = []; for (let k = 0; k < 6; k++) { const l = new THREE.Mesh(new THREE.BoxGeometry(.45, .6, .02), letterM); l.position.set(-1.5 + k * .6, .4, .18); mon.add(l); letters.push(l); }
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(.15, .15, 1.6, 8), Mat({ color: 0x1a1d24 })); stand.position.y = -2.4; mon.add(stand);

  // ===== Key cutaway (x = 22): cap, rubber dome, top membrane, spacer, bottom membrane =====
  const cut = new THREE.Group(); cut.position.set(22, 0, 0); scene.add(cut);
  const bigCap = new THREE.Mesh(new RoundedBoxGeometry(3, 1.1, 3, 3, .3), Mat({ color: 0xe8ecf4 })); cut.add(bigCap);
  const domeM = Mat({ color: 0x40b0a0, transparent: true, opacity: .8, shininess: 30 });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1.2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), domeM); cut.add(dome);
  const memTopM = Mat({ color: 0xd8e8f8, transparent: true, opacity: .85 });
  const memTop = new THREE.Mesh(new THREE.BoxGeometry(4, .08, 3.4), memTopM); cut.add(memTop);
  const spacer = new THREE.Mesh(new THREE.BoxGeometry(4, .3, 3.4), Mat({ color: 0xa0a8b8, transparent: true, opacity: .35, depthWrite: false })); spacer.position.y = -.25; cut.add(spacer);
  const memBot = new THREE.Mesh(new THREE.BoxGeometry(4, .08, 3.4), Mat({ color: 0xd8e8f8 })); memBot.position.y = -.45; cut.add(memBot);
  const padTM = Mat({ color: 0x3080ff, emissive: 0x3080ff, emissiveIntensity: .2 }), padBM = Mat({ color: 0xff6030, emissive: 0xff6030, emissiveIntensity: .2 });
  const padT = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, .06, 24), padTM); cut.add(padT);
  const padB = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, .06, 24), padBM); padB.position.y = -.38; cut.add(padB);
  const trT = new THREE.Mesh(new THREE.BoxGeometry(2.5, .05, .15), padTM); trT.position.set(-1.25, 0, 0); cut.add(trT);
  const trB = new THREE.Mesh(new THREE.BoxGeometry(.15, .05, 2), padBM); trB.position.set(0, -.38, 1); cut.add(trB);
  const sparkM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false });
  const spark = new THREE.Mesh(new THREE.SphereGeometry(.7, 16, 12), sparkM); spark.position.y = -.35; cut.add(spark);

  const shots = [
    [[2.0, 12.0, 16.0], [-.3, 0, -1.5]],     // 0 keyboard
    [[1.5, 13.0, 5.0], [0, -.2, 0]],         // 1 grid
    [[26.0, 3.0, 11.5], [22, 1.0, 0]],        // 2 press
    [[25.5, 2.0, 9.5], [22, .3, 0]],          // 3 contact
    [[1.0, 14.0, 5.5], [0, -.2, 0]],         // 4 scan
    [[5.0, 6.5, 9.5], [0, .3, -4.5]],        // 5 send
    [[2.5, 12.5, 16.5], [-.3, 0, -1.8]],     // 6 recap
  ];
  const cp = { p: V(), q: V() };
  function update(t, si, lt, sd) {
    const pulse = .5 + .5 * Math.sin(t * 6); const D = sd || 5;
    kb.rotation.y = Math.sin(t * .3) * .05;
    // keys lift away to reveal the grid in steps 1 and 4
    const lift = si === 1 ? ss(.3, 1.6, lt) : si === 4 ? 1 : si === 2 || si === 3 ? 1 : si === 5 ? 1 - ss(0, 1.2, lt) : 0;
    keysG.position.y = lift * 3.5; keysG.visible = lift < .98;
    caps.forEach((c, k) => { c.material = (si === 0 && k === ((Math.floor(t * 2.5) * 7) % caps.length)) || (si >= 5 && c === hitCap && (lt % 1.4) < .5) ? hitM : capM; c.position.y = .2 - (c.material === hitM ? .12 : 0); });
    // grid highlights
    const scanR = Math.floor(t * 4) % NR;
    rowMs.forEach((m, r) => { m.emissiveIntensity = si === 1 ? .2 + .5 * pulse : si === 4 ? (r === scanR ? 1.2 : .1) : si === 3 && r === ROW ? 1 : .2; });
    colMs.forEach((m, c) => { m.emissiveIntensity = si === 1 ? .2 + .5 * (1 - pulse) : si === 4 ? (scanR === ROW && c === COL ? 1.4 : .1) : si === 3 && c === COL ? 1 : .2; });
    xM.opacity = si === 4 && scanR === ROW ? .95 : si === 1 ? .5 * pulse : 0;
    scanM.opacity = si === 4 ? .35 : 0; scanBar.position.set(0, .02, (scanR - (NR - 1) / 2) * P);
    ctrlM.emissiveIntensity = si === 4 || si === 5 ? .5 + .5 * pulse : .1;
    // packets along cable
    pks.forEach((m, k) => { const u = (t * .5 + k / 3) % 1; m.position.copy(curve.getPointAt(u)); m.visible = si === 5 || si === 6; });
    const typed = si === 5 ? Math.floor(ss(.5, D - .5, lt) * 6.99) : si === 6 ? 6 : si === 0 ? 3 : 0;
    letters.forEach((l, k) => l.visible = k < typed);
    scrM.emissiveIntensity = si >= 5 ? .6 : .3;
    // cutaway press cycle
    let press = 0;
    if (si === 2) press = ss(.8, 2.4, lt);
    if (si === 3) press = 1;
    const h = 1 - press;
    bigCap.position.y = .85 + h * 1.0; dome.scale.set(1 + press * .15, .2 + h * .8, 1 + press * .15); dome.position.y = .1;
    memTop.position.y = lerp(-.28, .05, h); padT.position.y = memTop.position.y - .06; trT.position.y = padT.position.y;
    const touch = press > .95;
    padTM.emissiveIntensity = padBM.emissiveIntensity = touch ? 1.2 : .2;
    sparkM.opacity = touch ? .3 + .4 * pulse : 0;
    // camera
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const far = Math.abs(prev[1][0] - now[1][0]) > 8;
    const kk = si === 0 ? 1 : ease(lt / (far ? 1.1 : 1.4));
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], kk))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], kk)));
    const o = Math.sin(t * .2) * .08, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o));
    camera.lookAt(cp.q);
  }
  return { update };
}
