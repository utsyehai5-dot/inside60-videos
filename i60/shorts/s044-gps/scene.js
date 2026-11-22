// Inside 60 — GPS. Steps: 0 hook (10 km drift), 1 satellites in orbit, 2 atomic clocks broadcast time, 3 signal delay -> distance, 4 four satellites meet at one point, 5 relativity correction, 6 recap
export async function setup({ THREE, scene, camera }) {
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const ss = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x555555, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x070d1e);
  scene.add(new THREE.HemisphereLight(0xe8f0ff, 0x303040, 1.2));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(6, 6, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0x80b0ff, .9); rim.position.set(-8, -2, -6); scene.add(rim);

  // stars
  const sg = new THREE.BufferGeometry(); const sp = [];
  for (let i = 0; i < 700; i++) { const v = V(Math.random() - .5, Math.random() - .5, Math.random() - .5).normalize().multiplyScalar(60 + Math.random() * 20); sp.push(v.x, v.y, v.z); }
  sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: .25 })));

  // earth with procedural texture
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 512; const g = cv.getContext('2d');
  g.fillStyle = '#1f62c8'; g.fillRect(0, 0, 1024, 512);
  const rnd = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(7);
  g.fillStyle = '#3fae5a';
  for (let c = 0; c < 9; c++) { const cx = rnd() * 1024, cy = 110 + rnd() * 290; for (let k = 0; k < 26; k++) { g.beginPath(); g.ellipse(cx + (rnd() - .5) * 170, cy + (rnd() - .5) * 110, 20 + rnd() * 50, 14 + rnd() * 34, rnd() * 3, 0, 7); g.fill(); } }
  g.fillStyle = '#eef4ff'; g.fillRect(0, 0, 1024, 34); g.fillRect(0, 478, 1024, 34);
  const tex = new THREE.CanvasTexture(cv);
  const ER = 3;
  const earth = new THREE.Mesh(new THREE.SphereGeometry(ER, 64, 40), Mat({ map: tex, shininess: 25 })); scene.add(earth);
  const atm = new THREE.Mesh(new THREE.SphereGeometry(ER * 1.04, 48, 32), new THREE.MeshBasicMaterial({ color: 0x60b0ff, transparent: true, opacity: .15, side: THREE.BackSide })); scene.add(atm);

  // you (pin) on the surface
  const youDir = V(.25, .55, .8).normalize(); const you = youDir.clone().multiplyScalar(ER);
  const pinM = Mat({ color: 0xff3a5a, emissive: 0xff2040, emissiveIntensity: .4 });
  const pin = new THREE.Group(); pin.position.copy(you); pin.quaternion.setFromUnitVectors(V(0, 1, 0), youDir); scene.add(pin);
  const ph = new THREE.Mesh(new THREE.SphereGeometry(.22, 20, 14), pinM); ph.position.y = .55; pin.add(ph);
  const pc = new THREE.Mesh(new THREE.ConeGeometry(.16, .45, 16), pinM); pc.rotation.x = Math.PI; pc.position.y = .25; pin.add(pc);
  const ringM = new THREE.MeshBasicMaterial({ color: 0xffe040, transparent: true, opacity: 0, side: THREE.DoubleSide });
  const yRing = new THREE.Mesh(new THREE.RingGeometry(.3, .42, 40), ringM); yRing.rotation.x = -Math.PI / 2; yRing.position.y = .03; pin.add(yRing);

  // orbits + satellites
  const OR = 7.5;
  const sats = [];
  const tilts = [[.35, 0], [-.45, 1.2], [.9, 2.3], [-1.0, 3.6]];
  const satBody = Mat({ color: 0xe8c25a, shininess: 120 });
  const panelM = Mat({ color: 0x2a4fb0, emissive: 0x1030a0, emissiveIntensity: .3, shininess: 140 });
  tilts.forEach(([tx, ry], i) => {
    const plane = new THREE.Group(); plane.rotation.set(tx, ry, 0); scene.add(plane);
    const orb = new THREE.Mesh(new THREE.TorusGeometry(OR, .02, 6, 160), new THREE.MeshBasicMaterial({ color: 0x6aa8ff, transparent: true, opacity: .35 })); orb.rotation.x = Math.PI / 2; plane.add(orb);
    const s = new THREE.Group(); plane.add(s);
    s.add(new THREE.Mesh(new RoundedBoxGeometry(.55, .55, .7, 2, .06), satBody));
    [-1, 1].forEach(d => { const p = new THREE.Mesh(new THREE.BoxGeometry(1.2, .04, .5), panelM); p.position.x = d * .95; s.add(p); });
    const clkM = new THREE.MeshPhongMaterial({ color: 0x103018, emissive: 0x40ff90, emissiveIntensity: .2 });
    const clk = new THREE.Mesh(new THREE.SphereGeometry(.14, 12, 8), clkM); clk.position.set(0, .34, 0); s.add(clk);
    // signal shell
    const wm = new THREE.MeshBasicMaterial({ color: [0x60e0ff, 0xffb040, 0x90ff70, 0xff70d0][i], transparent: true, opacity: 0, depthWrite: false, wireframe: true });
    const w = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), wm); scene.add(w);
    // distance line
    const lm = new THREE.LineBasicMaterial({ color: [0x60e0ff, 0xffb040, 0x90ff70, 0xff70d0][i], transparent: true, opacity: 0 });
    const lg = new THREE.BufferGeometry().setFromPoints([V(), V()]); const line = new THREE.Line(lg, lm); scene.add(line);
    sats.push({ plane, s, clkM, w, wm, line, lg, lm, ph: i * 1.6 + .3 });
  });
  // place satellites near "above" the pin for steps 3-5 by choosing phase
  const tmp = V();
  // relativity clock (big) for step 5
  const bigClock = new THREE.Group(); bigClock.position.set(0, 0, 0); scene.add(bigClock);
  const face = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, .18, 48), Mat({ color: 0xf4f6fb })); face.rotation.x = Math.PI / 2; bigClock.add(face);
  const rimC = new THREE.Mesh(new THREE.TorusGeometry(1.12, .1, 12, 48), Mat({ color: 0xe8c25a })); bigClock.add(rimC);
  const handM = Mat({ color: 0x202430 });
  const hand = new THREE.Mesh(new THREE.BoxGeometry(.07, .9, .05), handM); hand.geometry.translate(0, .42, 0); hand.position.z = .12; bigClock.add(hand);
  const hand2M = Mat({ color: 0xff3a5a, emissive: 0xff2040, emissiveIntensity: .5 });
  const hand2 = new THREE.Mesh(new THREE.BoxGeometry(.05, .95, .04), hand2M); hand2.geometry.translate(0, .45, 0); hand2.position.z = .15; bigClock.add(hand2);
  for (let i = 0; i < 12; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(.06, .18, .04), handM); const a = i / 12 * Math.PI * 2; m.position.set(Math.sin(a) * .9, Math.cos(a) * .9, .1); m.rotation.z = -a; bigClock.add(m); }
  bigClock.scale.setScalar(0.001);

  const shots = [
    [[0, 5, 22], [0, 0, 0]],
    [[14, 9, 14], [0, 0, 0]],
    [[0, 4, 12], [0, 3, 0]],
    [[7, 6, 11], [you.x, you.y + 1.5, you.z]],
    [[2, 10, 18], [you.x * .6, you.y * .6 + 1, you.z * .6]],
    [[0, 6, 13], [0, 4.5, 2]],
    [[-6, 5, 21], [0, 0, 0]],
  ];
  const cp = { p: V(), q: V() };
  function satPos(o, t, spd) { o.s.position.set(Math.cos(t * spd + o.ph) * OR, 0, Math.sin(t * spd + o.ph) * OR); o.s.rotation.y = -(t * spd + o.ph); o.s.updateMatrixWorld(true); return o.s.getWorldPosition(tmp).clone(); }
  // phases chosen so that at step 3-5 satellites are spread above the pin
  const aboveTargets = [V(-3, 7, 4), V(4, 6.5, 3.5), V(0, 4, 7), V(3.5, 3, 6.5)].map(v => v.normalize().multiplyScalar(OR));
  function update(t, si, lt) {
    const pulse = .5 + .5 * Math.sin(t * 6);
    earth.rotation.y = si >= 3 && si <= 5 ? 0 : 0;
    // satellites: orbit freely in 0-2, 6; in 3-5 hover over "above" points (with gentle drift)
    sats.forEach((o, i) => {
      let p;
      if (si <= 2) p = satPos(o, t, .12);
      else { o.plane.updateMatrixWorld(true); const target = aboveTargets[i].clone().applyAxisAngle(V(0, 1, 0), Math.sin(t * .2) * .05); const local = o.plane.worldToLocal(target.clone()); o.s.position.lerp(local, si === 3 ? ss(0, 1.2, lt) : 1); o.s.lookAt(o.plane.worldToLocal(V(0, 0, 0))); p = o.s.getWorldPosition(V()); }
      o.clkM.emissiveIntensity = (si === 2 || si === 5) ? .4 + .6 * ((Math.floor(t * 4 + i) % 2)) : .25;
      // broadcast shells
      const bOn = si === 2 || si === 0;
      const u = (t * .5 + i * .25) % 1;
      if (bOn) { o.w.position.copy(p); o.w.scale.setScalar(.5 + u * 5); o.wm.opacity = .35 * (1 - u); }
      // distance spheres meeting at the pin
      else if (si === 4) { const d = p.distanceTo(you); const k = ss(0, 2.2, lt - i * .35); o.w.position.copy(p); o.w.scale.setScalar(Math.max(.01, d * k)); o.wm.opacity = .22 * ss(0, .4, k); }
      else o.wm.opacity = 0;
      // lines
      const lOn = si === 3 ? (i === 0 ? 1 : ss(1.2, 2.2, lt)) : si === 4 ? 1 : 0;
      const k3 = si === 3 ? ss(.3, 1.6, (lt * .6) % 1.6) : 1;
      o.lg.setFromPoints([p, p.clone().lerp(you, si === 3 ? k3 : 1)]); o.lm.opacity = lOn * .95;
    });
    ringM.opacity = si === 4 ? ss(2.6, 3.2, lt) * (.5 + .5 * pulse) : si === 6 ? .5 : 0;
    yRing.scale.setScalar(1 + (si === 4 ? .5 * pulse : 0));
    pinM.emissiveIntensity = si >= 3 ? .4 + .5 * pulse : .3;
    pin.scale.setScalar(si === 0 ? 1.6 : (si >= 3 && si <= 4 ? 1.4 : 1.2));
    // relativity clock
    const cOn = si === 5 ? ss(0, .8, lt) : 0;
    bigClock.scale.setScalar(Math.max(.001, cOn * 1.4)); bigClock.position.set(0, 4.6, 2.5); bigClock.lookAt(camera.position);
    hand.rotation.z = -t * .6; hand2.rotation.z = -t * .6 - (si === 5 ? .5 * (1 - ss(2.5, 3.5, lt)) : 0);
    hand2M.emissive.setHex(si === 5 && lt > 3.5 ? 0x40ff90 : 0xff2040); hand2M.color.setHex(si === 5 && lt > 3.5 ? 0x30d070 : 0xff3a5a);
    earth.rotation.y = t * .03;
    // step 2: follow satellite 0 closely
    { const sp = sats[0].s.getWorldPosition(V()); const out = sp.clone().normalize(); const cam = sp.clone().add(out.multiplyScalar(4.5)).add(V(1.5, 1.2, 1.5)); shots[2] = [[cam.x, cam.y, cam.z], [sp.x, sp.y - .6, sp.z]]; }
    // camera
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const k = si === 0 ? 1 : ease(lt / 1.4);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], k))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], k)));
    const o = Math.sin(t * .2) * .1, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o));
    camera.lookAt(cp.q);
  }
  return { update };
}
