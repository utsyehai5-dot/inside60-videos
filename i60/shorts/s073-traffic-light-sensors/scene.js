// Inside 60 — Traffic light sensors (inductive loop). Steps: 0 hook, 1 loop cut in road, 2 AC + magnetic field, 3 car disturbs field / frequency shift, 4 bikes sweet spot, 5 detector -> controller -> green, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 90, specular: 0x555555, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x141a2a); scene.fog = new THREE.Fog(0x141a2a, 40, 100);
  scene.add(new THREE.HemisphereLight(0xf4f8ff, 0x404050, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(6, 12, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0x90d0ff, .7); rim.position.set(-6, 4, -8); scene.add(rim);
  // road: lane runs along z (car comes from +z toward the stop line at z=0)
  const roadM = Mat({ color: 0x343c4a, shininess: 15, transparent: true, opacity: 1 });
  const road = new THREE.Mesh(new THREE.BoxGeometry(12, .3, 40), roadM); road.position.set(0, -.15, 8); scene.add(road);
  const side = new THREE.Mesh(new THREE.BoxGeometry(6, .5, 40), Mat({ color: 0x55606e, shininess: 10 })); side.position.set(9, 0, 8); scene.add(side);
  const white = Mat({ color: 0xf0f0f0, emissive: 0x303030 });
  const stop = new THREE.Mesh(new THREE.BoxGeometry(6, .03, .4), white); stop.position.set(0, .01, -.2); scene.add(stop);
  for (let k = 0; k < 6; k++) { const d = new THREE.Mesh(new THREE.BoxGeometry(.2, .03, 2), white); d.position.set(-3, .01, 2 + k * 4); scene.add(d); }
  // the loop: rectangle of wire, a few turns, in saw cuts
  const loopM = Mat({ color: 0xd08a40, emissive: 0x000000 });
  const cutM = Mat({ color: 0x15181e, shininess: 5 });
  const lw = 2.2, lz0 = .8, lz1 = 4.8;
  const loopG = new THREE.Group(); scene.add(loopG);
  for (let turn = 0; turn < 3; turn++) {
    const o = turn * .09;
    const pts = [V(-lw + o, -.05, lz0 + o), V(lw - o, -.05, lz0 + o), V(lw - o, -.05, lz1 - o), V(-lw + o, -.05, lz1 - o), V(-lw + o, -.05, lz0 + o)];
    const p = new THREE.CurvePath(); for (let i = 0; i < 4; i++) p.add(new THREE.LineCurve3(pts[i], pts[i + 1]));
    loopG.add(new THREE.Mesh(new THREE.TubeGeometry(p, 80, .04, 6), loopM));
  }
  const cuts = new THREE.Group(); scene.add(cuts);
  [[0, lz0, lw * 2 + .2, .3], [0, lz1, lw * 2 + .2, .3]].forEach(([x, z, w, d]) => { const c = new THREE.Mesh(new THREE.BoxGeometry(w, .04, d), cutM); c.position.set(x, .005, z); cuts.add(c); });
  [[-lw, (lz0 + lz1) / 2], [lw, (lz0 + lz1) / 2]].forEach(([x, z]) => { const c = new THREE.Mesh(new THREE.BoxGeometry(.3, .04, lz1 - lz0 + .2), cutM); c.position.set(x, .005, z); cuts.add(c); });
  // lead wire to roadside cabinet
  const lead = new THREE.CatmullRomCurve3([V(lw, -.05, 2.8), V(4.5, -.1, 2.8), V(6.5, .3, 2.8), V(7.2, .6, 2.8)]);
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(lead, 30, .05, 6), loopM));
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.4, 1), Mat({ color: 0x8a96a6, shininess: 60 })); cab.position.set(7.8, 1.45, 2.8); scene.add(cab);
  const detM = Mat({ color: 0x1f8040, emissive: 0x000000 });
  const det = new THREE.Mesh(new THREE.BoxGeometry(.1, .8, .7), detM); det.position.set(7.07, 1.7, 2.8); scene.add(det);
  // traffic light
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.15, .15, 7, 14), Mat({ color: 0x505a68 })); pole.position.set(6.6, 3.5, -.8); scene.add(pole);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, 5.2, 12), Mat({ color: 0x505a68 })); arm.rotation.z = Math.PI / 2; arm.position.set(4.1, 6.8, -.8); scene.add(arm);
  const head = new THREE.Mesh(new THREE.BoxGeometry(1, 2.8, .7), Mat({ color: 0x24282e })); head.position.set(1.8, 5.6, -.8); scene.add(head);
  const lamp = c => { const m = Mat({ color: c, emissive: 0x000000 }); return m; };
  const lamps = [lamp(0x502020), lamp(0x504020), lamp(0x205030)];
  const lampOn = [0xff3030, 0xffc020, 0x30ff70];
  lamps.forEach((m, k) => { const l = new THREE.Mesh(new THREE.SphereGeometry(.34, 18, 12), m); l.position.set(1.8, 6.5 - k * .9, -.4); scene.add(l); });
  // car
  const car = new THREE.Group(); scene.add(car);
  const bodyM = Mat({ color: 0x3a8cff, shininess: 140, transparent: true, opacity: 1 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1, 4.6), bodyM); body.position.y = 1.0; car.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.1, .8, 2.4), Mat({ color: 0x9fd0ff, shininess: 200, transparent: true, opacity: .8 })); cabin.position.set(0, 1.85, .3); car.add(cabin);
  const under = new THREE.Mesh(new THREE.BoxGeometry(2.2, .12, 4.2), Mat({ color: 0xa0a8b4, shininess: 150, emissive: 0x000000 })); under.position.y = .5; car.add(under);
  const underM = under.material;
  for (const x of [-1.2, 1.2]) for (const z of [-1.5, 1.5]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.45, .45, .35, 20), Mat({ color: 0x18181c })); w.rotation.z = Math.PI / 2; w.position.set(x, .45, z); car.add(w); }
  // magnetic field loops above the coil
  const fieldM = new THREE.MeshBasicMaterial({ color: 0x40d0ff, transparent: true, opacity: .6 });
  const field = []; for (let k = 0; k < 5; k++) { const r = new THREE.Mesh(new THREE.TorusGeometry(1, .03, 6, 48), fieldM); r.rotation.x = Math.PI / 2; r.position.set(0, .1, (lz0 + lz1) / 2); r.userData.o = k / 5; scene.add(r); field.push(r); }
  // current dots along the loop
  const curPath = new THREE.CurvePath(); { const pts = [V(-lw, -.02, lz0), V(lw, -.02, lz0), V(lw, -.02, lz1), V(-lw, -.02, lz1), V(-lw, -.02, lz0)]; for (let i = 0; i < 4; i++) curPath.add(new THREE.LineCurve3(pts[i], pts[i + 1])); }
  const dotM = new THREE.MeshBasicMaterial({ color: 0xffe040 });
  const dots = []; for (let k = 0; k < 16; k++) { const d = new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 6), dotM); scene.add(d); dots.push(d); }
  // frequency wave above cabinet
  const N = 90; const wavePos = new Float32Array(N * 3);
  const waveG = new THREE.BufferGeometry(); waveG.setAttribute('position', new THREE.BufferAttribute(wavePos, 3));
  const waveM = new THREE.LineBasicMaterial({ color: 0x40ff90 });
  const wave = new THREE.Line(waveG, waveM); wave.position.set(0, 2.75, 2.8); scene.add(wave);
  // signal pulse cabinet -> light
  const sig = new THREE.CatmullRomCurve3([V(7.8, 2.7, 2.8), V(7.2, 4, 1), V(6.6, 6.8, -.8), V(1.8, 6.8, -.8)]);
  const sigM = new THREE.MeshBasicMaterial({ color: 0x30ff70 });
  const sp = []; for (let k = 0; k < 8; k++) { const d = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 6), sigM); scene.add(d); sp.push(d); }

  // bicycle + detector stencil
  const bike = new THREE.Group(); scene.add(bike);
  const bfM = Mat({ color: 0xff8a30, shininess: 120 });
  for (const z of [-.75, .75]) { const w = new THREE.Mesh(new THREE.TorusGeometry(.5, .06, 10, 32), Mat({ color: 0x18181c })); w.rotation.y = Math.PI / 2; w.position.set(0, .56, z); bike.add(w); }
  const tube = (a, b) => { const c = new THREE.LineCurve3(a, b); bike.add(new THREE.Mesh(new THREE.TubeGeometry(c, 2, .05, 6), bfM)); };
  tube(V(0, .56, .75), V(0, 1.2, .1)); tube(V(0, 1.2, .1), V(0, .56, -.75)); tube(V(0, .56, .75), V(0, 1.45, .55)); tube(V(0, 1.2, .1), V(0, 1.25, -.5)); tube(V(0, .56, -.75), V(0, 1.25, -.5));
  const hb = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .7, 8), bfM); hb.rotation.z = Math.PI / 2; hb.position.set(0, 1.45, .55); bike.add(hb);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(.2, .08, .4), Mat({ color: 0x222222 })); seat.position.set(0, 1.3, -.55); bike.add(seat);
  const stencilM = Mat({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: .1 });
  for (const z of [2.3, 3.3]) { const c = new THREE.Mesh(new THREE.TorusGeometry(.32, .05, 6, 24), stencilM); c.rotation.x = Math.PI / 2; c.position.set(-2.2, .03, z); scene.add(c); }
  for (const z of [2.75, 2.85]) { const c = new THREE.Mesh(new THREE.BoxGeometry(.4, .03, .06), stencilM); c.position.set(-2.2, .03, z); scene.add(c); }
  const shots = [
    [[9, 9, 20], [2, 2.8, 2]],        // 0 hook
    [[2, 7, 9], [0, 0, 2.8]],          // 1 loop
    [[-4, 4, 9], [0, .6, 2.8]],        // 2 field
    [[-6, 3, 7], [0, 1, 2.8]],         // 3 car
    [[-6, 3.5, 8], [-2.2, .8, 2.8]],   // 4 bikes
    [[2, 4.2, 13], [3.8, 4.2, .5]],    // 5 signal
    [[-9, 8, 20], [2, 2.8, 2]],        // 6 recap
  ];
  shots.forEach(sh => { for (let i = 0; i < 3; i++) sh[0][i] = sh[1][i] + (sh[0][i] - sh[1][i]) * 1.2; });
  const cp = { p: V(), q: V() };
  function update(t, si, lt, sd) {
    const pulse = .5 + .5 * Math.sin(t * 6);
    // car position: arrives in hook, away in 1-2, rolls in during step 3, stays after
    let cz;
    if (si === 0) cz = lerp(18, 2.8, ease(lt / (sd * .8)));
    else if (si === 1 || si === 2) cz = 40;
    else if (si === 3) cz = lerp(16, 2.8, ease(lt / (sd * .6)));
    else if (si === 6) cz = lerp(2.8, -14, ease((lt - .5) / (sd * .8)));
    else cz = 2.8;
    car.position.set(0, 0, cz); car.visible = cz < 30;
    const over = Math.abs(cz - 2.8) < 1.6;
    const xr = si === 1 || si === 2 || si === 3;
    roadM.opacity = xr ? .45 : 1; roadM.depthWrite = !xr;
    bodyM.opacity = si === 3 ? .35 : 1; bodyM.depthWrite = si !== 3;
    loopM.emissive.setHex(0xff9030); loopM.emissiveIntensity = si === 1 ? .4 + .4 * pulse : si >= 2 ? .3 : 0;
    // current dots + field
    const live = si >= 2;
    dots.forEach((d, k) => { const o = (k / dots.length + t * .5) % 1; d.position.copy(curPath.getPoint(o)); d.visible = live || si === 0; });
    const squash = (si >= 3 && over) ? .55 : 1;
    field.forEach(r => { const o = (r.userData.o + t * .45) % 1; r.scale.set(2.4 * (1 - o * .2), 2.4 * (1 - o * .2), 1); r.position.y = .1 + o * 2.2 * squash; r.material.opacity = .6; r.visible = si >= 2 && si <= 3; });
    fieldM.opacity = .35 + .35 * (1 - ((t * .45) % 1)); fieldM.color.setHex(squash < 1 ? 0xff60d0 : 0x40d0ff);
    underM.emissive.setHex(0xff60d0); underM.emissiveIntensity = (si === 3 && over) ? .3 + .4 * pulse : 0;
    // wave: frequency rises when the car is over the loop
    const f = (over && si >= 3 && si <= 5) ? 9 : 5;
    for (let i = 0; i < N; i++) { const x = (i / (N - 1) - .5) * 2.6; wavePos[i * 3] = x; wavePos[i * 3 + 1] = Math.sin(x * f * 2 - t * 8) * .25; wavePos[i * 3 + 2] = 0; }
    waveG.attributes.position.needsUpdate = true; wave.visible = si >= 2 && si <= 3;
    waveM.color.setHex(f > 5 ? 0xff60d0 : 0x40ff90);
    detM.emissive.setHex(0x40ff90); detM.emissiveIntensity = si >= 2 && si <= 5 ? .3 + .5 * pulse : 0;
    // signal + lights
    sp.forEach((d, k) => { const o = (k / sp.length + t * .6) % 1; d.position.copy(sig.getPoint(o)); d.visible = si === 5 && lt < sd * .6; });
    let state = 0; // red
    if (si === 5) state = lt < sd * .45 ? 0 : lt < sd * .6 ? 1 : 2;
    if (si === 6) state = 2;
    // bike
    let bz = 40;
    if (si === 4) bz = lerp(14, 2.8, ease(lt / (sd * .6)));
    else if (si === 5) bz = 2.8;
    else if (si === 6) bz = lerp(2.8, -14, ease((lt - .5) / (sd * .8)));
    bike.position.set(-2.2, 0, bz); bike.visible = bz < 30;
    stencilM.emissiveIntensity = si === 4 ? .4 + .5 * pulse : .1;
    if (si === 4) { loopM.emissiveIntensity = .5 + .5 * pulse; }
    if (si === 0) state = 0;
    lamps.forEach((m, k) => { m.emissive.setHex(lampOn[k]); m.emissiveIntensity = k === state ? 1 : 0; });
    // camera
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const kk = si === 0 ? 1 : ease(lt / 1.4);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], kk))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], kk)));
    const o = Math.sin(t * .25) * .15, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o));
    camera.lookAt(cp.q);
  }
  return { update };
}
