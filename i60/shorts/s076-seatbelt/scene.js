// Inside 60 — Seatbelt retractor. Steps: 0 hook (belt pulls out then locks), 1 spring+spool, 2 pendulum+pawl, 3 centrifugal lever, 4 pretensioner piston, 5 torsion bar load limiter, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 90, specular: 0x555555, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x161a2c); scene.fog = new THREE.Fog(0x161a2c, 30, 80);
  scene.add(new THREE.HemisphereLight(0xf4f8ff, 0x404050, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(6, 10, 9); scene.add(key);
  const rim = new THREE.DirectionalLight(0x90c0ff, .7); rim.position.set(-6, 4, -8); scene.add(rim);
  // housing back plate
  const plate = new THREE.Mesh(new THREE.BoxGeometry(5.4, 5.6, .2), Mat({ color: 0x3a4050, shininess: 30 })); plate.position.set(.3, -.2, -3.5); plate.visible = false; scene.add(plate);
  // spool (axis z)
  const spool = new THREE.Group(); scene.add(spool);
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(.75, .75, 1.3, 36), Mat({ color: 0x8890a0 })); drum.rotation.x = Math.PI / 2; spool.add(drum);
  const roll = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 1.0, 40), Mat({ color: 0x30343c, shininess: 20 })); roll.rotation.x = Math.PI / 2; spool.add(roll);
  // stripe so rotation is visible
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(.12, 1.12, 1.02), Mat({ color: 0xff9030, emissive: 0x401800 })); stripe.position.y = .56; spool.add(stripe);
  // ratchet gear (front face, z=+.75)
  const gs = new THREE.Shape(); const N = 14;
  for (let i = 0; i < N; i++) { const a0 = i / N * Math.PI * 2, a1 = (i + .7) / N * Math.PI * 2, a2 = (i + 1) / N * Math.PI * 2;
    const p = (a, r) => [Math.cos(a) * r, Math.sin(a) * r]; if (i === 0) gs.moveTo(...p(a0, 1.05)); gs.lineTo(...p(a1, 1.35)); gs.lineTo(...p(a1, 1.05)); gs.lineTo(...p(a2, 1.05)); }
  const gearM = Mat({ color: 0xc8ccd6, emissive: 0x000000, shininess: 160 });
  const gear = new THREE.Mesh(new THREE.ExtrudeGeometry(gs, { depth: .18, bevelEnabled: false }), gearM); gear.position.z = .72; spool.add(gear);
  // torsion bar (axis through spool, sticks out back) 
  const barM = Mat({ color: 0x70ff90, emissive: 0x000000 });
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, 2.6, 6, 12), barM); bar.rotation.x = Math.PI / 2; bar.position.z = -.4; scene.add(bar);
  // spiral spring on back side (z = -.75)
  const spPts = []; for (let i = 0; i <= 240; i++) { const a = i / 240 * Math.PI * 2 * 4.5; const r = .25 + i / 240 * .9; spPts.push(V(Math.cos(a) * r, Math.sin(a) * r, 0)); }
  const springM = Mat({ color: 0x60c8ff, emissive: 0x000000 });
  const spring = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(spPts), 300, .035, 6), springM); spring.position.z = -.82; scene.add(spring);
  // webbing going up from roll to the right edge
  const webM = Mat({ color: 0x2c3240, shininess: 20 });
  const web = new THREE.Mesh(new THREE.BoxGeometry(.06, 1, .95), webM); scene.add(web);
  const tongue = new THREE.Mesh(new THREE.BoxGeometry(.5, .7, .14), Mat({ color: 0xd8dce4, shininess: 160 })); scene.add(tongue);
  // pendulum below + pawl
  const pend = new THREE.Group(); pend.position.set(-1.75, -1.45, .9); scene.add(pend);
  const pendM = Mat({ color: 0xffc840, emissive: 0x000000 });
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .9, 8), Mat({ color: 0x9098a8 })); rod.position.y = -.45; pend.add(rod);
  const bob = new THREE.Mesh(new THREE.SphereGeometry(.32, 20, 14), pendM); bob.position.y = -1.0; pend.add(bob);
  const pawlP = new THREE.Group(); pawlP.position.set(-1.6, -1.3, .92); scene.add(pawlP);
  const pawlM = Mat({ color: 0xff6040, emissive: 0x000000 });
  const pawl = new THREE.Mesh(new THREE.BoxGeometry(.9, .16, .16), pawlM); pawl.position.x = .45; pawlP.add(pawl);
  // centrifugal lever on gear face
  const levM = Mat({ color: 0xff50c0, emissive: 0x000000 });
  const lev = new THREE.Group(); lev.position.set(.35, .2, .95); spool.add(lev);
  const levB = new THREE.Mesh(new THREE.BoxGeometry(.7, .14, .1), levM); levB.position.x = .3; lev.add(levB);
  // pretensioner: cylinder + piston + rack below right
  const tubeM = Mat({ color: 0x8890a0, transparent: true, opacity: .45 });
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(.32, .32, 2.4, 20, 1, true), tubeM); cyl.position.set(2.6, -2.4, .9); scene.add(cyl);
  const gasM = Mat({ color: 0xff7020, emissive: 0xff5010, emissiveIntensity: 0, transparent: true, opacity: .9 });
  const gasC = new THREE.Mesh(new THREE.CylinderGeometry(.29, .29, 1, 18), gasM); scene.add(gasC);
  const piston = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .3, 20), Mat({ color: 0xe0e4ec, shininess: 180 })); scene.add(piston);
  const rack = new THREE.Mesh(new THREE.BoxGeometry(.18, 1.6, .3), Mat({ color: 0xc0c4cc })); scene.add(rack);
  const shots = [
    [[2.5, 1.5, 9.5], [.3, .1, 0]],       // 0 hook
    [[-4.5, 1.5, -5.5], [0, 0, -.6]],   // 1 spring (back)
    [[-.4, -.9, 6.8], [-1.3, -1.7, .9]],// 2 pendulum
    [[1.2, 1.0, 6.2], [.2, .2, .8]],    // 3 lever on gear
    [[3.6, -1.1, 8.0], [2.2, -2.0, .9]],// 4 pretensioner
    [[-5.5, 1.5, 3], [0, 0, -.3]],      // 5 torsion bar
    [[3, 2.5, 10.5], [.4, -.3, 0]],     // 6 recap
  ];
  shots.forEach(sh => { for (let i = 0; i < 3; i++) sh[0][i] = sh[1][i] + (sh[0][i] - sh[1][i]) * 1.2; });
  const cp = { p: V(), q: V() };
  let ang = 0, lastT = 0;
  function update(t, si, lt, sd) {
    const dt = Math.min(.1, Math.max(0, t - lastT)); lastT = t;
    const pulse = .5 + .5 * Math.sin(t * 7);
    let w = 0, out = 0; // spool angular speed (+ = paying out), belt out length
    let swing = 0, pawlUp = 0, levOut = 0, locked = false, pist = 0, twist = 0;
    if (si === 0) { const c = lt % 3; if (c < 1.6) w = 2.2; else { locked = true; swing = .5; pawlUp = 1; } }
    if (si === 1) w = Math.sin(lt * 1.6) * 2.0;
    if (si === 2) { const c = lt % 3.2; if (c < 1.2) w = 1.5; else { swing = ease((c - 1.2) / .3) * .6; pawlUp = ease((c - 1.3) / .3); locked = c > 1.6; } }
    if (si === 3) { const c = lt % 3.2; if (c < 1.0) w = 1.0; else if (c < 1.5) { w = 7; levOut = ease((c - 1.0) / .4); } else { levOut = 1; pawlUp = 1; locked = true; } }
    if (si === 4) { pist = ease((lt - .6) / .5); w = (lt > .6 && lt < 1.1) ? -8 : 0; pawlUp = lt > 1.2 ? 1 : 0; locked = lt > 1.2; }
    if (si === 5) { pawlUp = 1; locked = true; twist = ease((lt - .5) / 2.5); }
    if (si === 6) { locked = true; pawlUp = 1; }
    if (si === 5) w = 0;
    ang -= w * dt;
    spool.rotation.z = ang + (si === 5 ? -twist * .9 : 0);
    // torsion bar twist look: rotate it partially + glow
    bar.rotation.y = si === 5 ? -twist * .45 : 0; barM.emissive.setHex(0x30c050); barM.emissiveIntensity = si === 5 ? .3 + .4 * pulse : 0;
    springM.emissive.setHex(0x2090ff); springM.emissiveIntensity = si === 1 ? .35 + .3 * pulse : 0;
    spring.rotation.z = ang * .25;
    // webbing from roll top-right tangent up
    const len = 3.2 + Math.sin(ang * -1) * 0; web.scale.y = len; web.position.set(1.12, len / 2 - .1, 0);
    tongue.position.set(1.12, len + .1, 0);
    pend.rotation.z = -swing + (si === 2 && !swing ? Math.sin(t * 2) * .04 : 0);
    pendM.emissive.setHex(0xffa020); pendM.emissiveIntensity = si === 2 ? .3 + .4 * pulse : 0;
    pawlP.rotation.z = pawlUp * .35;
    pawlM.emissive.setHex(0xff4020); pawlM.emissiveIntensity = locked ? .6 : (si === 2 ? .2 : 0);
    gearM.emissive.setHex(0xffd040); gearM.emissiveIntensity = locked ? .25 + .2 * pulse : 0;
    lev.rotation.z = levOut * .7; levM.emissive.setHex(0xff30b0); levM.emissiveIntensity = si === 3 ? .4 + .3 * pulse : 0;
    // pretensioner
    const top = -1.2, bot = -3.6;
    const py = lerp(bot + .3, top - .3, si >= 4 ? (si === 4 ? pist : 1) : 0);
    piston.position.set(2.6, py, .9);
    gasC.visible = si === 4 && pist > .02; gasC.scale.y = Math.max(.01, py - bot); gasC.position.set(2.6, (py + bot) / 2, .9);
    gasM.emissiveIntensity = .6 + .4 * pulse;
    rack.position.set(2.25, py + .8, .9);
    // camera
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const kk = si === 0 ? 1 : ease(lt / 1.4);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], kk))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], kk)));
    const o = Math.sin(t * .25) * .1, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o));
    camera.lookAt(cp.q);
  }
  return { update };
}
