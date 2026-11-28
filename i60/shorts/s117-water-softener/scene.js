// Inside 60 — Water softener (cutaway resin tank + brine tank). Steps: 0 hook, 1 hard water ions, 2 resin beads with sodium,
// 3 swap Ca/Mg for Na, 4 brine flows in, 5 hard minerals flushed to drain, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const rnd = (() => { let s = 23; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  scene.background = new THREE.Color(0x172238);
  scene.add(new THREE.HemisphereLight(0xfff4ea, 0x404050, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, .9); key.position.set(4, 8, 10); scene.add(key);
  const root = new THREE.Group(); scene.add(root);
  const floor = new THREE.Mesh(new THREE.BoxGeometry(18, .3, 12), Mat({ color: 0x9ca3af, shininess: 10 })); floor.position.y = -3.35; root.add(floor);
  const wall = new THREE.Mesh(new THREE.BoxGeometry(18, 14, .3), Mat({ color: 0x6b5b7b, shininess: 5 })); wall.position.set(0, 3, -4); root.add(wall);

  // resin tank (x -1, y -3.2..2.4), brine tank (x 2.2)
  const RX = -1, BX = 2.3;
  const tankM = Mat({ color: 0x60a5fa, transparent: true, opacity: .25, side: THREE.DoubleSide, depthWrite: false });
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 5.2, 48, 1, true), tankM); tank.position.set(RX, -.6, 0); root.add(tank);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1.2, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), tankM); dome.position.set(RX, 2.0, 0); root.add(dome);
  const head = new THREE.Mesh(new THREE.BoxGeometry(1.2, .6, .9), Mat({ color: 0x334155 })); head.position.set(RX, 3.4, 0); root.add(head);
  const riser = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 5.6, 10), Mat({ color: 0xe5e7eb, transparent: true, opacity: .7 })); riser.position.set(RX, 0, 0); root.add(riser);
  const brineM = Mat({ color: 0xe2e8f0, transparent: true, opacity: .3, side: THREE.DoubleSide, depthWrite: false });
  const brineT = new THREE.Mesh(new THREE.BoxGeometry(1.8, 3.4, 1.8), brineM); brineT.position.set(BX, -1.6, 0); root.add(brineT);
  const saltM = Mat({ color: 0xffffff, shininess: 30 });
  for (let i = 0; i < 70; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(.18, .18, .18), saltM); s.position.set(BX + (rnd() - .5) * 1.5, -3.1 + rnd() * 1.2, (rnd() - .5) * 1.5); s.rotation.set(rnd() * 3, rnd() * 3, 0); root.add(s); }
  const brineWM = Mat({ color: 0x9be7d0, emissive: 0x20c090, emissiveIntensity: .2, transparent: true, opacity: .5 });
  const brineW = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.6, 1.7), brineWM); brineW.position.set(BX, -2.5, 0); root.add(brineW);
  // pipes: inlet (left, top), brine line, drain (right)
  const pipeM = Mat({ color: 0x94a3b8 });
  const tube = (pts, r, m) => { const g = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => V(...p))), 60, r, 8, false), m); root.add(g); return g; };
  const inletPts = [[-4.5, 3.4, 0], [-2.5, 3.4, 0], [RX - .6, 3.4, 0]];
  tube(inletPts, .12, pipeM);
  const bLineM = Mat({ color: 0x94a3b8, emissive: 0x20e0a0, emissiveIntensity: 0 });
  const bPts = [[BX, -1.0, 0], [BX, 3.4, 0], [RX + .6, 3.4, 0]]; tube(bPts, .08, bLineM);
  const drainM = Mat({ color: 0x94a3b8, emissive: 0xff7040, emissiveIntensity: 0 });
  const dPts = [[RX + .6, 3.2, .4], [.6, 3.0, 1.2], [.9, 0, 1.4], [.9, -3.1, 1.4]]; tube(dPts, .08, drainM);
  const drainGrate = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .05, 20), Mat({ color: 0x1f2937 })); drainGrate.position.set(.9, -3.18, 1.4); root.add(drainGrate);

  // resin beads (amber) with a small sodium ion (purple) each
  const beadM = Mat({ color: 0xf4b33d, emissive: 0xff9a00, emissiveIntensity: .05, shininess: 120 });
  const naM = Mat({ color: 0xb388ff, emissive: 0x8a5cff, emissiveIntensity: .6 });
  const caM = Mat({ color: 0xf8fafc, emissive: 0xffffff, emissiveIntensity: .4 });
  const mgM = Mat({ color: 0x4ade80, emissive: 0x22c55e, emissiveIntensity: .5 });
  const beadG = new THREE.SphereGeometry(.16, 14, 10), ionG = new THREE.SphereGeometry(.07, 8, 6);
  const beads = [];
  for (let i = 0; i < 150; i++) { const r = .2 + Math.sqrt(rnd()) * .9, a = rnd() * 6.283; const b = new THREE.Mesh(beadG, beadM);
    b.position.set(RX + Math.cos(a) * r, -3.0 + rnd() * 4.4, Math.sin(a) * r); root.add(b);
    const na = new THREE.Mesh(ionG, naM); root.add(na); const hard = new THREE.Mesh(ionG, rnd() < .6 ? caM : mgM); root.add(hard);
    beads.push({ b, na, hard, o: rnd(), ph: rnd() * 6.283 }); }
  // free ions in the water: hard (Ca white / Mg green) flowing down, released Na flowing out
  const free = Array.from({ length: 50 }, (_, i) => { const m = new THREE.Mesh(ionG, i % 3 ? caM : mgM); m.scale.setScalar(1.3); m.userData = { o: rnd(), r: Math.sqrt(rnd()) * 1.0, a: rnd() * 6.283 }; root.add(m); return m; });
  const inflow = Array.from({ length: 30 }, (_, i) => { const m = new THREE.Mesh(ionG, i % 3 ? caM : mgM); m.scale.setScalar(1.4); m.userData = { o: rnd(), dy: (rnd() - .5) * .15 }; root.add(m); return m; });
  const brineDots = Array.from({ length: 30 }, () => { const m = new THREE.Mesh(ionG, naM); m.userData = { o: rnd() }; root.add(m); return m; });
  const drainDots = Array.from({ length: 30 }, (_, i) => { const m = new THREE.Mesh(ionG, i % 3 ? caM : mgM); m.userData = { o: rnd() }; root.add(m); return m; });
  const bCurve = new THREE.CatmullRomCurve3(bPts.map(p => V(...p))), dCurve = new THREE.CatmullRomCurve3(dPts.map(p => V(...p)));
  // scale crust on a pipe end (hard water problem) shown in step 1
  const crust = new THREE.Mesh(new THREE.TorusGeometry(.13, .05, 8, 24), Mat({ color: 0xf5f0e0, shininess: 5 })); crust.position.set(-4.5, 3.4, 0); crust.rotation.y = Math.PI / 2; root.add(crust);

  const shots = [
    [[3.0, 1.2, 15.5], [.6, -.3, 0]],    // 0 wide
    [[-4.2, 4.2, 5.0], [-3.2, 3.3, 0]],  // 1 inlet hard water
    [[.4, .4, 6.0], [RX, -.4, 0]],       // 2 resin beads
    [[-.4, .8, 3.0], [RX, .4, 0]],       // 3 swap close-up
    [[4.6, 1.6, 9.5], [BX - 1.4, -.2, 0]], // 4 brine
    [[3.2, 0, 6.4], [.6, -.8, .8]],      // 5 drain
    [[3.0, 1.2, 15.5], [.6, -.3, 0]],    // 6 recap
  ];
  const cp = { p: V(), q: V() };
  function update(t, si, lt, sd) {
    const pulse = .5 + .5 * Math.sin(t * 6), k5 = ease(lt / sd);
    tankM.opacity = si >= 2 && si <= 5 ? .12 : .25;
    beadM.emissiveIntensity = si === 2 ? .25 + .2 * pulse : .05;
    bLineM.emissiveIntensity = si === 4 ? .5 + .4 * pulse : 0;
    drainM.emissiveIntensity = si === 5 ? .5 + .4 * pulse : 0;
    brineWM.emissiveIntensity = si === 4 ? .4 + .3 * pulse : .2;
    crust.visible = si === 1;
    // bead state: 0 = holding Na, 1 = holding hard ion (after swap); regeneration resets to Na
    beads.forEach(B => { const p = B.b.position, wob = .21;
      const ox = Math.cos(t * 2 + B.ph) * wob, oz = Math.sin(t * 2 + B.ph) * wob;
      let swapped = si === 3 ? (lt / sd > B.o * .8 ? 1 : 0) : (si === 4 || si === 5) ? 1 : 0;
      if (si === 5 && lt / sd > B.o * .7) swapped = 0;
      if (si === 4 && lt / sd > .5 + B.o * .5) swapped = 0;
      B.na.visible = !swapped && si >= 2 && si <= 5; B.hard.visible = !!swapped;
      B.na.position.set(p.x + ox, p.y + .05, p.z + oz); B.hard.position.set(p.x + ox, p.y + .05, p.z + oz); });
    // hard ions in the water drifting down through the bed (steps 2-3)
    free.forEach(m => { const u = m.userData, k = (u.o + t * .18) % 1; m.position.set(RX + Math.cos(u.a + k * 3) * u.r, lerp(2.2, -3.0, k), Math.sin(u.a + k * 3) * u.r); m.visible = si === 2 || si === 3 || si === 0; });
    // inlet ions flowing along the inlet pipe (steps 0,1,6)
    inflow.forEach(m => { const u = m.userData, k = (u.o + t * .3) % 1; m.position.set(lerp(-4.5, RX - .6, k), 3.4 + u.dy, u.dy); m.visible = si <= 1 || si === 6; });
    brineDots.forEach(m => { const k = (m.userData.o + t * .4) % 1; m.position.copy(bCurve.getPoint(k)); m.visible = si === 4; });
    drainDots.forEach(m => { const k = (m.userData.o + t * .4) % 1; m.position.copy(dCurve.getPoint(k)); m.visible = si === 5; });
    brineW.scale.y = si === 4 ? lerp(1, .6, k5) : si > 4 ? .6 : 1; brineW.position.y = -3.3 + 1.6 * brineW.scale.y / 2;
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
