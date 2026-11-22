// Inside 60 — Water treatment plant. Steps: 0 hook (line of basins), 1 coagulation, 2 flocculation, 3 sedimentation, 4 filtration, 5 chlorine, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const ss = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 60, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  scene.background = new THREE.Color(0x182238); scene.fog = new THREE.Fog(0x182238, 40, 110);
  scene.add(new THREE.HemisphereLight(0xf4f6ff, 0x40404c, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.8); key.position.set(6, 14, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0xa0c8ff, .7); rim.position.set(-6, 3, -8); scene.add(rim);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(120, 60), Mat({ color: 0x3a4052, shininess: 5 })); floor.rotation.x = -Math.PI / 2; floor.position.x = 18; scene.add(floor);

  const X = [0, 9, 18, 27, 36]; // coag, floc, sed, filter, chlorine
  const wallM = Mat({ color: 0xc8ccd4, transparent: true, opacity: .35, side: THREE.DoubleSide, depthWrite: false });
  const rimM = Mat({ color: 0xe0e4ec, shininess: 90 });
  const waterCols = [0x8a6a3a, 0x7a7448, 0x5a8a90, 0x3a9ad0, 0x2aa8ff];
  const waters = [];
  function basin(x, w, h, d, ci) {
    const g = new THREE.Group(); g.position.x = x; scene.add(g);
    const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallM); box.position.y = h / 2; g.add(box);
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(box.geometry), new THREE.LineBasicMaterial({ color: 0xffffff })); e.position.copy(box.position); g.add(e);
    const wm = Mat({ color: waterCols[ci], emissive: waterCols[ci], emissiveIntensity: .15, transparent: true, opacity: .55, depthWrite: false });
    const wa = new THREE.Mesh(new THREE.BoxGeometry(w - .2, h * .8, d - .2), wm); wa.position.y = h * .4 + .05; g.add(wa); waters.push(wm);
    return g;
  }
  const gC = basin(X[0], 5, 4, 4, 0), gF = basin(X[1], 5, 4, 4, 1), gS = basin(X[2], 6, 4, 4, 2), gP = basin(X[3], 5, 5, 4, 3), gD = basin(X[4], 5, 4, 4, 4);
  // connecting pipes along the line
  const pipeM = Mat({ color: 0x6a7a90 });
  for (let k = 0; k < 4; k++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, 4, 12), pipeM); p.rotation.z = Math.PI / 2; p.position.set((X[k] + X[k + 1]) / 2, 2.6, 0); scene.add(p); }
  const inP = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, 6, 12), pipeM); inP.rotation.z = Math.PI / 2; inP.position.set(-5.5, 2.6, 0); scene.add(inP);
  const outP = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, 6, 12), pipeM); outP.rotation.z = Math.PI / 2; outP.position.set(41.5, 2.6, 0); scene.add(outP);
  // flow dots along the pipes
  const flowM = new THREE.MeshBasicMaterial({ color: 0x80e0ff, transparent: true, opacity: .9 });
  const flow = []; for (let k = 0; k < 50; k++) { const m = new THREE.Mesh(new THREE.SphereGeometry(.14, 8, 6), flowM); scene.add(m); flow.push([m, k / 50]); }

  // --- Coagulation: dirt particles with "-" charge glow, alum drops
  const dirtM = Mat({ color: 0x6a4020, emissive: 0x200800 });
  const chM = new THREE.MeshBasicMaterial({ color: 0xff4060, transparent: true, opacity: .0, depthWrite: false });
  const coag = []; for (let k = 0; k < 36; k++) { const m = new THREE.Mesh(new THREE.SphereGeometry(.13, 8, 6), dirtM); const c = new THREE.Mesh(new THREE.SphereGeometry(.3, 10, 8), chM); m.add(c);
    gC.add(m); coag.push([m, rnd() * 6, rnd() * 6, rnd() * 6, c]); }
  const alumM = new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: .6, transparent: true, opacity: 0 });
  const alum = []; for (let k = 0; k < 14; k++) { const m = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 6), alumM); gC.add(m); alum.push([m, k / 14, rnd() - .5]); }
  const doser = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, 1.6, 20), Mat({ color: 0xf0f0f0 })); doser.position.set(0, 6.2, 0); gC.add(doser);
  const dpipe = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 1.4, 8), pipeM); dpipe.position.set(0, 4.9, 0); gC.add(dpipe);
  // --- Flocculation: paddles + clumps forming
  const paddle = new THREE.Group(); paddle.position.set(0, 2, 0); gF.add(paddle);
  paddle.add(new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 4.6, 8), pipeM));
  for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(3.2, .5, .08), Mat({ color: 0x4080e0 })); b.position.y = -1.2 + k * 1.1; b.rotation.y = k * 1.0; paddle.add(b); }
  const flocCenters = []; for (let k = 0; k < 6; k++) flocCenters.push(V((rnd() - .5) * 3.2, .8 + rnd() * 2.2, (rnd() - .5) * 2.6));
  const floc = []; for (let k = 0; k < 48; k++) { const m = new THREE.Mesh(new THREE.SphereGeometry(.14, 8, 6), dirtM); gF.add(m);
    floc.push([m, V((rnd() - .5) * 4.2, .3 + rnd() * 2.9, (rnd() - .5) * 3.4), flocCenters[k % 6], V((rnd() - .5) * .5, (rnd() - .5) * .5, (rnd() - .5) * .5)]); }
  // --- Sedimentation: big floc clumps falling to sludge layer
  const clumpM = Mat({ color: 0x7a5028, emissive: 0x1a0a00 });
  const sed = []; for (let k = 0; k < 18; k++) { const m = new THREE.Mesh(new THREE.DodecahedronGeometry(.28, 0), clumpM); gS.add(m); sed.push([m, (rnd() - .5) * 5, (rnd() - .5) * 3.2, rnd(), .25 + rnd() * .5]); }
  const sludge = new THREE.Mesh(new THREE.BoxGeometry(5.8, 1, 3.8), Mat({ color: 0x8a5a2a, emissive: 0x301804 })); sludge.position.y = .1; gS.add(sludge);
  // --- Filter: layers (cutaway)
  const layers = [[0x2a2a2e, 'charcoal', 1.0], [0xd8b878, 'sand', 1.2], [0x9098a0, 'gravel', 1.0]];
  let y0 = 3.4; const layerMs = [];
  layers.forEach(([c, n, h]) => { const lm = Mat({ color: c, emissive: c, emissiveIntensity: 0 }); const l = new THREE.Mesh(new THREE.BoxGeometry(4.8, h, 3.8), lm); l.position.y = y0 - h / 2; gP.add(l); layerMs.push(lm); y0 -= h; });
  // pebbles on gravel/sand front face for texture
  for (let k = 0; k < 40; k++) { const g = k < 20; const m = new THREE.Mesh(new THREE.SphereGeometry(g ? .16 : .07, 6, 5), Mat({ color: g ? 0x6a7078 : 0xc0a060 })); m.position.set((rnd() - .5) * 4.6, g ? .3 + rnd() * .9 : 1.3 + rnd() * 1.1, 1.92); gP.add(m); }
  const trickleM = new THREE.MeshBasicMaterial({ color: 0x9ae4ff, transparent: true, opacity: 0 });
  const trickle = []; for (let k = 0; k < 40; k++) { const m = new THREE.Mesh(new THREE.SphereGeometry(.1, 8, 6), trickleM); gP.add(m); trickle.push([m, (rnd() - .5) * 4.4, rnd(), (rnd() - .5) * 3.2]); }
  const stuckM = Mat({ color: 0x6a4020, transparent: true, opacity: 0 });
  const stuck = []; for (let k = 0; k < 16; k++) { const m = new THREE.Mesh(new THREE.SphereGeometry(.1, 6, 5), stuckM); m.position.set((rnd() - .5) * 4.4, 3.35 + rnd() * .1, 1.6 + rnd() * .3); gP.add(m); stuck.push(m); }
  // --- Disinfection: chlorine tank + germs that pop
  const clTank = new THREE.Mesh(new THREE.CylinderGeometry(.8, .8, 2.2, 24), Mat({ color: 0xc8f060, emissive: 0x405000 })); clTank.position.set(-1.2, 5.6, -.6); gD.add(clTank);
  const clM = new THREE.MeshPhongMaterial({ color: 0xd8ff60, emissive: 0xb0ff20, emissiveIntensity: .8, transparent: true, opacity: 0 });
  const cl = []; for (let k = 0; k < 16; k++) { const m = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 6), clM); gD.add(m); cl.push([m, k / 16, rnd() - .5, rnd() - .5]); }
  const germM = Mat({ color: 0x50e070, emissive: 0x108020, transparent: true, opacity: 1 });
  const germs = []; for (let k = 0; k < 14; k++) { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.CapsuleGeometry(.12, .28, 4, 8), germM); b.rotation.z = rnd() * 3; g.add(b);
    g.position.set((rnd() - .5) * 4, .6 + rnd() * 2.4, (rnd() - .5) * 3); gD.add(g); germs.push([g, rnd(), g.position.clone()]); }
  // glowing labels: ring markers under each basin
  const ringMs = X.map((x, k) => { const m = new THREE.MeshBasicMaterial({ color: 0xffd23a, transparent: true, opacity: 0 }); const r = new THREE.Mesh(new THREE.RingGeometry(3.5, 3.8, 48), m); r.rotation.x = -Math.PI / 2; r.position.set(x, .03, 0); scene.add(r); return m; });

  const shots = [
    [[-14, 15, 22], [14, 2, 0]],       // 0 along the line
    [[3.5, 8, 19], [0, 3.6, 0]],       // 1 coag
    [[12.5, 7.5, 18], [9, 2.4, 0]],    // 2 floc
    [[21.5, 7, 19], [18, 2.2, 0]],     // 3 sed
    [[30, 6, 18], [27, 2.6, 0]],       // 4 filter
    [[39.5, 8, 19], [36, 3.6, 0]],     // 5 chlorine
    [[52, 15, 22], [22, 2, 0]],        // 6 recap (other end)
  ];
  const cp = { p: V(), q: V() };
  function update(t, si, lt, sd) {
    const pulse = .5 + .5 * Math.sin(t * 6);
    ringMs.forEach((m, k) => m.opacity = si === k + 1 ? .5 + .5 * pulse : si === 0 ? ss(k * .5, k * .5 + .4, lt) * .7 : si === 6 ? .5 : 0);
    // pipe flow (x from -8 to 44)
    flow.forEach(([m, o]) => { const u = (t * .08 + o) % 1; m.position.set(-8 + u * 52, 2.6, 0); });
    // coag
    const dose = si === 1 ? ss(.4, 2.4, lt) : si > 1 ? 1 : 0;
    alumM.opacity = si === 1 ? .95 : 0;
    alum.forEach(([m, o, a]) => { const u = (t * .7 + o) % 1; m.position.set(a * 1.5 * u, 4.2 - u * 3.6, a * u); });
    chM.opacity = si <= 1 ? (1 - dose) * (.3 + .25 * pulse) : 0;
    coag.forEach(([m, a, b, c]) => { const sp = lerp(1, .25, dose); m.position.set(Math.sin(a + t * 1.3 * sp) * 2.1, 1.6 + Math.sin(b + t * 1.1 * sp) * 1.3, Math.sin(c + t * .9 * sp) * 1.7);
      if (dose > .5) { const cc = flocCenters[Math.floor(a) % 6]; m.position.lerp(V(cc.x * .6, cc.y, cc.z * .6), (dose - .5) * .8); } });
    // floc
    paddle.rotation.y = t * .8;
    const clump = si === 2 ? ss(.5, sd - .8, lt) : si > 2 ? 1 : 0;
    floc.forEach(([m, p0, c, off]) => { const cc = c.clone().applyAxisAngle(V(0, 1, 0), t * .3); m.position.lerpVectors(p0.clone().add(V(Math.sin(t + p0.x) * .3, Math.sin(t * 1.3 + p0.z) * .2, 0)), cc.add(off), ease(clump)); });
    // sed: clumps fall
    const settle = si === 3 ? ss(.2, sd - .5, lt) : si > 3 ? 1 : 0;
    sed.forEach(([m, x, z, o, sp]) => { const y = si < 3 ? 2.8 + Math.sin(t + o * 6) * .4 : Math.max(.75, 3.1 - ((settle * 2.4 * (1 + sp)) + o * .4 * settle)); m.position.set(x, y, z); m.rotation.set(t * sp, t * .5, 0); });
    sludge.scale.y = .3 + settle * .7; sludge.position.y = sludge.scale.y * .5;
    waters[2].color.setHex(0x5a8a90).lerp(new THREE.Color(0x3a9ad0), settle * .6);
    // filter
    trickleM.opacity = si === 4 ? .95 : si >= 5 ? .5 : 0;
    trickle.forEach(([m, x, o, z]) => { const u = (t * .35 + o) % 1; m.position.set(x + Math.sin(u * 20 + o * 9) * .08, 4.2 - u * 4.0, z); });
    layerMs.forEach((lm, k) => lm.emissiveIntensity = si === 4 ? ss(.6 + k * 1.0, 1.0 + k * 1.0, lt) * (.25 + .2 * pulse) : 0);
    stuckM.opacity = si === 4 ? ss(.8, 2.5, lt) : si > 4 ? 1 : 0;
    // chlorine + germs
    clM.opacity = si === 5 ? .95 : 0;
    cl.forEach(([m, o, a, b]) => { const u = (t * .6 + o) % 1; m.position.set(-1.2 + a * 2.5 * u, 4.4 - u * 3.6, -.6 + b * 2.5 * u); });
    const kill = si === 5 ? ss(1.0, sd - .6, lt) : si > 5 ? 1 : 0;
    germs.forEach(([g, o, p]) => { const kk = ss(o * .7, o * .7 + .3, kill); g.scale.setScalar(Math.max(.001, (1 - kk) * (1 + .15 * Math.sin(t * 8 + o * 9)))); g.position.set(p.x + Math.sin(t + o * 9) * .2, p.y + Math.sin(t * 1.3 + o) * .15, p.z); });
    germM.emissiveIntensity = si === 5 ? .5 + .5 * pulse : .3;
    // camera
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const kk = si === 0 ? 1 : ease(lt / 1.4);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], kk))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], kk)));
    const o = Math.sin(t * .2) * .08, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o));
    camera.lookAt(cp.q);
  }
  return { update };
}
