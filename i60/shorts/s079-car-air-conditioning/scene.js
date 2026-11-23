// Inside 60 — Car air conditioning. Steps: 0 hook loop overview (heat moved out), 1 compressor, 2 condenser, 3 expansion valve, 4 evaporator (-30C), 5 fan + cool air to vents, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 90, specular: 0x555555, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x131a2b); scene.fog = new THREE.Fog(0x131a2b, 30, 80);
  scene.add(new THREE.HemisphereLight(0xf4f8ff, 0x404050, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(6, 10, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0x90c0ff, .6); rim.position.set(-6, 4, -8); scene.add(rim);

  // floor: warm "outside / engine bay" half (left), cool "cabin" half (right)
  const fW = new THREE.Mesh(new THREE.BoxGeometry(5, .1, 6), Mat({ color: 0x4a3328, shininess: 10 })); fW.position.set(-2.4, -2.75, 0); scene.add(fW);
  const fC = new THREE.Mesh(new THREE.BoxGeometry(5, .1, 6), Mat({ color: 0x22384e, shininess: 10 })); fC.position.set(2.6, -2.75, 0); scene.add(fC);
  const wall = new THREE.Mesh(new THREE.BoxGeometry(.08, 5.4, 6), Mat({ color: 0x8090a0, transparent: true, opacity: .16 })); wall.position.set(.1, 0, 0); scene.add(wall);

  // refrigerant path (polyline)
  const pts = [];
  pts.push(V(-1.8, -1.05, 0), V(-1.8, .35, 0));
  const condRows = [.75, 1.1, 1.45, 1.8, 2.15];
  condRows.forEach((y, i) => { const a = i % 2 ? -.9 : -2.7, b = i % 2 ? -2.7 : -.9; pts.push(V(a, y, 0), V(b, y, 0)); });
  pts.push(V(-.9, 2.6, 0), V(.55, 2.6, 0)); const iValve = pts.length - 1; pts.push(V(1.05, 2.6, 0));
  pts.push(V(1.7, 2.6, 0), V(1.7, .55, 0));
  const evRows = [.25, -.1, -.45, -.8, -1.15];
  evRows.forEach((y, i) => { const a = i % 2 ? 2.6 : .8, b = i % 2 ? .8 : 2.6; pts.push(V(a, y, 0), V(b, y, 0)); });
  pts.push(V(2.6, -1.9, 0), V(-1.2, -1.9, 0), V(-1.8, -1.9, 0), V(-1.8, -1.55, 0));
  // cumulative lengths
  const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
  const TOT = cum[cum.length - 1];
  const at = u => { let d = ((u % 1) + 1) % 1 * TOT, i = 1; while (i < cum.length - 1 && cum[i] < d) i++; const k = (d - cum[i - 1]) / (cum[i] - cum[i - 1]); return pts[i - 1].clone().lerp(pts[i], k); };
  const uOf = i => cum[i] / TOT;
  const U_CIN = uOf(2), U_COUT = uOf(2 + condRows.length * 2 - 1), U_VAL = uOf(iValve), U_EIN = uOf(iValve + 4), U_EOUT = uOf(iValve + 3 + evRows.length * 2);
  function pathTube(i0, i1, mat, r) {
    const cp = new THREE.CurvePath(); for (let i = i0; i < i1; i++) cp.add(new THREE.LineCurve3(pts[i], pts[i + 1]));
    const m = new THREE.Mesh(new THREE.TubeGeometry(cp, (i1 - i0) * 12, r, 10, false), mat); scene.add(m);
    for (let i = i0 + 1; i < i1; i++) { const j = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), mat); j.position.copy(pts[i]); scene.add(j); }
    return m;
  }
  const hotM = Mat({ color: 0xff4a30, emissive: 0xff2010, emissiveIntensity: .25 });
  const warmM = Mat({ color: 0xffa040, emissive: 0xff8020, emissiveIntensity: .2 });
  const coldM = Mat({ color: 0x40a8ff, emissive: 0x2080ff, emissiveIntensity: .25 });
  const coolM = Mat({ color: 0x80d8ff, emissive: 0x40b0ff, emissiveIntensity: .2 });
  pathTube(0, 2 + condRows.length * 2 - 1, hotM, .075);
  pathTube(2 + condRows.length * 2 - 1, iValve, warmM, .06);
  pathTube(iValve + 1, iValve + 3 + evRows.length * 2, coldM, .075);
  pathTube(iValve + 3 + evRows.length * 2, pts.length - 1, coolM, .09);

  // compressor (axis z) with spinning pulley
  const compM = Mat({ color: 0x8a94a8, emissive: 0x000000, shininess: 140 });
  const comp = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, 1.1, 32), compM); comp.rotation.x = Math.PI / 2; comp.position.set(-1.8, -1.6, -.2); scene.add(comp);
  const pulley = new THREE.Group(); pulley.position.set(-1.8, -1.6, .45); scene.add(pulley);
  { const p = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, .22, 32), Mat({ color: 0x30343c })); p.rotation.x = Math.PI / 2; pulley.add(p);
    for (let k = 0; k < 3; k++) { const s = new THREE.Mesh(new THREE.BoxGeometry(.85, .12, .06), Mat({ color: 0xffc040 })); s.position.z = .13; s.rotation.z = k / 3 * Math.PI; pulley.add(s); } }
  // belt to engine pulley
  const engP = new THREE.Mesh(new THREE.CylinderGeometry(.35, .35, .2, 24), Mat({ color: 0x30343c })); engP.rotation.x = Math.PI / 2; engP.position.set(-3.1, -2.2, .45); scene.add(engP);
  const beltM = Mat({ color: 0x15171c });
  [[V(-1.8, -1.1, .45), V(-3.1, -1.85, .45)], [V(-1.8, -2.1, .45), V(-3.1, -2.55, .45)]].forEach(([a, b]) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, a.distanceTo(b), 8), beltM); c.position.copy(a).add(b).multiplyScalar(.5); c.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize()); scene.add(c); });
  // condenser: frame + fins
  const finM = Mat({ color: 0xb0b8c4, transparent: true, opacity: .55, emissive: 0x000000 });
  const condF = new THREE.Group(); scene.add(condF);
  for (let k = 0; k < 16; k++) { const f = new THREE.Mesh(new THREE.BoxGeometry(.02, 1.85, .4), finM); f.position.set(-2.75 + k * .125, 1.45, 0); condF.add(f); }
  { const fr = Mat({ color: 0x3a4250 }); [[-1.8, .5, 2.1, .08], [-1.8, 2.4, 2.1, .08]].forEach(([x, y, w, h]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, .45), fr); m.position.set(x, y, 0); condF.add(m); }); }
  // expansion valve block
  const valM = Mat({ color: 0xd8a040, emissive: 0x000000, shininess: 160 });
  const valve = new THREE.Mesh(new THREE.BoxGeometry(.5, .45, .45), valM); valve.position.set(.8, 2.6, 0); scene.add(valve);
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, .3, 14), valM); knob.position.set(.8, 2.95, 0); scene.add(knob);
  // evaporator fins
  const evFinM = Mat({ color: 0xc0d8ec, transparent: true, opacity: .55, emissive: 0x000000 });
  for (let k = 0; k < 15; k++) { const f = new THREE.Mesh(new THREE.BoxGeometry(.02, 1.7, .4), evFinM); f.position.set(.85 + k * .125, -.45, 0); scene.add(f); }
  { const fr = Mat({ color: 0x3a4250 }); [[1.7, .45], [1.7, -1.35]].forEach(([x, y]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(2.0, .08, .45), fr); m.position.set(x, y, 0); scene.add(m); }); }
  // blower fan behind evaporator (axis z)
  const fan = new THREE.Group(); fan.position.set(1.7, -.45, -.75); scene.add(fan);
  const fanM = Mat({ color: 0x5a6478, emissive: 0x000000 });
  for (let k = 0; k < 6; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.18, .75, .04), fanM); b.position.y = .4; const g = new THREE.Group(); g.rotation.z = k / 6 * Math.PI * 2; b.rotation.y = .5; g.add(b); fan.add(g); }
  { const hub = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, .14, 16), fanM); hub.rotation.x = Math.PI / 2; fan.add(hub); }
  // dashboard vent in front of evaporator
  const ventG = new THREE.Group(); scene.add(ventG);
  const vent = new THREE.Mesh(new THREE.BoxGeometry(1.4, .45, .2), Mat({ color: 0x252a33 })); vent.position.set(1.7, -.45, 1.7); ventG.add(vent);
  for (let k = 0; k < 4; k++) { const s = new THREE.Mesh(new THREE.BoxGeometry(1.3, .03, .22), Mat({ color: 0x8a94a4 })); s.position.set(1.7, -.6 + k * .1, 1.72); ventG.add(s); }

  // refrigerant particles
  const dotG = new THREE.SphereGeometry(.075, 10, 8);
  const dots = []; for (let k = 0; k < 64; k++) { const m = new THREE.MeshBasicMaterial({ color: 0xffffff }); const d = new THREE.Mesh(dotG, m); d.userData.o = k / 64; scene.add(d); dots.push(d); }
  const cHot = new THREE.Color(0xff3a20), cWarm = new THREE.Color(0xffb040), cCold = new THREE.Color(0x3aa0ff), cCool = new THREE.Color(0xa0e8ff), tc = new THREE.Color();
  function colAt(u) {
    if (u < U_CIN) return tc.copy(cHot);
    if (u < U_COUT) return tc.copy(cHot).lerp(cWarm, (u - U_CIN) / (U_COUT - U_CIN));
    if (u < U_VAL) return tc.copy(cWarm);
    if (u < U_EIN) return tc.copy(cCold);
    if (u < U_EOUT) return tc.copy(cCold).lerp(cCool, (u - U_EIN) / (U_EOUT - U_EIN));
    return tc.copy(cCool);
  }
  // heat out of condenser (to -z / up), cool air out of evaporator (to +z)
  const heat = []; for (let k = 0; k < 22; k++) { const m = new THREE.MeshBasicMaterial({ color: 0xff7030, transparent: true, opacity: .8 }); const p = new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 6), m); p.userData = { o: Math.random(), x: -2.7 + Math.random() * 1.8, y: .7 + Math.random() * 1.5 }; scene.add(p); heat.push(p); }
  const air = []; for (let k = 0; k < 26; k++) { const m = new THREE.MeshBasicMaterial({ color: 0x9fe4ff, transparent: true, opacity: .8 }); const p = new THREE.Mesh(new THREE.BoxGeometry(.05, .05, .35), m); p.userData = { o: Math.random(), x: .9 + Math.random() * 1.6, y: -1.3 + Math.random() * 1.7 }; scene.add(p); air.push(p); }
  const mist = []; for (let k = 0; k < 14; k++) { const m = new THREE.MeshBasicMaterial({ color: 0xc8ecff, transparent: true, opacity: .8 }); const p = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 6), m); p.userData.o = k / 14; scene.add(p); mist.push(p); }

  const shots = [
    [[1.5, .6, 17.5], [-.4, -.5, 0]],        // 0 overview
    [[.2, -.2, 7.0], [-2.1, -1.4, .2]],       // 1 compressor
    [[-.4, 2.0, 7.2], [-1.8, 1.0, 0]],        // 2 condenser
    [[2.8, 3.4, 4.6], [1.0, 2.2, 0]],           // 3 expansion valve
    [[3.4, .6, 7.6], [1.7, .05, 0]],          // 4 evaporator
    [[5.2, .6, 6.6], [1.6, -.3, .8]],          // 5 fan + vent airflow
    [[-2.4, 1.2, 17.5], [-.4, -.5, 0]],            // 6 recap
  ];
  const cp = { p: V(), q: V() };
  let flow = 0, lastT = 0, pAng = 0, fAng = 0;
  function update(t, si, lt, sd) {
    const dt = Math.min(.1, Math.max(0, t - lastT)); lastT = t;
    const pulse = .5 + .5 * Math.sin(t * 7);
    flow += .09 * dt; pAng += 9 * dt; fAng += 12 * dt;
    pulley.rotation.z = -pAng; ventG.visible = si !== 4; engP.rotation.y = 0; fan.rotation.z = -fAng;
    dots.forEach(d => { const u = (d.userData.o + flow) % 1; d.position.copy(at(u)); d.position.z += .0; d.material.color.copy(colAt(u)); d.scale.setScalar(u > U_VAL && u < U_EIN ? .85 : 1); });
    // glows by step
    compM.emissive.setHex(0xff5020); compM.emissiveIntensity = si === 1 ? .25 + .25 * pulse : 0;
    hotM.emissiveIntensity = si === 1 || si === 2 ? .5 + .3 * pulse : .25;
    finM.emissive.setHex(0xff6020); finM.emissiveIntensity = si === 2 ? .3 + .2 * pulse : 0;
    valM.emissive.setHex(0xffa020); valM.emissiveIntensity = si === 3 ? .35 + .3 * pulse : 0;
    coldM.emissiveIntensity = si === 3 || si === 4 ? .55 + .3 * pulse : .25;
    evFinM.emissive.setHex(0x3090ff); evFinM.emissiveIntensity = si === 4 || si === 5 ? .3 + .2 * pulse : 0;
    fanM.emissive.setHex(0x3080ff); fanM.emissiveIntensity = si === 5 ? .3 + .2 * pulse : 0;
    heat.forEach(p => { const u = p.userData, a = (t * .45 + u.o) % 1; p.visible = si !== 3 && si !== 4 && si !== 5; p.position.set(u.x - a * .4, u.y + a * 1.4, -.25 - a * 2.2); p.material.opacity = .85 * (1 - a); p.scale.setScalar(.6 + a); });
    air.forEach(p => { const u = p.userData, a = (t * .6 + u.o) % 1; p.visible = si >= 4 || si === 0; p.position.set(u.x, u.y, .3 + a * 3.0); p.material.opacity = .85 * (1 - a * .8); });
    mist.forEach(p => { const a = (t * 1.2 + p.userData.o) % 1; p.visible = si === 3 || si === 0 || si === 6; const ang = p.userData.o * 6.28; p.position.set(1.08 + a * .55, 2.6 + Math.sin(ang) * a * .16, Math.cos(ang) * a * .16); p.material.opacity = .9 * (1 - a); });
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
