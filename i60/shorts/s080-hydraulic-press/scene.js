// Inside 60 — Hydraulic press. Steps: 0 hook small push -> crush, 1 sealed oil + two pistons, 2 pressure spreads (Pascal), 3 big piston 100x area -> force, 4 trade-off distance, 5 pump strokes crush, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 90, specular: 0x555555, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x161a28); scene.fog = new THREE.Fog(0x161a28, 30, 80);
  scene.add(new THREE.HemisphereLight(0xf4f8ff, 0x404050, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(6, 10, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0x90c0ff, .6); rim.position.set(-6, 4, -8); scene.add(rim);

  const SX = -2.4, BX = .8, BASE = -2.3, RS = .16, RB = 1.6;
  const floor = new THREE.Mesh(new THREE.BoxGeometry(9, .2, 5), Mat({ color: 0x2a3040, shininess: 10 })); floor.position.set(0, BASE - .55, 0); scene.add(floor);
  const steelM = Mat({ color: 0x7d8796, shininess: 120 });
  const glassM = Mat({ color: 0xc8d8ea, transparent: true, opacity: .22, shininess: 200, side: THREE.DoubleSide, depthWrite: false });
  // cylinders (transparent walls)
  const bigWall = new THREE.Mesh(new THREE.CylinderGeometry(RB + .08, RB + .08, 2.2, 48, 1, true), glassM); bigWall.position.set(BX, BASE + 1.1, 0); scene.add(bigWall);
  const smWall = new THREE.Mesh(new THREE.CylinderGeometry(RS + .06, RS + .06, 2.8, 20, 1, true), glassM); smWall.position.set(SX, BASE + 1.4, 0); scene.add(smWall);
  const baseBlk = new THREE.Mesh(new THREE.BoxGeometry(5.4, .35, 2.2), steelM); baseBlk.position.set(-.6, BASE - .25, 0); scene.add(baseBlk);
  // oil
  const oilM = Mat({ color: 0xffb020, emissive: 0xff8000, emissiveIntensity: .15, transparent: true, opacity: .82, shininess: 160 });
  const oilBig = new THREE.Mesh(new THREE.CylinderGeometry(RB, RB, 1, 48), oilM); scene.add(oilBig);
  const oilSm = new THREE.Mesh(new THREE.CylinderGeometry(RS, RS, 1, 20), oilM); scene.add(oilSm);
  const pipeOil = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, BX - SX, 16), oilM); pipeOil.rotation.z = Math.PI / 2; pipeOil.position.set((SX + BX) / 2, BASE + .02, 0); scene.add(pipeOil);
  const pipeWall = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, BX - SX, 16, 1, true), glassM); pipeWall.rotation.z = Math.PI / 2; pipeWall.position.copy(pipeOil.position); scene.add(pipeWall);
  // pistons: big ram + platen
  const ramG = new THREE.Group(); scene.add(ramG);
  const pistonBM = Mat({ color: 0x5aa8ff, emissive: 0x000000, shininess: 140 });
  const pB = new THREE.Mesh(new THREE.CylinderGeometry(RB - .02, RB - .02, .3, 48), pistonBM); ramG.add(pB);
  const ramRod = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, 1.7, 24), steelM); ramRod.position.y = 1.0; ramG.add(ramRod);
  const platen = new THREE.Mesh(new THREE.BoxGeometry(2.4, .2, 1.6), Mat({ color: 0x9aa4b2, shininess: 140 })); platen.position.y = 1.95; ramG.add(platen);
  const smG = new THREE.Group(); scene.add(smG);
  const pistonSM = Mat({ color: 0xff6040, emissive: 0x000000, shininess: 140 });
  const pS = new THREE.Mesh(new THREE.CylinderGeometry(RS - .01, RS - .01, .2, 20), pistonSM); smG.add(pS);
  const smRod = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 1.6, 10), steelM); smRod.position.y = .9; smG.add(smRod);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(.18, 16, 12), pistonSM); knob.position.y = 1.75; smG.add(knob);
  // frame: two columns + crossbar over the big piston
  const CROSS_Y = 2.35;
  [-1, 1].forEach(s => { const c = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, CROSS_Y - BASE + .4, 16), steelM); c.position.set(BX + s * 2.0, (CROSS_Y + BASE) / 2, -.2); scene.add(c); });
  const cross = new THREE.Mesh(new THREE.BoxGeometry(4.5, .45, 1.6), Mat({ color: 0x3a4250 })); cross.position.set(BX, CROSS_Y + .2, -.0); scene.add(cross);
  // object to crush (a soft "can" box)
  const objM = Mat({ color: 0x40d080, emissive: 0x000000, shininess: 100 });
  const obj = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, 1, 28), objM); obj.position.x = BX; scene.add(obj);
  // pressure rings (Pascal): expanding glow discs in oil
  const ringM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .7 });
  const ringsB = []; for (let k = 0; k < 3; k++) { const r = new THREE.Mesh(new THREE.TorusGeometry(1, .035, 8, 48), ringM.clone()); r.rotation.x = Math.PI / 2; r.userData.o = k / 3; scene.add(r); ringsB.push(r); }
  const pDots = []; for (let k = 0; k < 10; k++) { const d = new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true })); d.userData.o = k / 10; scene.add(d); pDots.push(d); }
  // arrows
  function arrow(color, len, rad) {
    const g = new THREE.Group(); const m = new THREE.MeshBasicMaterial({ color });
    const sh = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, len, 12), m); sh.position.y = len / 2; g.add(sh);
    const hd = new THREE.Mesh(new THREE.ConeGeometry(rad * 2.4, rad * 4, 16), m); hd.position.y = len + rad * 2; g.add(hd);
    scene.add(g); return g;
  }
  const upArrows = []; for (let k = 0; k < 7; k++) { const a = arrow(0x50e0ff, .9, .05); upArrows.push(a); }
  const downArrow = arrow(0xff7050, .9, .05); downArrow.rotation.z = Math.PI;
  const longArrow = arrow(0xff7050, 1.6, .06); longArrow.rotation.z = Math.PI;
  const shortArrow = arrow(0x50e0ff, .25, .06);

  const shots = [
    [[1.4, .8, 16], [.2, -.5, 0]],        // 0 overview
    [[-2.0, .6, 10.5], [-.6, -1.1, 0]],         // 1 two pistons + oil
    [[-.4, 3.8, 10.5], [-.6, -1.1, 0]],         // 2 pressure spreads (from above-ish)
    [[4.2, .4, 7.2], [.8, -1.0, 0]],           // 3 big piston force
    [[-4.6, .8, 7.0], [-1.2, -.6, 0]],         // 4 trade-off distance
    [[2.6, 1.2, 10.5], [.8, .7, 0]],             // 5 crush
    [[-1.2, 1.2, 16], [.2, -.5, 0]],        // 6 recap
  ];
  const cp = { p: V(), q: V() };
  let rise = 0, lastT = 0;
  const OBJ_H = 1.3, RAM0 = BASE + .5; // ram piston center at rest
  function update(t, si, lt, sd) {
    const dt = Math.min(.1, Math.max(0, t - lastT)); lastT = t;
    const pulse = .5 + .5 * Math.sin(t * 7);
    // small piston motion
    let push = 0; // 0 = top, 1 = fully down
    if (si === 0 || si === 5) push = .5 - .5 * Math.cos(t * Math.PI * 2 * (si === 5 ? .9 : .6));
    else if (si === 2 || si === 3) push = ease((lt - .3) / 1.2);
    else if (si === 4) push = .5 - .5 * Math.cos(Math.min(1, lt / 2.4) * Math.PI);
    const descending = (si === 0 || si === 5) ? Math.sin(t * Math.PI * 2 * (si === 5 ? .9 : .6)) > 0 : (si >= 2 && si <= 4 && push < .98);
    const rate = { 0: .04, 2: .03, 3: .05, 4: .03, 5: .6 }[si] || 0;
    if (descending) rise = Math.min(1.45, rise + rate * dt);
    if (si === 6) rise = Math.min(1.45, rise + .05 * dt);
    // place
    const smTop = BASE + 2.4 - push * 1.4; smG.position.set(SX, smTop, 0);
    oilSm.scale.y = smTop - .1 - BASE; oilSm.position.set(SX, (smTop - .1 + BASE) / 2, 0);
    const ramY = RAM0 + rise; ramG.position.set(BX, ramY, 0);
    oilBig.scale.y = ramY - .15 - BASE; oilBig.position.set(BX, (ramY - .15 + BASE) / 2, 0);
    const platTop = ramY + 2.05, crossBot = CROSS_Y - .02;
    const h = Math.max(.35, Math.min(OBJ_H, crossBot - platTop));
    obj.scale.set(1 + (OBJ_H - h) * .35, h, 1 + (OBJ_H - h) * .35); obj.position.y = platTop + h / 2;
    objM.emissive.setHex(0x30ff80); objM.emissiveIntensity = h < OBJ_H - .02 ? .25 + .2 * pulse : 0;
    // glows
    oilM.emissiveIntensity = si === 1 ? .3 + .2 * pulse : si === 2 ? .45 : .15;
    pistonBM.emissive.setHex(0x2080ff); pistonBM.emissiveIntensity = si === 3 ? .4 + .3 * pulse : si === 1 ? .2 : 0;
    pistonSM.emissive.setHex(0xff4020); pistonSM.emissiveIntensity = si === 1 || si === 4 ? .35 + .3 * pulse : 0;
    // pressure rings + dots
    ringsB.forEach(r => { const a = (t * .8 + r.userData.o) % 1; r.visible = si === 2; r.position.set(BX, BASE + .1 + a * (ramY - BASE - .3), 0); r.scale.setScalar(RB * .98); r.material.opacity = .9 * (1 - a * .6); });
    pDots.forEach((d, k) => { const a = (t * .9 + d.userData.o) % 1; d.visible = si === 2; d.position.set(SX + a * (BX - SX), BASE + .02, 0); d.material.opacity = 1 - a * .3; });
    // arrows
    upArrows.forEach((a, k) => { const ang = k / 7 * Math.PI * 2; const r = k === 0 ? 0 : 1.0; a.visible = si === 3; a.position.set(BX + Math.cos(ang) * r * (k ? 1 : 0), ramY + .2, Math.sin(ang) * r * (k ? 1 : 0) + .0); a.scale.setScalar(.8 + .2 * pulse); });
    downArrow.visible = si === 2 || si === 3; downArrow.position.set(SX, smTop + 2.9, 0);
    longArrow.visible = si === 4; longArrow.position.set(SX + .5, BASE + 2.6, .4);
    shortArrow.visible = si === 4; shortArrow.position.set(BX - 1.45, ramY + 1.6, .9);
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
