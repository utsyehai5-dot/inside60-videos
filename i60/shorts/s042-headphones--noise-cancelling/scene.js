// Inside 60 — Noise cancelling headphones. Steps: 0 hook, 1 outer mics listen, 2 chip samples, 3 inverted wave (180°), 4 cancel, 5 best at low hum + cushions, 6 recap
export async function setup({ THREE, scene, camera }) {
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const ss = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 90, specular: 0x666666, side: THREE.DoubleSide, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x1c1a3a); scene.fog = new THREE.Fog(0x1c1a3a, 30, 80);
  scene.add(new THREE.HemisphereLight(0xf0f4ff, 0x40404c, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(5, 7, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0xc0a0ff, .8); rim.position.set(-6, -3, -6); scene.add(rim);

  const hp = new THREE.Group(); scene.add(hp); hp.position.y = 1.0;
  const shellM = Mat({ color: 0x2f9fd8, shininess: 110 });
  const darkM = Mat({ color: 0x2a2d36, shininess: 40 });
  // headband
  const band = new THREE.CatmullRomCurve3([V(-2.4, .9, 0), V(-2.3, 2.6, 0), V(-1.3, 3.7, 0), V(0, 4.0, 0), V(1.3, 3.7, 0), V(2.3, 2.6, 0), V(2.4, .9, 0)]);
  hp.add(new THREE.Mesh(new THREE.TubeGeometry(band, 64, .2, 10, false), shellM));
  const pad = new THREE.Mesh(new THREE.TubeGeometry(band, 64, .24, 10, false).scale(1, .985, 1.3), darkM); pad.position.y = -.06; hp.add(pad);
  // ear cups (axis along x). Lathe around y, rotated so its axis = x
  const cupProfile = [[0, 0], [1.1, 0], [1.35, .2], [1.4, .9], [1.25, 1.0], [0, 1.0]];
  const mkCup = (side, open) => {
    const g = new THREE.Group(); g.position.set(2.3 * side, -.2, 0); hp.add(g);
    const lat = new THREE.LatheGeometry(cupProfile.map(([r, y]) => new THREE.Vector2(r, y)), 48, open ? Math.PI * .3 : 0, open ? Math.PI * 1.4 : Math.PI * 2);
    const shell = new THREE.Mesh(lat, shellM); shell.rotation.z = side > 0 ? -Math.PI / 2 : Math.PI / 2; shell.position.x = side > 0 ? -.35 : .35; g.add(shell);
    const cush = new THREE.Mesh(new THREE.TorusGeometry(1.0, .3, 12, 40), cushM); cush.rotation.y = Math.PI / 2; cush.position.x = -.45 * side; g.add(cush);
    return g;
  };
  const cushM = Mat({ color: 0x3a3d48, shininess: 10, emissive: 0x40ff90, emissiveIntensity: 0 });
  const cupL = mkCup(-1, false), cupR = mkCup(1, true);
  // right cup internals (visible through the cut-away)
  const micM = Mat({ color: 0x20242c, emissive: 0xff4040, emissiveIntensity: 0 });
  const mic = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, .14, 16), micM); mic.rotation.z = Math.PI / 2; mic.position.set(.72, .75, .3); cupR.add(mic);
  const micRing = new THREE.Mesh(new THREE.TorusGeometry(.2, .035, 6, 24), Mat({ color: 0xc0c8d4 })); micRing.rotation.y = Math.PI / 2; micRing.position.set(.8, .75, .3); cupR.add(micRing);
  const chipM = Mat({ color: 0x1e5a3a, emissive: 0x30ff90, emissiveIntensity: 0 });
  const chip = new THREE.Mesh(new RoundedBoxGeometry(.12, .55, .55, 2, .03), chipM); chip.position.set(.3, .2, .45); cupR.add(chip);
  const pinM = Mat({ color: 0xd0d4dc });
  for (let i = 0; i < 4; i++) for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(.06, .05, .1), pinM); p.position.set(.3, .05 + i * .1, .45 + s * .32); cupR.add(p); }
  const drvM = Mat({ color: 0x50545e, emissive: 0x40a0ff, emissiveIntensity: 0 });
  const drv = new THREE.Mesh(new THREE.ConeGeometry(.85, .35, 32, 1, true), drvM); drv.rotation.z = Math.PI / 2; drv.position.set(-.15, 0, 0); cupR.add(drv);
  const mag = new THREE.Mesh(new THREE.CylinderGeometry(.35, .35, .25, 24), darkM); mag.rotation.z = Math.PI / 2; mag.position.set(.12, 0, 0); cupR.add(mag);
  const wireM = Mat({ color: 0xd8b060, emissive: 0xffa000, emissiveIntensity: .1 });
  [[V(.72, .75, .3), V(.5, .55, .45), V(.32, .4, .45)], [V(.3, .0, .45), V(.25, -.15, .25), V(.12, 0, .1)]].forEach(pts => cupR.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, .025, 5, false), wireM)));

  // wave traces (dots). Noise (red), anti-noise (blue), sum (green)
  const mkTrace = (col, n) => { const m = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, depthWrite: false }); const d = []; for (let i = 0; i < n; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(.1, 8, 6), m); scene.add(s); d.push(s); } return { m, d }; };
  const noise = mkTrace(0xff5050, 46), anti = mkTrace(0x50a0ff, 46), sum = mkTrace(0x60ff90, 46);
  const samp = mkTrace(0xfff080, 18);
  // incoming noise rings from the right
  const rings = [];
  for (let i = 0; i < 5; i++) { const m = new THREE.MeshBasicMaterial({ color: 0xff6060, transparent: true, opacity: 0, depthWrite: false }); const w = new THREE.Mesh(new THREE.TorusGeometry(1, .05, 6, 48), m); w.rotation.y = Math.PI / 2; scene.add(w); rings.push({ w, m, o: i / 5 }); }

  const shots = [
    [[3, 2.5, 15], [0, .2, 0]],
    [[6.5, 2.6, 7.5], [3.0, .6, .3]],
    [[5.5, 1.6, 5.5], [2.6, .9, .4]],
    [[2.5, 0, 15], [0, -1.0, 0]],
    [[-2.5, 0, 15], [0, -1.0, 0]],
    [[-4, 2, 16], [0, -1.4, 0]],
    [[-3, 2.5, 15], [0, .2, 0]],
  ];
  const cp = { p: V(), q: V() };
  function update(t, si, lt) {
    const pulse = .5 + .5 * Math.sin(t * 5);
    const low = si === 5;
    const kx = low ? .9 : 2.2, w = low ? 3 : 6;
    const wave = x => Math.sin(kx * x - w * t) * .6 + 0;
    micM.emissiveIntensity = si === 1 ? .5 + .5 * pulse : (si === 2 ? .3 : 0);
    chipM.emissiveIntensity = si === 2 || si === 3 ? .4 + .4 * pulse : .05;
    drvM.emissiveIntensity = si === 4 ? .3 + .3 * Math.abs(Math.sin(w * t)) : 0;
    drv.position.x = -.15 + (si === 4 ? .04 * Math.sin(w * t * 1.3) : 0);
    cushM.emissiveIntensity = si === 5 ? .2 + .2 * pulse : 0;
    wireM.emissiveIntensity = si >= 1 && si <= 4 ? .3 + .2 * pulse : .1;
    // incoming noise rings
    const rOn = si <= 2 || si === 6;
    rings.forEach(a => { const u = (t * .4 + a.o) % 1; a.w.position.set(lerp(9, 3.4, u), .8, .2); const r = .6 + u * .8; a.w.scale.set(r, r, 1); a.m.opacity = rOn ? (si === 1 ? .9 : .55) * ss(0, .15, u) * (1 - ss(.85, 1, u)) : 0; });
    // traces below the headphones
    const Y = -1.2, X0 = -4.2, X1 = 4.2;
    const nOn = si >= 3 && si <= 5 ? 1 : 0;
    const aOn = si === 3 ? ss(.3, 1.5, lt) : (si === 4 || si === 5 ? 1 : 0);
    const sOn = si === 4 ? ss(.6, 1.8, lt) : (si === 5 ? 1 : 0);
    noise.m.opacity = nOn; anti.m.opacity = aOn; sum.m.opacity = sOn;
    const sep = si === 3 ? .9 : (si >= 4 ? lerp(.9, 0, si === 4 ? ss(0, 1.2, lt) : 1) : .9);
    for (let i = 0; i < 46; i++) {
      const x = lerp(X0, X1, i / 45), y = wave(x);
      noise.d[i].position.set(x, Y + sep + y, 0);
      anti.d[i].position.set(x, Y - sep - y * aOn, .05);
      sum.d[i].position.set(x, Y - 1.4 + (si === 5 ? .06 * Math.sin(9 * x - 9 * t) : 0), 0);
    }
    // chip "samples" the noise near the cup
    samp.m.opacity = si === 2 ? ss(0, .5, lt) : 0;
    samp.d.forEach((m, i) => { const x = 3.6 + i * .3; m.position.set(x, 1.8 + .5 * Math.sin(2.2 * x - 6 * t), .6); m.scale.setScalar(.8 + .4 * ((i + Math.floor(t * 8)) % 3 === 0)); });
    // camera
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const k = si === 0 ? 1 : ease(lt / 1.3);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], k))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], k)));
    const o = Math.sin(t * .2) * .06, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o));
    camera.lookAt(cp.q);
  }
  return { update };
}
