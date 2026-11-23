// Inside 60 — Pressure washer. Steps: 0 hook (jet cleaning a dirty slab), 1 hose water into pump + motor,
// 2 wobble plate + pistons, 3 nozzle jet, 4 tip angles, 5 trigger released -> unloader bypass, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x161b28); scene.fog = new THREE.Fog(0x161b28, 30, 80);
  scene.add(new THREE.HemisphereLight(0xfff8f0, 0x303040, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(5, 9, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0x80c0ff, .5); rim.position.set(-6, 4, -8); scene.add(rim);
  const root = new THREE.Group(); scene.add(root);
  const GY = -2.6;
  const floor = new THREE.Mesh(new THREE.CircleGeometry(18, 48), Mat({ color: 0x2b333f, shininess: 5 })); floor.rotation.x = -Math.PI / 2; floor.position.y = GY; root.add(floor);

  // machine body (cutaway) on wheels
  const AX = -.9; // pump axis height
  const bodyM = Mat({ color: 0xf2c230, transparent: true, opacity: 1, side: THREE.DoubleSide, depthWrite: true, shininess: 120 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.9, 1.7), bodyM); body.position.set(-2.4, AX + .05, 0); root.add(body);
  [[-3.6, .9], [-3.6, -.9], [-1.2, .9], [-1.2, -.9]].forEach(([x, z]) => { const w = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, .25, 24).rotateX(Math.PI / 2), Mat({ color: 0x202428 })); w.position.set(x, GY + .42, z); root.add(w); });
  const legs = new THREE.Mesh(new THREE.BoxGeometry(3.0, GY + .42 < AX - .9 ? (AX - .9) - (GY + .42) : .2, .3), Mat({ color: 0x353b44 })); legs.position.set(-2.4, ((AX - .9) + (GY + .42)) / 2, 0); root.add(legs);
  // motor
  const motorM = Mat({ color: 0x3a7fe0, emissive: 0x40a0ff, emissiveIntensity: 0 });
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, 1.3, 32).rotateZ(Math.PI / 2), motorM); motor.position.set(-3.45, AX, 0); root.add(motor);
  const shaftM = Mat({ color: 0xd0d8e0, emissive: 0x40c0ff, emissiveIntensity: 0 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, 1.2, 12).rotateZ(Math.PI / 2), shaftM); shaft.position.set(-2.5, AX, 0); root.add(shaft);
  // wobble plate
  const wob = new THREE.Group(); wob.position.set(-2.4, AX, 0); root.add(wob);
  const TILT = .35;
  const plateM = Mat({ color: 0xffd040, emissive: 0xffc020, emissiveIntensity: 0, shininess: 160 });
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(.62, .62, .1, 40).rotateZ(Math.PI / 2), plateM); plate.rotation.z = TILT; wob.add(plate);
  const mark = new THREE.Mesh(new THREE.BoxGeometry(.12, .12, .12), new THREE.MeshBasicMaterial({ color: 0xff4020 })); mark.position.set(0, .56, 0); plate.add(mark);
  // pistons (3 around axis)
  const PR = .38, pistonM = Mat({ color: 0xc8d0d8, emissive: 0x40e0ff, emissiveIntensity: 0, shininess: 160 });
  const cylM = Mat({ color: 0x9ab0c4, transparent: true, opacity: .3, depthWrite: false, side: THREE.DoubleSide });
  const pistons = [];
  for (let k = 0; k < 3; k++) {
    const ph = k / 3 * Math.PI * 2; const y = Math.cos(ph) * PR, z = Math.sin(ph) * PR;
    const p = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, .8, 14).rotateZ(Math.PI / 2), pistonM); root.add(p);
    const c = new THREE.Mesh(new THREE.CylinderGeometry(.15, .15, .7, 16, 1, true).rotateZ(Math.PI / 2), cylM); c.position.set(-1.45, AX + y, z); root.add(c);
    pistons.push({ p, ph, y, z });
  }
  const manM = Mat({ color: 0x8a96a4, transparent: true, opacity: 1 });
  const manifold = new THREE.Mesh(new THREE.BoxGeometry(.45, 1.1, 1.1), manM); manifold.position.set(-.9, AX, 0); root.add(manifold);
  // water paths
  const inletCurve = new THREE.CatmullRomCurve3([V(-.4, GY + .1, -3.2), V(-.3, GY + .2, -1.6), V(-.4, AX - .3, -1.0), V(-.75, AX - .3, -.4), V(-1.3, AX, 0)]);
  const hoseM = Mat({ color: 0x30a050, emissive: 0x40ff80, emissiveIntensity: 0 });
  root.add(new THREE.Mesh(new THREE.TubeGeometry(inletCurve, 60, .1, 10), hoseM));
  // wand
  const wand = new THREE.Group(); wand.position.set(.4, .5, 1.3); wand.rotation.z = -.62; root.add(wand);
  const wandM = Mat({ color: 0x30363e });
  wand.add(new THREE.Mesh(new THREE.BoxGeometry(.5, .25, .22), wandM).translateX(.1));
  const grip = new THREE.Mesh(new THREE.BoxGeometry(.18, .6, .18), wandM); grip.position.set(-.05, -.35, 0); grip.rotation.z = .3; wand.add(grip);
  const trigM = Mat({ color: 0xff5030, emissive: 0xff5030, emissiveIntensity: 0 });
  const trig = new THREE.Mesh(new THREE.BoxGeometry(.08, .32, .1), trigM); trig.geometry.translate(0, -.16, 0); trig.position.set(.18, -.12, 0); wand.add(trig);
  const lanceM = Mat({ color: 0xc8ccd2, emissive: 0x40e0ff, emissiveIntensity: 0, shininess: 160 });
  wand.add(new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 2.0, 12).rotateZ(Math.PI / 2), lanceM).translateX(1.35));
  const tipColors = [0xff3030, 0xffd020, 0x30d060, 0xf0f0f0];
  const tipM = Mat({ color: 0xffd020, emissive: 0xffd020, emissiveIntensity: 0 });
  const tip = new THREE.Mesh(new THREE.CylinderGeometry(.09, .12, .22, 16).rotateZ(Math.PI / 2), tipM); tip.position.x = 2.4; wand.add(tip);
  const nozRing = new THREE.Mesh(new THREE.TorusGeometry(.18, .025, 6, 24), new THREE.MeshBasicMaterial({ color: 0xffe040, transparent: true, opacity: 0 })); nozRing.rotation.y = Math.PI / 2; nozRing.position.x = 2.52; wand.add(nozRing);
  root.updateMatrixWorld(true);
  const hpStart = V(-.68, AX + .3, .3);
  const hpCurve = new THREE.CatmullRomCurve3([hpStart, V(-.2, AX + .3, .6), V(.1, GY + .3, 1.4), V(.5, GY + .3, 1.6), V(.3, -.4, 1.4), wand.localToWorld(V(-.05, -.6, 0))]);
  root.add(new THREE.Mesh(new THREE.TubeGeometry(hpCurve, 80, .07, 10), Mat({ color: 0x202226 })));
  const bypassCurve = new THREE.CatmullRomCurve3([V(-.9, AX + .55, .2), V(-.9, AX + 1.0, .2), V(-1.6, AX + 1.05, .2), V(-2.0, AX + .6, .2), V(-1.85, AX + .35, .2)]);
  const bypM = Mat({ color: 0xb0bcc8, emissive: 0x40e0ff, emissiveIntensity: 0 });
  root.add(new THREE.Mesh(new THREE.TubeGeometry(bypassCurve, 40, .06, 8), bypM));
  const unl = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, .4, 16), Mat({ color: 0xe0a040, emissive: 0xff9020, emissiveIntensity: 0 })); unl.position.set(-.9, AX + .7, .2); root.add(unl);
  // jet
  const jetM = new THREE.MeshBasicMaterial({ color: 0xb8f0ff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  const jet = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 24, 1, true).translate(0, -.5, 0), jetM); root.add(jet);
  const dropM = new THREE.MeshBasicMaterial({ color: 0xd0f4ff });
  const drops = []; for (let i = 0; i < 40; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(.04, 6, 5), dropM); root.add(d); drops.push({ d, s: Math.random(), v: V((Math.random() - .5) * 2, Math.random() * 1.5, (Math.random() - .5) * 2) }); }
  const water = (c, n, m, r) => { const a = []; for (let k = 0; k < n; k++) { const d = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), m); root.add(d); a.push({ d, s: k / n, c }); } return a; };
  const lowM = new THREE.MeshBasicMaterial({ color: 0x60b0ff }), hiM = new THREE.MeshBasicMaterial({ color: 0xa0f4ff });
  const inDots = water(inletCurve, 16, lowM, .07), hpDots = water(hpCurve, 30, hiM, .06), byDots = water(bypassCurve, 12, hiM, .06);
  // dirty slab
  const SX = 4.4, SZ = 1.2, slabTop = GY + .12;
  const slab = new THREE.Mesh(new THREE.BoxGeometry(3.6, .24, 3.0), Mat({ color: 0xd8d4cc, shininess: 20 })); slab.position.set(SX, GY, SZ); root.add(slab);
  const tiles = [];
  for (let i = 0; i < 12; i++) for (let j = 0; j < 10; j++) { const m = new THREE.MeshPhongMaterial({ color: 0x4a3a28, transparent: true, opacity: .92, shininess: 2 }); const tt = new THREE.Mesh(new THREE.PlaneGeometry(.3, .3), m); tt.rotation.x = -Math.PI / 2; tt.position.set(SX - 1.65 + i * .3, slabTop + .005, SZ - 1.35 + j * .3); root.add(tt); tiles.push({ tt, m, clean: 0 }); }

  const sc = (p, q, k) => [p.map((x, i) => q[i] + (x - q[i]) * k), q];
  const shots = [
    sc([6.3, 3.6, 9.6], [2.6, -1.5, 1.0], 1.5),      // 0 hook
    sc([-1.6, 1.8, 6.8], [-1.8, -.9, 0], 1.3),      // 1 pump in + motor
    sc([-1.0, 1.0, 4.2], [-1.9, -.9, 0], 1.5),      // 2 wobble plate
    sc([4.8, 1.4, 5.0], [2.2, -1.0, 1.0], 1.6),     // 3 nozzle jet
    sc([5.8, 2.2, 6.6], [3.4, -1.6, 1.2], 1.5),     // 4 tips
    sc([.5, 2.6, 6.8], [-1.0, -.5, .4], 1.35),      // 5 unloader
    sc([3.4, 4.6, 12.8], [1.2, -1.0, .6], 1.4),      // 6 recap
  ];
  const cp = { p: V(), q: V() };
  let A = 0, lastT = 0, w = 10;
  const nz = V(), nd = V(), tmp = V();
  function update(t, si, lt, sd) {
    const dt = Math.min(.05, Math.max(0, t - lastT)); lastT = t;
    const pulse = .5 + .5 * Math.sin(t * 7);
    const released = si === 5 && lt > 1.0;
    const spraying = !released && si !== 1 && si !== 2 || (si === 1 || si === 2);
    w = lerp(w, si === 2 ? 2.2 : 10, Math.min(1, dt * 3)); A += dt * w;
    wob.rotation.x = A; shaft.rotation.x = A;
    pistons.forEach(pp => { const off = Math.tan(TILT) * PR * Math.cos(A - pp.ph) * .9; pp.p.position.set(-1.65 + off, AX + pp.y, pp.z); });
    // highlights
    motorM.emissiveIntensity = si === 1 ? .3 + .25 * pulse : 0; hoseM.emissiveIntensity = si === 1 ? .3 + .25 * pulse : 0;
    shaftM.emissiveIntensity = si === 1 || si === 2 ? .4 + .3 * pulse : 0;
    plateM.emissiveIntensity = si === 2 ? .35 + .3 * pulse : 0; pistonM.emissiveIntensity = si === 2 ? .35 + .3 * pulse : 0;
    lanceM.emissiveIntensity = si === 3 ? .25 + .2 * pulse : 0; nozRing.material.opacity = si === 3 ? .9 : 0; nozRing.scale.setScalar(1 + .3 * pulse);
    bypM.emissiveIntensity = si === 5 && released ? .5 + .4 * pulse : 0; unl.material.emissiveIntensity = si === 5 ? .4 + .3 * pulse : 0;
    trigM.emissiveIntensity = si === 5 ? .4 + .4 * pulse : 0; trig.rotation.z = released ? .5 : 0;
    const cut = si === 1 || si === 2 || si === 5;
    bodyM.opacity = cut ? .15 : 1; bodyM.depthWrite = !cut; manM.opacity = cut ? .5 : 1;
    // tip selection
    let tipI = 1; if (si === 4) tipI = Math.min(3, Math.floor(lt / (sd / 4)));
    if (si === 3) tipI = 0;
    tipM.color.setHex(tipColors[tipI]); tipM.emissive.setHex(tipColors[tipI]); tipM.emissiveIntensity = si === 4 || si === 3 ? .4 + .2 * pulse : .1;
    const halfAng = [0.02, 15, 25, 40][tipI] / 2 * Math.PI / 180;
    // sweep wand around its pivot
    const sweep = si === 0 || si === 3 || si === 4 || si === 6 ? Math.sin(t * .9) * .28 : 0;
    wand.rotation.set(0, sweep, -.62);
    wand.updateMatrixWorld(true);
    nz.copy(wand.localToWorld(tmp.set(2.52, 0, 0))); nd.copy(wand.localToWorld(V(3.52, 0, 0))).sub(nz).normalize();
    const len = (nz.y - (slabTop + .01)) / -nd.y; const hit = nz.clone().addScaledVector(nd, len);
    const on = !released && !(si === 1 || si === 2) ? 1 : 0;
    jet.visible = on > 0; jetM.opacity = .55 + .2 * pulse;
    jet.position.copy(nz); jet.quaternion.setFromUnitVectors(V(0, -1, 0), nd);
    const rad = Math.max(.03, Math.tan(halfAng) * len); jet.scale.set(rad, len, rad);
    drops.forEach(d => { d.d.visible = on > 0; d.s = (d.s + dt * 1.8) % 1; const k = d.s; d.d.position.set(hit.x + d.v.x * k * (rad + .3), hit.y + d.v.y * k - 2 * k * k, hit.z + d.v.z * k * (rad + .3)); });
    // cleaning
    const cleanR = Math.max(.25, rad * .9), power = tipI === 0 ? 2.6 : tipI === 1 ? 2 : tipI === 2 ? 1.5 : 1;
    if (on) tiles.forEach(ti => { const dx = ti.tt.position.x - hit.x, dz = ti.tt.position.z - hit.z; if (dx * dx + dz * dz < cleanR * cleanR) ti.clean = Math.min(1, ti.clean + dt * power); ti.m.opacity = .92 * (1 - ti.clean); });
    // water dots
    const flowHP = !released;
    inDots.forEach(d => { d.s = (d.s + dt * .35) % 1; d.d.position.copy(d.c.getPointAt(d.s)); d.d.visible = si === 1 || si === 2 || si === 5; });
    hpDots.forEach(d => { d.s = (d.s + dt * (si === 2 ? .3 : .9)) % 1; d.d.position.copy(d.c.getPointAt(d.s)); d.d.visible = flowHP && (si === 2 || si === 3 || si === 1); });
    byDots.forEach(d => { d.s = (d.s + dt * .6) % 1; d.d.position.copy(d.c.getPointAt(d.s)); d.d.visible = released; });
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
