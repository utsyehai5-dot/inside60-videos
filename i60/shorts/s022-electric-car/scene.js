// Inside 60 — How an Electric Car Works. Steps: 0 hook, 1 battery, 2 inverter DC->AC, 3 motor field, 4 one gear, 5 regen, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 60, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  scene.background = new THREE.Color(0x131f36);
  scene.fog = new THREE.Fog(0x131f36, 30, 75);
  scene.add(new THREE.HemisphereLight(0xeaf2ff, 0x30302a, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(6, 10, 9); scene.add(key);
  const rim = new THREE.DirectionalLight(0x88ccff, .9); rim.position.set(-7, 5, -6); scene.add(rim);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), Mat({ color: 0x24304a, shininess: 5 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -.76; scene.add(ground);
  const laneM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .5 });
  const lanes = []; for (let i = 0; i < 10; i++) { const l = new THREE.Mesh(new THREE.BoxGeometry(.16, .01, 1.4), laneM); l.position.set(-3.2, -.75, 0); scene.add(l); lanes.push(l); }

  // car shell (ghost)
  const shellM = Mat({ color: 0xa8c0e0, transparent: true, opacity: .1, depthWrite: false, side: THREE.DoubleSide });
  const body = new THREE.Mesh(new THREE.BoxGeometry(3.7, 1.0, 7.2), shellM); body.position.y = .55; scene.add(body);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(3.3, .9, 3.4), shellM); cab.position.set(0, 1.5, .2); scene.add(cab);

  // battery pack
  const packM = Mat({ color: 0x3a4a66, emissive: 0x40a0ff, emissiveIntensity: 0 });
  const pack = new THREE.Mesh(new THREE.BoxGeometry(3.0, .3, 3.8), packM); pack.position.set(0, -.15, -.4); scene.add(pack);
  const cellM = Mat({ color: 0x60d0a0, emissive: 0x40ff90, emissiveIntensity: 0 });
  const cellGeo = new THREE.CylinderGeometry(.11, .11, .26, 10);
  for (let i = 0; i < 11; i++) for (let j = 0; j < 14; j++) { const c = new THREE.Mesh(cellGeo, cellM); c.position.set(-1.3 + i * .26, .12, -2.1 + j * .26); scene.add(c); }
  // charge meter on pack side
  const barBg = new THREE.Mesh(new THREE.BoxGeometry(.06, .2, 3.0), Mat({ color: 0x1a2030 })); barBg.position.set(1.54, -.15, -.4); scene.add(barBg);
  const barM = new THREE.MeshBasicMaterial({ color: 0x40ff90 });
  const bar = new THREE.Mesh(new THREE.BoxGeometry(.07, .16, 3.0), barM); bar.position.set(1.56, -.15, -.4); scene.add(bar);

  // inverter
  const invM = Mat({ color: 0x8a96a8, emissive: 0xffc040, emissiveIntensity: 0 });
  const inv = new THREE.Mesh(new THREE.BoxGeometry(1.1, .5, .7), invM); inv.position.set(0, .2, 2.0); scene.add(inv);
  for (let i = 0; i < 6; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(1.0, .06, .72), Mat({ color: 0x5a6474 })); f.position.set(0, .48 + i * 0 , 2.0); f.position.y = .2 + .26; f.scale.x = .9; f.position.x = -.4 + i * .16; f.scale.set(.12, 1, 1); scene.add(f); }

  // rear axle + motor + gear pair
  const AZ = 3.0, MZ = 3.0, MY = .8; // motor above axle
  const steelM = Mat({ color: 0xc0c8d2, shininess: 110 });
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, 3.8, 14), steelM); axle.rotation.z = Math.PI / 2; axle.position.set(0, 0, AZ); scene.add(axle);
  const statorM = Mat({ color: 0x8aa0c0, transparent: true, opacity: .25, depthWrite: false, side: THREE.DoubleSide });
  const stator = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, 1.0, 32, 1, true), statorM); stator.rotation.z = Math.PI / 2; stator.position.set(0, MY, MZ); scene.add(stator);
  const coils = []; for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const m = Mat({ color: 0xc87a3a, emissive: 0xff8020, emissiveIntensity: 0 }); const c = new THREE.Mesh(new THREE.BoxGeometry(.9, .14, .2), m); c.position.set(0, MY + Math.cos(a) * .47, MZ + Math.sin(a) * .47); c.rotation.x = -a; scene.add(c); coils.push(c); }
  const rotor = new THREE.Group(); rotor.position.set(0, MY, MZ); scene.add(rotor);
  const rr = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .95, 24), Mat({ color: 0x9aa4b0, shininess: 100 })); rr.rotation.z = Math.PI / 2; rotor.add(rr);
  for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2; const s = new THREE.Mesh(new THREE.BoxGeometry(.96, .1, .14), Mat({ color: i % 2 ? 0xe04a4a : 0x4a7ae0 })); s.position.set(0, Math.cos(a) * .3, Math.sin(a) * .3); s.rotation.x = -a; rotor.add(s); }
  function gear(r, x, y, z, color) {
    const g = new THREE.Group(); g.position.set(x, y, z); scene.add(g);
    const m = Mat({ color, emissive: color, emissiveIntensity: 0 });
    const b = new THREE.Mesh(new THREE.CylinderGeometry(r - .06, r - .06, .18, 32), m); b.rotation.z = Math.PI / 2; g.add(b);
    const n = Math.round(r * 30); for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; const t = new THREE.Mesh(new THREE.BoxGeometry(.18, .09, .08), m); t.position.set(0, Math.cos(a) * r, Math.sin(a) * r); t.rotation.x = -a; g.add(t); }
    const mk = new THREE.Mesh(new THREE.BoxGeometry(.2, r * .6, .06), Mat({ color: 0xffffff })); mk.position.set(.02, r * .35, 0); g.add(mk);
    g.userData.m = m; return g;
  }
  const g1 = gear(.25, .7, MY, MZ, 0xe0a030), g2 = gear(.55, .7, 0, AZ, 0xe0a030);
  const shaftM = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, .4, 10), steelM); shaftM.rotation.z = Math.PI / 2; shaftM.position.set(.55, MY, MZ); scene.add(shaftM);
  // offset g2 so mesh is correct: center distance .8 vertically
  g1.position.y = .8; rotor.position.y = .8; stator.position.y = .8;

  // wheels
  const tyreM = Mat({ color: 0x2a2d33, shininess: 20 });
  const wheels = [];
  [[-1.95, -3.0], [1.95, -3.0], [-1.95, AZ], [1.95, AZ]].forEach(([x, z]) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
    const t = new THREE.Mesh(new THREE.CylinderGeometry(.75, .75, .5, 32), tyreM); t.rotation.z = Math.PI / 2; g.add(t);
    const hm = Mat({ color: 0xd0d6de, emissive: 0xffd040, emissiveIntensity: 0, shininess: 100 });
    const h = new THREE.Mesh(new THREE.CylinderGeometry(.45, .45, .54, 20), hm); h.rotation.z = Math.PI / 2; g.add(h);
    const sp = new THREE.Mesh(new THREE.BoxGeometry(.56, .7, .12), Mat({ color: 0x7a828e })); g.add(sp);
    const sp2 = sp.clone(); sp2.rotation.x = Math.PI / 2; g.add(sp2);
    wheels.push({ g, hm });
  });

  // energy particles: battery -> inverter (DC straight) -> motor (AC wiggle)
  const P1 = V(0, .1, .6), P2 = V(0, .2, 1.7), P3 = V(0, .8, MZ - .1);
  const N = 50, parts = []; const pg = new THREE.SphereGeometry(.08, 8, 6);
  for (let i = 0; i < N; i++) { const m = new THREE.MeshBasicMaterial({ color: 0x60c8ff, transparent: true, opacity: 0 }); const p = new THREE.Mesh(pg, m); scene.add(p); parts.push(p); }
  const tmp = V();
  function pathPos(u, out) {
    if (u < .55) { out.lerpVectors(P1, P2, u / .55); return 0; }
    const v = (u - .55) / .45; out.lerpVectors(P2, P3, v); out.x += Math.sin(v * Math.PI * 6) * .25; return 1;
  }

  const shots = [
    [[10.5, 10.0, 17.5], [0, .2, 0]],
    [[6.5, 7.0, -7.5], [0, -.1, -.5]],
    [[5.0, 3.5, -0.2], [0, .3, 2.0]],
    [[5.2, 3.0, 6.5], [0, .7, MZ]],
    [[5.8, 2.2, 7.0], [.4, .3, AZ]],
    [[-9.0, 6.5, 11.5], [0, .2, .8]],
    [[10.5, 10.0, 18], [0, .2, 0]],
  ];
  const cp = { p: V(), q: V() };
  let A = 0, W = 0, lastT = 0, F = 0, rate = 0, charge = .72;

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

    const regen = si === 5 && lt > .8;
    const target = regen ? 2.5 : 6;
    rate = lerp(rate, target, Math.min(1, dt * 2));
    W += dt * rate; A += dt * rate * (.55 / .25);
    rotor.rotation.x = -A; g1.rotation.x = -A; g2.rotation.x = W; axle.rotation.x = W;
    wheels.forEach(w => w.g.rotation.x = W);
    lanes.forEach((l, i) => { l.position.z = ((i * 2.2 + W * .75 * 1.0) % 22) - 11; });
    F += dt * (regen ? -.35 : .35);
    charge = Math.min(.95, Math.max(.3, charge + dt * (regen ? .03 : -.004)));
    bar.scale.z = charge; bar.position.z = -.4 - 1.5 * (1 - charge);
    barM.color.setHex(regen ? 0x40ff90 : 0x40d0ff);

    const pulse = .3 + .15 * Math.sin(t * 6);
    packM.emissiveIntensity = si === 1 ? pulse : 0; cellM.emissiveIntensity = si === 1 ? pulse + .1 : regen ? .5 : .05;
    invM.emissiveIntensity = si === 2 ? pulse + .2 : 0;
    coils.forEach((c, i) => { const ph = (A * .5 + i / 6 * Math.PI * 2); c.material.emissiveIntensity = (si === 3 ? 1 : .35) * Math.max(0, Math.cos(ph)); });
    g1.userData.m.emissiveIntensity = g2.userData.m.emissiveIntensity = si === 4 ? pulse + .1 : 0;
    wheels.forEach((w, i) => w.hm.emissiveIntensity = (si === 4 && i >= 2) ? .5 : 0);

    const show = si === 0 || si >= 2;
    parts.forEach((p, i) => {
      const u = (((i / N) + F) % 1 + 1) % 1;
      const seg = pathPos(u, tmp); p.position.copy(tmp);
      p.material.color.setHex(regen ? 0x50ff80 : seg === 0 ? 0x50b8ff : 0xffc040);
      p.material.opacity = show ? (si === 2 ? Math.min(1, lt / .5) : 1) : 0;
    });
  }
  return { update };
}
