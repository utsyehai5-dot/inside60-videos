// Inside 60 — Electric drill. Steps: 0 hook motor rpm, 1 trigger + battery power, 2 planetary gears, 3 speed switch,
// 4 slip clutch, 5 three-jaw chuck, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const X = g => g.rotateZ(-Math.PI / 2); // cylinder axis -> x
  scene.background = new THREE.Color(0x1a2030); scene.fog = new THREE.Fog(0x1a2030, 30, 80);
  scene.add(new THREE.HemisphereLight(0xfff8f0, 0x303040, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 1.2); key.position.set(5, 9, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0x80c0ff, .5); rim.position.set(-6, 4, -8); scene.add(rim);
  const root = new THREE.Group(); scene.add(root); root.position.set(-1.0, .6, 0);

  // floor
  const floor = new THREE.Mesh(new THREE.CircleGeometry(16, 48), Mat({ color: 0x2c3440, shininess: 5 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -4.6; root.add(floor);

  // housing (cut-away transparent)
  const shellM = Mat({ color: 0x20a0a0, transparent: true, opacity: .28, side: THREE.DoubleSide, depthWrite: false, shininess: 80 });
  const barrel = new THREE.Mesh(X(new THREE.CylinderGeometry(.75, .75, 3.4, 32, 1, true)), shellM); barrel.position.x = -.9; root.add(barrel);
  const backCap = new THREE.Mesh(new THREE.SphereGeometry(.75, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), shellM); backCap.rotation.z = Math.PI / 2; backCap.position.x = -2.6; root.add(backCap);
  const grip = new THREE.Mesh(new RoundedBox(THREE, .85, 2.4, .9, .3), Mat({ color: 0x20a0a0, shininess: 60 })); grip.position.set(-1.6, -1.8, 0); grip.rotation.z = -.18; root.add(grip);
  const gripRub = new THREE.Mesh(new RoundedBox(THREE, .5, 2.0, .95, .2), Mat({ color: 0x202428 })); gripRub.position.set(-1.85, -1.8, 0); gripRub.rotation.z = -.18; root.add(gripRub);
  // trigger
  const trigM = Mat({ color: 0x303438, emissive: 0xffc020, emissiveIntensity: 0 });
  const trig = new THREE.Mesh(new RoundedBox(THREE, .35, .55, .4, .1), trigM); trig.position.set(-1.05, -1.15, 0); root.add(trig);
  // battery
  const batM = Mat({ color: 0x303438, emissive: 0x40ff80, emissiveIntensity: 0, shininess: 60 });
  const bat = new THREE.Mesh(new RoundedBox(THREE, 1.9, .8, 1.3, .2), batM); bat.position.set(-1.6, -3.3, 0); root.add(bat);
  const batStripe = new THREE.Mesh(new THREE.BoxGeometry(1.92, .12, 1.32), Mat({ color: 0x20a0a0 })); batStripe.position.set(-1.6, -3.0, 0); root.add(batStripe);
  // power wire (battery -> trigger -> motor), glows on step 1
  const wireCurve = new THREE.CatmullRomCurve3([V(-1.4, -2.9, .2), V(-1.3, -1.6, .2), V(-1.2, -1.0, .2), V(-1.6, -.5, .2), V(-1.8, -.3, .2)]);
  const wireM = new THREE.MeshBasicMaterial({ color: 0x40ff80, transparent: true, opacity: 0 });
  root.add(new THREE.Mesh(new THREE.TubeGeometry(wireCurve, 40, .05, 6), wireM));
  const sparks = []; for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(.09, 10, 8), new THREE.MeshBasicMaterial({ color: 0xb0ffc0 })); root.add(s); sparks.push(s); }

  // motor x -2.4..-1.0
  const statorM = Mat({ color: 0x506070, transparent: true, opacity: .55, depthWrite: false });
  const stator = new THREE.Mesh(X(new THREE.CylinderGeometry(.62, .62, 1.4, 28, 1, true)), statorM); stator.position.x = -1.7; root.add(stator);
  const rotor = new THREE.Group(); rotor.position.x = -1.7; root.add(rotor);
  const coilM = Mat({ color: 0xc87533, emissive: 0xff6010, emissiveIntensity: 0, shininess: 140 });
  for (let k = 0; k < 6; k++) { const c = new THREE.Mesh(new THREE.BoxGeometry(1.2, .22, .3), coilM); const a = k / 6 * Math.PI * 2; c.position.set(0, Math.cos(a) * .32, Math.sin(a) * .32); c.rotation.x = a; rotor.add(c); }
  rotor.add(new THREE.Mesh(X(new THREE.CylinderGeometry(.07, .07, 2.0, 10)), Mat({ color: 0xd0d8e0 })));
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.25, .05, .05), new THREE.MeshBasicMaterial({ color: 0xffe040 })); stripe.position.y = .5; rotor.add(stripe);
  const blurM = new THREE.MeshBasicMaterial({ color: 0xffe0b0, transparent: true, opacity: 0, depthWrite: false });
  const blur = new THREE.Mesh(X(new THREE.CylinderGeometry(.55, .55, 1.25, 28, 1, true)), blurM); blur.position.x = -1.7; root.add(blur);

  // planetary gearbox at x -.4 (gears face along x)
  const gear = (r, teeth, w, col) => {
    const g = new THREE.Group(); const m = Mat({ color: col, emissive: col, emissiveIntensity: 0, shininess: 150 });
    g.add(new THREE.Mesh(X(new THREE.CylinderGeometry(r, r, w, 24)), m));
    for (let k = 0; k < teeth; k++) { const tt = new THREE.Mesh(new THREE.BoxGeometry(w, .07, .07), m); const a = k / teeth * Math.PI * 2; tt.position.set(0, Math.cos(a) * (r + .03), Math.sin(a) * (r + .03)); tt.rotation.x = -a; g.add(tt); }
    g.userData.m = m; return g;
  };
  const GX = -.45;
  const sun = gear(.14, 9, .3, 0xffd040); sun.position.x = GX; root.add(sun);
  const carrier = new THREE.Group(); carrier.position.x = GX; root.add(carrier);
  const planets = [];
  for (let k = 0; k < 3; k++) { const p = gear(.15, 10, .28, 0x40c0ff); const a = k / 3 * Math.PI * 2; p.position.set(0, Math.cos(a) * .32, Math.sin(a) * .32); carrier.add(p); planets.push(p); }
  const carrierPlate = new THREE.Mesh(X(new THREE.CylinderGeometry(.45, .45, .06, 24)), Mat({ color: 0x8090a0 })); carrierPlate.position.x = -.22; carrier.add(carrierPlate);
  const ringM = Mat({ color: 0xa0a8b0, emissive: 0xff8040, emissiveIntensity: 0, side: THREE.DoubleSide, shininess: 120 });
  const ring = new THREE.Mesh(X(new THREE.CylinderGeometry(.55, .55, .34, 32, 1, true)), ringM); ring.position.x = GX; root.add(ring);
  const ringRim = new THREE.Mesh(new THREE.TorusGeometry(.55, .04, 6, 32), ringM); ringRim.rotation.y = Math.PI / 2; ringRim.position.x = GX + .17; root.add(ringRim);
  // speed switch on top
  const swM = Mat({ color: 0xff4030, emissive: 0xff3010, emissiveIntensity: 0 });
  const sw = new THREE.Mesh(new RoundedBox(THREE, .4, .2, .3, .06), swM); root.add(sw);
  const swLabel1 = new THREE.Mesh(new THREE.CircleGeometry(.07, 12), new THREE.MeshBasicMaterial({ color: 0xffffff })); swLabel1.rotation.x = -Math.PI / 2; swLabel1.position.set(-.85, .79, .25); root.add(swLabel1);
  const swLabel2 = swLabel1.clone(); swLabel2.position.x = -.1; root.add(swLabel2); swLabel2.scale.setScalar(.6);

  // output spindle + clutch collar x .3..1.0
  const out = new THREE.Group(); out.position.x = .1; root.add(out);
  { const m = new THREE.Mesh(X(new THREE.CylinderGeometry(.08, .08, 1.8, 12)), Mat({ color: 0xd0d8e0 })); m.position.x = .9; out.add(m); }
  const collarM = Mat({ color: 0x202428, shininess: 40, transparent: true, opacity: .75 });
  const collarG = new THREE.Group(); root.add(collarG);
  const collar = new THREE.Mesh(X(new THREE.CylinderGeometry(.8, .8, .5, 32, 1, true)), collarM); collar.position.x = .65; root.add(collar);
  for (let k = 0; k < 20; k++) { const tick = new THREE.Mesh(new THREE.BoxGeometry(.25, .03, .03), new THREE.MeshBasicMaterial({ color: k % 5 ? 0xa0a0a0 : 0xffe040 })); const a = k / 20 * Math.PI * 2; tick.position.set(.65, Math.cos(a) * .81, Math.sin(a) * .81); tick.rotation.x = -a; collarG.add(tick); }
  const ballM = Mat({ color: 0xf0f4f8, emissive: 0xff40a0, emissiveIntensity: 0, shininess: 200 });
  const balls = []; for (let k = 0; k < 6; k++) { const b = new THREE.Mesh(new THREE.SphereGeometry(.09, 14, 10), ballM); root.add(b); balls.push(b); }
  const springs = []; for (let k = 0; k < 6; k++) { const s = new THREE.Mesh(X(new THREE.CylinderGeometry(.05, .05, .3, 8)), Mat({ color: 0x40c0ff })); root.add(s); springs.push(s); }
  // chuck x 1.0..2.0
  const chuck = new THREE.Group(); chuck.position.x = 1.0; root.add(chuck);
  const chuckM = Mat({ color: 0x303438, transparent: true, opacity: .45, depthWrite: false, shininess: 100 });
  { const m = new THREE.Mesh(X(new THREE.CylinderGeometry(.45, .62, 1.0, 28, 1, true)), chuckM); m.position.x = .5; chuck.add(m); }
  const jawM = Mat({ color: 0xd8dde2, emissive: 0xffd040, emissiveIntensity: 0, shininess: 180 });
  const jaws = []; for (let k = 0; k < 3; k++) { const j = new THREE.Mesh(new THREE.BoxGeometry(1.0, .14, .14), jawM); chuck.add(j); jaws.push(j); }
  // bit (screwdriver bit) + screw + wood
  const bitG = new THREE.Group(); bitG.position.x = 1.6; root.add(bitG);
  const bitM = Mat({ color: 0xc0c8d0, shininess: 200 });
  { const m = new THREE.Mesh(X(new THREE.CylinderGeometry(.1, .1, 1.6, 6)), bitM); m.position.x = .8; bitG.add(m); }
  const tip = new THREE.Mesh(new THREE.BoxGeometry(.3, .2, .05), bitM); tip.position.x = 1.7; bitG.add(tip);
  const tip2 = tip.clone(); tip2.rotation.x = Math.PI / 2; bitG.add(tip2);
  const screw = new THREE.Group(); root.add(screw);
  const scM = Mat({ color: 0xd0b060, shininess: 160 });
  screw.add(new THREE.Mesh(X(new THREE.CylinderGeometry(.28, .2, .14, 20)), scM));
  const thread = [];
  for (let k = 0; k < 60; k++) { const a = k * .5; thread.push(V(.1 + k * .022, Math.cos(a) * .16, Math.sin(a) * .16)); }
  screw.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(thread), 120, .035, 6), scM));
  { const m = new THREE.Mesh(X(new THREE.CylinderGeometry(.11, .02, 1.4, 12)), scM); m.position.x = .75; screw.add(m); }
  const wood = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.6, 2.0), Mat({ color: 0xe0b070, shininess: 10, transparent: true, opacity: .8, depthWrite: false })); root.add(wood);
  wood.position.set(5.75, 0, 0);

  const shots = [
    [[-7.0, 3.5, 8.5], [1.0, -1.0, 0]],    // 0 whole drill
    [[1.5, -.2, 8.5], [-2.2, -1.5, 0]],     // 1 trigger + battery
    [[.9, 1.6, 2.2], [-1.45, .6, 0]],      // 2 planetary gears
    [[-.8, 3.6, 3.0], [-1.3, .7, 0]],      // 3 switch + gears from above
    [[1.2, 1.3, 2.8], [-.4, .6, 0]],       // 4 clutch
    [[2.6, 1.3, 2.4], [.5, .6, 0]],        // 5 chuck
    [[-7.0, 3.5, 8.5], [1.0, -1.0, 0]],    // 6 recap
  ];
  const cp = { p: V(), q: V() };
  let mA = 0, oA = 0, adv = 0, lastT = 0;
  function update(t, si, lt, sd) {
    const dt = Math.min(.05, Math.max(0, t - lastT)); lastT = t;
    const pulse = .5 + .5 * Math.sin(t * 7);
    // trigger
    const pull = si === 1 ? ease(lt / 2) : (si === 0 ? 0.3 : 1);
    trig.position.x = -1.05 - pull * .18; trigM.emissiveIntensity = si === 1 ? .5 + .4 * pulse : 0;
    batM.emissiveIntensity = si === 1 ? .25 + .2 * pulse : 0; wireM.opacity = si === 1 ? .4 + .5 * pull : 0;
    sparks.forEach((s, i) => { s.visible = si === 1; s.position.copy(wireCurve.getPointAt(((t * .6 * (.4 + pull)) + i / 6) % 1)); });
    // motor speed (visual): slow enough to read gears on step 2
    const motor = si === 2 ? 3 : (si === 1 ? 4 + 30 * pull : 34);
    mA += dt * motor;
    rotor.rotation.x = mA; blurM.opacity = motor > 20 ? .35 : 0; coilM.emissiveIntensity = si === 0 || si === 1 ? .3 + .3 * pulse : 0;
    sun.rotation.x = mA;
    // speed switch: step 3 slides from low to high gear
    const hi = si === 3 ? ease((lt - 1.2) / 1.2) : (si > 3 ? 1 : 0);
    sw.position.set(lerp(-.85, -.1, hi), .82, 0); swM.emissiveIntensity = si === 3 ? .5 + .4 * pulse : 0;
    // clutch: slips during step 4 after the screw seats
    const slip = si === 4 && lt > 1.6;
    const outRate = slip ? 0 : (motor / 4) * (si === 3 ? lerp(1, 3.5, hi) : 1);
    oA += dt * outRate;
    carrier.rotation.x = oA; planets.forEach(p => { p.rotation.x = -(mA - oA) * .93; });
    planets.forEach(p => p.userData.m.emissiveIntensity = si === 2 ? .3 + .3 * pulse : 0);
    sun.userData.m.emissiveIntensity = si === 2 ? .4 + .3 * pulse : 0;
    ringM.emissiveIntensity = si === 2 ? .15 : 0;
    out.rotation.x = oA; chuck.rotation.x = oA; bitG.rotation.x = oA;
    // clutch balls: sit in detents; on slip they pop up and down
    collarM.opacity = si === 4 ? .35 : .75;
    balls.forEach((b, k) => {
      const a = k / 6 * Math.PI * 2 + (slip ? oA : oA);
      const pop = slip ? Math.abs(Math.sin(mA * 1.5 + k)) * .12 : 0;
      b.position.set(.48 + pop, Math.cos(a) * .5, Math.sin(a) * .5);
      springs[k].position.set(.8 + pop / 2, Math.cos(a) * .5, Math.sin(a) * .5); springs[k].scale.x = 1 - pop * 2.5;
    });
    ballM.emissiveIntensity = si === 4 ? (slip ? .5 + .5 * pulse : .3) : 0;
    // screw advance into wood (steps 2-4), seated at step 4
    if (si >= 1 && si <= 4 && !slip) adv = Math.min(1, adv + dt * .09);
    if (si === 5) adv = Math.max(0, adv - dt * .6);
    screw.position.set(3.5, 0, 0); screw.rotation.x = oA;
    wood.position.x = 4.95 - adv * 1.2 + .8;
    screw.visible = si !== 5;
    // chuck jaws: open on step 5 then close
    const close = si === 5 ? ease((lt - .6) / 1.6) : 1;
    const jr = lerp(.36, .13, close);
    jaws.forEach((j, k) => { const a = k / 3 * Math.PI * 2; j.position.set(.55, Math.cos(a) * jr, Math.sin(a) * jr); j.rotation.x = -a; });
    jawM.emissiveIntensity = si === 5 ? .4 + .4 * pulse : 0; chuckM.opacity = si === 5 ? .2 : .45;
    bitG.visible = true;
    const cut = si >= 2 && si <= 3; collarG.visible = !(cut || si === 4); collar.visible = !cut; chuck.visible = !cut || true; chuckM.opacity = cut ? .12 : chuckM.opacity;
    balls.forEach(b => b.visible = !cut); springs.forEach(b => b.visible = !cut);
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
function RoundedBox(THREE, w, h, d, r) {
  const s = new THREE.Shape(); const x = w / 2 - r, y = d / 2 - r;
  s.moveTo(-x, -y); s.lineTo(x, -y); s.lineTo(x, y); s.lineTo(-x, y); s.lineTo(-x, -y);
  const g = new THREE.ExtrudeGeometry(s, { depth: h - 2 * r, bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelSegments: 3 });
  g.rotateX(-Math.PI / 2); g.translate(0, -(h - 2 * r) / 2, 0); return g;
}
