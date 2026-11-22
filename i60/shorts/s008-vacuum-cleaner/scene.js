// Inside 60 — How a Vacuum Cleaner Works. Steps: 0 air pushes, 1 motor+fan, 2 low pressure, 3 air rushes in, 4 brush roll, 5 filter, 6 recap
export async function setup({ THREE, scene, camera }) {
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 50, specular: 0x333333, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  scene.background = new THREE.Color(0x141a30);
  scene.fog = new THREE.Fog(0x141a30, 24, 50);
  scene.add(new THREE.HemisphereLight(0xe8eeff, 0x283040, 1.4));
  const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(5, 9, 7); scene.add(key);
  const rim = new THREE.DirectionalLight(0x99bbff, 1.0); rim.position.set(-6, 4, -5); scene.add(rim);

  const M = new THREE.Group(); scene.add(M);
  const FY = -2.6;
  // carpet
  const carpet = new THREE.Mesh(new RoundedBoxGeometry(8, .3, 6, 3, .1), Mat({ color: 0x2f7f86, shininess: 4 })); carpet.position.set(0, FY - .15, 0); M.add(carpet);
  const tufts = []; for (let i = 0; i < 60; i++) { const m = new THREE.Mesh(new THREE.ConeGeometry(.05, .14, 5), Mat({ color: 0x3a9aa2, shininess: 2 })); m.position.set(-3.6 + (i * 1.37) % 7.2, FY + .06, -2.6 + (i * .91) % 5.2); M.add(m); tufts.push(m); }
  // dirt on the carpet in front of the nozzle
  const dirt = []; for (let i = 0; i < 26; i++) { const m = new THREE.Mesh(new THREE.DodecahedronGeometry(.06 + (i % 3) * .02), Mat({ color: i % 2 ? 0x8a5a2a : 0x6a4a2a })); m.position.set(-1.0 + (i * .53) % 2.0, FY + .05, .7 + (i * .37) % 1.4); M.add(m); dirt.push({ m, h: m.position.clone() }); }

  // floor head (cutaway)
  const headMat = Mat({ color: 0xff7a2a, transparent: true, opacity: 1, shininess: 70 });
  const head = new THREE.Mesh(new RoundedBoxGeometry(2.4, .5, 1.1, 4, .16), headMat); head.position.set(0, FY + .33, .2); M.add(head);
  // brush roll
  const brush = new THREE.Group(); brush.position.set(0, FY + .2, .35); M.add(brush);
  brush.add(new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, 2.1, 16).rotateZ(Math.PI / 2), Mat({ color: 0x404858 })));
  const brMat = Mat({ color: 0xffd23a, emissive: 0xffa000, emissiveIntensity: 0 });
  for (let i = 0; i < 28; i++) { const a = i * .9, x = -1.0 + i * (2.0 / 27); const b = new THREE.Mesh(new THREE.BoxGeometry(.05, .16, .05), brMat); b.position.set(x, Math.cos(a) * .19, Math.sin(a) * .19); b.rotation.x = a; brush.add(b); }

  // neck tube, dust bin, filter, motor housing, handle
  const clear = Mat({ color: 0xbfe6ff, transparent: true, opacity: .28, shininess: 100, specular: 0xffffff, depthWrite: false });
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, 1.85, 20, 1, true), clear); neck.position.set(0, FY + 1.48, 0); M.add(neck);
  const neckRing = new THREE.Mesh(new THREE.TorusGeometry(.21, .04, 8, 24).rotateX(Math.PI / 2), Mat({ color: 0xff7a2a })); neckRing.position.set(0, FY + .6, 0); M.add(neckRing);
  const binMat = Mat({ color: 0xbfe6ff, transparent: true, opacity: .3, shininess: 100, specular: 0xffffff, depthWrite: false });
  const bin = new THREE.Mesh(new THREE.CylinderGeometry(.62, .62, 1.6, 32, 1, true), binMat); bin.position.set(0, .4, 0); M.add(bin);
  const binBase = new THREE.Mesh(new THREE.CylinderGeometry(.64, .5, .14, 32), Mat({ color: 0xff7a2a })); binBase.position.set(0, -.45, 0); M.add(binBase);
  const pileMat = Mat({ color: 0x7a5530, shininess: 5 });
  const pile = new THREE.Mesh(new THREE.CylinderGeometry(.55, .58, 1, 28), pileMat); pile.position.set(0, -.38, 0); pile.scale.y = .02; M.add(pile);
  const filterMat = Mat({ color: 0xf2f2f2, emissive: 0x30ff9a, emissiveIntensity: 0, shininess: 10 });
  const filter = new THREE.Group(); filter.position.set(0, 1.32, 0); M.add(filter);
  filter.add(new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, .16, 32), filterMat));
  for (let i = 0; i < 16; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(.04, .2, 1.1), Mat({ color: 0xd8d8d8 })); p.rotation.y = i * Math.PI / 16; filter.add(p); }
  const houseMat = Mat({ color: 0x3a4256, transparent: true, opacity: 1, shininess: 70 });
  const house = new THREE.Mesh(new THREE.CylinderGeometry(.55, .62, 1.05, 32), houseMat); house.position.set(0, 1.95, 0); M.add(house);
  const vents = []; for (let i = 0; i < 10; i++) { const v = new THREE.Mesh(new RoundedBoxGeometry(.1, .3, .06, 2, .02), Mat({ color: 0x1a1e2a })); const a = i * Math.PI / 5; v.position.set(Math.cos(a) * .56, 2.2, Math.sin(a) * .56); v.rotation.y = -a; M.add(v); vents.push(v); }
  const handle = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(0, 2.45, 0), V(0, 2.95, -.25), V(0, 3.25, -.75), V(0, 2.9, -1.05), V(0, 2.3, -.75)]), 40, .1, 10), Mat({ color: 0x2a3040 })); M.add(handle);
  // motor + fan inside the housing
  const fanG = new THREE.Group(); fanG.position.set(0, 1.58, 0); M.add(fanG);
  const fanMat = Mat({ color: 0xc8d4e6, emissive: 0x3aa8ff, emissiveIntensity: 0, shininess: 90, specular: 0x999999 });
  fanG.add(new THREE.Mesh(new THREE.CylinderGeometry(.46, .46, .04, 28), fanMat));
  for (let i = 0; i < 9; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.42, .14, .035), fanMat); const p = new THREE.Group(); p.rotation.y = i * Math.PI * 2 / 9; b.position.x = .24; b.rotation.y = .5; p.add(b); fanG.add(p); }
  const blur = new THREE.Mesh(new THREE.CylinderGeometry(.48, .48, .16, 28), new THREE.MeshBasicMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0, depthWrite: false })); blur.position.set(0, 1.58, 0); M.add(blur);
  const motorMat = Mat({ color: 0xc87533, emissive: 0xff5a00, emissiveIntensity: 0, shininess: 80 });
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .5, 24), motorMat); motor.position.set(0, 2.0, 0); M.add(motor);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .6, 8), Mat({ color: 0xdddddd })); shaft.position.set(0, 1.75, 0); M.add(shaft);
  // low-pressure glow inside
  const lowMat = new THREE.MeshBasicMaterial({ color: 0x3a8aff, transparent: true, opacity: 0, depthWrite: false });
  const low = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, 1.45, 28), lowMat); low.position.set(0, .45, 0); M.add(low);
  const lowNeck = new THREE.Mesh(new THREE.CylinderGeometry(.17, .17, 1.8, 16), lowMat); lowNeck.position.set(0, FY + 1.48, 0); M.add(lowNeck);

  // airflow path: floor -> under head -> neck -> swirl in bin -> filter -> fan
  const path = [V(0, FY + .12, 1.6), V(0, FY + .12, .7), V(0, FY + .25, .15), V(0, FY + .9, 0), V(0, -.6, 0), V(0, -.3, 0)];
  for (let i = 0; i <= 14; i++) { const a = i * 1.1, y = lerp(-.15, 1.05, i / 14); path.push(V(Math.cos(a) * .42, y, Math.sin(a) * .42)); }
  path.push(V(0, 1.3, 0), V(0, 1.58, 0));
  const air = new THREE.CatmullRomCurve3(path, false, 'catmullrom', .3);
  const dustPath = path.slice(0, 6); for (let i = 0; i <= 10; i++) { const a = i * 1.1, y = lerp(-.1, -.25, i / 10); dustPath.push(V(Math.cos(a) * lerp(.45, .2, i / 10), y, Math.sin(a) * lerp(.45, .2, i / 10))); }
  const dustC = new THREE.CatmullRomCurve3(dustPath, false, 'catmullrom', .3);
  const mk = (c, r) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, depthWrite: false })); M.add(m); return m; };
  const airP = []; for (let i = 0; i < 40; i++) airP.push({ m: mk(0x9fe8ff, .07), o: i / 40 });
  const dustP = []; for (let i = 0; i < 22; i++) dustP.push({ m: mk(0xc08040, .09), o: i / 22 });
  const room = []; for (let i = 0; i < 30; i++) room.push({ m: mk(0xbff0ff, .08), o: i / 30, a: -Math.PI * .1 + (i * 2.39) % (Math.PI * 1.2), y: (i % 5) * .25 });
  const exh = []; for (let i = 0; i < 24; i++) exh.push({ m: mk(0xe8fff4, .08), o: i / 24, a: i * Math.PI / 6 + (i % 2) * .26 });

  const shots = [
    [[6.0, 1.0, 19.5], [0, -.5, 0]],
    [[2.4, 2.6, 4.6], [0, 1.8, 0]],
    [[3.6, 1.0, 7.4], [0, .3, 0]],
    [[2.8, -1.1, 6.8], [0, -2.0, .5]],
    [[3.0, -1.5, 3.4], [0, -2.35, .3]],
    [[-3.2, 1.3, 6.0], [0, .6, 0]],
    [[-5.5, 1.0, 19.5], [0, -.5, 0]],
  ];
  const cur = { p: V(), q: V() };
  let fanA = 0, brA = 0, lastT = 0, flowA = 0, flowD = 0, dirtTaken = 0;

  function update(t, si, lt, sd) {
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const k = si === 0 ? 1 : ease(lt / 1.3);
    cur.p.set(...prev[0].map((v, i) => lerp(v, now[0][i], k)));
    cur.q.set(...prev[1].map((v, i) => lerp(v, now[1][i], k)));
    const o = Math.sin(t * .15) * .08;
    camera.position.set(cur.p.x * Math.cos(o) - cur.p.z * Math.sin(o), cur.p.y, cur.p.z * Math.cos(o) + cur.p.x * Math.sin(o));
    camera.lookAt(cur.q);
    const dt = Math.max(0, Math.min(.1, t - lastT)); lastT = t;
    const focus = s => si === s ? 1 : 0;

    // cutaway after the hook
    const xr = si === 0 ? ease((lt - 2.2) / 1.2) : si === 6 ? 1 - ease((lt - 1.2) / 1.2) * .5 : 1;
    headMat.opacity = 1 - xr * .75; headMat.depthWrite = headMat.opacity > .9;
    houseMat.opacity = 1 - xr * .8; houseMat.depthWrite = houseMat.opacity > .9;

    // machine power: on from the start
    const on = si === 0 ? ease((lt - .4) / 1.2) : 1;
    fanA += dt * 9 * on * (si === 1 ? 1.6 : 1); fanG.rotation.y = fanA;
    blur.material.opacity = on * (.15 + focus(1) * .25);
    motorMat.emissiveIntensity = .1 + focus(1) * (.5 + .3 * Math.sin(t * 12));
    fanMat.emissiveIntensity = focus(1) * (.4 + .2 * Math.sin(t * 8));
    motor.position.x = focus(1) * .01 * Math.sin(t * 60);
    brA += dt * 10 * on * (si === 4 ? 1.5 : 1); brush.rotation.x = -brA;
    brMat.emissiveIntensity = focus(4) * (.6 + .3 * Math.sin(t * 6));

    // low pressure glow
    const lp = focus(2) * ease((lt - .5) / 1) * (.25 + .12 * Math.sin(t * 4)) + (si === 0 ? 0 : .04);
    lowMat.opacity = lp;

    // flowing air + dust
    flowA += dt * .16 * on; flowD += dt * .11 * on;
    const airVis = (si === 0 ? ease((lt - 2.4) / 1) : 1) * (si === 3 || si === 2 || si === 5 ? 1 : .6);
    airP.forEach(({ m, o: oo }) => { const u = (flowA + oo) % 1; m.position.copy(air.getPoint(u)); m.material.opacity = airVis * .85 * Math.min(1, u * 8, (1 - u) * 8); });
    const dVis = si === 0 ? ease((lt - 2.4) / 1) : 1;
    dustP.forEach(({ m, o: oo }) => { const u = (flowD + oo) % 1; m.position.copy(dustC.getPoint(u)); m.material.opacity = dVis * Math.min(1, u * 8, (1 - u) * 10); });
    // dirt on carpet gets picked up over time; pile grows
    dirtTaken = Math.min(1, t / 40);
    dirt.forEach(({ m, h }, i) => { const gone = i / dirt.length < dirtTaken; m.visible = !gone; if (!gone && si === 4) m.position.y = h.y + Math.abs(Math.sin(t * 9 + i)) * .06; else m.position.y = h.y; });
    pile.scale.y = .02 + dirtTaken * .28; pile.position.y = -.38 + pile.scale.y / 2;
    filterMat.emissiveIntensity = focus(5) * (.45 + .25 * Math.sin(t * 5));
    filterMat.color.setHex(si >= 5 ? 0xe6dccb : 0xf2f2f2);

    // room air pushed toward the nozzle (hook + step 3)
    const rv = si === 0 ? 1 - ease((lt - 3.6) / .8) * .6 : si === 3 ? 1 : si === 6 ? .6 : 0;
    room.forEach(({ m, o: oo, a, y }) => { const u = (t * .35 + oo) % 1; const r = lerp(3.2, .3, u * u); m.position.set(Math.sin(a) * r, FY + .2 + y * (1 - u), .5 + Math.cos(a) * r); m.material.opacity = rv * .9 * Math.min(1, u * 5, (1 - u) * 5); });
    // exhaust: clean air out of the vents
    const ev = on * (si === 5 ? 1 : si === 2 ? .9 : .35);
    exh.forEach(({ m, o: oo, a }) => { const u = (t * .7 + oo) % 1; const r = .6 + u * 1.6; m.position.set(Math.cos(a) * r, 2.2 + u * .5, Math.sin(a) * r); m.material.opacity = ev * (1 - u) * .9; });
  }
  return { update };
}
