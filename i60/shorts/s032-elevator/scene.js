// Inside 60 — Elevator (traction). Steps: 0 hook, 1 ropes/sheave, 2 counterweight, 3 motor/friction, 4 rails, 5 governor/safety, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 70, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x152238); scene.fog = new THREE.Fog(0x152238, 30, 80);
  scene.add(new THREE.HemisphereLight(0xe6f0ff, 0x303848, 1.7));
  const key = new THREE.DirectionalLight(0xffffff, 1.8); key.position.set(6, 10, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0x88bbff, .7); rim.position.set(-8, 4, -6); scene.add(rim);

  const TOP = 6.2, BOT = -6;
  // shaft: back wall + floor slabs (floors)
  const wall = new THREE.Mesh(new THREE.BoxGeometry(7, 14, .2), Mat({ color: 0x3a4a62 })); wall.position.set(.2, 0, -1.6); scene.add(wall);
  for (let i = 0; i < 5; i++) { const y = BOT + i * 2.9; const s = new THREE.Mesh(new THREE.BoxGeometry(7, .12, .25), Mat({ color: 0x5b6d88 })); s.position.set(.2, y, -1.4); scene.add(s); }
  const roof = new THREE.Mesh(new THREE.BoxGeometry(7, .3, 3.4), Mat({ color: 0x4a5a74 })); roof.position.set(.2, TOP + 1.9, 0); scene.add(roof);
  // guide rails
  const railM = Mat({ color: 0xb8c4d4, emissive: 0x3070ff, emissiveIntensity: 0, shininess: 120 });
  const CX = -1.1, WX = 1.5;
  [CX - 1.05, CX + 1.05, WX - .45, WX + .45].forEach(x => { const r = new THREE.Mesh(new THREE.BoxGeometry(.1, 14, .14), railM); r.position.set(x, .3, 0); scene.add(r); });
  // car
  const car = new THREE.Group(); scene.add(car);
  const carM = Mat({ color: 0xe8eef6 });
  const cbox = new THREE.Mesh(new THREE.BoxGeometry(1.9, 2.3, 1.7), carM); car.add(cbox);
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.9, .04), Mat({ color: 0x9fb4cc, shininess: 150 })); door.position.set(0, -.1, .87); car.add(door);
  const seam = new THREE.Mesh(new THREE.BoxGeometry(.02, 1.9, .05), Mat({ color: 0x506070 })); seam.position.set(0, -.1, .88); car.add(seam);
  const cross = new THREE.Mesh(new THREE.BoxGeometry(2.2, .16, .3), Mat({ color: 0x5a6878 })); cross.position.y = 1.3; car.add(cross);
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(.5, .1, .05), Mat({ color: 0xffe08a, emissive: 0xffb020, emissiveIntensity: .8 })); lamp.position.set(0, 1.0, .88); car.add(lamp);
  // safety clamps on car sides
  const clampM = Mat({ color: 0x777777, emissive: 0xff2020, emissiveIntensity: 0 });
  const clamps = [-1, 1].map(s => { const c = new THREE.Mesh(new THREE.BoxGeometry(.28, .35, .4), clampM); c.position.set(s * 1.05, -1.05, 0); car.add(c); return c; });
  // counterweight
  const cw = new THREE.Group(); scene.add(cw);
  const cwM = Mat({ color: 0xff8a2a, emissive: 0xff5000, emissiveIntensity: 0 });
  for (let i = 0; i < 6; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(.7, .26, .5), cwM); p.position.y = -.75 + i * .3; cw.add(p); }
  const cwf = new THREE.Mesh(new THREE.BoxGeometry(.9, .12, .3), Mat({ color: 0x5a6878 })); cwf.position.y = 1.05; cw.add(cwf);
  // sheave + motor on top
  const SX = (CX + WX) / 2, SR = (WX - CX) / 2, SY = TOP + .6;
  const sheave = new THREE.Group(); sheave.position.set(SX, SY, 0); scene.add(sheave);
  const sheM = Mat({ color: 0xd0d8e4, emissive: 0x2080ff, emissiveIntensity: 0, shininess: 110 });
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(SR, SR, .5, 48), sheM); disc.rotation.x = Math.PI / 2; sheave.add(disc);
  for (let g = -1; g <= 1; g++) { const gr = new THREE.Mesh(new THREE.TorusGeometry(SR, .03, 6, 48), Mat({ color: 0x404850 })); gr.position.z = g * .13; sheave.add(gr); }
  const spokes = new THREE.Group(); sheave.add(spokes);
  for (let i = 0; i < 5; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(SR * 1.7, .14, .56), Mat({ color: 0x7a8696 })); s.rotation.z = i / 5 * Math.PI; spokes.add(s); }
  const motorM = Mat({ color: 0x2d7fd8, emissive: 0x1050ff, emissiveIntensity: 0 });
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(.75, .75, 1.3, 32), motorM); motor.rotation.x = Math.PI / 2; motor.position.set(SX, SY, -1.0); scene.add(motor);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.15, .15, 1.2, 16), Mat({ color: 0x999999 })); shaft.rotation.x = Math.PI / 2; shaft.position.set(SX, SY, -.4); scene.add(shaft);
  // ropes (3 per side), unit-height cylinders scaled each frame
  const ropeM = Mat({ color: 0x404040, emissive: 0xffd000, emissiveIntensity: 0, shininess: 30 });
  const ropes = [];
  [-.13, 0, .13].forEach(z => [CX, WX].forEach(x => { const r = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, 1, 6), ropeM); r.position.set(x, 0, z); scene.add(r); ropes.push({ r, x }); }));
  // governor: small wheel top-left, loop rope to bottom pulley
  const GX = CX - 1.55;
  const gov = new THREE.Group(); gov.position.set(GX, TOP + .9, .5); scene.add(gov);
  const govM = Mat({ color: 0x40d070, emissive: 0x10a040, emissiveIntensity: 0 });
  { const gw = new THREE.Mesh(new THREE.CylinderGeometry(.4, .4, .15, 32), govM); gw.rotation.x = Math.PI / 2; gov.add(gw); }
  const flyw = [-1, 1].map(s => { const b = new THREE.Mesh(new THREE.SphereGeometry(.1, 12, 8), Mat({ color: 0xffd040, emissive: 0xffa000, emissiveIntensity: .3 })); b.position.set(s * .22, 0, .12); gov.add(b); return b; });
  const govRopeM = Mat({ color: 0x30a060 });
  const gr1 = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, TOP + .9 - BOT + .5, 6), govRopeM); gr1.position.set(GX - .4, (TOP + .9 + BOT - .5) / 2, .5); scene.add(gr1);
  const gr2 = gr1.clone(); gr2.position.x = GX + .4; scene.add(gr2);
  const link = new THREE.Mesh(new THREE.BoxGeometry(.45, .08, .08), Mat({ color: 0x30a060 })); scene.add(link);
  // floor numbers glow plates on wall
  const glow = [];
  for (let i = 0; i < 4; i++) { const g = new THREE.Mesh(new THREE.BoxGeometry(.35, .2, .05), Mat({ color: 0x223, emissive: 0x30ff90, emissiveIntensity: .1 })); g.position.set(-3, BOT + 1.6 + i * 2.9, -1.4); scene.add(g); glow.push(g); }

  const shots = [
    [[8, 1.5, 23], [0, .8, 0]],     // hook wide
    [[4, 7.5, 9.5], [.2, 6.2, 0]], // sheave close
    [[9, -.5, 15], [1.3, -.6, 0]],    // counterweight
    [[-7, 8.4, 4.2], [.2, 6.4, -.6]], // motor
    [[10, -1, 24], [0, 0, 0]],    // rails wide
    [[-7, 1, 11], [-1.4, 0, 0]],  // safety close (y follows car)
    [[-8, 2, 23], [0, .8, 0]],    // recap
  ];
  const cp = { p: V(), q: V() };
  let lastT = 0, carY = -3, vel = 0, ang = 0;
  function update(t, si, lt, sd) {
    const dt = Math.min(.1, Math.max(0, t - lastT)); lastT = t; sd = sd || 6;
    // car motion target per step
    let target = carY;
    if (si === 0) target = -3 + 6 * ((Math.sin(t * .5 - 1.57) + 1) / 2);
    if (si === 1 || si === 2) target = -1 + Math.sin(lt * .6) * 1.2;
    if (si === 3) target = -3 + 5 * ease(lt / sd);
    if (si === 4) target = 2 - 6 * ease(lt / sd);
    if (si === 5) target = -4 + Math.min(3, lt * lt * .45);
    if (si === 6) target = -3 + 6 * ((Math.sin(lt * .7 - 1.57) + 1) / 2);
    let ny = carY + (target - carY) * Math.min(1, dt * 3);
    if (si === 5 && lt > 2.6) ny = carY; // clamped: stops
    if (t < .05) ny = target;
    vel = (ny - carY) / Math.max(dt, 1e-3); carY = ny;
    car.position.y = carY;
    const cwY = -carY + .3; cw.position.set(WX, cwY, 0);
    ang += vel * dt / SR; sheave.rotation.z = -ang;
    // ropes from sheave tangent down
    ropes.forEach(o => { const yb = o.x === CX ? carY + 1.38 : cwY + 1.1; const h = SY - yb; o.r.scale.y = Math.max(.01, h); o.r.position.y = yb + h / 2; });
    // highlights
    const pulse = .5 + .5 * Math.sin(t * 5);
    ropeM.emissiveIntensity = si === 1 ? .35 + .3 * pulse : 0;
    sheM.emissiveIntensity = si === 1 || si === 3 ? .25 + .2 * pulse : 0;
    cwM.emissiveIntensity = si === 2 || si === 0 ? .25 + .3 * pulse : 0;
    motorM.emissiveIntensity = si === 3 ? .4 + .4 * pulse : 0;
    railM.emissiveIntensity = si === 4 ? .35 + .25 * pulse : 0;
    govM.emissiveIntensity = si === 5 ? .4 + .4 * pulse : 0;
    clampM.emissiveIntensity = si === 5 && lt > 2.6 ? .9 : 0;
    clamps.forEach((c, i) => { c.position.x = (i ? 1 : -1) * (1.05 + (si === 5 && lt > 2.6 ? -.04 : .04)); });
    gov.rotation.z = -ang * 2.2;
    const spread = si === 5 ? Math.min(.18, Math.abs(vel) * .06) : .02;
    flyw.forEach((b, i) => { b.position.x = (i ? 1 : -1) * (.22 + spread); });
    link.position.set(GX + .4 - .2 + .02, carY + .6, .5); link.position.x = (GX + .4 + CX - .95) / 2; link.scale.x = 1;
    glow.forEach((g, i) => { const fy = BOT + 1.6 + i * 2.9; g.material.emissiveIntensity = Math.abs(fy - carY) < 1.2 ? 1 : .1; });
    // camera
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const k = si === 0 ? 1 : ease(lt / 1.3);
    cp.p.set(...prev[0].map((v, i) => lerp(v, now[0][i], k))); cp.q.set(...prev[1].map((v, i) => lerp(v, now[1][i], k)));
    let fy = 0; if (si === 5) fy = carY * k; else if (si === 6 || si === 4) fy = 0;
    const o = Math.sin(t * .2) * .1, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y + fy, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o));
    camera.lookAt(cp.q.x, cp.q.y + fy, cp.q.z);
  }
  return { update };
}
