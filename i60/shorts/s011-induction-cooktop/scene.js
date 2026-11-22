// Inside 60 — How an Induction Cooktop Works. Steps: 0 hook, 1 coil, 2 field, 3 currents, 4 heat, 5 magnetic pans, 6 recap
export async function setup({ THREE, scene, camera }) {
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 50, specular: 0x333333, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const V2 = (x, y) => new THREE.Vector2(x, y);

  scene.background = new THREE.Color(0x111a2a);
  scene.fog = new THREE.Fog(0x111a2a, 24, 50);
  scene.add(new THREE.HemisphereLight(0xe8f0ff, 0x283038, 1.4));
  const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(5, 9, 7); scene.add(key);
  const rim = new THREE.DirectionalLight(0x88ccff, 1.0); rim.position.set(-6, 4, -5); scene.add(rim);

  const M = new THREE.Group(); scene.add(M);
  // cooktop body
  const bodyMat = Mat({ color: 0x3a4252, transparent: true, opacity: 1 });
  const body = new THREE.Mesh(new RoundedBoxGeometry(10, .9, 5.5, 3, .12), bodyMat); body.position.set(-1.5, -1.75, 0); M.add(body);
  const glassMat = Mat({ color: 0x0d1018, shininess: 120, specular: 0xaaaaaa, transparent: true, opacity: .95 });
  const glass = new THREE.Mesh(new RoundedBoxGeometry(10.1, .08, 5.6, 2, .03), glassMat); glass.position.set(-1.5, -1.26, 0); M.add(glass);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.75, .025, 6, 64).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x8a96aa })); ring.position.set(0, -1.21, 0); M.add(ring);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.3, .025, 6, 64).rotateX(Math.PI / 2), ring.material); ring2.position.set(-4.4, -1.21, .4); M.add(ring2);
  // control lights
  const ctrl = []; for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(.18, .02, .1), new THREE.MeshBasicMaterial({ color: 0x333a48 })); m.position.set(-.8 + i * .4, -1.21, 2.35); M.add(m); ctrl.push(m); }

  // copper coil (flat spiral) under glass
  const sp = []; for (let i = 0; i <= 400; i++) { const f = i / 400, a = f * Math.PI * 2 * 9, r = lerp(.3, 1.6, f); sp.push(V(Math.cos(a) * r, -1.42, Math.sin(a) * r)); }
  const coilMat = Mat({ color: 0xd8823a, emissive: 0xff7a2a, emissiveIntensity: 0, shininess: 90, specular: 0xffccaa });
  const coil = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(sp), 900, .045, 6), coilMat); M.add(coil);
  // current dots along the coil
  const coilCurve = new THREE.CatmullRomCurve3(sp);
  const mk = (c, r) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, depthWrite: false })); M.add(m); return m; };
  const cur = []; for (let i = 0; i < 50; i++) cur.push({ m: mk(0xfff07a, .07), o: i / 50 });

  // magnetic field loops (tori stacked above coil)
  const fieldMat = new THREE.MeshBasicMaterial({ color: 0x5ad0ff, transparent: true, opacity: 0, depthWrite: false });
  const loops = [];
  for (let i = 0; i < 5; i++) {
    const r = .5 + i * .3;
    const pts = []; for (let k = 0; k <= 60; k++) { const a = k / 60 * Math.PI * 2; pts.push(V(Math.cos(a) * r * .9 + 0, Math.sin(a) * (r * 1.3) - 1.4, 0)); }
    const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 80, .03, 6, true);
    for (let s = -1; s <= 1; s += 2) { const m = new THREE.Mesh(g, fieldMat); m.position.x = s * (.9 + i * .1) ; m.rotation.y = 0; M.add(m); loops.push(m); }
  }
  // vertical field arrows through pan
  const arrows = []; for (let i = 0; i < 7; i++) { const g = new THREE.Group(); const sh = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, 1.4, 8), fieldMat); const hd = new THREE.Mesh(new THREE.ConeGeometry(.12, .3, 10), fieldMat); hd.position.y = .85; g.add(sh, hd); g.position.set(-1.2 + i * .4, -.4, 0); M.add(g); arrows.push(g); }

  // pan (steel, lathe) + handle
  const panG = new THREE.Group(); M.add(panG);
  const prof = [V2(0, 0), V2(1.55, 0), V2(1.65, .08), V2(1.75, .9), V2(1.82, .95)];
  const panMat = Mat({ color: 0x9aa4b2, emissive: 0xff3a00, emissiveIntensity: 0, shininess: 100, specular: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 1 });
  const pan = new THREE.Mesh(new THREE.LatheGeometry(prof, 48), panMat); panG.add(pan);
  const baseMat = Mat({ color: 0x8a94a2, emissive: 0xff4a00, emissiveIntensity: 0, transparent: true, opacity: 1 });
  const panBase = new THREE.Mesh(new THREE.CylinderGeometry(1.56, 1.56, .12, 48), baseMat); panBase.position.y = .04; panG.add(panBase);
  const handle = new THREE.Mesh(new RoundedBoxGeometry(2.2, .2, .35, 2, .08), Mat({ color: 0x23282f })); handle.position.set(2.8, .75, 0); handle.rotation.z = .1; panG.add(handle);
  panG.position.set(0, -1.2, 0);
  // eddy current swirls in pan base
  const eddy = []; for (let i = 0; i < 36; i++) eddy.push({ m: mk(0xffd04a, .06), r: .3 + (i % 4) * .33, o: i / 36 });
  // water + steam
  const waterMat = Mat({ color: 0x3a9aff, transparent: true, opacity: .55, emissive: 0x0a2a60, emissiveIntensity: .3, depthWrite: false });
  const water = new THREE.Mesh(new THREE.CylinderGeometry(1.68, 1.6, .55, 40), waterMat); water.position.y = .4; panG.add(water);
  const bub = []; for (let i = 0; i < 26; i++) bub.push({ m: mk(0xeaf8ff, .07), x: Math.cos(i * 2.4) * (.2 + (i * .37) % 1.3), z: Math.sin(i * 2.4) * (.2 + (i * .37) % 1.3), o: i / 26 });
  const steam = []; for (let i = 0; i < 16; i++) steam.push({ m: mk(0xf2f8ff, .16), o: i / 16, x: Math.cos(i * 1.7) * .9, z: Math.sin(i * 1.7) * .9 });
  const heatLight = new THREE.PointLight(0xff6a20, 0, 6); heatLight.position.set(0, -.6, 1.5); M.add(heatLight);

  // step 5: aluminum pan (cold) beside, a magnet test
  const alG = new THREE.Group(); M.add(alG);
  const alMat = Mat({ color: 0xd6dbe2, shininess: 60, transparent: true, opacity: 0 });
  alG.add(new THREE.Mesh(new THREE.LatheGeometry([V2(0, 0), V2(1.1, 0), V2(1.2, .7), V2(1.26, .74)], 40), alMat));
  const xMat = new THREE.MeshBasicMaterial({ color: 0xff4a4a, transparent: true, opacity: 0 });
  const xA = new THREE.Mesh(new THREE.BoxGeometry(.9, .12, .12), xMat); xA.rotation.z = .8; const xB = xA.clone(); xB.rotation.z = -.8; xA.position.y = xB.position.y = 1.6; alG.add(xA, xB);
  alMat.side = THREE.DoubleSide; alG.position.set(-4.4, -1.2, .4);
  const ckMat = new THREE.MeshBasicMaterial({ color: 0x4aff8a, transparent: true, opacity: 0 });
  const ck1 = new THREE.Mesh(new THREE.BoxGeometry(.45, .12, .12), ckMat); ck1.rotation.z = -.8; ck1.position.set(-.2, 2.2, 0);
  const ck2 = new THREE.Mesh(new THREE.BoxGeometry(.9, .12, .12), ckMat); ck2.rotation.z = .9; ck2.position.set(.25, 2.35, 0); panG.add(ck1, ck2);

  const shots = [
    [[3.0, 4.0, 11.0], [0, -.6, 0]],
    [[2.5, 5.0, 7.5], [0, -1.4, 0]],
    [[0, .4, 9.5], [0, -.5, 0]],
    [[2.5, 3.2, 6.6], [0, -1.0, 0]],
    [[3.6, 3.4, 10.5], [0, -.6, 0]],
    [[-2.2, 4.2, 14.5], [-2.2, -.6, 0]],
    [[-4.0, 4.5, 13.5], [0, -.6, 0]],
  ];
  const cp = { p: V(), q: V() };

  function update(t, si, lt, sd) {
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const k = si === 0 ? 1 : ease(lt / 1.3);
    cp.p.set(...prev[0].map((v, i) => lerp(v, now[0][i], k)));
    cp.q.set(...prev[1].map((v, i) => lerp(v, now[1][i], k)));
    const o = Math.sin(t * .15) * .07;
    camera.position.set(cp.p.x * Math.cos(o) - cp.p.z * Math.sin(o), cp.p.y, cp.p.z * Math.cos(o) + cp.p.x * Math.sin(o));
    camera.lookAt(cp.q);
    const f = s => si === s ? 1 : 0;

    // x-ray: glass/body transparent in steps 1..3 to see coil; pan lifted in step 1
    const xr = (si >= 1 && si <= 3) ? 1 : 0;
    glassMat.opacity = .95 - xr * .7; glassMat.depthWrite = !xr;
    bodyMat.opacity = 1 - xr * .6; bodyMat.depthWrite = !xr;
    const lift = si === 1 ? ease(lt / 1.2) : si === 2 ? 1 - ease(lt / 1.2) : 0;
    panG.position.y = -1.2 + lift * 6;
    panMat.opacity = baseMat.opacity = si === 2 ? .45 : 1; panMat.depthWrite = si !== 2;

    const on = si === 0 ? ease((lt - .3) / .6) : 1;
    ctrl.forEach((m, i) => m.material.color.setHex(on > .5 && i < 4 ? 0xff5a3a : 0x333a48));
    coilMat.emissiveIntensity = on * (.15 + (f(1) + f(2)) * (.4 + .2 * Math.sin(t * 8)));
    const cv = (si === 1 ? 1 : si === 2 ? .6 : 0);
    cur.forEach(({ m, o: oo }) => { const u = (t * .12 + oo) % 1; m.position.copy(coilCurve.getPoint(u)); m.position.y += .05; m.material.opacity = cv; });

    // alternating field: pulse direction
    const flip = Math.sin(t * 9);
    const fv = si === 2 ? 1 : si === 3 ? .5 : si === 0 ? .35 : 0;
    fieldMat.opacity = fv * (.45 + .4 * Math.abs(flip));
    fieldMat.color.setHex(flip > 0 ? 0x5ad0ff : 0xb48aff);
    loops.forEach((m, i) => m.scale.setScalar(.85 + .15 * Math.abs(flip)));
    arrows.forEach((g, i) => { g.rotation.z = flip > 0 ? 0 : Math.PI; g.scale.setScalar(si === 2 || si === 3 ? 1 : 0.001); g.position.y = -.2 + (si === 3 ? .1 : 0); });

    // eddy currents in pan base (step 3 focus, faint 4)
    const ev = si === 3 ? 1 : si === 4 ? .5 : si === 0 ? .6 : 0;
    eddy.forEach(({ m, r, o: oo }, i) => { const a = (t * (i % 2 ? 1.6 : -1.6) + oo * Math.PI * 2); m.position.set(Math.cos(a) * r, panG.position.y + .13, Math.sin(a) * r); m.material.opacity = ev; });

    // heat builds
    const heat = si === 0 ? ease(lt / sd) * .9 : si === 3 ? lt / sd * .4 : si === 4 ? .4 + ease(lt / sd) * .6 : si >= 5 ? 1 : 0;
    baseMat.emissiveIntensity = heat * (.6 + f(4) * .3 * Math.sin(t * 6));
    panMat.emissiveIntensity = heat * .06;
    heatLight.intensity = heat * (2 + f(4) * 2);
    waterMat.color.setHex(0x3a9aff).lerp(new THREE.Color(0xff8a5a), heat * .35);
    bub.forEach(({ m, x, z, o: oo }) => { const u = (t * .9 + oo) % 1; m.position.set(x, panG.position.y + .12 + u * .55, z); m.material.opacity = heat > .6 ? .85 * (1 - u) : 0; });
    steam.forEach(({ m, o: oo, x, z }) => { const u = (t * .3 + oo) % 1; m.position.set(x * (1 + u * .3), panG.position.y + .8 + u * 2.6, z); m.material.opacity = heat > .7 ? (1 - u) * .6 : 0; m.scale.setScalar(1 + u * 1.4); });

    // magnetic pans test
    const al = si === 5 ? ease(lt / .8) : si === 6 ? 1 - ease((lt - .5) / .8) : 0;
    alMat.opacity = al; alMat.depthWrite = al > .9;
    xMat.opacity = si === 5 ? ease((lt - 1.5) / .4) : 0;
    ckMat.opacity = si === 5 ? ease((lt - 2.2) / .4) : 0;
  }
  return { update };
}
