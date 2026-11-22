// Inside 60 — Speaker. Steps: 0 hook (440 Hz), 1 alternating current signal, 2 voice coil in magnet gap, 3 push/pull electromagnet, 4 cone piston, 5 pressure waves, 6 recap
export async function setup({ THREE, scene, camera }) {
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const ss = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 90, specular: 0x666666, side: THREE.DoubleSide, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x1a1838); scene.fog = new THREE.Fog(0x1a1838, 30, 80);
  scene.add(new THREE.HemisphereLight(0xf0f4ff, 0x40404c, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(4, 6, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0xa0c0ff, .8); rim.position.set(-6, -3, -6); scene.add(rim);
  const P0 = Math.PI, PL = Math.PI * 1.5; // cut-away wedge faces the camera
  const lathe = (pts, mat, seg = 48) => { const m = new THREE.Mesh(new THREE.LatheGeometry(pts.map(([r, z]) => new THREE.Vector2(r, z)), seg, P0, PL), mat); m.rotation.x = Math.PI / 2; return m; };
  const ring = (r0, r1, z0, z1) => [[r0, z0], [r1, z0], [r1, z1], [r0, z1], [r0, z0]];

  // static parts: magnet + plates + pole + basket
  const magM = Mat({ color: 0x3a3e48, shininess: 60 });
  scene.add(lathe(ring(.78, 1.9, -1.75, -1.05), magM));
  const nM = Mat({ color: 0xd84040, emissive: 0xff2020, emissiveIntensity: 0 }), sM = Mat({ color: 0x3a6ae0, emissive: 0x2050ff, emissiveIntensity: 0 });
  scene.add(lathe(ring(.62, 1.9, -1.05, -.85), nM));          // top plate (N)
  scene.add(lathe(ring(0, 1.9, -1.95, -1.75), sM));            // back plate (S)
  scene.add(lathe([[0, -1.75], [.42, -1.75], [.42, -.85], [0, -.85]], sM)); // pole piece
  const basketM = Mat({ color: 0x8a92a0, shininess: 120 });
  scene.add(lathe([[1.9, -.85], [2.0, -.85], [2.85, .95], [2.75, .95]], Mat({ color: 0x8a92a0, shininess: 120, transparent: true, opacity: .35, depthWrite: false })));
  const frontRing = lathe(ring(2.75, 3.05, .95, 1.1), basketM); scene.add(frontRing);

  // moving parts
  const mov = new THREE.Group(); scene.add(mov);
  const coneM = Mat({ color: 0x40444e, shininess: 30, specular: 0x222222, emissive: 0x40c0ff, emissiveIntensity: 0 });
  mov.add(lathe([[.5, -.4], [1.4, .2], [2.45, .85]], coneM));
  const surround = new THREE.Mesh(new THREE.TorusGeometry(2.6, .14, 8, 48, PL), Mat({ color: 0x24262c })); surround.rotation.z = P0 + Math.PI / 2; surround.position.z = .9;
  // torus lies in xy (z axis normal) — align its arc start with the lathe wedge
  mov.add(surround);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(.55, 24, 10, P0, PL, 0, Math.PI / 2), Mat({ color: 0x30333a })); cap.rotation.x = Math.PI / 2; cap.position.z = -.35; cap.scale.y = .6; mov.add(cap);
  const coilM = Mat({ color: 0xd07830, emissive: 0xff3000, emissiveIntensity: 0, shininess: 120 });
  mov.add(lathe(ring(.47, .55, -1.35, -.35), coilM));
  for (let i = 0; i < 9; i++) { const w = new THREE.Mesh(new THREE.TorusGeometry(.56, .035, 6, 32, PL), coilM); w.rotation.z = P0 + Math.PI / 2; w.position.z = -1.3 + i * .11; mov.add(w); }
  const spiderM = Mat({ color: 0xc8b070, shininess: 20 });
  mov.add(lathe([[.56, -.55], [.9, -.6], [1.2, -.5], [1.5, -.6], [1.85, -.55]], spiderM));

  // wire + terminal
  const TERM = V(2.4, -2.2, -1.3);
  const term = new THREE.Mesh(new RoundedBoxGeometry(.7, .5, .35, 2, .06), Mat({ color: 0x30333a })); term.position.copy(TERM); scene.add(term);
  const wireM = Mat({ color: 0xd8b060, emissive: 0xffa000, emissiveIntensity: .1 });
  const wcurve = new THREE.CatmullRomCurve3([TERM.clone().add(V(-.2, .2, 0)), V(1.6, -1.6, -1.2), V(.9, -.7, -.6), V(.55, -.3, -.6)]);
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(wcurve, 40, .04, 6, false), wireM));
  const qM = new THREE.MeshBasicMaterial({ color: 0xff5040, transparent: true, opacity: 0, depthWrite: false });
  const charges = []; for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(.09, 10, 8), qM); scene.add(m); charges.push(m); }
  // signal wave dots
  const waveM = new THREE.MeshBasicMaterial({ color: 0xfff080, transparent: true, opacity: 0, depthWrite: false });
  const wdots = []; for (let i = 0; i < 28; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(.1, 8, 6), waveM); scene.add(m); wdots.push(m); }
  // air pressure waves
  const airM = []; const airs = [];
  for (let i = 0; i < 6; i++) { const m = new THREE.MeshBasicMaterial({ color: 0x80d8ff, transparent: true, opacity: 0, depthWrite: false }); const w = new THREE.Mesh(new THREE.TorusGeometry(1, .05, 6, 64), m); scene.add(w); airs.push({ w, m, o: i / 6 }); }
  // magnet field arrows (simple glowing arcs)
  const fieldM = new THREE.MeshBasicMaterial({ color: 0x80a0ff, transparent: true, opacity: 0, depthWrite: false });
  [-1, 1].forEach(s => { const c = new THREE.CatmullRomCurve3([V(.7 * s, 0, -.95).applyAxisAngle(V(0, 0, 1), .0), V(.7 * s, 0, -.95)]); });
  for (let k = 0; k < 6; k++) { const a = Math.PI * .5 + k * .35; const m = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, .2, 6), fieldM); m.rotation.z = Math.PI / 2 + a; m.position.set(.5 * Math.cos(a), .5 * Math.sin(a), -.95); }

  const shots = [
    [[7, 4, 21], [0, -.2, .6]],
    [[11, 1, 8], [1.6, -1.4, -1.2]],
    [[6.5, 3.2, 6.5], [0, 0, -.9]],
    [[6.2, .8, 7.8], [0, 0, -.8]],
    [[13, 2, 4], [0, 0, .2]],
    [[10, 5, 23], [0, -.2, 2]],
    [[-7, 4, 21], [0, -.2, .6]],
  ];
  const cp = { p: V(), q: V() };
  function update(t, si, lt, sd) {
    sd = sd || 6;
    const pulse = .5 + .5 * Math.sin(t * 5);
    const f = si === 0 || si === 6 ? 7 : (si === 5 ? 3 : 1.6);
    const ph = Math.PI * 2 * f * t, cur = Math.sin(ph);
    const amp = si === 0 || si === 6 ? .08 : (si === 1 || si === 2 ? .05 : .28);
    mov.position.z = amp * cur;
    const glow = si >= 3 && si <= 4 ? 1 : (si === 2 ? .4 : .15);
    coilM.emissive.setHex(cur > 0 ? 0xff3000 : 0x2060ff); coilM.emissiveIntensity = glow * Math.abs(cur);
    nM.emissiveIntensity = si === 2 || si === 3 ? .25 + .2 * pulse : 0; sM.emissiveIntensity = nM.emissiveIntensity;
    coneM.emissiveIntensity = si === 4 ? .15 + .15 * Math.abs(cur) : 0;
    // charges flow back and forth along the wire
    qM.opacity = si >= 1 && si <= 3 ? 1 : 0; qM.color.setHex(cur > 0 ? 0xff5040 : 0x4080ff);
    charges.forEach((m, i) => { const u = Math.min(.98, Math.max(.02, i / 6 + .08 + .07 * Math.sin(ph))); m.position.copy(wcurve.getPoint(u)); });
    wireM.emissiveIntensity = si === 1 ? .3 + .3 * Math.abs(cur) : .1;
    // signal wave dots scroll
    waveM.opacity = si === 1 ? ss(0, .6, lt) : (si === 2 ? 1 - ss(0, .8, lt) : 0);
    wdots.forEach((m, i) => { const x = i / 27; m.position.set(2.6 + x * 3.2 * .0 + .2, -2.9 - .0, -1.3 + 0); m.position.set(3.1, -1.3 + .6 * Math.sin(ph - x * 9), .6 - x * 4.4); });
    // air waves
    const airOn = si === 0 || si >= 4;
    airs.forEach(a => { const u = (t * (si === 5 ? .35 : .45) + a.o) % 1; const r = 2.7 + u * 1.8; a.w.scale.set(r, r, 1); a.w.position.z = 1.2 + u * 4.5; a.m.opacity = airOn ? (si === 5 ? .75 : .45) * (1 - u) : 0; });
    // camera
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const k = si === 0 ? 1 : ease(lt / 1.3);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], k))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], k)));
    const o = Math.sin(t * .2) * .08, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o));
    camera.lookAt(cp.q);
  }
  return { update };
}
