// Inside 60 — How a Dishwasher Works. Steps: 0 hook, 1 fill+heat, 2 spray arms, 3 detergent, 4 filter/recycle, 5 rinse+dry, 6 recap
export async function setup({ THREE, scene, camera }) {
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 50, specular: 0x333333, ...o });

  scene.background = new THREE.Color(0x10182c);
  scene.fog = new THREE.Fog(0x10182c, 20, 45);
  scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x202838, 1.4));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(5, 9, 7); scene.add(key);
  const rim = new THREE.DirectionalLight(0x88aaff, 1.0); rim.position.set(-6, 4, -5); scene.add(rim);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(16, 64), Mat({ color: 0x1c2640, shininess: 5 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -1.7; scene.add(floor);

  const M = new THREE.Group(); scene.add(M);
  const W = 4.4, H = 5.4, Dp = 4.0, Y0 = -1.7; // outer box from floor
  const cabMat = Mat({ color: 0xd8dee8, transparent: true, opacity: 1, shininess: 90, specular: 0x888888 });
  const cab = new THREE.Mesh(new RoundedBoxGeometry(W, H, Dp, 6, .25), cabMat); cab.position.set(0, Y0 + H / 2, 0); M.add(cab);
  const handle = new THREE.Mesh(new RoundedBoxGeometry(2.4, .2, .25, 3, .08), Mat({ color: 0x3a4256 })); handle.position.set(0, Y0 + H - .5, Dp / 2 + .1); M.add(handle);
  const inner = new THREE.Mesh(new THREE.BoxGeometry(W - .3, H - .6, Dp - .3), Mat({ color: 0x8a96aa, side: THREE.BackSide, shininess: 80 })); inner.position.copy(cab.position); inner.position.y += .1; M.add(inner);
  const yb = Y0 + .4; // tub floor

  // sump water pool
  const poolMat = Mat({ color: 0x3aa8ff, transparent: true, opacity: .7, emissive: 0x0a4a8a, emissiveIntensity: .5, shininess: 100 });
  const pool = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, .2, 40), poolMat); pool.position.set(0, yb + .1, 0); M.add(pool);
  // heater loop
  const heatMat = Mat({ color: 0x553322, emissive: 0xff4a00, emissiveIntensity: 0 });
  const hp = []; for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 2; hp.push(new THREE.Vector3(Math.cos(a) * 1.7, 0, Math.sin(a) * 1.3)); }
  const heater = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(hp, true), 80, .06, 8), heatMat); heater.position.set(0, yb + .35, 0); M.add(heater);
  const glow = new THREE.PointLight(0xff6a10, 0, 5); glow.position.set(0, yb + .6, 0); M.add(glow);
  // filter
  const filtMat = Mat({ color: 0xc8d0dc, transparent: true, opacity: .5, emissive: 0x7cff6b, emissiveIntensity: 0 });
  const filt = new THREE.Mesh(new THREE.CylinderGeometry(.45, .45, .7, 20, 1, true), filtMat); filt.position.set(0, yb + .15, 0); M.add(filt);
  const filtWire = new THREE.Mesh(new THREE.CylinderGeometry(.46, .46, .7, 16, 5, true), new THREE.MeshBasicMaterial({ color: 0x7cff6b, wireframe: true, transparent: true, opacity: .5 })); filtWire.position.copy(filt.position); M.add(filtWire);
  // pump under tub + pipe up the back wall
  const pumpMat = Mat({ color: 0x3dd6ff, emissive: 0x1a8aff, emissiveIntensity: 0 });
  const pump = new THREE.Mesh(new THREE.CylinderGeometry(.45, .45, .7, 24), pumpMat); pump.position.set(0, yb - .2, -.9); pump.rotation.x = Math.PI / 2; M.add(pump);
  const yLow = yb + .75, yUp = yb + 2.75;
  const pathPts = [new THREE.Vector3(0, yb + .1, 0), new THREE.Vector3(0, yb - .2, -.6), new THREE.Vector3(0, yb - .2, -1.5), new THREE.Vector3(0, yb + .6, -1.7), new THREE.Vector3(0, yUp - .6, -1.7), new THREE.Vector3(0, yUp, -1.4), new THREE.Vector3(0, yUp, 0)];
  const path = new THREE.CatmullRomCurve3(pathPts);
  M.add(new THREE.Mesh(new THREE.TubeGeometry(path, 60, .13, 10), Mat({ color: 0x8a95a8, transparent: true, opacity: .55 })));
  const flow = []; for (let i = 0; i < 22; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(.11, 8, 6), new THREE.MeshBasicMaterial({ color: 0x5ac8ff, transparent: true, opacity: 0 })); M.add(f); flow.push(f); }
  // feed tube to the lower arm
  const feed = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, yLow - yb, 10), Mat({ color: 0x8a95a8 })); feed.position.set(0, (yLow + yb) / 2 + .1, 0); M.add(feed);

  // spray arms with jets
  const armMat = Mat({ color: 0xe8ecf2, shininess: 70 });
  const jetMat = new THREE.MeshPhongMaterial({ color: 0x9fe0ff, transparent: true, opacity: 0, emissive: 0x3aa8ff, emissiveIntensity: .7, depthWrite: false });
  function makeArm(y, len, jetH) {
    const g = new THREE.Group(); g.position.set(0, y, 0); M.add(g);
    g.add(new THREE.Mesh(new RoundedBoxGeometry(len, .14, .38, 3, .06), armMat));
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .2, 16), armMat));
    const jets = [];
    for (let i = -3; i <= 3; i++) { if (!i) continue;
      const j = new THREE.Mesh(new THREE.CylinderGeometry(.05, .14, jetH, 8), jetMat); j.geometry.translate(0, jetH / 2, 0);
      j.position.set(i * len / 7.2, .08, 0); j.rotation.x = (i > 0 ? 1 : -1) * .45; g.add(j); jets.push(j);
      const back = new THREE.Mesh(new THREE.CylinderGeometry(.02, .06, .7, 6), jetMat); back.geometry.translate(0, .35, 0);
      back.position.set(i * len / 7.2, .0, (i > 0 ? -1 : 1) * .15); back.rotation.x = (i > 0 ? -1 : 1) * 1.35; g.add(back); jets.push(back);
    }
    return { g, jets };
  }
  const lowArm = makeArm(yLow, 3.6, 1.5), upArm = makeArm(yUp, 3.0, 1.3);

  // racks (wire)
  const wireMat = Mat({ color: 0x9aa6bb, shininess: 60 });
  function rack(y) {
    const g = new THREE.Group(); g.position.set(0, y, 0); M.add(g);
    for (const x of [-1.8, 1.8]) { const b = new THREE.Mesh(new THREE.BoxGeometry(.06, .06, 3.4), wireMat); b.position.x = x; g.add(b); }
    for (let i = 0; i <= 8; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(3.6, .05, .05), wireMat); b.position.z = -1.7 + i * 3.4 / 8; g.add(b); }
    for (const z of [-1.7, 1.7]) for (let i = 0; i <= 6; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.04, .5, .04), wireMat); b.position.set(-1.8 + i * .6, .25, z); g.add(b); }
    return g;
  }
  rack(yLow + .3); rack(yUp + .3);
  // dishes
  const plateCols = [0xffffff, 0xffd23d, 0x5ad1ff, 0xffffff, 0xff8a3d, 0x7cff6b];
  const foodMat = Mat({ color: 0x8a5a2a, shininess: 5 });
  const food = [];
  plateCols.forEach((c, i) => {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(.75, .75, .07, 32), Mat({ color: c, shininess: 90 }));
    p.rotation.x = Math.PI / 2; p.position.set(-1.5 + i * .6, yLow + 1.1, .2); p.rotation.z = .1; M.add(p);
    for (let n = 0; n < 3; n++) { const f = new THREE.Mesh(new THREE.SphereGeometry(.1, 8, 6), foodMat); f.position.set(p.position.x + .06, p.position.y + .3 - n * .3, p.position.z + .1 + n * .02); M.add(f); food.push({ f, home: f.position.clone(), n: i * 3 + n }); }
  });
  const cupCols = [0xff5e7a, 0xa47bff, 0x3dd6ff, 0xffd23d];
  cupCols.forEach((c, i) => { const cp = new THREE.Mesh(new THREE.CylinderGeometry(.38, .3, .7, 24, 1, true), Mat({ color: c, side: THREE.DoubleSide })); cp.position.set(-1.2 + i * .8, yUp + .75, (i % 2) * .8 - .4); cp.rotation.x = Math.PI; M.add(cp); });

  // detergent dispenser on inside of door (front)
  const disp = new THREE.Group(); disp.position.set(1.1, yb + 2.0, Dp / 2 - .2); M.add(disp);
  disp.add(new THREE.Mesh(new RoundedBoxGeometry(.9, .7, .2, 3, .06), Mat({ color: 0x3a4256 })));
  const lidPivot = new THREE.Group(); lidPivot.position.set(0, -.35, -.12); disp.add(lidPivot);
  const lid = new THREE.Mesh(new RoundedBoxGeometry(.85, .65, .06, 3, .03), Mat({ color: 0x5ad1ff, emissive: 0x1a7fb0, emissiveIntensity: .4 })); lid.position.y = .32; lidPivot.add(lid);
  const tab = new THREE.Mesh(new RoundedBoxGeometry(.5, .35, .15, 3, .06), Mat({ color: 0x7cff6b, emissive: 0x2a9a2a, emissiveIntensity: .5 })); tab.position.z = -.12; disp.add(tab);
  const soap = []; for (let i = 0; i < 30; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(.07 + (i % 3) * .03, 8, 6), new THREE.MeshPhongMaterial({ color: 0xbfffd0, transparent: true, opacity: 0, emissive: 0x3aff7a, emissiveIntensity: .4 })); M.add(s); soap.push(s); }
  // steam
  const steam = []; for (let i = 0; i < 24; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(.18, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false })); M.add(s); steam.push({ s, x: ((i * 37) % 30) / 10 - 1.5, z: ((i * 17) % 26) / 10 - 1.3, o: (i * .41) % 1 }); }

  const shots = [
    [[5.5, 4.0, 13.5], [0, 1.0, 0]],
    [[4.0, 1.6, 10.0], [0, -.2, 0]],
    [[-5.5, 2.0, 11.0], [0, .9, 0]],
    [[3.2, 2.4, 9.5], [.8, 1.1, 1.4]],
    [[6.5, .6, 9.5], [0, -.1, -.5]],
    [[-4.5, 4.6, 11.5], [0, 1.0, 0]],
    [[5.5, 4.2, 14.5], [0, 1.0, 0]],
  ];
  const cur = { p: new THREE.Vector3(), q: new THREE.Vector3() };
  let a1 = 0, a2 = 0, lastT = 0;

  function update(t, si, lt, sd) {
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const k = si === 0 ? 1 : ease(lt / 1.3);
    cur.p.set(...prev[0].map((v, i) => lerp(v, now[0][i], k)));
    cur.q.set(...prev[1].map((v, i) => lerp(v, now[1][i], k)));
    const o = Math.sin(t * .15) * .07;
    camera.position.set(cur.p.x * Math.cos(o) - cur.p.z * Math.sin(o), cur.p.y, cur.p.z * Math.cos(o) + cur.p.x * Math.sin(o));
    camera.lookAt(cur.q);
    const dt = Math.max(0, Math.min(.1, t - lastT)); lastT = t;

    const xr = si === 0 ? ease((lt - 1.8) / 1.2) : si === 6 ? 1 - ease((lt - .8) / 1.2) : 1;
    cabMat.opacity = 1 - xr * .84; cabMat.depthWrite = cabMat.opacity > .9;
    inner.material.opacity = 1; inner.visible = xr < .5;

    // pool fill / drain
    const pl = si === 0 ? 0 : si === 1 ? ease((lt - .3) / 1.6) : si === 4 ? .7 + .3 * Math.sin(t * 2) : si === 5 ? (lt < sd * .5 ? 1 : 1 - ease((lt - sd * .5) / 1)) : 1;
    pool.scale.set(1, Math.max(.01, pl), 1); pool.visible = pl > .02; pool.position.y = yb + .1 * pl;
    poolMat.color.setHex(si === 3 || si === 4 ? 0x5ad8c0 : 0x3aa8ff);
    // heater
    const ht = si === 1 ? ease((lt - 1.5) / 1) : si === 5 ? ease((lt - sd * .45) / 1) : si === 2 || si === 3 ? .4 : 0;
    heatMat.emissiveIntensity = ht * (1.4 + .3 * Math.sin(t * 6)); glow.intensity = ht * 3;
    // spray
    const spray = si === 0 ? ease((lt - 2.6) / .6) : si === 2 || si === 3 || si === 4 ? (si === 2 ? ease((lt - 1) / .8) : 1) : si === 5 ? 1 - ease((lt - sd * .45) / .6) : si === 6 ? .7 : 0;
    a1 += spray * 3.2 * dt; a2 -= spray * 4 * dt; lowArm.g.rotation.y = a1; upArm.g.rotation.y = a2;
    jetMat.opacity = spray * (.45 + .15 * Math.sin(t * 25));
    [lowArm, upArm].forEach(A => A.jets.forEach((j, n) => j.scale.set(1, .85 + .15 * Math.sin(t * 30 + n), 1)));
    pumpMat.emissiveIntensity = spray * (.7 + .3 * Math.sin(t * 12));
    flow.forEach((f, i) => { const u = (t * .8 + i / flow.length) % 1; f.position.copy(path.getPointAt(u)); f.material.opacity = (si === 2 || si === 4) ? spray * .95 : 0; f.material.color.setHex(si === 4 ? 0x5ad8c0 : 0x5ac8ff); });
    // food: on plates, washes off during 3, caught in filter during 4
    food.forEach(({ f, home, n }) => {
      const off = si < 3 ? 0 : si === 3 ? ease((lt - 1.2 - (n % 5) * .25) / 1.4) : 1;
      const fall = si === 4 ? ease((lt - (n % 6) * .2) / 1.6) : si > 4 ? 1 : 0;
      if (si < 4) { f.position.set(home.x, home.y - off * .4, home.z + off * .3); f.material.opacity = 1; f.visible = off < .98; }
      else { const ang = n * 2.4; f.visible = si < 6; f.position.set(lerp(home.x, Math.cos(ang) * .3, fall), lerp(home.y - .4, yb + .2 + (n % 3) * .12, fall), lerp(home.z + .3, Math.sin(ang) * .3, fall)); }
    });
    filtMat.emissiveIntensity = si === 4 ? .6 + .4 * Math.sin(t * 6) : 0;
    filtWire.material.opacity = si === 4 ? .9 : .4; filtWire.rotation.y = t * .5;
    // dispenser lid
    const op = si === 3 ? ease((lt - .4) / .6) : si > 3 && si < 6 ? 1 : 0;
    lidPivot.rotation.x = op * 1.7; tab.visible = op < .7 || si < 3;
    tab.scale.setScalar(si === 3 ? 1 - ease((lt - .9) / 1.5) * .8 + .2 : 1);
    soap.forEach((s, i) => { const u = (t * .5 + i / soap.length) % 1, aa = i * 2.4; s.position.set(disp.position.x - u * 1.4 + Math.cos(aa) * u * .6, disp.position.y - u * 1.0 + Math.sin(aa * 1.3) * .4, disp.position.z - .2 - u * 1.8); s.material.opacity = (si === 3 ? ease((lt - .8) / .6) : 0) * (1 - u) * .85; });
    // steam while drying
    const st = si === 5 ? ease((lt - sd * .5) / 1) : 0;
    steam.forEach(({ s, x, z, o: oo }) => { const u = (t * .35 + oo) % 1; s.position.set(x + Math.sin(t + oo * 9) * .15, yb + .6 + u * 3.6, z); s.scale.setScalar(.6 + u * 1.2); s.material.opacity = st * (1 - u) * .35; });
    M.rotation.y = Math.sin(t * .3) * .04;
  }
  return { update };
}
