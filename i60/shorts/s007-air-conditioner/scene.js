// Inside 60 — How an Air Conditioner Works. Steps: 0 moves heat, 1 evaporator, 2 compressor, 3 condenser, 4 expansion valve, 5 drip, 6 recap
export async function setup({ THREE, scene, camera }) {
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 50, specular: 0x333333, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  scene.background = new THREE.Color(0x10182c);
  scene.fog = new THREE.Fog(0x10182c, 22, 48);
  scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x202838, 1.4));
  const key = new THREE.DirectionalLight(0xffffff, 2.1); key.position.set(5, 9, 7); scene.add(key);
  const rim = new THREE.DirectionalLight(0x88aaff, 1.0); rim.position.set(-6, 4, -5); scene.add(rim);

  const M = new THREE.Group(); scene.add(M);
  const FY = -1.1;
  // room floor (left, warm wood) and outside ground (right, green)
  const roomFloor = new THREE.Mesh(new THREE.BoxGeometry(4.2, .2, 4), Mat({ color: 0x8a5a3a, shininess: 20 })); roomFloor.position.set(-2.1, FY - .1, 0); M.add(roomFloor);
  const ground = new THREE.Mesh(new THREE.BoxGeometry(4.2, .2, 4), Mat({ color: 0x3a8a4a, shininess: 5 })); ground.position.set(2.1, FY - .1, 0); M.add(ground);
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(4.2, 5.4, .2), Mat({ color: 0xf0e2c8, shininess: 10 })); backWall.position.set(-2.1, FY + 2.7, -1.9); M.add(backWall);
  const wallMat = Mat({ color: 0xd9c9a8, transparent: true, opacity: .9 });
  const wall = new THREE.Mesh(new THREE.BoxGeometry(.3, 5.4, 4), wallMat); wall.position.set(0, FY + 2.7, 0); M.add(wall);
  // room temperature tint light
  const roomLight = new THREE.PointLight(0xff7a30, 0, 7); roomLight.position.set(-2, 1.2, 1); M.add(roomLight);

  // indoor unit on the back wall
  const inMat = Mat({ color: 0xf4f6fa, transparent: true, opacity: 1, shininess: 80 });
  const indoor = new THREE.Mesh(new RoundedBoxGeometry(2.8, 1.0, .8, 4, .2), inMat); indoor.position.set(-1.9, 3.2, -1.4); M.add(indoor);
  const louver = new THREE.Mesh(new RoundedBoxGeometry(2.4, .08, .3, 2, .03), Mat({ color: 0xb8c2d0 })); louver.position.set(-1.9, 2.68, -1.05); louver.rotation.x = .5; M.add(louver);
  // outdoor unit
  const outMat = Mat({ color: 0xc8d0dc, transparent: true, opacity: 1, shininess: 60 });
  const outdoor = new THREE.Mesh(new RoundedBoxGeometry(2.4, 2.0, 1.8, 4, .15), outMat); outdoor.position.set(2.0, FY + 1.0, 0); M.add(outdoor);
  const fan = new THREE.Group(); fan.position.set(2.0, FY + 2.05, 0); M.add(fan);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.75, .06, 8, 40), Mat({ color: 0x3a4256 })); ring.rotation.x = Math.PI / 2; fan.add(ring);
  const blades = new THREE.Group(); fan.add(blades);
  for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new RoundedBoxGeometry(.65, .04, .26, 2, .02), Mat({ color: 0x5a6478 })); b.position.x = .36; const p = new THREE.Group(); p.rotation.y = i * Math.PI / 2; b.rotation.x = .35; p.add(b); blades.add(p); }

  // compressor
  const compMat = Mat({ color: 0x3a4256, emissive: 0xff3a00, emissiveIntensity: 0, shininess: 70 });
  const comp = new THREE.Mesh(new THREE.CapsuleGeometry(.38, .6, 6, 20), compMat); comp.position.set(1.35, FY + .75, .25); M.add(comp);
  // coils (serpentines)
  function serp(x0, x1, y0, y1, z, n, vertical) {
    const p = [];
    for (let i = 0; i <= n; i++) {
      const f = i / n;
      if (vertical) { const y = lerp(y0, y1, f); p.push(V(i % 2 ? x1 : x0, y, z), V(i % 2 ? x0 : x1, y, z)); }
      else { const x = lerp(x0, x1, f); p.push(V(x, i % 2 ? y1 : y0, z), V(x, i % 2 ? y0 : y1, z)); }
    }
    return p;
  }
  const evapPts = serp(-3.0, -.8, 2.95, 3.45, -1.25, 7, false);
  const condPts = serp(2.9, 1.1, FY + .25, FY + 1.75, -.72, 5, true);
  const loop = [
    ...evapPts,                                    // evaporator (indoor)
    V(-.5, 3.4, -1.1), V(0, 3.3, -.7), V(.7, 2.6, -.2), V(1.3, 1.4, .25), // suction line to compressor
    V(1.35, FY + 1.25, .25),                       // into compressor top
    V(1.35, FY + .2, .3), V(2.0, FY + .15, .1),    // discharge (hot)
    ...condPts.reverse(),                         // condenser (outdoor)
    V(1.1, FY + 2.0, -.3), V(.75, 1.6, .2),        // to valve
    V(.45, 2.0, .3), V(0, 2.4, .0), V(-.6, 2.75, -.7), V(-2.9, 2.85, -1.05) // cold liquid back inside
  ];
  const N = loop.length;
  const iEvapEnd = evapPts.length - 1, iCompIn = iEvapEnd + 5, iCompOut = iCompIn + 2, iCondEnd = iCompOut + condPts.length, iValve = iCondEnd + 2;
  const curve = new THREE.CatmullRomCurve3(loop, true, 'catmullrom', .2);
  const tubeMat = Mat({ color: 0x9aa6bb, shininess: 90, specular: 0x888888 });
  M.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 600, .07, 8, true), tubeMat));
  const evapMat = Mat({ color: 0x5ad1ff, emissive: 0x1a8aff, emissiveIntensity: 0 });
  const condMat = Mat({ color: 0xff8a3d, emissive: 0xff4a00, emissiveIntensity: 0 });
  const fins = (pts, mat) => { const g = new THREE.Group(); M.add(g); const bb = new THREE.Box3().setFromPoints(pts); const s = bb.getSize(V()), c = bb.getCenter(V()); const pl = new THREE.Mesh(new THREE.BoxGeometry(s.x + .2, s.y + .2, .06), mat); pl.position.copy(c); pl.position.z -= .1; g.add(pl); return pl; };
  const evapFins = fins(evapPts, evapMat), condFins = fins(condPts, condMat);
  // expansion valve
  const valveMat = Mat({ color: 0xd4a640, emissive: 0x3aa8ff, emissiveIntensity: 0, shininess: 90, specular: 0xaaaaaa });
  const valve = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, .5, 18), valveMat); valve.position.copy(curve.getPoint(iValve / N)); valve.rotation.z = .7; M.add(valve);

  // refrigerant particles
  const ref = []; for (let i = 0; i < 70; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(.1, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 })); M.add(m); ref.push({ m, o: i / 70 }); }
  const cCold = new THREE.Color(0x2a7cff), cCool = new THREE.Color(0x8fe4ff), cHot = new THREE.Color(0xff3a1a), cWarm = new THREE.Color(0xffb03a), tmpC = new THREE.Color();
  function refColor(idx) {
    if (idx <= iEvapEnd) return tmpC.copy(cCold).lerp(cCool, idx / iEvapEnd);
    if (idx <= iCompIn) return tmpC.copy(cCool);
    if (idx <= iCondEnd) return tmpC.copy(cHot).lerp(cWarm, Math.max(0, idx - iCompOut) / (iCondEnd - iCompOut));
    if (idx <= iValve) return tmpC.copy(cWarm);
    return tmpC.copy(cCold);
  }
  // air: room heat into unit, cool air out; outdoor heat up and away
  const heatIn = [], coolOut = [], heatOut = [], hook = [];
  const mk = (c, r) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, depthWrite: false })); M.add(m); return m; };
  for (let i = 0; i < 18; i++) heatIn.push({ m: mk(0xff7a30, .09), o: i / 18, x: -3 + (i * .37) % 2.4 });
  for (let i = 0; i < 18; i++) coolOut.push({ m: mk(0x9fe8ff, .09), o: i / 18, x: -3 + (i * .53) % 2.4 });
  for (let i = 0; i < 20; i++) heatOut.push({ m: mk(0xff5a2a, .11), o: i / 20, a: i * 2.4 });
  for (let i = 0; i < 14; i++) hook.push({ m: mk(0xff6a20, .16), o: i / 14 });
  const hookCurve = new THREE.QuadraticBezierCurve3(V(-2.2, 1.0, .6), V(0, 5.6, .6), V(2.6, 2.6, .6));
  // drips
  const drain = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(-.7, 2.7, -1.2), V(-.3, 2.5, -1.0), V(.4, 2.3, -.9), V(.6, 1.0, -.9)]), 30, .05, 8), Mat({ color: 0xdfe6ee })); M.add(drain);
  const drops = []; for (let i = 0; i < 6; i++) drops.push({ m: mk(0x5ac8ff, .13), o: i / 6 });
  const condensate = []; for (let i = 0; i < 16; i++) { const m = mk(0xcff4ff, .09); m.position.set(-2.9 + (i * .29) % 2.1, 2.95 + (i % 3) * .2, -1.15); condensate.push(m); }

  const shots = [
    [[.8, 3.4, 16.0], [0, 1.6, 0]],
    [[-4.0, 3.8, 8.0], [-1.7, 2.9, -1.0]],
    [[5.2, 1.6, 8.0], [1.4, .1, 0]],
    [[3.8, 4.4, 9.0], [1.9, .6, -.3]],
    [[2.4, 2.6, 7.4], [.5, 1.7, 0]],
    [[-5.0, 2.4, 9.0], [-1.6, 2.4, -.8]],
    [[.8, 3.6, 16.5], [0, 1.6, 0]],
  ];
  const cur = { p: V(), q: V() };
  let flowU = 0, fanA = 0, lastT = 0;

  function update(t, si, lt, sd) {
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const k = si === 0 ? 1 : ease(lt / 1.3);
    cur.p.set(...prev[0].map((v, i) => lerp(v, now[0][i], k)));
    cur.q.set(...prev[1].map((v, i) => lerp(v, now[1][i], k)));
    const o = Math.sin(t * .15) * .06;
    camera.position.set(cur.p.x * Math.cos(o) - cur.p.z * Math.sin(o), cur.p.y, cur.p.z * Math.cos(o) + cur.p.x * Math.sin(o));
    camera.lookAt(cur.q);
    const dt = Math.max(0, Math.min(.1, t - lastT)); lastT = t;

    // units open up after the hook
    const xr = si === 0 ? ease((lt - 2.4) / 1.2) : si === 6 ? 1 - ease((lt - 1) / 1.2) * .6 : 1;
    inMat.opacity = 1 - xr * .8; inMat.depthWrite = inMat.opacity > .9;
    outMat.opacity = 1 - xr * .78; outMat.depthWrite = outMat.opacity > .9;
    // room cools over the video
    roomLight.intensity = si === 0 ? 2.5 : Math.max(0, 2.5 - si * .5);
    roomLight.color.setHex(si >= 4 ? 0x5aa8ff : 0xff7a30);

    // refrigerant flow
    const fl = si === 0 ? ease((lt - 2.6) / 1) : 1;
    flowU += dt * .045 * fl;
    ref.forEach(({ m, o: oo }) => { const u = (flowU + oo) % 1; m.position.copy(curve.getPoint(u)); m.material.color.copy(refColor(u * N)); m.material.opacity = fl * .95; m.scale.setScalar(u * N > iCompOut && u * N < iCondEnd ? 1.25 : 1); });
    const focus = (s) => si === s ? 1 : 0;
    evapMat.emissiveIntensity = .25 + focus(1) * (.6 + .3 * Math.sin(t * 5)) + focus(4) * .5 + focus(5) * .4;
    condMat.emissiveIntensity = .2 + focus(3) * (.8 + .3 * Math.sin(t * 5));
    compMat.emissiveIntensity = focus(2) * (.5 + .4 * Math.sin(t * 9)) + .1;
    comp.scale.set(1 + focus(2) * .05 * Math.sin(t * 18), 1, 1 + focus(2) * .05 * Math.sin(t * 18));
    valveMat.emissiveIntensity = focus(4) * (.8 + .4 * Math.sin(t * 7));
    valve.scale.setScalar(1 + focus(4) * .3);

    // indoor air: warm in, cool out
    const air = si === 0 ? fl : 1;
    heatIn.forEach(({ m, o: oo, x }) => { const u = (t * .3 + oo) % 1; m.position.set(x + .2, lerp(1.0, 3.6, u), lerp(1.2, -1.0, u)); m.material.opacity = air * .8 * Math.sin(u * Math.PI) * (si === 1 || si === 0 || si === 6 ? 1 : .35); });
    coolOut.forEach(({ m, o: oo, x }) => { const u = (t * .35 + oo) % 1; m.position.set(x + .2, lerp(2.6, .4, u), lerp(-.9, 1.6, u)); m.material.opacity = air * .85 * Math.sin(u * Math.PI) * (si === 1 || si >= 4 ? 1 : .35); });
    // outdoor fan + heat out
    fanA += dt * (si === 3 ? 14 : 6) * fl; blades.rotation.y = fanA;
    heatOut.forEach(({ m, o: oo, a }) => { const u = (t * .4 + oo) % 1; m.position.set(2.0 + Math.cos(a) * .5 * (1 + u), FY + 2.1 + u * 2.4, Math.sin(a) * .5 * (1 + u)); m.material.opacity = fl * Math.sin(u * Math.PI) * (si === 3 ? .95 : .4); });
    // hook: heat carried over the wall
    const hk = si === 0 ? 1 - ease((lt - 3.2) / .8) : si === 6 ? ease((lt - 1.4) / .8) : 0;
    hook.forEach(({ m, o: oo }) => { const u = (t * .35 + oo) % 1; m.position.copy(hookCurve.getPoint(u)); m.material.opacity = hk * Math.sin(u * Math.PI) * .9; });
    // condensation + drips (step 5)
    const dr = si === 5 ? ease((lt - .6) / 1) : 0;
    condensate.forEach((m, i) => { m.material.opacity = dr * (.6 + .4 * Math.sin(t * 3 + i)); m.position.y = 2.95 + (i % 3) * .2 - ((t * .2 + i * .13) % .3); });
    drops.forEach(({ m, o: oo }) => { const u = (t * .8 + oo) % 1; m.position.set(.6, lerp(1.0, FY + .05, u * u), -.9); m.material.opacity = dr * (1 - u * .5); });
    louver.rotation.x = .5 + Math.sin(t * .8) * .1;
  }
  return { update };
}
