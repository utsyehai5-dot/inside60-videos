// Inside 60 — How a Turbocharger Works. Steps: 0 hook, 1 exhaust flow, 2 turbine, 3 shaft + compressor, 4 intercooler, 5 more power, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 60, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  scene.background = new THREE.Color(0x161e36);
  scene.fog = new THREE.Fog(0x161e36, 30, 75);
  scene.add(new THREE.HemisphereLight(0xeaf2ff, 0x30302a, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(6, 10, 9); scene.add(key);
  const rim = new THREE.DirectionalLight(0x88ccff, .9); rim.position.set(-7, 5, -6); scene.add(rim);

  // engine
  const engM = Mat({ color: 0x5a6474, emissive: 0xff7030, emissiveIntensity: 0 });
  const eng = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.6, 2.4), engM); scene.add(eng);
  const head = new THREE.Mesh(new THREE.BoxGeometry(3.0, .5, 2.0), Mat({ color: 0x3a4250 })); head.position.y = 1.55; scene.add(head);
  const cyl = []; for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .2, 20), Mat({ color: 0xff8040, emissive: 0xff5010, emissiveIntensity: .2 })); c.position.set(-1.1 + i * .73, 1.9, 0); scene.add(c); cyl.push(c); }

  const pipeM = (c, op) => Mat({ color: c, transparent: true, opacity: op, depthWrite: false });
  const tube = (pts, r, m) => { const cv = new THREE.CatmullRomCurve3(pts.map(p => V(...p))); const t = new THREE.Mesh(new THREE.TubeGeometry(cv, 80, r, 12, false), m); scene.add(t); return cv; };
  const YT = 1.6, XT = 3.3, XC = 5.1;
  const exCurve = tube([[1.5, .2, 0], [2.4, .5, 0], [3.0, 1.0, 0], [XT, YT, 0], [XT, YT, -.01]], .32, pipeM(0xc06040, .35));
  const outCurve = tube([[XT, YT, 0], [XT - .1, YT, -1.2], [XT - .2, -.4, -1.8], [XT - .2, -1.4, -4.5]], .3, pipeM(0x8a6050, .3));
  const inCurve = tube([[7.4, YT, 0], [6.4, YT, 0], [XC, YT, 0], [XC, 2.7, .9], [4.2, 3.4, 1.5], [2.4, 3.5, 1.6]], .3, pipeM(0x6a90c0, .3));
  const in2Curve = tube([[-.6, 3.5, 1.6], [-2.1, 3.0, 1.1], [-2.3, 1.2, .5], [-1.6, .3, 0]], .3, pipeM(0x6a90c0, .3));

  // turbo housings + wheels on a shaft along x
  function wheel(x, color, n) {
    const g = new THREE.Group(); g.position.set(x, YT, 0); scene.add(g);
    const m = Mat({ color, emissive: color, emissiveIntensity: 0, shininess: 100 });
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(.18, .32, .5, 20), m); hub.rotation.z = Math.PI / 2; g.add(hub);
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; const b = new THREE.Mesh(new THREE.BoxGeometry(.45, .55, .06), m); b.position.set(0, Math.cos(a) * .45, Math.sin(a) * .45); b.rotation.x = -a; b.rotation.y = .5; g.add(b); }
    return { g, m };
  }
  const tw = wheel(XT, 0xff9a40, 10), cw = wheel(XC, 0x6ac8ff, 12);
  const shaftM = Mat({ color: 0xd0d6de, shininess: 120, emissive: 0xffd040, emissiveIntensity: 0 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, XC - XT, 12), shaftM); shaft.rotation.z = Math.PI / 2; shaft.position.set((XT + XC) / 2, YT, 0); scene.add(shaft);
  const bear = new THREE.Mesh(new THREE.CylinderGeometry(.32, .32, .9, 20), Mat({ color: 0x7a8494 })); bear.rotation.z = Math.PI / 2; bear.position.set((XT + XC) / 2, YT, 0); scene.add(bear);
  const hT = new THREE.Mesh(new THREE.TorusGeometry(.72, .28, 12, 36), Mat({ color: 0xb05a3a, transparent: true, opacity: .3, depthWrite: false, emissive: 0xff5020, emissiveIntensity: 0 })); hT.rotation.y = Math.PI / 2; hT.position.set(XT, YT, 0); scene.add(hT);
  const hC = new THREE.Mesh(new THREE.TorusGeometry(.76, .3, 12, 36), Mat({ color: 0x8aa6c6, transparent: true, opacity: .3, depthWrite: false })); hC.rotation.y = Math.PI / 2; hC.position.set(XC, YT, 0); scene.add(hC);

  // intercooler (top mount)
  const icM = Mat({ color: 0x8a96a6, emissive: 0x40a0ff, emissiveIntensity: 0 });
  const ic = new THREE.Group(); ic.position.set(.9, 3.5, 1.6); scene.add(ic);
  ic.add(new THREE.Mesh(new THREE.BoxGeometry(3.4, .9, .5), icM));
  for (let i = 0; i < 16; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(.05, .95, .56), Mat({ color: 0x3a4454 })); f.position.x = -1.6 + i * .213; ic.add(f); }

  // flow particles
  function flow(curves, n, color) {
    const ps = []; const geo = new THREE.SphereGeometry(.11, 8, 6);
    for (let i = 0; i < n; i++) { const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0 }); const p = new THREE.Mesh(geo, m); scene.add(p); ps.push(p); }
    return ps;
  }
  const exP = flow(null, 46, 0xff7030), inP = flow(null, 56, 0x80d0ff);
  const hot = new THREE.Color(0xffa040), cool = new THREE.Color(0x60c8ff), fresh = new THREE.Color(0xd8f0ff);
  // joined intake path: inCurve (to intercooler entry) + intercooler straight + in2Curve
  const icA = V(2.4, 3.5, 1.6), icB = V(-.6, 3.5, 1.6);
  function intakePos(u, out) {
    if (u < .5) { inCurve.getPointAt(u / .5, out); return u < .16 ? 0 : 1; }
    if (u < .7) { out.lerpVectors(icA, icB, (u - .5) / .2); return 2; }
    in2Curve.getPointAt((u - .7) / .3, out); return 3;
  }
  function exPos(u, out) { if (u < .45) exCurve.getPointAt(u / .45, out); else outCurve.getPointAt((u - .45) / .55, out); }

  // boost glow ring on engine for "more power"
  const glowM = new THREE.MeshBasicMaterial({ color: 0xffd040, transparent: true, opacity: 0, depthWrite: false });
  const glow = new THREE.Mesh(new THREE.TorusGeometry(2.4, .08, 8, 60), glowM); glow.position.set(0, .3, 1.3); scene.add(glow);

  const shots = [
    [[6.0, 9.5, 24], [2.6, 1.4, 0]],
    [[5.5, 3.5, 10.5], [2.2, .9, 0]],
    [[7.0, 3.8, 6.2], [XT, YT, 0]],
    [[9.5, 4.5, 8.0], [4.3, YT, 0]],
    [[2.4, 9.0, 10.5], [.8, 3.0, 1.2]],
    [[-6.5, 6.0, 14.5], [1.0, 1.2, 0]],
    [[6.0, 9.5, 24.5], [2.6, 1.4, 0]],
  ];
  const cp = { p: V(), q: V() };
  let A = 0, lastT = 0, spd = 0;
  const tmp = V();

  function update(t, si, lt, sd) {
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const k = si === 0 ? 1 : ease(lt / 1.3);
    cp.p.set(...prev[0].map((v, i) => lerp(v, now[0][i], k)));
    cp.q.set(...prev[1].map((v, i) => lerp(v, now[1][i], k)));
    const o = Math.sin(t * .2) * .08;
    const dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o));
    camera.lookAt(cp.q);
    const dt = Math.min(.1, Math.max(0, t - lastT)); lastT = t;

    const exOn = si === 0 || si >= 1;
    const inOn = si === 0 || si >= 3;
    const target = si === 1 ? 6 : 14;
    spd = lerp(spd, target, Math.min(1, dt * 2)); A += dt * spd;
    tw.g.rotation.x = A; cw.g.rotation.x = A; shaft.rotation.x = A;
    const pulse = .3 + .15 * Math.sin(t * 6);
    tw.m.emissiveIntensity = si === 2 ? pulse + .2 : .1;
    cw.m.emissiveIntensity = si === 3 ? pulse + .1 : 0;
    shaftM.emissiveIntensity = si === 3 ? .6 : 0;
    hT.material.emissiveIntensity = si === 1 || si === 2 ? .4 : .1;
    icM.emissiveIntensity = si === 4 ? pulse + .2 : 0;
    engM.emissiveIntensity = si === 5 ? pulse * .6 : 0;
    cyl.forEach((c, i) => c.material.emissiveIntensity = .2 + (si === 5 ? .6 : .2) * Math.max(0, Math.sin(t * 14 + i * 1.6)));
    glowM.opacity = si === 5 ? .9 * Math.min(1, lt / .6) : 0;
    glow.scale.setScalar(1 + .06 * Math.sin(t * 5));

    exP.forEach((p, i) => {
      const u = ((i / exP.length) + t * .32) % 1;
      exPos(u, tmp); p.position.copy(tmp);
      p.material.opacity = exOn ? (si === 1 ? Math.min(1, lt / .5) : 1) * (u > .9 ? (1 - u) * 10 : 1) : 0;
      p.material.color.setHex(u < .45 ? 0xff6020 : 0xb07050);
    });
    inP.forEach((p, i) => {
      const u = ((i / inP.length) + t * .22) % 1;
      const seg = intakePos(u, tmp); p.position.copy(tmp);
      p.material.opacity = inOn ? (si === 3 ? Math.min(1, lt / .5) : 1) * (u < .05 ? u * 20 : u > .96 ? (1 - u) * 25 : 1) : 0;
      if (seg === 0) p.material.color.copy(fresh); else if (seg === 1) p.material.color.copy(hot);
      else if (seg === 2) p.material.color.copy(hot).lerp(cool, (u - .5) / .2); else p.material.color.copy(cool);
      p.scale.setScalar(seg === 0 ? 1.2 : .9);
    });
  }
  return { update };
}
