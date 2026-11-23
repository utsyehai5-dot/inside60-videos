// Inside 60 — Space heater. Steps: 0 hook (glowing heater), 1 nichrome coil (cutaway), 2 electrons + resistance -> red hot,
// 3 fan pushes warm air, 4 thermostat clicks off/on, 5 tip-over switch cuts power, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x444444, ...o });
  scene.background = new THREE.Color(0x1a2233);
  scene.add(new THREE.HemisphereLight(0xfff4e8, 0x3a4050, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, .9); key.position.set(5, 7, 9); scene.add(key);
  const glowL = new THREE.PointLight(0xff6020, 0, 8); glowL.position.set(0, 0, 1.2); scene.add(glowL);
  const root = new THREE.Group(); scene.add(root);
  const GY = -2.2;
  const floor = new THREE.Mesh(new THREE.BoxGeometry(30, .3, 20), Mat({ color: 0x8a6448, shininess: 20 })); floor.position.y = GY - .15; root.add(floor);
  const wall = new THREE.Mesh(new THREE.BoxGeometry(30, 14, .3), Mat({ color: 0x4f6a80, shininess: 5 })); wall.position.set(0, GY + 7, -5); root.add(wall);

  // heater (tilt pivot at front-bottom edge)
  const pivot = new THREE.Group(); pivot.position.set(1.4, GY, 0); root.add(pivot);
  const H = new THREE.Group(); H.position.set(-1.4, 0, 0); pivot.add(H);
  const caseM = Mat({ color: 0xe8e4dc, shininess: 60, transparent: true, opacity: 1, side: THREE.DoubleSide });
  const W = 2.4, HT = 3.2, D = 1.6;
  const back = new THREE.Mesh(new THREE.BoxGeometry(W, HT, .1), caseM); back.position.set(0, HT / 2 + .25, -D / 2); H.add(back);
  [-1, 1].forEach(s => { const sd = new THREE.Mesh(new THREE.BoxGeometry(.1, HT, D), caseM); sd.position.set(s * W / 2, HT / 2 + .25, 0); H.add(sd); });
  const top = new THREE.Mesh(new THREE.BoxGeometry(W, .12, D), caseM); top.position.set(0, HT + .25, 0); H.add(top);
  const base = new THREE.Mesh(new THREE.BoxGeometry(W + .4, .25, D + .4), Mat({ color: 0x303438 })); base.position.y = .125; H.add(base);
  // front grille bars
  const grilleM = Mat({ color: 0x404448, shininess: 120, transparent: true, opacity: 1 });
  for (let i = 0; i < 9; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, HT - .3, 8), grilleM); b.position.set(-W / 2 + .25 + i * (W - .5) / 8, HT / 2 + .25, D / 2); H.add(b); }
  // nichrome coil (helix tube), zig-zag across 3 rows
  const pts = [];
  const rows = 3, turns = 14;
  for (let r = 0; r < rows; r++) for (let i = 0; i <= 200; i++) { const u = i / 200, a = u * turns * Math.PI * 2; const dir = r % 2 ? -1 : 1;
    pts.push(new THREE.Vector3(dir * lerp(-.85, .85, u), 1.15 + r * .75 + Math.sin(a) * .16, .25 + Math.cos(a) * .16)); }
  const curve = new THREE.CatmullRomCurve3(pts);
  const coilM = Mat({ color: 0x9aa0a8, shininess: 160, emissive: 0xff3a00, emissiveIntensity: 0 });
  const coil = new THREE.Mesh(new THREE.TubeGeometry(curve, 1400, .035, 6, false), coilM); H.add(coil);
  // fan behind coil
  const fan = new THREE.Group(); fan.position.set(0, 1.9, -.5); H.add(fan);
  const fanM = Mat({ color: 0x5aa0d0, emissive: 0x3080c0, emissiveIntensity: 0 });
  fan.add(new THREE.Mesh(new THREE.CylinderGeometry(.15, .15, .2, 16).rotateX(Math.PI / 2), Mat({ color: 0x333333 })));
  for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.7, .22, .03), fanM); const g = new THREE.Group(); g.rotation.z = i / 5 * Math.PI * 2; b.position.x = .45; b.rotation.x = .4; g.add(b); fan.add(g); }
  // thermostat dial on top
  const dialM = Mat({ color: 0x202020, emissive: 0x40ff80, emissiveIntensity: 0 });
  const dial = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .14, 24), dialM); dial.position.set(.7, HT + .38, .3); H.add(dial);
  const tick = new THREE.Mesh(new THREE.BoxGeometry(.04, .02, .18), Mat({ color: 0xffffff })); tick.position.set(0, .08, .08); dial.add(tick);
  // tip-over switch (plunger under base)
  const swM = Mat({ color: 0xc02020, emissive: 0xff2020, emissiveIntensity: 0 });
  const sw = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, .2, 16), swM); sw.position.set(0, -.02, 0); H.add(sw);
  // electrons (in coil), warm air particles
  const eM = new THREE.MeshBasicMaterial({ color: 0x80e0ff });
  const elec = Array.from({ length: 50 }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 6), eM); m.userData.o = i / 50; H.add(m); return m; });
  const airM = new THREE.MeshBasicMaterial({ color: 0xffa050, transparent: true, opacity: .85 });
  const air = Array.from({ length: 50 }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(.08, 8, 6), airM); m.userData = { o: i / 50, x: (Math.random() - .5) * 1.8, y: 1 + Math.random() * 2 }; root.add(m); return m; });
  // plug + cord
  const cord = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(1.1, GY + .3, -.6), new THREE.Vector3(2.5, GY + .05, -1.5), new THREE.Vector3(4, GY + .05, -3), new THREE.Vector3(4.6, GY + 1, -4.8)]), 40, .05, 6), Mat({ color: 0x222222 })); root.add(cord);

  const shots = [
    [[4.0, .6, 11.5], [0, -.3, 0]],     // 0 wide
    [[1.8, -.2, 5.6], [0, -.3, 0]],     // 1 coil close
    [[.9, -.4, 3.6], [0, -.5, .2]],     // 2 coil very close
    [[5.0, .4, 8.5], [.6, -.6, .6]],    // 3 side, air out
    [[2.6, 2.4, 5.5], [.5, 1.0, 0]],    // 4 thermostat (above)
    [[1.6, .2, 12.5], [1.2, -1.0, 0]],   // 5 tip-over (falls sideways)
    [[4.0, .6, 11.5], [0, -.3, 0]],     // 6 recap
  ];
  const cp = { p: new THREE.Vector3(), q: new THREE.Vector3() };
  let fanA = 0, lastT = 0, heat = 0;
  function update(t, si, lt, sd) {
    const dt = Math.min(.05, Math.max(0, t - lastT)); lastT = t;
    const f = Math.min(1, lt / Math.max(.1, sd)), pulse = .5 + .5 * Math.sin(t * 6);
    // power state
    let on = si !== 1;
    if (si === 4) on = !(f > .35 && f < .7);
    let tilt = 0;
    if (si === 5) { tilt = ease((f - .15) / .3); if (f > .3) on = false; }
    pivot.rotation.z = -tilt * 1.4;
    const tgt = on ? 1 : 0;
    heat = lerp(heat, tgt, Math.min(1, dt * (si === 2 ? 1.2 : 2.5)));
    coilM.emissiveIntensity = heat * 1.4; coilM.color.setHex(heat > .5 ? 0xd06040 : 0x9aa0a8);
    glowL.intensity = heat * 3;
    // cutaway (steps 1-4)
    const cut = si >= 1 && si <= 4;
    caseM.opacity = cut ? .25 : 1; grilleM.opacity = cut ? .3 : 1;
    // electrons
    elec.forEach(m => { m.visible = si === 2; if (m.visible) { const u = (m.userData.o + t * .06) % 1; m.position.copy(curve.getPointAt(u)); m.position.y += Math.sin(t * 40 + m.userData.o * 90) * .03; } });
    // fan
    fanA += (on && si !== 1 ? 14 : 0) * dt; fan.rotation.z = fanA;
    fanM.emissiveIntensity = si === 3 ? .3 + .3 * pulse : 0;
    // air
    const showAir = (si === 0 || si === 3 || si === 6 || si === 4) && heat > .3;
    air.forEach(m => { const u = m.userData, k = (t * .4 + u.o) % 1; m.visible = showAir;
      m.position.set(u.x * (1 + k), GY + u.y + k * 1.6, 1.2 + k * 5); m.scale.setScalar(1 - k * .6); });
    airM.opacity = .85 * heat;
    // thermostat + switch
    dialM.emissiveIntensity = si === 4 ? .5 + .5 * pulse : 0; dial.rotation.y = si === 4 ? Math.sin(f * Math.PI) * .8 : 0;
    swM.emissiveIntensity = si === 5 && f > .3 ? .6 + .4 * pulse : 0; sw.position.y = si === 5 && f > .3 ? -.12 : -.02;
    // camera
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const kk = si === 0 ? 1 : ease(lt / 1.4);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], kk))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], kk)));
    const ob = Math.sin(t * .25) * .07, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(ob) - dz * Math.sin(ob), cp.p.y, cp.q.z + dz * Math.cos(ob) + dx * Math.sin(ob));
    camera.lookAt(cp.q);
  }
  return { update };
}
