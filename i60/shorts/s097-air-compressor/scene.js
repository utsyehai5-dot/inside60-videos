// Inside 60 — Air compressor. Steps: 0 hook (whole compressor running), 1 motor + crankshaft, 2 intake stroke,
// 3 compression + check valve, 4 tank filling, 5 pressure switch stops motor, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x171c29); scene.fog = new THREE.Fog(0x171c29, 30, 80);
  scene.add(new THREE.HemisphereLight(0xfff8f0, 0x303040, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(5, 9, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0x80c0ff, .5); rim.position.set(-6, 4, -8); scene.add(rim);
  const root = new THREE.Group(); scene.add(root); root.position.y = -.3;
  const floor = new THREE.Mesh(new THREE.CircleGeometry(16, 48), Mat({ color: 0x2b333f, shininess: 5 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -3.3; root.add(floor);

  // tank: horizontal cylinder
  const tankM = Mat({ color: 0xe05a28, transparent: true, opacity: 1, side: THREE.DoubleSide, shininess: 120 });
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 4.4, 40, 1, true).rotateZ(Math.PI / 2), tankM); tank.position.set(0, -1.9, 0); root.add(tank);
  const capGeo = new THREE.SphereGeometry(1.25, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const capL = new THREE.Mesh(capGeo.clone().rotateZ(Math.PI / 2), tankM); capL.scale.set(.45, 1, 1); capL.position.set(-2.2, -1.9, 0); root.add(capL);
  const capR = new THREE.Mesh(capGeo.clone().rotateZ(-Math.PI / 2), tankM); capR.scale.set(.45, 1, 1); capR.position.set(2.2, -1.9, 0); root.add(capR);
  [-1.6, 1.6].forEach(x => { const f = new THREE.Mesh(new THREE.BoxGeometry(.3, .5, 1.8), Mat({ color: 0x303840 })); f.position.set(x, -3.1, 0); root.add(f); });
  // air inside tank
  const airTM = new THREE.MeshBasicMaterial({ color: 0x70d0ff });
  const tankDots = [];
  for (let i = 0; i < 110; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 6), airTM); const a = Math.random() * 6.28, r = Math.sqrt(Math.random()) * 1.1; d.position.set((Math.random() - .5) * 4.6, -1.9 + Math.cos(a) * r, Math.sin(a) * r); d.userData.b = d.position.clone(); d.userData.ph = Math.random() * 6; d.visible = false; root.add(d); tankDots.push(d); }

  // pump: crankcase + cylinder + head (front cutaway: transparent cylinder)
  const PY = .1; // crank center
  const crankcase = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.1, 1.2), Mat({ color: 0x404a56, transparent: true, opacity: 1 })); crankcase.position.set(0, PY, 0); root.add(crankcase);
  const cylM = Mat({ color: 0xa8c8e0, transparent: true, opacity: .22, side: THREE.DoubleSide, depthWrite: false, shininess: 150 });
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(.52, .52, 1.8, 32, 1, true), cylM); cyl.position.set(0, PY + 1.65, 0); root.add(cyl);
  for (let k = 0; k < 6; k++) { const fin = new THREE.Mesh(new THREE.TorusGeometry(.6, .035, 6, 32), Mat({ color: 0x7d8a98, transparent: true, opacity: .5 })); fin.rotation.x = Math.PI / 2; fin.position.set(0, PY + 1.0 + k * .26, 0); root.add(fin); }
  const headY = PY + 2.6;
  const head = new THREE.Mesh(new THREE.BoxGeometry(1.4, .35, 1.1), Mat({ color: 0x5a6672 })); head.position.set(0, headY + .17, 0); root.add(head);
  // crank, rod, piston
  const crank = new THREE.Group(); crank.position.set(0, PY, .2); root.add(crank);
  const web = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, .12, 24).rotateX(Math.PI / 2), Mat({ color: 0xc0c8d0, emissive: 0x40c0ff, emissiveIntensity: 0 })); crank.add(web);
  const pinOff = .38;
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, .3, 12).rotateX(Math.PI / 2), Mat({ color: 0xffd040 })); pin.position.set(0, pinOff, .05); crank.add(pin);
  const shaftM = Mat({ color: 0xd0d8e0, emissive: 0x40c0ff, emissiveIntensity: 0 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, 2.6, 12).rotateX(Math.PI / 2), shaftM); shaft.position.z = -1.1; crank.add(shaft);
  const rodM = Mat({ color: 0xd8dde3, emissive: 0x40c0ff, emissiveIntensity: 0 });
  const rod = new THREE.Mesh(new THREE.BoxGeometry(.16, 1, .12), rodM); root.add(rod);
  const pistonM = Mat({ color: 0xb8c2cc, emissive: 0xffb040, emissiveIntensity: 0, shininess: 160 });
  const piston = new THREE.Mesh(new THREE.CylinderGeometry(.48, .48, .4, 32), pistonM); root.add(piston);
  const L = 1.55;
  // motor along -z behind crank
  const motorM = Mat({ color: 0x2c7be0, emissive: 0x40a0ff, emissiveIntensity: 0, shininess: 120 });
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, 1.3, 32).rotateX(Math.PI / 2), motorM); motor.position.set(0, PY, -1.5); root.add(motor);
  for (let k = 0; k < 10; k++) { const r = new THREE.Mesh(new THREE.BoxGeometry(.05, .05, 1.2), Mat({ color: 0x1a5ab0 })); const a = k / 10 * Math.PI * 2; r.position.set(Math.cos(a) * .61, PY + Math.sin(a) * .61, -1.5); root.add(r); }
  const fanM = Mat({ color: 0x20262e });
  const fan = new THREE.Group(); fan.position.set(0, PY, .75); root.add(fan);
  for (let k = 0; k < 5; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.12, .7, .04), fanM); b.geometry.translate(0, .35, 0); b.rotation.z = k / 5 * Math.PI * 2; b.rotation.y = .4; fan.add(b); }

  // valves in head: intake (left) flap, outlet check valve (right) ball
  const vInM = Mat({ color: 0x40e0ff, emissive: 0x40e0ff, emissiveIntensity: 0 });
  const vIn = new THREE.Mesh(new THREE.BoxGeometry(.34, .05, .34), vInM); vIn.geometry.translate(.17, 0, 0); vIn.position.set(-.45, headY + .02, .2); root.add(vIn);
  const vOutM = Mat({ color: 0xff9030, emissive: 0xff9030, emissiveIntensity: 0 });
  const vOut = new THREE.Mesh(new THREE.SphereGeometry(.12, 16, 12), vOutM); vOut.position.set(.3, headY + .25, .2); root.add(vOut);
  const filter = new THREE.Mesh(new THREE.CylinderGeometry(.28, .28, .3, 24).rotateZ(Math.PI / 2), Mat({ color: 0x30363e })); filter.position.set(-1.0, headY + .2, .2); root.add(filter);
  // discharge tube to tank
  const tubePath = new THREE.CatmullRomCurve3([V(.3, headY + .3, .2), V(.9, headY + .45, .2), V(1.5, headY, .2), V(1.6, PY, .2), V(1.6, -.5, .2)]);
  const tubeM = Mat({ color: 0xc89040, emissive: 0xff8020, emissiveIntensity: 0, shininess: 160 });
  root.add(new THREE.Mesh(new THREE.TubeGeometry(tubePath, 60, .08, 10), tubeM));
  // air dots
  const inM = new THREE.MeshBasicMaterial({ color: 0x80e0ff });
  const inPath = new THREE.CatmullRomCurve3([V(-2.4, headY + .5, .2), V(-1.4, headY + .25, .2), V(-.6, headY + .15, .2), V(-.2, headY - .3, .2)]);
  const inDots = []; for (let k = 0; k < 16; k++) { const d = new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 6), inM); root.add(d); inDots.push({ d, s: k / 16 }); }
  const cDots = []; for (let k = 0; k < 26; k++) { const m = new THREE.MeshBasicMaterial({ color: 0x80e0ff }); const d = new THREE.Mesh(new THREE.SphereGeometry(.065, 8, 6), m); root.add(d); const a = Math.random() * 6.28, r = Math.sqrt(Math.random()) * .4; cDots.push({ d, m, x: Math.cos(a) * r, z: Math.sin(a) * r, f: Math.random(), ph: Math.random() * 6 }); }
  const outM = new THREE.MeshBasicMaterial({ color: 0xffa050 });
  const outDots = []; for (let k = 0; k < 14; k++) { const d = new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 6), outM); root.add(d); outDots.push({ d, s: k / 14 }); }
  // gauge + pressure switch on tank
  const gauge = new THREE.Group(); gauge.position.set(-1.2, -.35, .55); root.add(gauge);
  gauge.add(new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .4, 10), Mat({ color: 0xb08a40 })).translateY(-.2));
  const face = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, .12, 32).rotateX(Math.PI / 2), Mat({ color: 0x2a2f36 })); gauge.add(face);
  const dial = new THREE.Mesh(new THREE.CircleGeometry(.36, 32), new THREE.MeshBasicMaterial({ color: 0xf4f4f4 })); dial.position.z = .065; gauge.add(dial);
  const red = new THREE.Mesh(new THREE.RingGeometry(.28, .34, 24, 1, -.6, .5), new THREE.MeshBasicMaterial({ color: 0xff3030 })); red.position.z = .07; gauge.add(red);
  const needle = new THREE.Mesh(new THREE.BoxGeometry(.03, .3, .01), new THREE.MeshBasicMaterial({ color: 0x101010 })); needle.geometry.translate(0, .15, 0); needle.position.z = .08; gauge.add(needle);
  const sw = new THREE.Group(); sw.position.set(-1.0, -.1, -.3); root.add(sw);
  const swM = Mat({ color: 0x3a4450, emissive: 0xffe040, emissiveIntensity: 0 });
  sw.add(new THREE.Mesh(new THREE.BoxGeometry(.7, .55, .5), swM));
  const lever = new THREE.Mesh(new THREE.BoxGeometry(.1, .4, .1), Mat({ color: 0xffd040 })); lever.geometry.translate(0, .2, 0); lever.position.set(0, .27, 0); sw.add(lever);
  const lampM = new THREE.MeshBasicMaterial({ color: 0x40ff60 });
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(.09, 12, 8), lampM); lamp.position.set(.2, 0, .26); sw.add(lamp);
  const wire = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(-1.3, -.1, -.3), V(-1.3, .1, -1.0), V(-.6, PY, -1.6)]), 30, .03, 6), Mat({ color: 0x202020 })); root.add(wire);

  const sc = (p, q, k) => [p.map((x, i) => q[i] + (x - q[i]) * k), q];
  const shots = [
    sc([3.6, 2.4, 9.8], [0, .1, 0], 1.45),        // 0 hook
    sc([-4.0, 1.6, 3.6], [0, .2, -.8], 1.6),       // 1 motor + crank
    sc([-.6, 3.6, 4.6], [-.3, 2.1, 0], 1.55),      // 2 intake
    sc([1.6, 3.2, 4.6], [.5, 2.1, 0], 1.55),       // 3 squeeze + check valve
    sc([2.0, .9, 7.6], [.3, -1.4, 0], 1.45),       // 4 tank
    sc([-3.0, 1.2, 4.2], [-1.1, -.4, 0], 1.6),     // 5 switch + gauge
    sc([3.6, 2.4, 9.8], [0, .1, 0], 1.45),        // 6 recap
  ];
  const cp = { p: V(), q: V() };
  let A = 0, lastT = 0, fill = .15, w = 9;
  function update(t, si, lt, sd) {
    const dt = Math.min(.05, Math.max(0, t - lastT)); lastT = t;
    const pulse = .5 + .5 * Math.sin(t * 7);
    // motor speed: slow for explaining strokes, stops at the switch
    let target = si === 2 || si === 3 ? 2.6 : 9;
    if (si === 5) target = lt < sd * .55 ? 9 : 0;
    w = lerp(w, target, Math.min(1, dt * 3)); A += dt * w;
    crank.rotation.z = -A; fan.rotation.z = -A;
    const th = -A + Math.PI / 2;
    const px = Math.cos(th) * pinOff, py = Math.sin(th) * pinOff;
    const pinW = V(px, PY + py, .2);
    const pistY = PY + py + Math.sqrt(L * L - px * px);
    piston.position.set(0, pistY, .0);
    rod.position.set(px / 2, (pinW.y + pistY) / 2, .2); rod.scale.y = Math.hypot(px, pistY - pinW.y); rod.rotation.z = Math.atan2(px, pistY - pinW.y);
    const vy = Math.cos(th) * -w; // sign of piston velocity ~ dy/dt
    const goingDown = Math.sin(A) > 0 ? false : true;
    const dyn = Math.cos(-A) ; // piston up when crank pin top
    const rising = Math.sin(A) < 0 ? true : false;
    const top = PY + pinOff + L, bot = PY - pinOff + Math.sqrt(L * L) - .0;
    const comp = (pistY - (PY - pinOff + L)) / (2 * pinOff); // 0 at bottom, 1 at top
    const up = Math.sin(A) > 0; // pin moving left->right over top: piston moving down when sin>0? decide via derivative
    const dPist = -Math.cos(th) * 0 + (Math.cos(th) * -1) * 0;
    // numerical direction
    const prevY = piston.userData.y ?? pistY; const vel = pistY - prevY; piston.userData.y = pistY;
    const intake = vel < -1e-4, squeeze = vel > 1e-4;
    vIn.rotation.z = intake && w > .5 ? -.6 : 0;
    vOut.position.y = headY + .25 + (squeeze && comp > .6 && w > .5 ? .12 : 0);
    // highlights
    motorM.emissiveIntensity = si === 1 ? .3 + .25 * pulse : 0; shaftM.emissiveIntensity = si === 1 ? .5 + .3 * pulse : 0;
    rodM.emissiveIntensity = si === 1 ? .35 + .25 * pulse : 0; web.material.emissiveIntensity = si === 1 ? .4 + .3 * pulse : 0;
    vInM.emissiveIntensity = si === 2 ? .5 + .4 * pulse : .1; vOutM.emissiveIntensity = si === 3 ? .5 + .4 * pulse : .1;
    pistonM.emissiveIntensity = si === 3 ? comp * .5 : 0;
    tubeM.emissiveIntensity = si === 3 ? .3 + .2 * pulse : 0;
    swM.emissiveIntensity = si === 5 ? .3 + .3 * pulse : 0;
    crankcase.material.opacity = si === 1 ? .25 : 1;
    // air in cylinder
    const flowing = w > .5;
    cDots.forEach(c => {
      const span = Math.max(.08, headY - (pistY + .2) - .08);
      c.d.position.set(c.x + Math.sin(t * 3 + c.ph) * .02, pistY + .24 + c.f * span, c.z + .0);
      const heat = Math.min(1, Math.max(0, (comp - .3) / .7));
      c.m.color.setRGB(lerp(.5, 1, heat), lerp(.88, .55, heat), lerp(1, .2, heat));
    });
    inDots.forEach(d => { d.s = (d.s + dt * .5 * w / 9 * (intake ? 2 : .2)) % 1; d.d.position.copy(inPath.getPointAt(d.s)); d.d.visible = flowing && (si === 0 || si === 2 || si === 6 || si === 4); });
    outDots.forEach(d => { d.s = (d.s + dt * .5 * w / 9 * (squeeze ? 2 : .2)) % 1; d.d.position.copy(tubePath.getPointAt(d.s)); d.d.visible = flowing && si !== 1 && si !== 2; });
    // tank fill
    if (si === 4) fill = .15 + .75 * ease(lt / sd);
    if (si >= 5) fill = Math.max(fill, .9 + (si === 5 ? .1 * ease(lt / (sd * .55)) : .1));
    if (si === 0) fill = .4;
    tankM.opacity = si === 4 || si === 5 ? .25 : 1; tankM.depthWrite = !(si === 4 || si === 5);
    tankDots.forEach((d, i) => { d.visible = (si === 4 || si === 5) && i / tankDots.length < fill; const b = d.userData.b; d.position.set(b.x + Math.sin(t * 2 + d.userData.ph) * .05, b.y + Math.cos(t * 2.3 + d.userData.ph) * .05, b.z); });
    airTM.color.setHex(si === 4 && pulse > .5 ? 0x90e8ff : 0x70d0ff);
    needle.rotation.z = 2.2 - fill * 3.2;
    const off = si === 5 && lt > sd * .55;
    lever.rotation.z = off ? -.7 : .2; lampM.color.setHex(off ? 0xff3030 : 0x40ff60);
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
