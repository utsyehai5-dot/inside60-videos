// Inside 60 — How a Car Gearbox Works. Steps: 0 hook, 1 clutch, 2 input + layshaft, 3 free gears on main shaft, 4 synchro collar locks 1st, 5 first (big torque) vs top, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 60, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const fr = x => x - Math.floor(x);

  scene.background = new THREE.Color(0x15203a);
  scene.fog = new THREE.Fog(0x15203a, 30, 70);
  scene.add(new THREE.HemisphereLight(0xeaf2ff, 0x30302a, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(6, 10, 9); scene.add(key);
  const rim = new THREE.DirectionalLight(0x88ccff, .9); rim.position.set(-7, 5, -6); scene.add(rim);

  function gear(r, w, color, emis) {
    const g = new THREE.Group();
    const m = Mat({ color, emissive: emis || color, emissiveIntensity: 0 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(r - .08, r - .08, w, 40), m); body.rotation.z = Math.PI / 2; g.add(body);
    const n = Math.max(10, Math.round(r * 18));
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; const tth = new THREE.Mesh(new THREE.BoxGeometry(w, .16, .13), m); tth.position.set(0, Math.cos(a) * r, Math.sin(a) * r); tth.rotation.x = a; g.add(tth); }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r * .55, .05, 8, 30), Mat({ color: 0xffffff, transparent: true, opacity: .5 })); ring.rotation.y = Math.PI / 2; ring.position.x = w / 2 + .01; g.add(ring);
    g.userData.m = m; scene.add(g); return g;
  }
  const shaftM = Mat({ color: 0xb0b8c4, shininess: 110 });
  const shaft = (x0, x1, y, r) => { const s = new THREE.Mesh(new THREE.CylinderGeometry(r, r, x1 - x0, 16), shaftM.clone()); s.rotation.z = Math.PI / 2; s.position.set((x0 + x1) / 2, y, 0); scene.add(s); return s; };

  const YM = .9, YL = -.9; // main/input axis and layshaft axis (center distance 1.8)
  // engine + flywheel + clutch
  const eng = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.2, 2.6), Mat({ color: 0x5a6270 })); eng.position.set(-8.6, YM, 0); scene.add(eng);
  const fly = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, .3, 40), Mat({ color: 0x8a94a4, emissive: 0xff8040, emissiveIntensity: 0 })); fly.rotation.z = Math.PI / 2; fly.position.set(-7.1, YM, 0); scene.add(fly);
  const clutchM = Mat({ color: 0xd8a040, emissive: 0xffc040, emissiveIntensity: 0 });
  const clutch = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, .18, 40), clutchM); clutch.rotation.z = Math.PI / 2; scene.add(clutch);
  const clutchMarks = []; for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.2, .9, .12), Mat({ color: 0x6a4a2a })); scene.add(b); clutchMarks.push(b); }
  const engMarks = []; for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.32, .14, .5), Mat({ color: 0xe04a4a })); scene.add(b); engMarks.push(b); }

  // shafts
  const inShaft = shaft(-6.9, -3.0, YM, .14);
  const mainShaft = shaft(-2.9, 6.5, YM, .14);
  const layShaft = shaft(-4.2, 3.0, YL, .14);
  // constant-mesh pair (input -> layshaft)
  const gIn = gear(.7, .45, 0x6aa8e8); gIn.position.set(-3.6, YM, 0);
  const gLin = gear(1.1, .45, 0x6aa8e8); gLin.position.set(-3.6, YL, 0);
  // speed pairs: [layR, mainR, x]
  const pairs = [[.5, 1.3, 2.0, 0x40c070], [.8, 1.0, 0, 0xe0a030], [1.1, .7, -1.9, 0xc060e0]];
  const P = pairs.map(([rl, rm, x, c]) => { const L = gear(rl, .45, c); L.position.set(x, YL, 0); const M = gear(rm, .45, c); M.position.set(x, YM, 0); return { rl, rm, x, L, M, a: 0 }; });
  // synchro collar between 1st (x=2.0) and 2nd (x=0)
  const collarM = Mat({ color: 0xffe040, emissive: 0xffd020, emissiveIntensity: 0 });
  const collar = new THREE.Group(); scene.add(collar);
  const cBody = new THREE.Mesh(new THREE.CylinderGeometry(.48, .48, .5, 32), collarM); cBody.rotation.z = Math.PI / 2; collar.add(cBody);
  const cGroove = new THREE.Mesh(new THREE.TorusGeometry(.5, .07, 8, 32), Mat({ color: 0x8a7020 })); cGroove.rotation.y = Math.PI / 2; collar.add(cGroove);
  const fork = new THREE.Group(); scene.add(fork);
  const fkM = Mat({ color: 0x9aa2ae, emissive: 0xffe040, emissiveIntensity: 0 });
  const fArm = new THREE.Mesh(new THREE.BoxGeometry(.16, 1.6, .16), fkM); fArm.position.y = 1.2; fork.add(fArm);
  const fU = new THREE.Mesh(new THREE.TorusGeometry(.62, .06, 8, 24, Math.PI), fkM); fU.rotation.y = Math.PI / 2; fork.add(fU);
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 2.2, 10), Mat({ color: 0x30343c })); scene.add(stick);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(.3, 20, 14), Mat({ color: 0x23252b, shininess: 90 })); scene.add(knob);
  // output arrow (torque ring) at end of main shaft
  const outM = new THREE.MeshBasicMaterial({ color: 0xffe040, transparent: true, opacity: 0, depthWrite: false });
  const torque = new THREE.Mesh(new THREE.TorusGeometry(.9, .08, 8, 40, Math.PI * 1.5), outM); torque.rotation.y = Math.PI / 2; torque.position.set(5.6, YM, 0); scene.add(torque);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(.2, .45, 12), outM); scene.add(tip);
  // casing (ghost)
  const cas = new THREE.Mesh(new THREE.BoxGeometry(9.2, 4.6, 3.4), Mat({ color: 0x8a96a6, transparent: true, opacity: .08, depthWrite: false, side: THREE.DoubleSide })); cas.position.set(-.6, 0, 0); scene.add(cas);

  const shots = [
    [[.6, 3.0, 15], [-.6, .1, 0]],
    [[-5.0, 2.6, 7.5], [-6.4, .8, 0]],
    [[-1.5, 1.0, 10], [-2.2, -.2, 0]],
    [[2.6, 3.4, 8.5], [.4, .6, 0]],
    [[3.6, 2.8, 6.2], [1.4, .9, 0]],
    [[4.2, 3.0, 12.5], [3.4, .4, 0]],
    [[1.0, 3.2, 18], [-.8, .1, 0]],
  ];
  const cp = { p: V(), q: V() };
  let engA = 0, inA = 0, outA = 0, lastT = 0, inSpeed = 0;

  function update(t, si, lt, sd) {
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const k = si === 0 ? 1 : ease(lt / 1.3);
    cp.p.set(...prev[0].map((v, i) => lerp(v, now[0][i], k)));
    cp.q.set(...prev[1].map((v, i) => lerp(v, now[1][i], k)));
    const o = Math.sin(t * .2) * .08;
    const dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o));
    camera.lookAt(cp.q);

    const dt = Math.min(.1, Math.max(0, t - lastT)); lastT = t;
    // clutch: disengaged during step 1 (and while shifting in step 4), engaged otherwise
    const dis = si === 1 ? ease((lt - .6) / .8) : si === 4 ? (lt < 2.2 ? 1 : 1 - ease((lt - 2.2) / .6)) : 0;
    const cx = -6.75 + dis * .7;
    clutch.position.set(cx, YM, 0);
    clutchM.emissiveIntensity = si === 1 ? .45 + .2 * Math.sin(t * 6) : 0;
    fly.material.emissiveIntensity = si === 1 ? .25 : 0;
    const engSpeed = 6;
    engA += dt * engSpeed;
    const target = engSpeed * (1 - dis);
    inSpeed = lerp(inSpeed, target, Math.min(1, dt * 4));
    inA += dt * inSpeed;
    fly.rotation.x = engA;
    engMarks.forEach((b, i) => { const a = engA + i / 6 * Math.PI * 2; b.position.set(-7.1, YM + Math.cos(a) * 1.1, Math.sin(a) * 1.1); b.rotation.x = -a; });
    clutch.rotation.x = inA;
    clutchMarks.forEach((b, i) => { const a = inA + i / 6 * Math.PI * 2; b.position.set(cx + .12, YM + Math.cos(a) * .7, Math.sin(a) * .7); b.rotation.x = -a; });
    inShaft.rotation.x = inA; gIn.rotation.x = inA;
    const layA = -inA * .7 / 1.1 + .15; gLin.rotation.x = layA; layShaft.rotation.x = layA;
    gIn.userData.m.emissiveIntensity = gLin.userData.m.emissiveIntensity = si === 2 ? .3 + .15 * Math.sin(t * 6) : 0;
    layShaft.material.emissive.setHex(0xffd040); layShaft.material.emissiveIntensity = si === 2 ? .5 : 0;

    // selected gear: none until step 4, then 1st; in step 5 second half shows top (3rd)
    const sel = si === 4 ? (lt > 1.8 ? 0 : -1) : si === 5 ? (lt < sd * .5 ? 0 : 2) : si === 6 || si === 0 ? 1 : -1;
    P.forEach((p, i) => {
      p.L.rotation.x = layA * (i === 0 ? 1 : 1);
      p.a = -layA * p.rl / p.rm; p.M.rotation.x = p.a + i * .2;
      const hl = (si === 3) || (sel === i && si >= 4 && si <= 5);
      p.M.userData.m.emissiveIntensity = p.L.userData.m.emissiveIntensity = hl ? .3 + .15 * Math.sin(t * 6) : 0;
    });
    // collar slides
    const cxPos = si === 4 ? lerp(1.0, 1.55, ease((lt - .6) / 1.2)) : si === 5 && sel === 0 ? 1.55 : 1.0;
    collar.position.set(cxPos, YM, 0); fork.position.set(cxPos, YM, 0);
    collarM.emissiveIntensity = si === 4 ? .6 + .3 * Math.sin(t * 8) : .1;
    fkM.emissiveIntensity = si === 4 ? .3 : 0;
    const stickLean = (cxPos - 1.0) / .55;
    stick.position.set(cxPos, YM + 3.0, 0); stick.rotation.z = -stickLean * .35;
    knob.position.set(cxPos + Math.sin(stickLean * .35) * 1.1, YM + 3.0 + Math.cos(stickLean * .35) * 1.1, 0);
    // output shaft speed
    let outSpeed = 0;
    if (sel >= 0) outSpeed = -(-inSpeed * .7 / 1.1) * P[sel].rl / P[sel].rm;
    outA += dt * outSpeed; mainShaft.rotation.x = outA; collar.rotation.x = outA;
    if (sel >= 0) P[sel].M.rotation.x = outA;
    mainShaft.material.emissive.setHex(0xffd040); mainShaft.material.emissiveIntensity = sel >= 0 && si >= 4 && si <= 5 ? .4 : 0;
    // torque indicator: thick for 1st, thin for top
    const show = si === 5 ? 1 : 0;
    outM.opacity = show; const th = sel === 0 ? 2.2 : .8; torque.scale.set(th, 1, 1); torque.scale.setScalar(1); torque.scale.z = 1;
    torque.geometry.dispose(); torque.geometry = new THREE.TorusGeometry(.9, sel === 0 ? .2 : .06, 8, 40, Math.PI * 1.5);
    torque.rotation.x = outA;
    const ta = outA + Math.PI * 1.5; tip.position.set(5.6, YM + Math.cos(ta) * .9, Math.sin(ta) * .9); tip.rotation.x = -ta + Math.PI; tip.scale.setScalar(sel === 0 ? 1.6 : .8);
  }
  return { update };
}
