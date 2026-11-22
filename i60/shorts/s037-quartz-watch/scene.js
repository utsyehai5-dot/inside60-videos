// Inside 60 — Quartz watch. Steps: 0 hook, 1 tuning-fork crystal (piezo), 2 battery keeps it ringing, 3 divider chip x15, 4 stepper motor + second hand, 5 accuracy, 6 recap
export async function setup({ THREE, scene, camera }) {
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const ss = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 90, specular: 0x666666, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x182440); scene.fog = new THREE.Fog(0x182440, 30, 80);
  scene.add(new THREE.HemisphereLight(0xf0f4ff, 0x40404c, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(4, 6, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0xa0c0ff, .8); rim.position.set(-6, -3, -6); scene.add(rim);

  // board
  const board = new THREE.Mesh(new RoundedBoxGeometry(5, 11.4, .3, 3, .3), Mat({ color: 0x1f6a4a, shininess: 30, specular: 0x222222 }));
  board.position.set(0, -.3, -.5); scene.add(board);

  // dial + second hand (top, center 0,3.4)
  const DC = V(0, 3.4, 0);
  const dialM = Mat({ color: 0xf2f4f8, emissive: 0x40c0ff, emissiveIntensity: 0, shininess: 40 });
  const dial = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, .1, 60), dialM); dial.rotation.x = Math.PI / 2; dial.position.copy(DC).setZ(-.2); scene.add(dial);
  const ringM = Mat({ color: 0xc8ced8, emissive: 0xffc040, emissiveIntensity: 0, shininess: 150 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.65, .1, 10, 60), ringM); ring.position.copy(DC).setZ(-.15); scene.add(ring);
  for (let i = 0; i < 60; i++) { const big = i % 5 === 0; const m = new THREE.Mesh(new THREE.BoxGeometry(big ? .07 : .03, big ? .25 : .12, .03), Mat({ color: 0x20242c })); const a = i / 60 * Math.PI * 2; m.position.set(DC.x + 1.42 * Math.sin(a), DC.y + 1.42 * Math.cos(a), -.12); m.rotation.z = -a; scene.add(m); }
  const handM = Mat({ color: 0xff3030, emissive: 0xff2000, emissiveIntensity: .1 });
  const secHand = new THREE.Group(); secHand.position.copy(DC).setZ(.05); scene.add(secHand);
  const sh = new THREE.Mesh(new RoundedBoxGeometry(.07, 1.7, .04, 2, .02), handM); sh.position.y = .6; secHand.add(sh);
  const minH = new THREE.Mesh(new RoundedBoxGeometry(.12, 1.3, .04, 2, .03), Mat({ color: 0x20242c })); minH.position.set(0, .55, -.03);
  const minG = new THREE.Group(); minG.position.copy(DC); minG.rotation.z = -2.2; minG.add(minH); scene.add(minG);
  const hourH = new THREE.Mesh(new RoundedBoxGeometry(.16, .85, .04, 2, .04), Mat({ color: 0x20242c })); hourH.position.set(0, .35, -.06);
  const hourG = new THREE.Group(); hourG.position.copy(DC); hourG.rotation.z = .9; hourG.add(hourH); scene.add(hourG);
  const capM = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, .2, 16), handM); capM.rotation.x = Math.PI / 2; capM.position.copy(DC).setZ(.1); scene.add(capM);

  // gears (between motor and dial)
  const gearShape = (r, n) => { const s = new THREE.Shape(); for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, d = Math.PI * 2 / n, th = Math.min(.1, r * .15);
    [[r - th, a], [r, a + d * .25], [r, a + d * .5], [r - th, a + d * .75]].forEach(([rr, aa], j) => { const x = rr * Math.cos(aa), y = rr * Math.sin(aa); (i || j) ? s.lineTo(x, y) : s.moveTo(x, y); }); }
    s.closePath(); return new THREE.ExtrudeGeometry(s, { depth: .1, bevelEnabled: false, curveSegments: 3 }); };
  const brass = Mat({ color: 0xe8b040, emissive: 0xff9000, emissiveIntensity: 0, shininess: 120 });
  const gears = [[.55, 1.25, .45, 18, 1], [-.35, .95, .4, 16, -1]].map(([x, y, r, n, d]) => { const g = new THREE.Mesh(gearShape(r, n), brass); g.position.set(x, y, -.2); scene.add(g); return { g, r, d }; });

  // stepper motor: coil + stator + magnet rotor (center 0.3, 0)
  const coilM = Mat({ color: 0xc8702a, emissive: 0xff5000, emissiveIntensity: 0, shininess: 90 });
  const coil = new THREE.Mesh(new THREE.CylinderGeometry(.38, .38, 1.9, 24), coilM); coil.rotation.z = Math.PI / 2; coil.position.set(-1, -.35, 0); scene.add(coil);
  for (let i = 0; i < 14; i++) { const w = new THREE.Mesh(new THREE.TorusGeometry(.39, .025, 6, 24), coilM); w.rotation.y = Math.PI / 2; w.position.set(-1.85 + i * .13, -.35, 0); scene.add(w); }
  const statorM = Mat({ color: 0xa8b0bc, emissive: 0x30a0ff, emissiveIntensity: 0, shininess: 120 });
  const stator = new THREE.Group(); scene.add(stator);
  [[-.1, -.35, .3, .22], [.3, -.6, .7, .2], [.3, .25, .7, .2]].forEach(([x, y, w, h]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, .22), statorM); m.position.set(x, y, 0); stator.add(m); });
  const rotor = new THREE.Group(); rotor.position.set(.55, -.18, .05); scene.add(rotor);
  const magN = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .28, 24, 1, false, 0, Math.PI), Mat({ color: 0xe53935, emissive: 0xff0000, emissiveIntensity: 0 }));
  const magS = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .28, 24, 1, false, Math.PI, Math.PI), Mat({ color: 0x2f6be0, emissive: 0x0040ff, emissiveIntensity: 0 }));
  [magN, magS].forEach(m => { m.rotation.x = Math.PI / 2; rotor.add(m); });

  // chip + divider bits (center 0,-1.9)
  const chipM = Mat({ color: 0x23262e, shininess: 60 });
  const chip = new THREE.Mesh(new RoundedBoxGeometry(2.6, 1.1, .25, 2, .05), chipM); chip.position.set(0, -1.9, -.1); scene.add(chip);
  for (let i = 0; i < 10; i++) [-1, 1].forEach(s => { const p = new THREE.Mesh(new THREE.BoxGeometry(.08, .22, .06), Mat({ color: 0xd0d4dc })); p.position.set(-1.1 + i * .245, -1.9 + s * .64, -.2); scene.add(p); });
  const bits = [];
  for (let i = 0; i < 15; i++) { const m = new THREE.MeshPhongMaterial({ color: 0x203040, emissive: 0x40ffe0, emissiveIntensity: 0 }); const b = new THREE.Mesh(new RoundedBoxGeometry(.13, .4, .08, 2, .03), m); b.position.set(-1.12 + i * .16, -1.9, .07); scene.add(b); bits.push(m); }

  // quartz crystal can + tuning fork (center 0,-3.5), lying along x
  const canM = Mat({ color: 0xc0c8d4, shininess: 150, specular: 0xaaaaaa, transparent: true, opacity: 1 });
  const can = new THREE.Mesh(new THREE.CapsuleGeometry(.42, 2.1, 6, 20), canM); can.rotation.z = Math.PI / 2; can.position.set(.1, -3.5, 0); scene.add(can);
  const qM = Mat({ color: 0xbfe8ff, emissive: 0x30c0ff, emissiveIntensity: .1, shininess: 160, transparent: true, opacity: .92 });
  const fork = new THREE.Group(); fork.position.set(-.85, -3.5, 0); scene.add(fork);
  const base = new THREE.Mesh(new RoundedBoxGeometry(.45, .55, .12, 2, .03), qM); fork.add(base);
  const prongs = [-1, 1].map(s => { const p = new THREE.Group(); p.position.set(.2, s * .17, 0); fork.add(p); const m = new THREE.Mesh(new RoundedBoxGeometry(1.8, .16, .1, 2, .03), qM); m.position.x = .9; p.add(m); return { p, s }; });
  const elM = Mat({ color: 0xffd060, emissive: 0xffa000, emissiveIntensity: 0 });
  prongs.forEach(({ p, s }) => { const e = new THREE.Mesh(new THREE.BoxGeometry(1.4, .06, .02), elM); e.position.set(.8, 0, .06); p.add(e); });
  const legs = [-1, 1].map(s => { const l = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .9, 8), Mat({ color: 0xd0d4dc })); l.rotation.z = Math.PI / 2; l.position.set(-1.6, -3.5 + s * .12, 0); scene.add(l); });

  // battery (bottom)
  const batM = Mat({ color: 0xd8dde6, emissive: 0x40ff80, emissiveIntensity: 0, shininess: 150 });
  const bat = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, .35, 48), batM); bat.rotation.x = Math.PI / 2; bat.position.set(.2, -5.0, -.05); scene.add(bat);
  const plus = new THREE.Mesh(new THREE.BoxGeometry(.5, .1, .02), Mat({ color: 0x404850 })); plus.position.set(.2, -5, .14); scene.add(plus);
  const plus2 = plus.clone(); plus2.rotation.z = Math.PI / 2; scene.add(plus2);

  // traces with travelling pulses
  const trM = Mat({ color: 0xd8b060, emissive: 0xffa000, emissiveIntensity: .1 });
  const mkTrace = pts => { const c = new THREE.CatmullRomCurve3(pts.map(p => V(...p)), false, 'catmullrom', .1); const m = new THREE.Mesh(new THREE.TubeGeometry(c, 60, .035, 6, false), trM); scene.add(m); return c; };
  const trBat = mkTrace([[-.9, -4.6, -.2], [-1.9, -4.2, -.2], [-2.05, -3, -.2], [-1.9, -2.1, -.2], [-1.35, -1.95, -.2]]);
  const trXtal = mkTrace([[-1.35, -2.1, -.2], [-1.9, -2.7, -.2], [-2.05, -3.45, -.2], [-1.6, -3.5, -.2]]);
  const trCoil = mkTrace([[1.35, -1.75, -.2], [1.95, -1.2, -.2], [1.95, -.4, -.2], [-.05, -.35, -.2]]);
  const pulseM = new THREE.MeshBasicMaterial({ color: 0xfff080, transparent: true, opacity: 0, depthWrite: false });
  const pulses = [];
  [[trBat, 0], [trBat, .33], [trBat, .66], [trXtal, 0], [trXtal, .5], [trCoil, 0]].forEach(([c, o]) => { const m = new THREE.Mesh(new THREE.SphereGeometry(.11, 12, 8), pulseM); scene.add(m); pulses.push({ c, o, m }); });
  const sparkM = new THREE.MeshBasicMaterial({ color: 0xffe060, transparent: true, opacity: 0, depthWrite: false });
  const sparks = [-1, 1].map(s => { const m = new THREE.Mesh(new THREE.SphereGeometry(.09, 10, 8), sparkM); m.position.set(.4, -3.5 + s * .45, .1); scene.add(m); return m; });

  const shots = [
    [[4, -1.2, 30], [0, -1.55, 0]],
    [[1.2, -2.2, 5.2], [.1, -3.5, 0]],
    [[-3.2, -5.2, 8], [-.5, -3.4, 0]],
    [[1, -1.2, 5.2], [0, -1.9, 0]],
    [[2.2, 1, 6.2], [0, .3, 0]],
    [[1.2, 4.2, 6.6], [0, 3.3, 0]],
    [[-4, -.6, 30], [0, -1.55, 0]],
  ];
  const cp = { p: V(), q: V() };
  function update(t, si, lt, sd) {
    sd = sd || 6;
    const pulse = .5 + .5 * Math.sin(t * 5);
    // fork vibration (exaggerated, slowed); in step 1 show one squeeze first
    let vib = .06 * Math.sin(t * Math.PI * 2 * 6);
    if (si === 1) vib = lt < 2.4 ? -.12 * ss(.6, 1.2, lt) * (1 - ss(2, 2.4, lt)) : vib * ss(2.4, 3, lt);
    prongs.forEach(({ p, s }) => { p.rotation.z = s * vib; });
    const squeeze = si === 1 && lt > .9 && lt < 2.2;
    sparkM.opacity = squeeze ? .6 + .4 * pulse : 0;
    canM.opacity = si === 1 || si === 2 ? lerp(1, .18, ease(lt / 1)) : (si === 0 || si === 6 ? .35 : 1);
    canM.transparent = canM.opacity < 1; canM.depthWrite = canM.opacity >= 1;
    qM.emissiveIntensity = si <= 2 || si === 6 ? .25 + .35 * Math.abs(Math.sin(t * Math.PI * 2 * 6)) : .1;
    elM.emissiveIntensity = squeeze || si === 2 ? .6 * pulse : 0;
    batM.emissiveIntensity = si === 2 ? .2 + .3 * pulse : 0;
    pulseM.opacity = si === 2 || si === 4 || si === 0 || si === 6 ? 1 : 0;
    pulses.forEach(p => { const u = ((t * .5 + p.o) % 1); p.m.position.copy(p.c.getPoint(u)).setZ(-.05); p.m.visible = p.c !== trCoil || si === 4; });
    // divider cascade: bit i toggles at half the rate of bit i-1 (visual)
    bits.forEach((m, i) => { const f = 6 * Math.pow(.72, i); const on = Math.sin(t * Math.PI * 2 * f) > 0; m.emissiveIntensity = (si === 3 ? (on ? 1.2 : .05) : (on ? .35 : .02)); });
    // one tick per second
    const n = Math.floor(t), fr = t - n, step = ss(0, .12, fr);
    rotor.rotation.z = Math.PI * (n + step);
    secHand.rotation.z = -(n + ss(0, .1, fr)) * Math.PI / 30;
    gears.forEach(({ g, r, d }) => { g.rotation.z = d * (n + step) * .5 / r; });
    const kick = 1 - ss(0, .3, fr);
    coilM.emissiveIntensity = si === 4 ? .9 * kick : .1 * kick;
    statorM.emissiveIntensity = si === 4 ? .5 * kick : 0;
    magN.material.emissiveIntensity = magS.material.emissiveIntensity = si === 4 ? .4 * kick : 0;
    brass.emissiveIntensity = si === 4 ? .2 * kick : 0;
    ringM.emissiveIntensity = si === 5 ? .3 + .4 * pulse : 0;
    dialM.emissiveIntensity = si === 5 ? .12 * pulse : 0;
    handM.emissiveIntensity = si === 4 || si === 5 ? .3 + .4 * kick : .1;
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const k = si === 0 ? 1 : ease(lt / 1.3);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], k))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], k)));
    const o = Math.sin(t * .2) * .08, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o));
    camera.lookAt(cp.q);
  }
  return { update };
}
