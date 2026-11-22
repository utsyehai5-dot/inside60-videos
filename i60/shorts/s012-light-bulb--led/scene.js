// Inside 60 — How an LED Bulb Works. Steps: 0 hook (filament vs chip), 1 driver, 2 chip layers, 3 electron+hole -> light, 4 blue + phosphor = white, 5 efficiency, 6 recap
export async function setup({ THREE, scene, camera }) {
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 50, specular: 0x333333, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const V2 = (x, y) => new THREE.Vector2(x, y);

  scene.background = new THREE.Color(0x0f1626);
  scene.fog = new THREE.Fog(0x0f1626, 24, 50);
  scene.add(new THREE.HemisphereLight(0xe8f0ff, 0x283038, 1.3));
  const key = new THREE.DirectionalLight(0xffffff, 1.8); key.position.set(5, 9, 7); scene.add(key);
  const rim = new THREE.DirectionalLight(0x88ccff, 1.0); rim.position.set(-6, 4, -5); scene.add(rim);
  const mk = (c, r, parent) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, depthWrite: false })); (parent || scene).add(m); return m; };

  // ---- LED bulb (centre) ----
  const B = new THREE.Group(); scene.add(B);
  const domeMat = Mat({ color: 0xffffff, emissive: 0xfff2d8, emissiveIntensity: 0, transparent: true, opacity: .9, shininess: 30, depthWrite: false, side: THREE.DoubleSide });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1.6, 40, 24, 0, Math.PI * 2, 0, Math.PI * .62), domeMat); dome.position.y = 1.0; B.add(dome);
  const housingMat = Mat({ color: 0xe8ecf2, transparent: true, opacity: 1 });
  const housing = new THREE.Mesh(new THREE.LatheGeometry([V2(1.3, 0), V2(1.05, -.9), V2(.72, -1.5), V2(.6, -1.6)], 40), housingMat); housing.position.y = .3; B.add(housing);
  housingMat.side = THREE.DoubleSide;
  // screw base
  const screwPts = []; for (let i = 0; i <= 200; i++) { const f = i / 200, a = f * Math.PI * 2 * 4; screwPts.push(V(Math.cos(a) * .6, -1.35 - f * 1.0, Math.sin(a) * .6)); }
  const screwMat = Mat({ color: 0xc8ccd2, shininess: 110, specular: 0xffffff, transparent: true, opacity: 1 });
  const screw = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(screwPts), 400, .07, 6), screwMat); B.add(screw);
  const core = new THREE.Mesh(new THREE.CylinderGeometry(.56, .5, 1.05, 30), screwMat); core.position.y = -1.85; B.add(core);
  const tip = new THREE.Mesh(new THREE.CylinderGeometry(.22, .25, .2, 20), Mat({ color: 0x3a3a3a })); tip.position.y = -2.45; B.add(tip);
  // driver board inside
  const drv = new THREE.Group(); drv.position.y = -.5; B.add(drv);
  const pcbMat = Mat({ color: 0x1f8a4a, emissive: 0x0a5a2a, emissiveIntensity: 0 });
  drv.add(new THREE.Mesh(new RoundedBoxGeometry(.9, 1.3, .08, 2, .02), pcbMat));
  const capMat = Mat({ color: 0x2a5aff, shininess: 80 });
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, .45, 16), capMat); cap.position.set(-.18, .2, .18); drv.add(cap);
  const chipD = new THREE.Mesh(new RoundedBoxGeometry(.3, .3, .1, 1, .02), Mat({ color: 0x1a1a1a })); chipD.position.set(.2, -.25, .08); drv.add(chipD);
  const coilD = new THREE.Mesh(new THREE.TorusGeometry(.13, .06, 8, 16), Mat({ color: 0xd8823a })); coilD.position.set(.2, .3, .1); drv.add(coilD);
  // LED board with chips
  const ledBoard = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, .1, 40), Mat({ color: 0xd0d6de, shininess: 90 })); ledBoard.position.y = .35; B.add(ledBoard);
  const chipMats = [];
  const chips = []; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const m = Mat({ color: 0xfff6a0, emissive: 0xfff0c0, emissiveIntensity: 0 }); chipMats.push(m); const c = new THREE.Mesh(new RoundedBoxGeometry(.26, .08, .26, 1, .02), m); c.position.set(Math.cos(a) * .7, .43, Math.sin(a) * .7); B.add(c); chips.push(c); }
  const bulbLight = new THREE.PointLight(0xfff4e0, 0, 12); bulbLight.position.set(0, 1.4, 1); B.add(bulbLight);
  // current dots through the base & driver
  const wirePath = new THREE.CatmullRomCurve3([V(0, -2.5, 0), V(0, -1.9, .3), V(-.2, -1.2, .2), V(-.2, -.5, .15), V(.2, 0, .15), V(.3, .4, .3), V(.7, .45, .1)]);
  const amps = []; for (let i = 0; i < 18; i++) amps.push({ m: mk(0xfff07a, .07, B), o: i / 18 });

  // ---- old incandescent (left, hook) ----
  const I = new THREE.Group(); I.position.set(-3.3, 0, 0); scene.add(I);
  const iGlassMat = Mat({ color: 0xfff4d0, transparent: true, opacity: .25, shininess: 120, specular: 0xffffff, depthWrite: false, side: THREE.DoubleSide });
  I.add(new THREE.Mesh(new THREE.LatheGeometry([V2(0, 2.7), V2(.9, 2.45), V2(1.35, 1.6), V2(1.25, .6), V2(.75, -.1), V2(.6, -.6)], 40), iGlassMat));
  const iScrew = new THREE.Mesh(new THREE.CylinderGeometry(.58, .52, 1.0, 30), screwMat); iScrew.position.y = -1.1; I.add(iScrew);
  const filPts = []; for (let i = 0; i <= 80; i++) { const f = i / 80; filPts.push(V(lerp(-.45, .45, f), 1.3 + .08 * Math.sin(f * 60), .08 * Math.cos(f * 60))); }
  const filMat = Mat({ color: 0xffa040, emissive: 0xff6a10, emissiveIntensity: 0 });
  I.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(filPts), 160, .03, 6), filMat));
  const heatW = []; for (let i = 0; i < 14; i++) heatW.push({ m: mk(0xff5a2a, .16, I), o: i / 14, a: i * 2.4 });
  const iLight = new THREE.PointLight(0xffa050, 0, 8); iLight.position.set(0, 1.4, 1); I.add(iLight);

  // ---- big chip close-up (right side, steps 2-4) ----
  const C = new THREE.Group(); C.position.set(5.5, .3, 0); scene.add(C);
  const nMat = Mat({ color: 0x3a8aff, transparent: true, opacity: .8, depthWrite: false });
  const pMat = Mat({ color: 0xff6a8a, transparent: true, opacity: .8, depthWrite: false });
  const nL = new THREE.Mesh(new RoundedBoxGeometry(2.6, .9, 1.6, 2, .06), nMat); nL.position.y = -.5; C.add(nL);
  const pL = new THREE.Mesh(new RoundedBoxGeometry(2.6, .9, 1.6, 2, .06), pMat); pL.position.y = .5; C.add(pL);
  const jMat = new THREE.MeshBasicMaterial({ color: 0x6aa8ff, transparent: true, opacity: 0 });
  const junction = new THREE.Mesh(new THREE.BoxGeometry(2.62, .06, 1.62), jMat); C.add(junction);
  const phosMat = Mat({ color: 0xffe04a, emissive: 0xffd02a, emissiveIntensity: .2, transparent: true, opacity: 0, depthWrite: false });
  const phos = new THREE.Mesh(new RoundedBoxGeometry(2.9, .35, 1.9, 2, .1), phosMat); phos.position.y = 1.2; C.add(phos);
  const elec = []; for (let i = 0; i < 14; i++) elec.push({ m: mk(0x6ad0ff, .1, C), x: -1.1 + (i % 7) * .37, z: (i < 7 ? -.4 : .4), o: i / 14 });
  const holes = []; for (let i = 0; i < 14; i++) { const m = new THREE.Mesh(new THREE.TorusGeometry(.08, .025, 6, 14), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false })); C.add(m); holes.push({ m, x: -1.1 + (i % 7) * .37, z: (i < 7 ? -.4 : .4), o: i / 14 }); }
  const photons = []; for (let i = 0; i < 20; i++) photons.push({ m: mk(0x4a7aff, .09, C), x: -1.1 + (i % 7) * .37, z: (i % 2 ? -.4 : .4), o: i / 20, a: i * 2.1 });
  const chipLight = new THREE.PointLight(0x6a8aff, 0, 6); chipLight.position.set(0, 1.5, 1.5); C.add(chipLight);

  const shots = [
    [[-1.65, .6, 18.0], [-1.65, .4, 0]],
    [[2.0, -.8, 8.6], [0, -1.0, 0]],
    [[7.0, 1.8, 8.4], [5.5, .5, 0]],
    [[6.8, 1.4, 7.8], [5.5, .7, 0]],
    [[7.0, 2.2, 8.6], [5.5, 1.0, 0]],
    [[0, 1.2, 11.5], [0, 1.0, 0]],
    [[-1.65, .6, 18.0], [-1.65, .4, 0]],
  ];
  const cp = { p: V(), q: V() };

  function update(t, si, lt, sd) {
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const k = si === 0 ? 1 : ease(lt / 1.3);
    cp.p.set(...prev[0].map((v, i) => lerp(v, now[0][i], k)));
    cp.q.set(...prev[1].map((v, i) => lerp(v, now[1][i], k)));
    const o = Math.sin(t * .15) * .06;
    camera.position.set(cp.p.x + Math.sin(o) * .8, cp.p.y, cp.p.z);
    camera.lookAt(cp.q);
    const f = s => si === s ? 1 : 0;

    // incandescent on in hook, dim elsewhere
    const inc = si === 0 ? ease(lt / .6) : si === 6 ? .0 : 0;
    filMat.emissiveIntensity = inc * 1.4; iLight.intensity = inc * 3;
    heatW.forEach(({ m, o: oo, a }) => { const u = (t * .35 + oo) % 1; m.position.set(Math.cos(a) * (.5 + u * 1.2), 1.3 + u * 2.2, Math.sin(a) * .4); m.material.opacity = inc * (1 - u) * .55; m.scale.setScalar(1 + u); });
    I.visible = si === 0 || si === 6 || (si === 1 && lt < 1.3);
    C.visible = si >= 1 && si <= 4 || si === 6;

    // bulb x-ray for driver (step 1)
    const xr = si === 1 ? 1 : 0;
    housingMat.opacity = 1 - xr * .8; housingMat.depthWrite = !xr;
    screwMat.opacity = 1 - xr * .65; screwMat.depthWrite = !xr;
    pcbMat.emissiveIntensity = f(1) * (.4 + .2 * Math.sin(t * 6));
    amps.forEach(({ m, o: oo }) => { const u = (t * .35 + oo) % 1; m.position.copy(wirePath.getPoint(u)); m.material.opacity = f(1) * .95; });

    // bulb on
    const lit = si === 0 ? ease((lt - 1.2) / .6) : si === 1 ? ease((lt - 2) / .8) * .6 : si >= 5 ? 1 : .3;
    domeMat.emissiveIntensity = lit * .9; domeMat.opacity = .55 + lit * .35;
    chipMats.forEach(m => m.emissiveIntensity = lit * 1.2);
    bulbLight.intensity = lit * (si === 5 ? 4 : 3);

    // chip close-up: electrons (n, bottom) rise, holes (p, top) sink, meet at junction -> photon
    const cv = si >= 2 && si <= 4 ? 1 : 0;
    const flow = si >= 3 ? 1 : si === 2 ? .35 : 0;
    jMat.opacity = (si === 3 ? .5 + .4 * Math.sin(t * 10) : si === 4 ? .5 : si === 2 ? .2 : 0);
    elec.forEach(({ m, x, z, o: oo }) => { const u = (t * .45 * flow + oo) % 1; m.position.set(x, lerp(-.85, 0, si === 2 ? .3 + .2 * Math.sin(t + oo * 9) : u), z + .85); m.material.opacity = cv * .95; });
    holes.forEach(({ m, x, z, o: oo }) => { const u = (t * .45 * flow + oo + .02) % 1; m.position.set(x, lerp(.85, 0, si === 2 ? .3 + .2 * Math.sin(t * 1.1 + oo * 7) : u), z + .85); m.material.opacity = cv * .95; });
    photons.forEach(({ m, x, z, o: oo, a }) => { const u = (t * .6 + oo) % 1; m.position.set(x + Math.cos(a) * u * 1.4, u * 2.8, z + .85 + Math.sin(a) * u * .8); const white = si === 4 && u * 2.8 > 1.2; m.material.color.setHex(white ? 0xfff8e8 : 0x4a7aff); m.scale.setScalar(white ? 1.5 : 1); m.material.opacity = (si === 3 || si === 4 ? 1 : 0) * (1 - u); });
    chipLight.intensity = (si === 3 ? 2.5 : si === 4 ? 3 : 0);
    chipLight.color.setHex(si === 4 ? 0xfff4e0 : 0x6a8aff);
    phosMat.opacity = si === 4 ? ease(lt / .8) * .85 : 0;
    phosMat.emissiveIntensity = si === 4 ? .5 : 0;
  }
  return { update };
}
