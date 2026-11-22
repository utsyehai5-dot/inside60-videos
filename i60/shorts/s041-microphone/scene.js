// Inside 60 — Microphone (dynamic). Steps: 0 hook (speaker in reverse), 1 sound waves arrive, 2 diaphragm shakes, 3 coil around magnet, 4 induction current, 5 signal out, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const ss = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 90, specular: 0x666666, side: THREE.DoubleSide, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x14223a); scene.fog = new THREE.Fog(0x14223a, 30, 80);
  scene.add(new THREE.HemisphereLight(0xf0f4ff, 0x404050, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(5, 7, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0xa0c0ff, .8); rim.position.set(-6, -3, -6); scene.add(rim);
  // lathe around y; open wedge (phi 0..π/2) faces the camera (+x,+z)
  const PS = Math.PI / 2, PL = Math.PI * 1.5;
  const lathe = (pts, mat, seg = 48) => new THREE.Mesh(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg, PS, PL), mat);
  const ring = (r0, r1, y0, y1) => [[r0, y0], [r1, y0], [r1, y1], [r0, y1], [r0, y0]];

  const mic = new THREE.Group(); scene.add(mic); mic.position.y = -1.2;
  // handle
  const bodyM = Mat({ color: 0x3c4250, shininess: 70 });
  mic.add(lathe([[.55, -6], [.7, -6], [.95, .4], [1.05, .6], [1.05, .75], [.8, .75], [.75, .4], [.5, -6]], bodyM));
  const capM = Mat({ color: 0x9aa4b4, shininess: 140 });
  mic.add(lathe(ring(.55, .72, -6.2, -5.9), capM));
  // grille (wire cage)
  const grilleM = new THREE.MeshPhongMaterial({ color: 0xc8d0dc, wireframe: true, transparent: true, opacity: .55 });
  const grille = new THREE.Mesh(new THREE.SphereGeometry(1.45, 22, 14, PS, PL, 0, Math.PI * .62), grilleM); grille.position.y = 1.5; mic.add(grille);
  mic.add(lathe(ring(1.0, 1.12, .7, 1.0), capM));
  // magnet assembly
  const magM = Mat({ color: 0x3a3e48, shininess: 60 });
  const nM = Mat({ color: 0xd84040, emissive: 0xff2020, emissiveIntensity: 0 }), sM = Mat({ color: 0x3a6ae0, emissive: 0x2050ff, emissiveIntensity: 0 });
  mic.add(lathe(ring(.55, .85, .8, 1.35), magM));
  mic.add(lathe(ring(.48, .85, 1.35, 1.45), nM));
  mic.add(lathe([[0, .8], [.3, .8], [.3, 1.55], [0, 1.55]], sM));
  mic.add(lathe(ring(0, .85, .7, .8), sM));
  // moving: diaphragm + coil
  const mov = new THREE.Group(); mic.add(mov);
  const diaM = Mat({ color: 0xf0c040, emissive: 0xffb000, emissiveIntensity: 0, shininess: 150, specular: 0xffffff });
  mov.add(lathe([[0, 2.02], [.25, 2.0], [.5, 1.92], [.75, 1.8], [.92, 1.72]], diaM));
  const coilM = Mat({ color: 0xd07830, emissive: 0xff3000, emissiveIntensity: 0, shininess: 120 });
  mov.add(lathe(ring(.36, .43, 1.15, 1.8), coilM));
  for (let i = 0; i < 7; i++) { const w = new THREE.Mesh(new THREE.TorusGeometry(.44, .03, 6, 32, PL), coilM); w.rotation.x = Math.PI / 2; w.rotation.z = -PS - PL; w.position.y = 1.2 + i * .09; mov.add(w); }
  // wire down the handle
  const wireM = Mat({ color: 0xd8b060, emissive: 0xffa000, emissiveIntensity: .1 });
  const wcurve = new THREE.CatmullRomCurve3([V(.3, 1.2, .3), V(.45, .4, .35), V(.4, -2.5, .3), V(.35, -5.6, .25)]);
  mic.add(new THREE.Mesh(new THREE.TubeGeometry(wcurve, 40, .045, 6, false), wireM));
  const qM = new THREE.MeshBasicMaterial({ color: 0x60e0ff, transparent: true, opacity: 0, depthWrite: false });
  const charges = []; for (let i = 0; i < 10; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(.1, 10, 8), qM); mic.add(m); charges.push(m); }
  // incoming sound waves (flat wavefronts falling onto the grille)
  const waves = [];
  for (let i = 0; i < 5; i++) { const m = new THREE.MeshBasicMaterial({ color: 0x80e0ff, transparent: true, opacity: 0, depthWrite: false }); const w = new THREE.Mesh(new THREE.TorusGeometry(1, .05, 6, 64), m); w.rotation.x = Math.PI / 2; scene.add(w); waves.push({ w, m, o: i / 5 }); }
  // field lines glow (simple vertical rods around the gap)
  const fieldM = new THREE.MeshBasicMaterial({ color: 0x90b0ff, transparent: true, opacity: 0, depthWrite: false });
  for (let k = 0; k < 8; k++) { const a = PS + k * PL / 7; const m = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, .5, 6), fieldM); m.position.set(.4 * Math.sin(a), 1.3, .4 * Math.cos(a)); m.rotation.z = Math.PI / 2; m.rotation.y = a; mic.add(m); }
  // output signal trace beside the mic
  const sigM = new THREE.MeshBasicMaterial({ color: 0xfff080, transparent: true, opacity: 0, depthWrite: false });
  const sdots = []; for (let i = 0; i < 34; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 6), sigM); scene.add(m); sdots.push(m); }

  const shots = [
    [[6, 2, 17], [0, -1.6, 0]],
    [[5, 5, 13], [0, 1.6, 0]],
    [[3.2, 2.6, 4.8], [0, .8, 0]],
    [[3.6, 1.2, 4.2], [0, .3, 0]],
    [[3.0, .6, 3.8], [0, .2, 0]],
    [[9, 1, 14], [1.6, -2, 0]],
    [[-6, 2, 17], [0, -1.6, 0]],
  ];
  const cp = { p: V(), q: V() };
  function update(t, si, lt) {
    const pulse = .5 + .5 * Math.sin(t * 5);
    const ph = t * Math.PI * 2 * (si === 2 || si === 3 || si === 4 ? 1.4 : 3);
    const cur = Math.sin(ph) * (.7 + .3 * Math.sin(t * 1.7));
    const amp = si === 0 || si === 6 ? .04 : (si === 1 ? .03 : .09);
    mov.position.y = amp * cur;
    diaM.emissiveIntensity = si === 2 ? .2 + .3 * Math.abs(cur) : .05;
    coilM.emissive.setHex(cur > 0 ? 0xff3000 : 0x2080ff);
    coilM.emissiveIntensity = si === 4 || si === 5 ? .9 * Math.abs(cur) : (si === 3 ? .3 : .05);
    nM.emissiveIntensity = si === 3 || si === 4 ? .25 + .2 * pulse : 0; sM.emissiveIntensity = nM.emissiveIntensity;
    fieldM.opacity = si === 3 || si === 4 ? .5 + .3 * pulse : 0;
    grilleM.opacity = si >= 2 && si <= 4 ? .18 : .55;
    bodyM.transparent = true; bodyM.opacity = si >= 2 && si <= 4 ? .5 : 1;
    // charges in the wire
    qM.opacity = si >= 4 && si <= 5 ? 1 : 0;
    charges.forEach((m, i) => { const u = Math.min(.99, Math.max(.01, ((i / 10 + t * .25) % 1))); m.position.copy(wcurve.getPoint(u)); });
    wireM.emissiveIntensity = si >= 4 && si <= 5 ? .35 + .3 * Math.abs(cur) : .1;
    // incoming sound
    const wOn = si <= 2 || si === 6;
    waves.forEach(a => { const u = (t * .45 + a.o) % 1; a.w.position.y = lerp(7.5, 1.6, u); const r = 1.6 - u * .3; a.w.scale.set(r, r, 1); a.m.opacity = wOn ? (si === 1 ? .85 : .5) * ss(0, .15, u) * (1 - ss(.85, 1, u)) : 0; });
    // output trace
    sigM.opacity = si === 5 ? ss(0, .6, lt) : 0;
    sdots.forEach((m, i) => { const x = i / 33; const p = ph - x * 10; m.position.set(2.0 + .55 * Math.sin(p) * (.7 + .3 * Math.sin(t * 1.7 - x * 3)), -6.4 + x * 7, 0); });
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
