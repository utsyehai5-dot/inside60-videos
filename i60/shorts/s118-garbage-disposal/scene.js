// Inside 60 — Garbage disposal (cutaway under a sink). Steps: 0 hook (no blades), 1 motor spins turntable,
// 2 impellers fling food outward, 3 grind ring, 4 tiny particles through holes, 5 cold water flush, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x555555, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const rnd = (() => { let s = 31; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  scene.background = new THREE.Color(0x1b2230);
  scene.add(new THREE.HemisphereLight(0xfff4ea, 0x404050, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, .9); key.position.set(4, 9, 10); scene.add(key);
  const root = new THREE.Group(); scene.add(root);
  const wall = new THREE.Mesh(new THREE.BoxGeometry(18, 16, .3), Mat({ color: 0x3f4f63, shininess: 5 })); wall.position.set(0, 1, -4); root.add(wall);

  // sink basin bottom (y 3.2) with drain hole, counter
  const steel = Mat({ color: 0xc9d1db, shininess: 120, specular: 0x999999 });
  const sink = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.0, .15, 48, 1, false), steel); sink.position.y = 3.3; root.add(sink);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(.75, .1, 10, 40), steel); lip.rotation.x = Math.PI / 2; lip.position.y = 3.4; root.add(lip);
  // hopper (grinding chamber) y 0.6..3.2, transparent cutaway
  const bodyM = Mat({ color: 0x334155, transparent: true, opacity: .35, side: THREE.DoubleSide, depthWrite: false });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 2.6, 48, 1, true), bodyM); body.position.y = 1.9; root.add(body);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.75, 1.4, .5, 40, 1, true), bodyM); neck.position.y = 3.0; root.add(neck);
  // motor housing y -2.6..0.4
  const motorM = Mat({ color: 0x1e293b, transparent: true, opacity: .55, side: THREE.DoubleSide, depthWrite: false });
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.3, 3.0, 48, 1, true), motorM); motor.position.y = -1.1; root.add(motor);
  const motorBot = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.2, .2, 40), Mat({ color: 0x111827 })); motorBot.position.y = -2.65; root.add(motorBot);
  const coilM = Mat({ color: 0xb45309, emissive: 0xff7a00, emissiveIntensity: 0 });
  const stator = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 1.8, 32, 1, true), coilM); stator.position.y = -1.2; root.add(stator);
  const rotor = new THREE.Group(); root.add(rotor);
  const rotorCore = new THREE.Mesh(new THREE.CylinderGeometry(.7, .7, 1.7, 16), Mat({ color: 0x64748b })); rotorCore.position.y = -1.2; rotor.add(rotorCore);
  for (let i = 0; i < 8; i++) { const bar = new THREE.Mesh(new THREE.BoxGeometry(.12, 1.75, .12), Mat({ color: 0xcbd5e1 })); const a = i * Math.PI / 4; bar.position.set(Math.cos(a) * .68, -1.2, Math.sin(a) * .68); rotor.add(bar); }
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, 1.6, 12), steel); shaft.position.y = .0; rotor.add(shaft);
  // turntable at y 0.75 with 2 blunt impeller lugs
  const plateM = Mat({ color: 0x94a3b8, emissive: 0x60a5fa, emissiveIntensity: 0 });
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(1.32, 1.32, .14, 48), plateM); plate.position.y = .75; rotor.add(plate);
  for (let i = 0; i < 12; i++) { const h = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, .16, 8), Mat({ color: 0x1f2937 })); const a = i * Math.PI / 6; h.position.set(Math.cos(a) * 1.0, .76, Math.sin(a) * 1.0); rotor.add(h); }
  const lugM = Mat({ color: 0xe2e8f0, emissive: 0xffd000, emissiveIntensity: 0 });
  const lugs = [0, Math.PI].map(a => { const g = new THREE.Group(); g.rotation.y = a; const l = new THREE.Mesh(new THREE.BoxGeometry(.6, .3, .3), lugM); l.position.set(.85, .97, 0); g.add(l); const pin = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, .35, 10), steel); pin.position.set(.6, .97, 0); g.add(pin); rotor.add(g); return l; });
  // grind ring: serrated band on the wall just above the plate
  const ringM = Mat({ color: 0x9ca3af, emissive: 0xff4060, emissiveIntensity: 0 });
  const ring = new THREE.Group(); root.add(ring);
  for (let i = 0; i < 36; i++) { const a = i * Math.PI * 2 / 36; const tooth = new THREE.Mesh(new THREE.BoxGeometry(.18, .5, .12), ringM); tooth.position.set(Math.cos(a) * 1.42, 1.05, Math.sin(a) * 1.42); tooth.rotation.y = -a; ring.add(tooth); }
  // drain outlet pipe from side of lower chamber
  const pipeM = Mat({ color: 0xd1d5db, emissive: 0x38bdf8, emissiveIntensity: 0 });
  const outPts = [V(1.5, .45, 0), V(2.6, .45, 0), V(3.2, .1, 0), V(3.4, -1.0, 0), V(3.4, -3.5, 0)];
  const outCurve = new THREE.CatmullRomCurve3(outPts);
  root.add(new THREE.Mesh(new THREE.TubeGeometry(outCurve, 60, .25, 12, false), pipeM));

  // food chunks (lemon/veg colours) that fall into chamber, get flung and shrink
  const foodCols = [0xfacc15, 0x22c55e, 0xf97316, 0xef4444];
  const foodG = new THREE.DodecahedronGeometry(.22, 0);
  const food = Array.from({ length: 22 }, (_, i) => { const m = new THREE.Mesh(foodG, Mat({ color: foodCols[i % 4], emissive: foodCols[i % 4], emissiveIntensity: .15 })); m.userData = { o: rnd(), a: rnd() * 6.283, r: .3 + rnd() * .5 }; root.add(m); return m; });
  const bits = Array.from({ length: 60 }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(.05, 6, 4), Mat({ color: foodCols[i % 4], emissive: foodCols[i % 4], emissiveIntensity: .4 })); m.userData = { o: rnd(), a: rnd() * 6.283 }; root.add(m); return m; });
  const waterM = Mat({ color: 0x60c0ff, emissive: 0x2090ff, emissiveIntensity: .5, transparent: true, opacity: .8 });
  const water = Array.from({ length: 50 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), waterM); m.userData = { o: rnd(), x: (rnd() - .5) * .3, z: (rnd() - .5) * .3, a: rnd() * 6.283 }; root.add(m); return m; });
  const slurry = Array.from({ length: 40 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(.08, 6, 4), Mat({ color: 0x9ccf6a, emissive: 0x5a9a30, emissiveIntensity: .4 })); m.userData = { o: rnd() }; root.add(m); return m; });

  const shots = [
    [[4.2, 2.6, 19.0], [.9, .3, 0]],      // 0 wide
    [[3.2, -.6, 5.2], [0, -.8, 0]],       // 1 motor
    [[1.6, 3.6, 3.2], [0, .9, 0]],        // 2 impellers from above
    [[2.4, 1.6, 3.4], [0, 1.0, 0]],       // 3 grind ring
    [[2.6, .8, 3.8], [.6, .7, 0]],        // 4 bits through holes
    [[6.5, 1.8, 10.5], [1.6, .2, 0]],     // 5 water flush
    [[4.2, 2.6, 19.0], [.9, .3, 0]],      // 6 recap
  ];
  const cp = { p: V(), q: V() };
  function update(t, si, lt, sd) {
    const pulse = .5 + .5 * Math.sin(t * 6);
    const spin = si === 0 ? 1.5 : 9;
    rotor.rotation.y = t * spin;
    coilM.emissiveIntensity = si === 1 ? .4 + .4 * pulse : .05;
    plateM.emissiveIntensity = si === 1 ? .3 + .3 * pulse : 0;
    lugM.emissiveIntensity = si === 2 ? .4 + .4 * pulse : 0;
    ringM.emissiveIntensity = si === 3 || si === 4 ? .35 + .35 * pulse : 0;
    pipeM.emissiveIntensity = si === 5 ? .3 + .3 * pulse : 0;
    bodyM.opacity = si >= 1 && si <= 5 ? .15 : .35;
    // food: drop from sink to plate, ride the plate, flung to the wall
    food.forEach(m => { const u = m.userData, k = (u.o + t * .22) % 1;
      if (k < .4) { m.position.set(Math.cos(u.a) * u.r * .6, lerp(4.2, .95, k / .4), Math.sin(u.a) * u.r * .6); m.scale.setScalar(1); }
      else { const kk = (k - .4) / .6, a = u.a + t * spin * .6, r = lerp(u.r, 1.25, Math.min(1, kk * 2)); m.position.set(Math.cos(a) * r, 1.0 + Math.sin(kk * 30) * .05, Math.sin(a) * r); m.scale.setScalar(Math.max(.15, 1 - kk)); }
      m.rotation.set(t * 3 + u.a, t * 2, 0); m.visible = si !== 5 || k < .5; });
    // fine bits pass down through gap between plate and wall into lower chamber
    bits.forEach(m => { const u = m.userData, k = (u.o + t * .5) % 1, a = u.a + t * 4; m.position.set(Math.cos(a) * 1.4, lerp(1.0, .4, k), Math.sin(a) * 1.4); m.visible = si >= 3; });
    // water: falls from sink (steps 5,6 heavy; otherwise light)
    water.forEach(m => { const u = m.userData, k = (u.o + t * .9) % 1; m.position.set(u.x, lerp(5.5, .9, k), u.z); m.visible = si >= 5 || si === 0; });
    slurry.forEach(m => { const k = (m.userData.o + t * .45) % 1; m.position.copy(outCurve.getPoint(k)); m.visible = si >= 4; });
    // camera
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const kk = si === 0 ? 1 : ease(lt / 1.4);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], kk))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], kk)));
    const ob = Math.sin(t * .25) * .1, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(ob) - dz * Math.sin(ob), cp.p.y, cp.q.z + dz * Math.cos(ob) + dx * Math.sin(ob));
    camera.lookAt(cp.q);
  }
  return { update };
}
