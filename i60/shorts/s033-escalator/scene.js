// Inside 60 — Escalator. Steps: 0 hook (hidden return steps), 1 chain+motor, 2 wheels, 3 stairs form, 4 flatten, 5 comb+handrail, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 70, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x2b3d63); scene.fog = new THREE.Fog(0x2b3d63, 35, 90);
  scene.add(new THREE.HemisphereLight(0xeef4ff, 0x505868, 2.0));
  const key = new THREE.DirectionalLight(0xffffff, 1.7); key.position.set(-6, 12, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0x99bbff, .7); rim.position.set(8, 4, -8); scene.add(rim);

  const T30 = Math.tan(Math.PI / 6), K = .55, XA = -4, XB = 4, XE = 6.2, H = (XB - XA) * T30;
  const sp = u => K * Math.log(1 + Math.exp(u / K)), sg = u => 1 / (1 + Math.exp(-u / K));
  const Y = x => T30 * (sp(x - XA) - sp(x - XB));
  const F = x => sg(x - XA) - sg(x - XB); // 0 flat .. 1 slope
  const DROP = 1.5, R = DROP / 2;
  // loop parameter: top run x -XE..XE, arc down at right, bottom run XE..-XE, arc up at left
  const LT = 2 * XE, LA = Math.PI * R, L = 2 * LT + 2 * LA;
  function pose(s) {
    s = ((s % L) + L) % L;
    if (s < LT) { const x = -XE + s; return { x, y: Y(x), rot: 0, top: 1 }; }
    s -= LT;
    if (s < LA) { const a = s / R; return { x: XE + Math.sin(a) * R, y: Y(XE) - R + Math.cos(a) * R, rot: -a, top: 0 }; }
    s -= LA;
    if (s < LT) { const x = XE - s; return { x, y: Y(x) - DROP, rot: -Math.PI, top: 0 }; }
    s -= LT; const a = s / R; return { x: -XE - Math.sin(a) * R, y: Y(-XE) - R - Math.cos(a) * R, rot: -Math.PI - a, top: 0 };
  }
  // steps
  const N = 34, SPC = L / N, W = .78, Dz = 1.6;
  const treadM = Mat({ color: 0xc8d0dc, shininess: 100 });
  const edgeM = Mat({ color: 0xffd23a, emissive: 0xffb000, emissiveIntensity: .35 });
  const riserM = Mat({ color: 0x8a96a8 });
  const wheelM = Mat({ color: 0x30343c, emissive: 0x00e0ff, emissiveIntensity: 0 });
  const steps = [];
  for (let i = 0; i < N; i++) {
    const g = new THREE.Group(); scene.add(g);
    const tr = new THREE.Mesh(new THREE.BoxGeometry(W, .09, Dz), treadM); tr.position.x = -W / 2; g.add(tr);
    for (let k = 0; k < 6; k++) { const gr = new THREE.Mesh(new THREE.BoxGeometry(W * .92, .02, .03), riserM); gr.position.set(-W / 2, .05, -Dz / 2 + .15 + k * .26); g.add(gr); }
    [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.BoxGeometry(W, .095, .06), edgeM); e.position.set(-W / 2, .002, s * (Dz / 2 - .03)); g.add(e); });
    const ri = new THREE.Mesh(new THREE.BoxGeometry(.05, 1, Dz * .96), riserM); ri.position.x = -W; g.add(ri);
    const wh = [];
    [[-.05, -.2], [-W + .05, -.2]].forEach(([x, y], j) => [-1, 1].forEach(sz => { const w = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .06, 16), wheelM); w.rotation.x = Math.PI / 2; w.position.set(x, y, sz * (j ? .62 : .8)); g.add(w); wh.push(w); }));
    steps.push({ g, ri, wh });
  }
  // tracks (two lines along top run): main (front wheels) and trailer (rear wheels)
  const trackM = Mat({ color: 0x5a6476, emissive: 0x00c0ff, emissiveIntensity: 0 });
  const mkTrack = (fn, z) => { const pts = []; for (let x = -XE; x <= XE + .001; x += .2) pts.push(V(x, fn(x), z)); const c = new THREE.CatmullRomCurve3(pts); [z, -z].forEach(zz => { const p2 = pts.map(p => V(p.x, p.y, zz)); scene.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(p2), 120, .035, 6), trackM)); }); };
  mkTrack(x => Y(x) - .29, .8);
  mkTrack(x => Y(x - W) - .29 + 0, .62);
  // chain (dots along loop) + sprockets
  const chainM = Mat({ color: 0x9aa4b4, emissive: 0xffa020, emissiveIntensity: 0 });
  const links = []; for (let i = 0; i < 90; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(.12, .07, .07), chainM); scene.add(m); links.push(m); }
  const sprM = Mat({ color: 0x6c7890, emissive: 0xff8000, emissiveIntensity: 0 });
  const spr = [XE, -XE].map((x, i) => { const g = new THREE.Group(); g.position.set(x, Y(x) - R - .2, 0); scene.add(g); [-.8, .8].forEach(z => { const d = new THREE.Mesh(new THREE.CylinderGeometry(R * .9, R * .9, .1, 20), sprM); d.rotation.x = Math.PI / 2; d.position.z = z; g.add(d); for (let k = 0; k < 10; k++) { const t = new THREE.Mesh(new THREE.BoxGeometry(.12, .2, .1), sprM); const a = k / 10 * Math.PI * 2; t.position.set(Math.cos(a) * R * .95, Math.sin(a) * R * .95, z); t.rotation.z = a; g.add(t); } }); const ax = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 1.8, 10), Mat({ color: 0x888888 })); ax.rotation.x = Math.PI / 2; g.add(ax); return g; });
  const motorM = Mat({ color: 0x2f80e0, emissive: 0x1050ff, emissiveIntensity: 0 });
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(.45, .45, 1.1, 24), motorM); motor.rotation.x = Math.PI / 2; motor.position.set(XE + 1.3, Y(XE) - 1.6, -.2); scene.add(motor);
  const belt = new THREE.Mesh(new THREE.BoxGeometry(1.4, .08, .1), Mat({ color: 0x222 })); belt.position.set(XE + .65, Y(XE) - 1.1, -1.0); belt.rotation.z = .55; scene.add(belt);
  // landings + comb plates
  const landM = Mat({ color: 0x707c90 });
  [[-XE - 1.6, Y(-XE)], [XE + 1.6, Y(XE)]].forEach(([x, y]) => { const l = new THREE.Mesh(new THREE.BoxGeometry(3.0, .12, 2.4), landM); l.position.set(x, y - .01, 0); scene.add(l); });
  const combM = Mat({ color: 0xffd23a, emissive: 0xffa000, emissiveIntensity: 0 });
  const combs = [[-XE - .1, 1], [XE + .1, -1]].map(([x, s]) => { const g = new THREE.Group(); g.position.set(x, Y(x) + .06, 0); scene.add(g);
    const b = new THREE.Mesh(new THREE.BoxGeometry(.25, .06, Dz), combM); b.position.x = -s * .05; g.add(b);
    for (let k = 0; k < 16; k++) { const t = new THREE.Mesh(new THREE.BoxGeometry(.25, .03, .04), combM); t.position.set(s * .2, -.02, -Dz / 2 + .05 + k * (Dz - .1) / 15); g.add(t); } return g; });
  // balustrades (glass ribbons) and handrails
  const glassM = new THREE.MeshPhongMaterial({ color: 0xbfe0ff, transparent: true, opacity: .22, side: THREE.DoubleSide, depthWrite: false, shininess: 150 });
  const ribbon = (f0, f1, z, mat) => { const pos = [], idx = []; let n = 0; for (let x = -XE - .4; x <= XE + .401; x += .2) { pos.push(x, f0(x), z, x, f1(x), z); if (n) { const a = 2 * (n - 1); idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } n++; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); const m = new THREE.Mesh(g, mat); scene.add(m); return m; };
  [-1, 1].forEach(s => ribbon(x => Y(x) + .05, x => Y(x) + 1.05, s * .95, glassM));
  // side skirt (truss) only on far side, so hidden steps are visible from the front
  ribbon(x => Y(x) - DROP - .55, x => Y(x) - .1, -1.15, Mat({ color: 0x55688c, side: THREE.DoubleSide }));
  const railM = Mat({ color: 0x15171c, emissive: 0xff3040, emissiveIntensity: 0, shininess: 40 });
  const rails = [-1, 1].map(s => { const pts = []; for (let x = -XE - .4; x <= XE + .4; x += .4) pts.push(V(x, Y(x) + 1.1, s * .95)); pts.push(V(XE + .9, Y(XE) + .9, s * .95)); pts.push(V(XE + .6, Y(XE) + .35, s * .95));
    for (let x = XE; x >= -XE; x -= .4) pts.push(V(x, Y(x) + .25, s * .95)); pts.push(V(-XE - .6, Y(-XE) + .35, s * .95)); pts.push(V(-XE - .9, Y(-XE) + .9, s * .95));
    const c = new THREE.CatmullRomCurve3(pts, true); scene.add(new THREE.Mesh(new THREE.TubeGeometry(c, 240, .07, 8, true), railM));
    const marks = []; for (let k = 0; k < 26; k++) { const m = new THREE.Mesh(new THREE.SphereGeometry(.085, 8, 6), Mat({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: .3 })); scene.add(m); marks.push(m); } return { c, marks, len: c.getLength() }; });

  const shots = [
    [[-8, 2.2, 13.5], [.5, 1.0, 0]],      // hook: front, sees under
    [[13, 3, 10], [5.8, 2.5, 0]],     // chain + motor at top
    [[-1.2, .9, 5.2], [.6, 1.6, .2]],     // wheels close
    [[-9, 7, 15], [0, 2.1, 0]],       // stairs on slope
    [[-12, 3.5, 7], [-5.5, .3, 0]],   // flatten bottom
    [[-10, 3, 6], [-6, .8, .4]],      // comb + handrail
    [[8.5, 4.5, 13.5], [-.3, 1.4, 0]],        // recap
  ];
  const cp = { p: V(), q: V() };
  const v = .55;
  function update(t, si, lt, sd) {
    sd = sd || 6;
    const s0 = t * v;
    steps.forEach((st, i) => { const p = pose(i * SPC + s0); st.g.position.set(p.x, p.y, 0); st.g.rotation.z = p.rot;
      const f = p.top ? F(p.x - W / 2) : 0; const h = W * T30 * f; st.ri.scale.y = Math.max(.02, h); st.ri.position.y = -h / 2 + .03; st.ri.visible = p.top && h > .03; });
    links.forEach((m, i) => { const p = pose(i * L / links.length + s0); m.position.set(p.x - .05, p.y - .29, 0.8); m.rotation.z = p.rot; });
    spr.forEach(g => g.rotation.z = -s0 / R);
    const pulse = .5 + .5 * Math.sin(t * 5);
    chainM.emissiveIntensity = si === 1 ? .6 * pulse + .2 : 0; sprM.emissiveIntensity = si === 1 ? .4 * pulse : 0; motorM.emissiveIntensity = si === 1 ? .5 + .4 * pulse : 0;
    wheelM.emissiveIntensity = si === 2 ? .5 + .4 * pulse : 0;
    trackM.emissiveIntensity = (si === 3 || si === 4) ? .45 + .35 * pulse : (si === 2 ? .2 : 0);
    combM.emissiveIntensity = si === 5 ? .4 + .4 * pulse : 0; railM.emissiveIntensity = si === 5 ? .35 * pulse + .15 : 0;
    edgeM.emissiveIntensity = si === 3 ? .7 : .35;
    // hidden steps glow in hook
    treadM.emissive = treadM.emissive || new THREE.Color(); treadM.emissive.setHex(si === 0 ? 0x203050 : 0x000000);
    rails.forEach(r => r.marks.forEach((m, k) => { const u = ((k / r.marks.length) + s0 / r.len) % 1; m.position.copy(r.c.getPointAt(u)); }));
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const k = si === 0 ? 1 : ease(lt / 1.3);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], k))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], k)));
    const o = Math.sin(t * .2) * .08, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o));
    camera.lookAt(cp.q);
  }
  return { update };
}
