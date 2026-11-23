// Inside 60 — Garage door opener. Steps: 0 hook (door rises, seen from driveway), 1 torsion springs + cables,
// 2 motor + gears + chain on rail, 3 trolley + arm pulling door, 4 remote rolling code, 5 safety beam reverse, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x161b28); scene.fog = new THREE.Fog(0x161b28, 30, 80);
  scene.add(new THREE.HemisphereLight(0xfff8f0, 0x303040, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 1.0); key.position.set(6, 9, 8); scene.add(key);
  const key2 = new THREE.DirectionalLight(0xfff0e0, .7); key2.position.set(-5, 7, -9); scene.add(key2);
  const root = new THREE.Group(); scene.add(root); root.position.y = -1.7;

  const W = 3.2, H0 = 2.4, R = .45, PH = .6, NP = 4;
  // floors
  const floorIn = new THREE.Mesh(new THREE.PlaneGeometry(6, 6.5), Mat({ color: 0x3a4250, shininess: 5 })); floorIn.rotation.x = -Math.PI / 2; floorIn.position.set(0, 0, -3.25); root.add(floorIn);
  const drive = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), Mat({ color: 0x55606e, shininess: 5 })); drive.rotation.x = -Math.PI / 2; drive.position.set(0, -.01, 3); root.add(drive);
  // front wall with opening
  const wallM = Mat({ color: 0xd9cbb4, transparent: true, opacity: 1, shininess: 10 });
  const wl = new THREE.Mesh(new THREE.BoxGeometry(1.4, 3.6, .25), wallM); wl.position.set(-(W / 2 + .7), 1.8, .12); root.add(wl);
  const wr = wl.clone(); wr.position.x = W / 2 + .7; root.add(wr);
  const wt = new THREE.Mesh(new THREE.BoxGeometry(W, 3.6 - H0, .25), wallM); wt.position.set(0, H0 + (3.6 - H0) / 2, .12); root.add(wt);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(6.2, .2, 1.2), Mat({ color: 0x8a3a30 })); roof.position.set(0, 3.7, .5); root.add(roof);
  // vertical + curved + horizontal tracks
  const sPt = s => {
    if (s <= H0) return { p: V(0, s, -.05), a: 0 };
    const c = Math.PI / 2 * R;
    if (s <= H0 + c) { const a = (s - H0) / R; return { p: V(0, H0 + R * Math.sin(a), -.05 - (R - R * Math.cos(a))), a }; }
    return { p: V(0, H0 + R, -.05 - R - (s - H0 - c)), a: Math.PI / 2 };
  };
  const trackPts = []; for (let s = 0; s <= H0 + 3.4; s += .05) trackPts.push(sPt(s).p);
  const trackCurve = new THREE.CatmullRomCurve3(trackPts);
  const trackM = Mat({ color: 0x9aa4b0, shininess: 120 });
  [-1, 1].forEach(sx => { const tr = new THREE.Mesh(new THREE.TubeGeometry(trackCurve, 120, .04, 6), trackM); tr.position.x = sx * (W / 2 + .05); root.add(tr); });
  // door panels
  const panelM = Mat({ color: 0xf4f4f0, shininess: 60, side: THREE.DoubleSide });
  const grooveM = Mat({ color: 0xc8ccd2 });
  const panels = [];
  for (let k = 0; k < NP; k++) {
    const g = new THREE.Group(); root.add(g);
    const b = new THREE.Mesh(new THREE.BoxGeometry(W, PH - .02, .06), panelM); g.add(b);
    for (let j = -1; j <= 1; j++) { const r = new THREE.Mesh(new THREE.BoxGeometry(.9, PH * .55, .02), grooveM); r.position.set(j * 1.02, 0, .04); g.add(r); }
    panels.push(g);
  }
  const placeDoor = base => {
    panels.forEach((g, k) => { const s = base + (k + .5) * PH; const q = sPt(s); g.position.copy(q.p); g.position.z += .0; g.rotation.set(-q.a, 0, 0); });
  };
  // torsion spring assembly above opening (inside)
  const SY = H0 + .3, SZ = -.25;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, W + .4, 10).rotateZ(Math.PI / 2), Mat({ color: 0xb8c0c8 })); shaft.position.set(0, SY, SZ); root.add(shaft);
  const springM = Mat({ color: 0x404850, emissive: 0xffb020, emissiveIntensity: 0, shininess: 140 });
  const springs = [];
  [-1, 1].forEach(sx => {
    const pts = []; const L = 1.1, turns = 22;
    for (let i = 0; i <= 400; i++) { const u = i / 400, a = u * turns * Math.PI * 2; pts.push(V(u * L - L / 2, Math.cos(a) * .11, Math.sin(a) * .11)); }
    const sp = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 400, .022, 5), springM);
    sp.position.set(sx * .75, SY, SZ); root.add(sp); springs.push(sp);
  });
  const drums = [], cables = [];
  const cableM = Mat({ color: 0xe0e4e8, emissive: 0xffd040, emissiveIntensity: 0 });
  [-1, 1].forEach(sx => {
    const d = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, .1, 20).rotateZ(Math.PI / 2), Mat({ color: 0x707880 })); d.position.set(sx * (W / 2 + .12), SY, SZ); root.add(d); drums.push(d);
    const c = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, 1, 6), cableM); root.add(c); cables.push({ c, sx });
  });
  // ceiling rail + opener
  const RY = H0 + R + .45, RZ0 = -.4, RZ1 = -5.2;
  const rail = new THREE.Mesh(new THREE.BoxGeometry(.12, .1, RZ0 - RZ1), Mat({ color: 0x8c96a2 })); rail.position.set(0, RY, (RZ0 + RZ1) / 2); root.add(rail);
  const headerBrk = new THREE.Mesh(new THREE.BoxGeometry(.2, .45, .08), Mat({ color: 0x707880 })); headerBrk.position.set(0, RY - .1, -.06); root.add(headerBrk);
  const unitM = Mat({ color: 0xe8eaee, transparent: true, opacity: 1, shininess: 100, side: THREE.DoubleSide });
  const unit = new THREE.Mesh(new THREE.BoxGeometry(.9, .5, 1.1), unitM); unit.position.set(0, RY - .05, RZ1 - .45); root.add(unit);
  const lightM = Mat({ color: 0xfff4c0, emissive: 0xffe080, emissiveIntensity: .3 });
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(.6, .06, .5), lightM); lamp.position.set(0, RY - .32, RZ1 - .45); root.add(lamp);
  const motorM = Mat({ color: 0x3a7fe0, emissive: 0x40a0ff, emissiveIntensity: 0 });
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, .4, 20), motorM); motor.position.set(.15, RY - .05, RZ1 - .55); root.add(motor);
  const gearM = Mat({ color: 0xffc030, emissive: 0xffa010, emissiveIntensity: 0, shininess: 140 });
  const mkGear = (r, n) => { const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.CylinderGeometry(r, r, .06, 24), gearM)); for (let i = 0; i < n; i++) { const tt = new THREE.Mesh(new THREE.BoxGeometry(.05, .06, .06), gearM); const a = i / n * Math.PI * 2; tt.position.set(Math.cos(a) * (r + .02), 0, Math.sin(a) * (r + .02)); tt.rotation.y = -a; g.add(tt); } return g; };
  const g1 = mkGear(.07, 8); g1.position.set(.15, RY + .2, RZ1 - .55); root.add(g1);
  const g2 = mkGear(.2, 20); g2.position.set(-.13, RY + .2, RZ1 - .4); root.add(g2);
  // chain loop
  const chainM = new THREE.MeshBasicMaterial({ color: 0x8090a0 });
  const chainDots = [];
  for (let i = 0; i < 70; i++) { const d = new THREE.Mesh(new THREE.BoxGeometry(.05, .03, .06), chainM); root.add(d); chainDots.push({ d, u: i / 70 }); }
  const chainL = (RZ0 - RZ1 + .1) * 2;
  const chainPos = u => { const half = .5, z0 = RZ1 - .1, len = RZ0 - z0; if (u < half) return V(.0, RY + .07, z0 + (u / half) * len); return V(0, RY - .07, RZ0 - ((u - half) / half) * len); };
  // trolley + arm
  const trolM = Mat({ color: 0xff6030, emissive: 0xff5020, emissiveIntensity: 0 });
  const trolley = new THREE.Mesh(new THREE.BoxGeometry(.22, .18, .35), trolM); root.add(trolley);
  const armM = Mat({ color: 0x505860, emissive: 0xff8040, emissiveIntensity: 0 });
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 1, 8), armM); root.add(arm);
  // safety sensors + beam
  const eyeM = Mat({ color: 0x303840, emissive: 0x20ff60, emissiveIntensity: .4 });
  [-1, 1].forEach(sx => { const e = new THREE.Mesh(new THREE.BoxGeometry(.14, .16, .14), eyeM); e.position.set(sx * (W / 2 + .12), .16, -.2); root.add(e); });
  const beamM = new THREE.MeshBasicMaterial({ color: 0xff3030, transparent: true, opacity: 0 });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, W + .2, 8).rotateZ(Math.PI / 2), beamM); beam.position.set(0, .16, -.2); root.add(beam);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(.3, 24, 16), Mat({ color: 0x30c0ff, emissive: 0x2080ff, emissiveIntensity: .2 })); root.add(ball); ball.visible = false;
  // car outside
  const car = new THREE.Group(); car.position.set(0, 0, 3.6); root.add(car);
  const carM = Mat({ color: 0xd04040, shininess: 140 });
  const cb = new THREE.Mesh(new THREE.BoxGeometry(1.8, .55, 3.4), carM); cb.position.y = .5; car.add(cb);
  const ct = new THREE.Mesh(new THREE.BoxGeometry(1.5, .45, 1.7), Mat({ color: 0x90b8e0, shininess: 160 })); ct.position.set(0, .98, .2); car.add(ct);
  [[-.9, 1.1], [.9, 1.1], [-.9, -1.1], [.9, -1.1]].forEach(([x, z]) => { const w = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .2, 20).rotateZ(Math.PI / 2), Mat({ color: 0x202428 })); w.position.set(x, .3, z); car.add(w); });
  // remote
  const remote = new THREE.Group(); root.add(remote); remote.position.set(.6, 2.0, -4.0);
  remote.add(new THREE.Mesh(new THREE.BoxGeometry(.32, .5, .08), Mat({ color: 0x2a2e36 })));
  const btnM = Mat({ color: 0x50d070, emissive: 0x40ff80, emissiveIntensity: 0 });
  const btn = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, .04, 16).rotateX(Math.PI / 2), btnM); btn.position.set(0, .08, .05); remote.add(btn);
  const codeBars = [];
  for (let i = 0; i < 8; i++) { const m = new THREE.MeshBasicMaterial({ color: 0x40e0ff }); const b = new THREE.Mesh(new THREE.BoxGeometry(.05, .05, .05), m); root.add(b); codeBars.push({ b, m }); }
  const waveM = new THREE.MeshBasicMaterial({ color: 0x60e0ff, transparent: true, opacity: 0, side: THREE.DoubleSide });
  const waves = [0, 1, 2].map(() => { const w = new THREE.Mesh(new THREE.TorusGeometry(.3, .015, 6, 32), waveM.clone()); root.add(w); return w; });

  // door opening amount per step: [start, end] fraction of full travel
  const FULL = H0 + .2;
  const seq = [[0, .9], [.9, .45], [.45, .95], [.95, .3], [.3, .95], [.95, .95], [.95, .5]];
  const sc = (p, q, k) => [p.map((x, i) => q[i] + (x - q[i]) * k), q];
  const shots = [
    sc([3.2, 1.2, 8.4], [0, -.4, 0], 1.25),        // 0 hook from driveway
    sc([2.2, .4, -3.8], [0, .8, -.3], 1.25),        // 1 springs
    sc([1.9, .9, -8.6], [0, 1.4, -5.3], 1.0),      // 2 motor
    sc([3.2, .5, -5.0], [0, .9, -1.6], 1.2),       // 3 trolley + arm
    sc([3.2, .7, -1.8], [.1, .9, -4.8], 1.15),      // 4 remote -> opener
    sc([1.8, -.8, -2.8], [0, -1.2, -.2], 1.15),      // 5 safety beam
    sc([5.5, 2.0, -9.0], [0, .2, -2.4], 1.2),      // 6 recap
  ];
  const cp = { p: V(), q: V() };
  let lastT = 0, chainU = 0, prevOpen = 0, gearA = 0;
  const tmp = V();
  function update(t, si, lt, sd) {
    const dt = Math.min(.05, Math.max(0, t - lastT)); lastT = t;
    const pulse = .5 + .5 * Math.sin(t * 7);
    const f = Math.min(1, lt / Math.max(.1, sd));
    let o;
    let broken = false, pressed = false;
    if (si === 4) { pressed = f > .3; o = lerp(seq[4][0], seq[4][1], ease((f - .35) / .6)); }
    else if (si === 5) {
      if (f < .5) o = lerp(.95, .35, ease(f / .5 * 1.1));
      else { broken = true; o = lerp(.35, .95, ease((f - .55) / .4)); }
    } else o = lerp(seq[si][0], seq[si][1], ease(f * 1.05));
    const base = o * FULL;
    placeDoor(base);
    const vel = (o - prevOpen) / Math.max(dt, 1e-3); prevOpen = o;
    const moving = Math.abs(vel) > .005;
    // chain + gears follow door motion
    const cu = o * FULL / chainL;
    chainDots.forEach(c => { c.d.position.copy(chainPos(((c.u + cu) % 1 + 1) % 1)); });
    gearA = o * 40; g1.rotation.y = gearA * 2.8; g2.rotation.y = -gearA;
    // trolley follows top panel
    const topEdge = sPt(base + NP * PH).p;
    const tz = Math.min(RZ0 - .1, topEdge.z - .7);
    trolley.position.set(0, RY - .14, tz);
    const a0 = V(0, RY - .2, tz), a1 = V(0, topEdge.y - .12, topEdge.z - .05);
    arm.position.copy(a0).add(a1).multiplyScalar(.5); arm.scale.y = a0.distanceTo(a1);
    arm.quaternion.setFromUnitVectors(V(0, 1, 0), tmp.copy(a1).sub(a0).normalize());
    // cables from drum to bottom corners
    const bot = sPt(base).p;
    cables.forEach(({ c, sx }) => {
      const p0 = V(sx * (W / 2 + .12), SY - .14, SZ + .02), p1 = V(sx * (W / 2 - .02), bot.y + .02, bot.z - .02);
      if (base > H0 - .2) { c.visible = false; return; } c.visible = true;
      c.position.copy(p0).add(p1).multiplyScalar(.5); c.scale.y = p0.distanceTo(p1); c.quaternion.setFromUnitVectors(V(0, 1, 0), tmp.copy(p1).sub(p0).normalize());
    });
    drums.forEach(d => d.rotation.x = -o * 12);
    // spring twist look
    springs.forEach(s => s.rotation.x = -o * 3);
    // highlights
    springM.emissiveIntensity = si === 1 ? .35 + .3 * pulse : 0; cableM.emissiveIntensity = si === 1 ? .4 + .3 * pulse : 0;
    motorM.emissiveIntensity = si === 2 ? .35 + .3 * pulse : 0; gearM.emissiveIntensity = si === 2 ? .3 + .3 * pulse : 0;
    chainM.color.setHex(si === 2 || si === 3 ? 0xffd040 : 0x8090a0);
    trolM.emissiveIntensity = si === 3 ? .4 + .3 * pulse : 0; armM.emissiveIntensity = si === 3 ? .4 + .3 * pulse : 0;
    unitM.opacity = si === 2 ? .25 : 1; unitM.depthWrite = si !== 2;
    lightM.emissiveIntensity = moving ? .9 : .3;
    wallM.opacity = si === 0 ? 1 : 1;
    // remote
    remote.visible = si === 4;
    btnM.emissiveIntensity = pressed ? .6 + .4 * pulse : .05;
    const code = Math.floor(t * 1.2) * 7919;
    codeBars.forEach((c, i) => {
      c.b.visible = si === 4; c.b.position.set(.37 + i * .065, 2.36, -4.0);
      const bit = ((code >> i) ^ (i * 3)) & 1; c.m.color.setHex(bit ? 0x40e0ff : 0xff40a0); c.b.scale.y = bit ? 2.2 : 1;
    });
    waves.forEach((w, i) => {
      const k = ((t * .9 + i / 3) % 1); w.visible = si === 4 && pressed;
      const st = V(.6, 2.1, -4.0), en = V(0, RY - .05, RZ1 - .45);
      w.position.copy(st).lerp(en, k); w.scale.setScalar(.5 + k * 1.6); w.material.opacity = (1 - k) * .8; w.lookAt(en);
    });
    // safety
    beamM.opacity = si === 5 || si === 6 ? (broken && f < .7 ? .25 + .6 * pulse : .75) : (si === 0 ? 0 : .35);
    beamM.color.setHex(broken && f < .7 ? 0xffe040 : 0xff3030);
    ball.visible = si === 5 && f > .3;
    if (ball.visible) { const k = Math.min(1, (f - .3) / .35); ball.position.set(lerp(2.6, -.2, ease(k)), .3, -.45); ball.rotation.z = k * 8; }
    car.visible = false;
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
