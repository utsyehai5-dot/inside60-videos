// Inside 60 — Smart lock. Steps: 0 hook (AA batteries inside lock), 1 deadbolt into frame, 2 motor + gears turn bolt,
// 3 phone -> bridge -> lock signal, 4 encrypted check on chip, 5 keypad/fingerprint + auto-lock, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x161b28); scene.fog = new THREE.Fog(0x161b28, 30, 80);
  scene.add(new THREE.HemisphereLight(0xfff8f0, 0x303040, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 1.0); key.position.set(5, 8, 10); scene.add(key);
  const key2 = new THREE.DirectionalLight(0xc0d8ff, .6); key2.position.set(-4, 3, -10); scene.add(key2);
  const root = new THREE.Group(); scene.add(root);

  // door + frame (door face normal = +z is the inside of the house)
  const DT = .45;
  const doorM = Mat({ color: 0x9a6a40, shininess: 30, transparent: true, opacity: 1 });
  const door = new THREE.Mesh(new THREE.BoxGeometry(3.2, 7, DT), doorM); door.position.set(-1.0, 0, 0); root.add(door);
  for (let j = -1; j <= 1; j += 2) { const pn = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.4, .04), Mat({ color: 0x8a5c36 })); pn.position.set(-1.1, j * 1.8, DT / 2 + .01); root.add(pn); const pn2 = pn.clone(); pn2.position.z = -DT / 2 - .01; root.add(pn2); }
  const frameM = Mat({ color: 0xf0ece4, shininess: 30, transparent: true, opacity: 1 });
  const frame = new THREE.Mesh(new THREE.BoxGeometry(.5, 7.2, DT + .5), frameM); frame.position.set(.87, 0, 0); root.add(frame);
  const wall = new THREE.Mesh(new THREE.BoxGeometry(3, 7.4, .3), Mat({ color: 0xb8c4d0, shininess: 10 })); wall.position.set(2.6, 0, -.05); root.add(wall);
  const strike = new THREE.Mesh(new THREE.BoxGeometry(.03, .5, .3), Mat({ color: 0xd8b860, shininess: 160 })); strike.position.set(.61, 0, 0); root.add(strike);
  // bolt
  const boltM = Mat({ color: 0xd0d6dc, emissive: 0x40e0ff, emissiveIntensity: 0, shininess: 180 });
  const bolt = new THREE.Mesh(new THREE.BoxGeometry(.9, .22, .22), boltM); root.add(bolt);
  // smart lock body on inside face (cutaway capable)
  const BZ = DT / 2 + .2;
  const bodyM = Mat({ color: 0x2c3038, transparent: true, opacity: 1, side: THREE.DoubleSide, shininess: 120 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(.8, 1.7, .4), bodyM); body.position.set(.05, -.05, BZ); root.add(body);
  const knobM = Mat({ color: 0xa0a8b0, transparent: true, opacity: 1, shininess: 160 });
  const knob = new THREE.Mesh(new THREE.BoxGeometry(.12, .5, .14), knobM); knob.position.set(.05, .15, BZ + .27); root.add(knob);
  // internals
  const motorM = Mat({ color: 0x3a7fe0, emissive: 0x40a0ff, emissiveIntensity: 0 });
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(.11, .11, .4, 20), motorM); motor.position.set(-.18, -.45, BZ); root.add(motor);
  const gearM = Mat({ color: 0xffc030, emissive: 0xffa010, emissiveIntensity: 0, shininess: 140 });
  const mkGear = (r, n) => { const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.CylinderGeometry(r, r, .05, 24).rotateX(Math.PI / 2), gearM)); for (let i = 0; i < n; i++) { const tt = new THREE.Mesh(new THREE.BoxGeometry(.045, .045, .05), gearM); const a = i / n * Math.PI * 2; tt.position.set(Math.cos(a) * (r + .015), Math.sin(a) * (r + .015), 0); tt.rotation.z = a; g.add(tt); } return g; };
  const gA = mkGear(.06, 8); gA.position.set(-.18, -.2, BZ); root.add(gA);
  const gB = mkGear(.15, 18); gB.position.set(.03, -.12, BZ); root.add(gB);
  const gC = mkGear(.22, 24); gC.position.set(.12, .2, BZ - .02); root.add(gC);
  const batM = Mat({ color: 0x40c060, emissive: 0x60ff80, emissiveIntensity: 0, shininess: 120 });
  const bats = [];
  for (let i = 0; i < 4; i++) { const b = new THREE.Group(); const c = new THREE.Mesh(new THREE.CylinderGeometry(.065, .065, .42, 16), batM); b.add(c); const tp = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .04, 10), Mat({ color: 0xd0d0d0 })); tp.position.y = .23; b.add(tp); b.position.set(-.25 + i * .14, -.42 + (i > 1 ? 0 : 0), BZ - .1); b.position.y = .55; root.add(b); bats.push(b); }
  const pcbM = Mat({ color: 0x1f7a45, emissive: 0x20ff80, emissiveIntensity: 0 });
  const pcb = new THREE.Mesh(new THREE.BoxGeometry(.6, .32, .03), pcbM); pcb.position.set(.05, -.72, BZ - .12); root.add(pcb);
  const chipM = Mat({ color: 0x202428, emissive: 0x40ffa0, emissiveIntensity: 0 });
  const chip = new THREE.Mesh(new THREE.BoxGeometry(.16, .16, .04), chipM); chip.position.set(.05, -.72, BZ - .09); root.add(chip);
  const checkRingM = new THREE.MeshBasicMaterial({ color: 0x40ff90, transparent: true, opacity: 0 });
  const checkRing = new THREE.Mesh(new THREE.TorusGeometry(.2, .02, 8, 32), checkRingM); checkRing.position.set(.05, -.72, BZ + .05); root.add(checkRing);
  // outside keypad (on -z face)
  const kpZ = -DT / 2 - .06;
  const kp = new THREE.Mesh(new THREE.BoxGeometry(.7, 1.6, .1), Mat({ color: 0x23272e, shininess: 120 })); kp.position.set(.05, -.05, kpZ); root.add(kp);
  const keys = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { const m = Mat({ color: 0x404650, emissive: 0x40c0ff, emissiveIntensity: 0 }); const k = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .03, 16).rotateX(Math.PI / 2), m); k.position.set(.05 + (c - 1) * .18, .45 - r * .18, kpZ - .06); root.add(k); keys.push(m); }
  const fpM = new THREE.MeshBasicMaterial({ color: 0x40c0ff, transparent: true, opacity: .3 });
  const fps = [.04, .07, .1, .13].map(r => { const a = new THREE.Mesh(new THREE.TorusGeometry(r, .008, 6, 32, Math.PI * 1.4), fpM); a.rotation.set(0, Math.PI, -Math.PI * .2); a.position.set(.05, -.45, kpZ - .06); root.add(a); return a; });
  const timerM = new THREE.MeshBasicMaterial({ color: 0xffc040 });
  let timer = new THREE.Mesh(new THREE.RingGeometry(.2, .26, 40, 1, 0, .01), timerM); timer.position.set(.05, .55, BZ + .28); root.add(timer);
  // phone + bridge + signal
  const phone = new THREE.Group(); root.add(phone); phone.position.set(1.7, -.2, 2.2); phone.rotation.y = -.5;
  phone.add(new THREE.Mesh(new THREE.BoxGeometry(.7, 1.4, .08), Mat({ color: 0x1a1d22, shininess: 160 })));
  const scrM = Mat({ color: 0x2060c0, emissive: 0x3080ff, emissiveIntensity: .4 });
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(.6, 1.25), scrM); scr.position.z = .045; phone.add(scr);
  const appBtnM = Mat({ color: 0xffffff, emissive: 0x80ffb0, emissiveIntensity: 0 });
  const appBtn = new THREE.Mesh(new THREE.CircleGeometry(.16, 32), appBtnM); appBtn.position.set(0, -.2, .05); phone.add(appBtn);
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(.35, .5, .2), Mat({ color: 0xf2f2f2, emissive: 0x40c0ff, emissiveIntensity: 0 })); bridge.position.set(2.0, 1.3, .25); root.add(bridge);
  const packets = [];
  for (let i = 0; i < 10; i++) { const m = new THREE.MeshBasicMaterial({ color: 0x60e0ff }); const p = new THREE.Mesh(new THREE.BoxGeometry(.09, .09, .09), m); root.add(p); packets.push({ p, m, s: i / 10 }); }
  const routeA = new THREE.CatmullRomCurve3([V(1.7, .4, 2.2), V(2.2, 1.0, 1.4), V(2.0, 1.3, .4)]);
  const routeB = new THREE.CatmullRomCurve3([V(2.0, 1.3, .4), V(1.1, .9, .9), V(.1, .1, BZ + .3)]);

  const sc = (p, q, k) => [p.map((x, i) => q[i] + (x - q[i]) * k), q];
  const shots = [
    sc([1.3, .5, 3.4], [.05, -.1, BZ], 1.55),       // 0 hook: lock cutaway
    sc([1.9, 2.0, 2.4], [.5, 0, 0], 1.45),          // 1 bolt into frame from above-edge
    sc([.7, .2, 2.4], [.05, -.15, BZ], 1.45),       // 2 motor + gears
    sc([3.2, .9, 6.2], [1.1, .3, 1.0], 1.3),        // 3 phone -> bridge -> lock
    sc([.9, -.3, 2.6], [.05, -.4, BZ], 1.5),       // 4 chip check
    sc([-1.2, .2, -3.2], [.05, -.05, kpZ], 1.5),   // 5 keypad outside
    sc([2.6, 1.4, 5.6], [.4, 0, .2], 1.1),         // 6 recap
  ];
  const cp = { p: V(), q: V() };
  let lastT = 0, prevL = 0;
  function update(t, si, lt, sd) {
    const dt = Math.min(.05, Math.max(0, t - lastT)); lastT = t;
    const pulse = .5 + .5 * Math.sin(t * 7);
    const f = Math.min(1, lt / Math.max(.1, sd));
    let L = 1, checked = false, keyIdx = -1, fpOn = false, sending = 0;
    if (si === 0) L = ease((f - .15) / .45);
    else if (si === 1 || si === 2) L = f < .45 ? 1 - ease(f / .35) : ease((f - .5) / .35);
    else if (si === 3) { sending = f > .15 && f < .8 ? 1 : 0; L = 1 - ease((f - .7) / .25); }
    else if (si === 4) { sending = f < .45 ? 1 : 0; checked = f > .45; L = ease((f - .55) / .3); }
    else if (si === 5) { keyIdx = f < .4 ? Math.floor(f / .1) : -1; fpOn = f > .25 && f < .45; L = f < .45 ? 1 : f < .55 ? 1 - ease((f - .45) / .08) : f < .85 ? 0 : ease((f - .85) / .12); }
    else L = 1;
    const moving = Math.abs(L - prevL) > .0005; prevL = L;
    bolt.position.set(lerp(.14, .62, L), 0, 0);
    gC.rotation.z = -L * Math.PI / 2; gB.rotation.z = L * Math.PI / 2 * (.22 / .15); gA.rotation.z = -L * Math.PI / 2 * (.22 / .06);
    knob.rotation.z = -L * Math.PI / 2;
    // highlights
    const cut = si === 0 || si === 1 || si === 2 || si === 4;
    bodyM.opacity = cut ? .18 : 1; bodyM.depthWrite = !cut; knobM.opacity = cut ? .35 : 1;
    batM.emissiveIntensity = si === 0 ? .35 + .3 * pulse : 0;
    motorM.emissiveIntensity = si === 2 || (moving && cut) ? .35 + .3 * pulse : 0;
    gearM.emissiveIntensity = si === 2 ? .3 + .3 * pulse : 0;
    boltM.emissiveIntensity = si === 1 ? .35 + .3 * pulse : 0;
    strike.material.emissive = strike.material.emissive || new THREE.Color();
    pcbM.emissiveIntensity = si === 4 ? .1 + .1 * pulse : 0;
    chipM.emissiveIntensity = si === 4 ? (checked ? .9 : .3 + .3 * pulse) : 0;
    checkRingM.opacity = si === 4 && checked ? .9 : 0; checkRing.scale.setScalar(1 + (checked ? .25 * pulse : 0));
    // phone + packets
    phone.visible = si === 3 || si === 4;
    appBtnM.emissiveIntensity = (si === 3 && f > .1) ? .6 + .4 * pulse : .1;
    bridge.material.emissiveIntensity = si === 3 ? .3 + .3 * pulse : 0;
    packets.forEach((pk, i) => {
      pk.p.visible = sending > 0;
      pk.s = (pk.s + dt * .5) % 1;
      const pos = pk.s < .5 ? routeA.getPointAt(pk.s * 2) : routeB.getPointAt((pk.s - .5) * 2);
      pk.p.position.copy(pos); pk.p.rotation.set(t * 3 + i, t * 2, 0);
      const scr = Math.floor(t * 6 + i) % 3; pk.m.color.setHex([0x60e0ff, 0xff60c0, 0xb080ff][scr]);
    });
    // keypad / fingerprint / auto-lock timer
    keys.forEach((m, i) => { m.emissiveIntensity = si === 5 && [1, 5, 9, 4][keyIdx] === i ? 1 : (si === 5 ? .1 : 0); });
    fpM.opacity = fpOn ? .6 + .4 * pulse : .3;
    const showTimer = si === 5 && f > .55 && f < .87;
    timer.visible = showTimer;
    if (showTimer) { timer.geometry.dispose(); timer.geometry = new THREE.RingGeometry(.2, .26, 40, 1, Math.PI / 2, Math.max(.01, (f - .55) / .3 * Math.PI * 2)); }
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
