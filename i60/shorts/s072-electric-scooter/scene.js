// Inside 60 — Electric scooter. Steps: 0 hook (motor in wheel), 1 battery in deck, 2 controller pulses, 3 hub motor coils+magnets, 4 hall sensors, 5 regen braking, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 90, specular: 0x555555, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x14192a); scene.fog = new THREE.Fog(0x14192a, 40, 100);
  scene.add(new THREE.HemisphereLight(0xf4f8ff, 0x404050, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.7); key.position.set(6, 10, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0x90d0ff, .8); rim.position.set(-6, 4, -6); scene.add(rim);
  // road + moving dashes
  const road = new THREE.Mesh(new THREE.BoxGeometry(60, .2, 10), Mat({ color: 0x2e3644, shininess: 20 })); road.position.y = -.1; scene.add(road);
  const dashM = Mat({ color: 0xe8e0c0, emissive: 0x403a20 });
  const dashes = []; for (let k = 0; k < 12; k++) { const d = new THREE.Mesh(new THREE.BoxGeometry(1.6, .04, .2), dashM); d.position.set(-24 + k * 4, .02, -2.6); scene.add(d); dashes.push(d); }
  const sc = new THREE.Group(); scene.add(sc);
  // deck
  const deckM = Mat({ color: 0x2f3a4c, shininess: 120, transparent: true, opacity: 1 });
  const deck = new THREE.Mesh(new THREE.BoxGeometry(5, .45, 1.5), deckM); deck.position.set(0, .75, 0); sc.add(deck);
  const grip = new THREE.Mesh(new THREE.BoxGeometry(4.4, .04, 1.2), Mat({ color: 0x1a1d24, shininess: 10, transparent: true })); grip.position.set(0, 1.0, 0); sc.add(grip);
  // battery cells
  const cellM = Mat({ color: 0x3a90ff, emissive: 0x000000, shininess: 140 });
  const cells = new THREE.Group(); sc.add(cells);
  for (let a = 0; a < 7; a++) for (let b = 0; b < 3; b++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.17, .17, .34, 16), cellM); c.position.set(-1.5 + a * .5, .75, -.42 + b * .42); cells.add(c); }
  // controller
  const ctrlM = Mat({ color: 0x40464f, emissive: 0x000000 });
  const ctrl = new THREE.Mesh(new THREE.BoxGeometry(.7, .3, .9), ctrlM); ctrl.position.set(-2.15, .75, 0); sc.add(ctrl);
  // stem + handlebar
  const metal = Mat({ color: 0xb8c0cc, shininess: 160 });
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, 5.4, 16), metal); stem.position.set(2.85, 3.5, 0); stem.rotation.z = .12; sc.add(stem);
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, 2.6, 14), metal); bar.rotation.x = Math.PI / 2; bar.position.set(2.53, 6.15, 0); sc.add(bar);
  const thrM = Mat({ color: 0x303030, emissive: 0x000000 });
  const thr = new THREE.Mesh(new THREE.BoxGeometry(.3, .18, .25), thrM); thr.position.set(2.65, 6.15, .95); sc.add(thr);
  const neck = new THREE.Mesh(new THREE.BoxGeometry(.9, .25, .6), metal); neck.position.set(2.6, .85, 0); sc.add(neck);
  const fork = new THREE.Mesh(new THREE.BoxGeometry(.15, 1.2, .9), metal); fork.position.set(3.15, 1.1, 0); sc.add(fork);
  const rarm = new THREE.Mesh(new THREE.BoxGeometry(1.0, .18, .9), metal); rarm.position.set(-2.8, .9, 0); sc.add(rarm);
  // wheels
  const tireM = Mat({ color: 0x1c1c22, shininess: 20 });
  const mkWheel = (x) => { const g = new THREE.Group(); g.position.set(x, .95, 0); sc.add(g);
    const tire = new THREE.Mesh(new THREE.TorusGeometry(.78, .2, 14, 40), tireM); g.add(tire); return g; };
  const fw = mkWheel(3.3); const fwr = new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, .2, 24), metal); fwr.rotation.x = Math.PI / 2; fw.add(fwr);
  for (let k = 0; k < 5; k++) { const s = new THREE.Mesh(new THREE.BoxGeometry(.08, 1.15, .22), Mat({ color: 0x8890a0 })); s.rotation.z = k * Math.PI / 5; fw.add(s); }
  // rear hub motor
  const rw = mkWheel(-3.3);
  const hubShellM = Mat({ color: 0x9aa4b4, shininess: 120, transparent: true, opacity: 1, side: THREE.DoubleSide });
  const rotor = new THREE.Group(); rw.add(rotor);
  const rotorRing = new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, .3, 32, 1, true), hubShellM); rotorRing.rotation.x = Math.PI / 2; rotor.add(rotorRing);
  const magN = Mat({ color: 0xe04050, emissive: 0x300000 }), magS = Mat({ color: 0x3070e0, emissive: 0x000830 });
  for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; const m = new THREE.Mesh(new THREE.BoxGeometry(.12, .24, .28), k % 2 ? magN : magS); m.position.set(Math.cos(a) * .52, Math.sin(a) * .52, 0); m.rotation.z = a; rotor.add(m); }
  const coils = []; for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2; const cm = Mat({ color: 0xc87a30, emissive: 0x000000 }); const c = new THREE.Mesh(new THREE.BoxGeometry(.24, .16, .26), cm); c.position.set(Math.cos(a) * .32, Math.sin(a) * .32, 0); c.rotation.z = a; rw.add(c); coils.push(cm); }
  const hallM = []; for (let k = 0; k < 3; k++) { const a = (k / 9 + .055) * Math.PI * 2; const m = Mat({ color: 0x202020, emissive: 0x40c0ff }); const h = new THREE.Mesh(new THREE.BoxGeometry(.09, .09, .1), m); h.position.set(Math.cos(a) * .42, Math.sin(a) * .42, .17); rw.add(h); hallM.push(m); }
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, .5, 14), metal); axle.rotation.x = Math.PI / 2; rw.add(axle);
  // energy particles: battery -> controller -> hub
  const path = new THREE.CatmullRomCurve3([V(0, .75, 0), V(-1.2, .75, .2), V(-2.15, .75, 0), V(-2.8, .9, .3), V(-3.3, .95, .2)]);
  const enM = new THREE.MeshBasicMaterial({ color: 0xffe040 });
  const en = []; for (let k = 0; k < 14; k++) { const d = new THREE.Mesh(new THREE.SphereGeometry(.08, 8, 6), enM); sc.add(d); en.push(d); }
  // brake glow
  const brM = new THREE.MeshBasicMaterial({ color: 0x40ff80, transparent: true, opacity: .7 });
  const brRing = new THREE.Mesh(new THREE.TorusGeometry(1.15, .05, 8, 48), brM); brRing.position.set(-3.3, .95, 0); sc.add(brRing);

  const shots = [
    [[6, 5.5, 16.5], [0, 2.8, 0]],          // 0 hook
    [[2, 5, 6], [-.3, .8, 0]],        // 1 battery
    [[-.5, 4, 5], [-1.6, .9, 0]],     // 2 controller
    [[-3.3, 1.4, 3.8], [-3.3, .95, 0]], // 3 hub motor
    [[-2.2, 1.6, 3.4], [-3.3, .95, 0]], // 4 hall sensors
    [[-1, 3.5, 6.5], [-2.2, 1, 0]],   // 5 regen
    [[-8, 7, 18], [0, 3, 0]],         // 6 recap
  ];
  shots.forEach(sh => { for (let i = 0; i < 3; i++) sh[0][i] = sh[1][i] + (sh[0][i] - sh[1][i]) * 1.35; });
  const cp = { p: V(), q: V() };
  let wa = 0, lastT = 0;
  function update(t, si, lt, sd) {
    const dt = Math.max(0, Math.min(.1, t - lastT)); lastT = t;
    const pulse = .5 + .5 * Math.sin(t * 6);
    const speed = si === 5 ? lerp(3, .6, ease(lt / sd)) : 3;
    wa += speed * dt;
    fw.rotation.z = -wa; rotor.rotation.z = -wa;
    dashes.forEach(d => { d.position.x -= speed * .85 * dt; if (d.position.x < -24) d.position.x += 48; });
    const xr = si >= 1 && si <= 5;
    deckM.opacity = xr ? .2 : 1; deckM.depthWrite = !xr; grip.material.opacity = xr ? .15 : 1;
    cellM.emissive.setHex(si === 5 ? 0x20ff60 : 0x2060ff); cellM.emissiveIntensity = si === 1 ? .3 + .3 * pulse : si === 5 ? .25 + .25 * pulse : .05;
    ctrlM.emissive.setHex(0x40a0ff); ctrlM.emissiveIntensity = si === 2 ? .4 + .5 * (Math.sin(t * 20) > 0 ? 1 : 0) : 0;
    thrM.emissive.setHex(0xffd030); thrM.emissiveIntensity = si === 2 ? .8 : 0;
    const hx = si === 3 || si === 4; hubShellM.opacity = hx ? .15 : .95; hubShellM.depthWrite = !hx;
    const act = Math.floor(wa * 9 / (Math.PI * 2) * 3) % 9;
    hallM.forEach((m, k) => { m.emissiveIntensity = si === 4 ? (k === act % 3 ? 1 : .15) : 0; });
    coils.forEach((m, k) => { m.emissive.setHex(si === 5 ? 0x40ff80 : 0xff9020); m.emissiveIntensity = (si === 3 || si === 4 || si === 0 || si === 6) ? (k % 3 === act % 3 ? 1 : .05) : si === 5 ? .4 : 0; });
    // energy flow direction
    enM.color.setHex(si === 5 ? 0x40ff80 : 0xffe040);
    const flow = si === 2 || si === 5 || si === 6;
    en.forEach((d, k) => { let o = (k / en.length + t * .4) % 1; if (si === 5) o = 1 - o; d.position.copy(path.getPoint(o)); d.visible = flow; d.scale.setScalar(si === 2 ? (Math.sin(t * 20 + k) > 0 ? 1.2 : .6) : 1); });
    brRing.visible = si === 5; brRing.scale.setScalar(1 + .1 * pulse);
    // camera
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const kk = si === 0 ? 1 : ease(lt / 1.4);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], kk))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], kk)));
    const o = Math.sin(t * .25) * .15, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o));
    camera.lookAt(cp.q);
  }
  return { update };
}
