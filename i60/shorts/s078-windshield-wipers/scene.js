// Inside 60 — Windshield wipers. Steps: 0 hook wipers sweeping rain, 1 motor, 2 worm gear, 3 linkage, 4 blades sweep, 5 rain sensor IR, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 90, specular: 0x555555, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x142030); scene.fog = new THREE.Fog(0x142030, 40, 90);
  scene.add(new THREE.HemisphereLight(0xf4f8ff, 0x404050, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(6, 10, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0x90c0ff, .7); rim.position.set(-6, 4, -8); scene.add(rim);

  // car body context: windshield frame (glass in xy plane, z=0), roof above, hood below/front
  const bodyM = Mat({ color: 0x2a70d0, shininess: 120 });
  const GW = 6.4, GH = 3.2;
  const glassM = Mat({ color: 0x9fd8ff, transparent: true, opacity: .28, shininess: 200, side: THREE.DoubleSide });
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(GW, GH), glassM); scene.add(glass);
  const frameM = Mat({ color: 0x1e2430 });
  [[0, GH / 2 + .1, GW + .4, .2], [0, -GH / 2 - .1, GW + .4, .2]].forEach(([x, y, w, h]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, .2), frameM); m.position.set(x, y, 0); scene.add(m); });
  [-1, 1].forEach(s => { const m = new THREE.Mesh(new THREE.BoxGeometry(.25, GH + .4, .25), bodyM); m.position.set(s * (GW / 2 + .12), 0, 0); scene.add(m); });
  const roof = new THREE.Mesh(new THREE.BoxGeometry(GW + .5, .25, 3), bodyM); roof.position.set(0, GH / 2 + .3, -1.5); scene.add(roof);
  const hood = new THREE.Mesh(new THREE.BoxGeometry(GW + .5, .25, 4.5), bodyM); hood.position.set(0, -GH / 2 - 1.5, 3.2); scene.add(hood);
  const cowl = new THREE.Mesh(new THREE.BoxGeometry(GW + .5, .15, 1.0), Mat({ color: 0x20252e })); cowl.position.set(0, -GH / 2 - 1.3, .55); scene.add(cowl);

  // raindrops on glass
  const dropM = Mat({ color: 0xd8f0ff, transparent: true, opacity: .85, shininess: 250, emissive: 0x204060 });
  const drops = [];
  for (let k = 0; k < 70; k++) {
    const d = new THREE.Mesh(new THREE.SphereGeometry(.07 + Math.random() * .05, 10, 8), dropM);
    d.scale.z = .45; scene.add(d);
    d.userData = { x: (Math.random() - .5) * (GW - .4), y: (Math.random() - .5) * (GH - .3), born: -Math.random() * 3, wet: true };
    d.position.set(d.userData.x, d.userData.y, .05); drops.push(d);
  }
  // falling rain streaks
  const streakM = new THREE.MeshBasicMaterial({ color: 0xbfe0ff, transparent: true, opacity: .45 });
  const streaks = []; for (let k = 0; k < 40; k++) { const s = new THREE.Mesh(new THREE.BoxGeometry(.025, .5, .025), streakM); s.userData = { x: (Math.random() - .5) * 9, z: .5 + Math.random() * 5, o: Math.random() }; scene.add(s); streaks.push(s); }

  // wiper arms (rotate about z at pivots)
  const P1 = V(-1.7, -1.4, .14), P2 = V(1.2, -1.4, .14);
  const armM = Mat({ color: 0x15181e, shininess: 60 });
  const bladeM = Mat({ color: 0x303640, emissive: 0x000000 });
  function makeArm(P, L) {
    const g = new THREE.Group(); g.position.copy(P); scene.add(g);
    const a = new THREE.Mesh(new THREE.BoxGeometry(L, .09, .07), armM); a.position.x = L / 2; g.add(a);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, .14, 18), armM); hub.rotation.x = Math.PI / 2; g.add(hub);
    const bl = new THREE.Mesh(new THREE.BoxGeometry(L * .92, .07, .12), bladeM); bl.position.set(L * .52, 0, .06); g.add(bl);
    return g;
  }
  const L1 = 2.8, L2 = 1.95;
  const arm1 = makeArm(P1, L1), arm2 = makeArm(P2, L2);

  // mechanism under cowl (in front, z ~ .7, y ~ -2.2)
  const MZ = .75;
  const motM = Mat({ color: 0x3a4250, emissive: 0x000000 });
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(.32, .32, .9, 24), motM); motor.rotation.z = Math.PI / 2; motor.position.set(-.65, -2.55, MZ); scene.add(motor);
  const capM = Mat({ color: 0xd88a30 }); const cap = new THREE.Mesh(new THREE.CylinderGeometry(.33, .33, .12, 24), capM); cap.rotation.z = Math.PI / 2; cap.position.set(-1.12, -2.55, MZ); scene.add(cap);
  // worm (helix tube on shaft), axis x
  const worm = new THREE.Group(); worm.position.set(.15, -2.55, MZ); scene.add(worm);
  const wormM = Mat({ color: 0xffc040, emissive: 0x000000, shininess: 160 });
  { const sh = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 1.0, 12), wormM); sh.rotation.z = Math.PI / 2; worm.add(sh);
    const pts = []; for (let i = 0; i <= 120; i++) { const a = i / 120 * Math.PI * 2 * 6; pts.push(V(-.4 + i / 120 * .8, Math.cos(a) * .14, Math.sin(a) * .14)); }
    worm.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 240, .035, 6), wormM)); }
  // worm wheel (axis z) above the worm
  const WC = V(.15, -2.0, MZ);
  const wheel = new THREE.Group(); wheel.position.copy(WC); scene.add(wheel);
  const wheelM = Mat({ color: 0x50d0ff, emissive: 0x000000, shininess: 140 });
  { const d = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, .16, 36), wheelM); d.rotation.x = Math.PI / 2; wheel.add(d);
    for (let k = 0; k < 28; k++) { const a = k / 28 * Math.PI * 2; const t = new THREE.Mesh(new THREE.BoxGeometry(.07, .08, .16), wheelM); t.position.set(Math.cos(a) * .45, Math.sin(a) * .45, 0); t.rotation.z = a; wheel.add(t); } }
  // crank on wheel front
  const CR = .32;
  const crankM = Mat({ color: 0xff5060, emissive: 0x000000 });
  const crank = new THREE.Mesh(new THREE.BoxGeometry(CR, .1, .08), crankM); crank.position.x = CR / 2; const crankG = new THREE.Group(); crankG.position.set(WC.x, WC.y, MZ + .12); crankG.add(crank); scene.add(crankG);
  // levers on pivots (behind cowl, rotate with arms), rods between
  const rodM = Mat({ color: 0xff5060, emissive: 0x000000 });
  const rod1 = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, 1, 10), rodM); scene.add(rod1);
  const rod2 = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, 1, 10), rodM); scene.add(rod2);
  const leverM = Mat({ color: 0xc0c8d4 });
  const lev1 = new THREE.Mesh(new THREE.BoxGeometry(.5, .08, .06), leverM); scene.add(lev1);
  const lev2 = new THREE.Mesh(new THREE.BoxGeometry(.5, .08, .06), leverM); scene.add(lev2);
  const posts = [P1, P2].map(P => { const m = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, MZ - .1, 10), leverM); m.rotation.x = Math.PI / 2; m.position.set(P.x, P.y, (MZ + .14) / 2); scene.add(m); return m; });
  const up = V(0, 1, 0), tmp = V();
  function setRod(r, a, b) { r.position.copy(a).add(b).multiplyScalar(.5); tmp.copy(b).sub(a); r.scale.set(1, tmp.length(), 1); r.quaternion.setFromUnitVectors(up, tmp.normalize()); }
  // rain sensor behind glass top
  const SENS = V(0, 1.15, -.45);
  const senM = Mat({ color: 0x303844, emissive: 0x000000 });
  const sensor = new THREE.Mesh(new THREE.BoxGeometry(.55, .28, .16), senM); sensor.position.copy(SENS); scene.add(sensor);
  const irM = new THREE.MeshBasicMaterial({ color: 0xff3050 });
  const beamA = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 1, 8), irM); scene.add(beamA);
  const beamB = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 1, 8), irM); scene.add(beamB);
  const scat = []; for (let k = 0; k < 5; k++) { const s = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, 1, 6), irM); scene.add(s); scat.push(s); }
  const sDrops = []; for (let k = 0; k < 6; k++) { const d = new THREE.Mesh(new THREE.SphereGeometry(.09, 10, 8), dropM); d.scale.z = .45; d.position.set(-.3 + k * .12, 1.1 + (k % 3) * .06, .05); scene.add(d); sDrops.push(d); }

  const shots = [
    [[0, .2, 13.5], [0, -1.5, 0]],             // 0 hook: whole windshield
    [[-3.2, -1.0, 4.4], [-.5, -2.4, .7]],     // 1 motor
    [[1.8, -1.2, 3.6], [.15, -2.25, .7]],     // 2 worm gear close
    [[1.5, 1.2, 9.0], [-.3, -1.9, .4]],       // 3 linkage
    [[2.6, 1.6, 13], [0, -1.2, 0]],            // 4 blades sweep
    [[3.4, 1.2, -3.0], [0, .8, -.2]],           // 5 rain sensor
    [[-3.5, 1.6, 14], [0, -1.4, 0]],               // 6 recap
  ];
  const cp = { p: V(), q: V() };
  let phase = 0, lastT = 0, motAng = 0;
  const A0 = .06, AMP = 1.62;
  function update(t, si, lt, sd) {
    const dt = Math.min(.1, Math.max(0, t - lastT)); lastT = t;
    const pulse = .5 + .5 * Math.sin(t * 7);
    // wiping on? step 5: off until rain builds up
    const wiping = si !== 5 || lt > 2.6;
    const rate = si === 2 ? 2.2 : si === 3 ? 2.6 : 3.6; // rad/s of crank
    if (wiping) phase += rate * dt;
    motAng += (wiping ? rate * 28 : 0) * dt;
    worm.rotation.x = motAng;
    wheel.rotation.z = -phase;
    crankG.rotation.z = -phase;
    const ang = A0 + AMP * (.5 - .5 * Math.cos(phase));
    arm1.rotation.z = ang; arm2.rotation.z = ang;
    // levers + rods
    const pin = V(WC.x + Math.cos(-phase) * CR, WC.y + Math.sin(-phase) * CR, MZ + .16);
    const levs = [[lev1, P1, rod1], [lev2, P2, rod2]];
    levs.forEach(([lv, P, rd]) => {
      const la = ang - Math.PI / 2 - .4; const e = V(P.x + Math.cos(la) * .5, P.y + Math.sin(la) * .5, MZ + .16);
      lv.position.set((P.x + e.x) / 2, (P.y + e.y) / 2, MZ + .16); lv.rotation.z = la; setRod(rd, pin, e);
    });
    // glows
    motM.emissive.setHex(0x3060ff); motM.emissiveIntensity = si === 1 ? .35 + .35 * pulse : 0;
    wormM.emissive.setHex(0xff9a20); wormM.emissiveIntensity = si === 2 ? .35 + .3 * pulse : 0;
    wheelM.emissive.setHex(0x30a0ff); wheelM.emissiveIntensity = si === 2 ? .3 + .3 * pulse : 0;
    rodM.emissive.setHex(0xff3040); rodM.emissiveIntensity = si === 3 ? .45 + .35 * pulse : 0;
    crankM.emissive.setHex(0xff3040); crankM.emissiveIntensity = si === 3 ? .45 + .35 * pulse : 0;
    bladeM.emissive.setHex(0x30ff80); bladeM.emissiveIntensity = si === 4 ? .35 + .3 * pulse : 0;
    senM.emissive.setHex(0x602030); senM.emissiveIntensity = si === 5 ? .3 + .2 * pulse : 0;
    // drops: wiped when arm passes
    drops.forEach(d => {
      const u = d.userData;
      if (!u.wet && t - u.born > 0) u.wet = true;
      if (u.wet && wiping) {
        [[P1, L1], [P2, L2]].some(([P, L]) => {
          const dx = u.x - P.x, dy = u.y - P.y, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
          if (r < L + .1 && Math.abs(a - ang) < .08) { u.wet = false; u.born = t + .6 + Math.random() * 2.2; return true; } return false;
        });
      }
      d.visible = u.wet; const g = Math.min(1, Math.max(.2, (t - u.born) * 1.5)); d.scale.set(g, g, .45 * g);
    });
    streaks.forEach(s => { const u = s.userData; const a = (t * 1.4 + u.o) % 1; s.position.set(u.x, 5 - a * 8, u.z); s.visible = si !== 1 && si !== 2; });
    // rain sensor
    const sOn = si === 5;
    const sensWet = sOn && lt > .8 && !(lt > 2.6 && Math.abs(ang - 1.57) < 2);
    sDrops.forEach((d, k) => { d.visible = sOn && lt > .5 + k * .2 && !(lt > 2.9); });
    beamA.visible = beamB.visible = sOn;
    const hit = V(0, 1.15, 0);
    setRod(beamA, V(-.3, 1.15, -.34), V(0, 1.15, .02)); setRod(beamB, V(0, 1.15, .02), V(.3, 1.15, -.34));
    scat.forEach((s, k) => { s.visible = sOn && lt > 1.0 && lt < 2.9; const a = -.9 + k * .45; setRod(s, V(0, 1.15, .03), V(Math.sin(a) * .8, 1.15 + Math.cos(a) * .35, .9)); });
    irM.color.setHSL(.98, 1, .5 + .12 * pulse);
    void hit; void sensWet;
    // camera
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const kk = si === 0 ? 1 : ease(lt / 1.4);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], kk))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], kk)));
    const o = Math.sin(t * .25) * .08, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o));
    camera.lookAt(cp.q);
  }
  return { update };
}
