// Inside 60 — Ship propeller. Steps: 0 hook, 1 shaft, 2 blades, 3 pressure, 4 thrust, 5 cavitation, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x666666, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x0d4466);
  scene.fog = new THREE.Fog(0x0d4466, 16, 55);
  scene.add(new THREE.HemisphereLight(0xdff4ff, 0x203040, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(6, 10, 8); scene.add(key);
  const rim = new THREE.DirectionalLight(0x88ddff, .9); rim.position.set(-7, 3, -6); scene.add(rim);

  // stern of hull (+x side), tapering toward the propeller
  const hullM = Mat({ color: 0x8a2f2f, shininess: 50, transparent: true });
  const hull = new THREE.Mesh(new THREE.CylinderGeometry(.55, 2.6, 5, 36, 1), hullM); hull.rotation.z = Math.PI / 2; hull.position.set(4.3, .3, 0); hull.scale.set(1, 1, .7); scene.add(hull);
  const skeg = new THREE.Mesh(new THREE.BoxGeometry(3, 1.6, .3), hullM); skeg.position.set(3.2, .4, 0); scene.add(skeg);
  // rudder behind the propeller
  const rudder = new THREE.Mesh(new THREE.BoxGeometry(1.0, 3.2, .18), Mat({ color: 0x8a2f2f })); rudder.position.set(-1.9, 1.2, 0); scene.add(rudder);
  // shaft
  const shaftM = Mat({ color: 0xc0c6d0, shininess: 140, emissive: 0x40a0ff, emissiveIntensity: 0 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, 6, 20), shaftM); shaft.rotation.z = Math.PI / 2; shaft.position.x = 3; scene.add(shaft);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(5.5, .06, .34), Mat({ color: 0xffd040, emissive: 0xffa000, emissiveIntensity: .4 })); stripe.position.x = 3.2;
  const shaftSpin = new THREE.Group(); shaftSpin.add(stripe); scene.add(shaftSpin);
  // propeller
  const prop = new THREE.Group(); scene.add(prop);
  const bronze = Mat({ color: 0xd8a24a, shininess: 140, specular: 0xffe0a0, side: THREE.DoubleSide, emissive: 0xff8000, emissiveIntensity: 0 });
  const hub = new THREE.Mesh(new THREE.SphereGeometry(.45, 24, 16), bronze); hub.scale.set(1.4, 1, 1); prop.add(hub);
  const R0 = .35, R1 = 2.1, PITCH = 3.2;
  function bladeGeo() {
    const s = new THREE.Shape(); const n = 24;
    for (let i = 0; i <= n; i++) { const r = R0 + (R1 - R0) * i / n; const w = .55 * Math.sin(Math.PI * Math.min(1, .15 + .85 * i / n)) + .12; (i ? s.lineTo : s.moveTo).call(s, w * .5 + .1 * i / n, r); }
    for (let i = n; i >= 0; i--) { const r = R0 + (R1 - R0) * i / n; const w = .55 * Math.sin(Math.PI * Math.min(1, .15 + .85 * i / n)) + .12; s.lineTo(-w * .5 + .1 * i / n, r); }
    // shape lies in (z=tangential -> shape x, y=radial); thickness along x
    const g = new THREE.ExtrudeGeometry(s, { depth: .07, bevelEnabled: false, curveSegments: 2 });
    g.translate(0, 0, -.035);
    const p = g.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i);
      const tang = v.x, rad = v.y, thick = v.z; const phi = Math.atan(PITCH / (2 * Math.PI * Math.max(.3, rad)));
      // rotate in (axial, tangential) plane by phi around radial axis
      const ax = thick * Math.cos(phi) + tang * Math.sin(phi), tg = -thick * Math.sin(phi) + tang * Math.cos(phi);
      p.setXYZ(i, ax, rad, tg); }
    g.computeVertexNormals(); return g;
  }
  const bg = bladeGeo(); const blades = [];
  for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(bg, bronze); b.rotation.x = i / 5 * Math.PI * 2; prop.add(b); blades.push(b); }
  // highlight blade (step 2)
  const hiM = Mat({ color: 0xffe070, emissive: 0xffb020, emissiveIntensity: .6, side: THREE.DoubleSide });
  // pressure discs
  const lowM = new THREE.MeshBasicMaterial({ color: 0x40a8ff, transparent: true, opacity: 0, depthWrite: false });
  const hiPM = new THREE.MeshBasicMaterial({ color: 0xff5a3c, transparent: true, opacity: 0, depthWrite: false });
  const low = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 16), lowM); low.scale.set(.45, R1, R1); low.position.x = .55; scene.add(low);
  const hiP = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 16), hiPM); hiP.scale.set(.45, R1, R1); hiP.position.x = -.55; scene.add(hiP);
  // thrust arrow (on the hull side, pointing +x = forward)
  const arM = new THREE.MeshPhongMaterial({ color: 0x40ff90, emissive: 0x20c060, emissiveIntensity: .6, transparent: true, opacity: 0 });
  const arrow = new THREE.Group(); arrow.position.set(1.2, 4.6, 0); scene.add(arrow);
  const as = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, 2, 12), arM); as.rotation.z = Math.PI / 2; as.position.x = 1; arrow.add(as);
  const ah = new THREE.Mesh(new THREE.ConeGeometry(.4, .8, 16), arM); ah.rotation.z = -Math.PI / 2; ah.position.x = 2.3; arrow.add(ah);
  // water particles: flow from +x through disc to -x, swirl & accelerate behind
  const pg = new THREE.SphereGeometry(.05, 6, 5); const wp = [];
  for (let i = 0; i < 220; i++) { const m = new THREE.Mesh(pg, new THREE.MeshBasicMaterial({ color: 0xcfeaff, transparent: true, opacity: 0 })); scene.add(m);
    wp.push({ m, ph: Math.random(), a: Math.random() * 6.28, r: .5 + Math.random() * 1.5 }); }
  // cavitation bubbles at blade tips
  const cav = [];
  for (let i = 0; i < 80; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(.05 + Math.random() * .07, 8, 6), new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0xcfefff, emissiveIntensity: .5, transparent: true, opacity: 0 })); scene.add(m); cav.push({ m, ph: Math.random(), b: i % 5, dr: Math.random() }); }
  // pitting marks (step 5) on a blade
  const pits = []; for (let i = 0; i < 14; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(.05, 6, 4), new THREE.MeshPhongMaterial({ color: 0x4a3010, transparent: true, opacity: 0 })); blades[0].add(m); const r = 1.4 + Math.random() * .6; const phi = Math.atan(PITCH / (2 * Math.PI * r)); m.position.set(.05 * Math.cos(phi) , r, (Math.random() - .5) * .4); pits.push(m); }

  const shots = [
    [[-6, 2.5, 11], [.5, .3, 0]],
    [[2, 4.5, 9], [2.6, 1, 0]],
    [[-1.5, 1.2, 7], [0, .8, 0]],
    [[0, 2, 11], [0, 0, 0]],
    [[-3, 5, 13], [1.5, 1.5, 0]],
    [[-3.5, 1.5, 6], [0, 1.2, 0]],
    [[-8, 3, 11], [.8, .5, 0]],
  ];
  const cp = { p: V(), q: V() };
  let lastT = 0, ang = 0, w = 1.5;
  function update(t, si, lt) {
    const dt = Math.min(.1, Math.max(0, t - lastT)); lastT = t;
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const k = si === 0 ? 1 : ease(lt / 1.3);
    cp.p.set(...prev[0].map((v, i) => lerp(v, now[0][i], k))); cp.q.set(...prev[1].map((v, i) => lerp(v, now[1][i], k)));
    const o = Math.sin(t * .2) * .12, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o)); camera.lookAt(cp.q);
    const wT = si === 2 ? .35 : si === 5 ? 4.5 : si === 4 ? 2.6 : 1.8;
    w += (wT - w) * Math.min(1, dt * 2); ang += w * dt;
    prop.rotation.x = ang; shaftSpin.rotation.x = ang; shaft.rotation.x = 0;
    shaftM.emissiveIntensity = si === 1 ? .7 : 0; hullM.opacity = si === 1 ? 1 - .65 * ease((lt - .5) / 1) : 1; hullM.depthWrite = hullM.opacity > .99;
    blades.forEach((b, i) => b.material = si === 2 && i === 0 ? hiM : bronze);
    const pOn = si === 3 ? Math.min(1, lt) : 0;
    lowM.opacity = .35 * pOn; hiPM.opacity = .35 * pOn;
    const aOn = si === 4 ? ease((lt - .8) / 1) : 0;
    arM.opacity = aOn * .95; arrow.visible = aOn > .01; arrow.position.x = 1.2 + (si === 4 ? Math.sin(lt * 2) * .15 : 0);
    // water flow
    const flowOn = si === 2 ? .4 : 1;
    wp.forEach(p => { const u = (p.ph + t * .12 * w) % 1; const x = 5 - u * 13;
      const behind = x < 0; const rr = behind ? p.r * (1 - .35 * Math.min(1, -x / 3)) : p.r;
      const sw = p.a + (behind ? -x * .5 * (w / 2) : 0);
      p.m.position.set(x, Math.cos(sw) * rr, Math.sin(sw) * rr);
      let op = 1; if (u < .08) op = u / .08; if (u > .92) op = (1 - u) / .08;
      p.m.material.opacity = op * flowOn * (si === 4 && behind ? 1 : .7);
      p.m.material.color.setHex(si === 4 && behind ? 0xfff070 : si === 3 ? (x > 0 ? 0x80c8ff : 0xffa080) : 0xcfeaff); });
    // cavitation
    const cOn = si === 5 && lt > 1.2;
    cav.forEach(c => { const u = (c.ph + t * .8) % 1; const ba = ang + c.b / 5 * Math.PI * 2 - u * .6; const r = 1.6 + c.dr * .5;
      c.m.position.set(-u * 1.5, Math.cos(ba) * r, Math.sin(ba) * r); c.m.material.opacity = cOn ? (1 - u) * .9 : 0; c.m.scale.setScalar(u < .7 ? 1 : 1 - (u - .7) * 3); });
    pits.forEach(m => m.material.opacity = si === 5 && lt > 2.5 ? .9 : 0);
    bronze.emissiveIntensity = 0;
  }
  return { update };
}
