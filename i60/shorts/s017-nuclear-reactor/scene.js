// Inside 60 — How a Nuclear Reactor Works. Steps: 0 pellet hook, 1 fission, 2 chain reaction + control rods, 3 hot pressurized loop, 4 steam generator, 5 turbine + generator + condenser, 6 recap
export async function setup({ THREE, scene, camera }) {
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 50, specular: 0x333333, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const fr = x => x - Math.floor(x);
  const glow = (c, r) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, depthWrite: false })); scene.add(m); return m; };

  scene.background = new THREE.Color(0x121c30);
  scene.fog = new THREE.Fog(0x121c30, 40, 90);
  scene.add(new THREE.HemisphereLight(0xeaf2ff, 0x30302a, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(6, 10, 9); scene.add(key);
  const rim = new THREE.DirectionalLight(0x88ccff, .9); rim.position.set(-7, 5, -6); scene.add(rim);

  // ---------- micro zone (x = -24): pellet + atoms ----------
  const MZ = V(-24, 0, 0);
  const pelletMat = Mat({ color: 0x3a3a3e, emissive: 0x30ff70, emissiveIntensity: .25, shininess: 90 });
  const pellet = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, 1.1, 32), pelletMat); pellet.position.set(MZ.x - 1.4, MZ.y, 0); scene.add(pellet);
  const coal = new THREE.Group(); coal.position.set(MZ.x + 2.0, MZ.y - 1.2, -.5); scene.add(coal);
  const coalM = Mat({ color: 0x24242a, shininess: 10 });
  for (let i = 0; i < 55; i++) { const r = .25 + (i * 37 % 10) / 40; const b = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), coalM); const a = i * 2.4, rr = 1.6 * Math.sqrt((i % 20) / 20); b.position.set(Math.cos(a) * rr, Math.floor(i / 20) * .45 + (1.6 - rr) * .5, Math.sin(a) * rr * .6); b.rotation.set(i, i * 2, i * 3); coal.add(b); }
  const eq = new THREE.Group(); eq.position.set(MZ.x + .2, MZ.y, 0); scene.add(eq);
  const eqM = new THREE.MeshBasicMaterial({ color: 0xffe040, transparent: true, opacity: 0 });
  [-.18, .18].forEach(y => { const b = new THREE.Mesh(new THREE.BoxGeometry(.6, .12, .05), eqM); b.position.y = y; eq.add(b); });

  // atoms: big nucleus that splits
  const nucM = Mat({ color: 0x40d070, emissive: 0x20ff60, emissiveIntensity: .2, shininess: 80 });
  const halfA = new THREE.Mesh(new THREE.SphereGeometry(.75, 24, 18), nucM); const halfB = new THREE.Mesh(new THREE.SphereGeometry(.75, 24, 18), nucM.clone());
  const atom = new THREE.Mesh(new THREE.SphereGeometry(1.05, 28, 20), nucM); atom.position.copy(MZ); scene.add(atom); scene.add(halfA); scene.add(halfB);
  const neutron = glow(0x8ad8ff, .22);
  const outN = []; for (let i = 0; i < 3; i++) outN.push(glow(0x8ad8ff, .2));
  const flash = glow(0xffd060, 1.6);
  // chain lattice (step 2 small view inside core uses vessel zone)

  // ---------- plant zone ----------
  // reactor vessel (cut-away, transparent shell) at x=-6
  const RV = V(-6, 0, 0);
  const shellM = Mat({ color: 0x9aa6b6, transparent: true, opacity: .28, depthWrite: false, side: THREE.DoubleSide });
  { const sh = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 6, 36, 1, true), shellM); sh.position.copy(RV); scene.add(sh); }
  const domeT = new THREE.Mesh(new THREE.SphereGeometry(1.8, 36, 12, 0, Math.PI * 2, 0, Math.PI / 2), shellM); domeT.position.set(RV.x, 3, 0); scene.add(domeT);
  const domeB = new THREE.Mesh(new THREE.SphereGeometry(1.8, 36, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), shellM); domeB.position.set(RV.x, -3, 0); scene.add(domeB);
  const coreWater = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 5.8, 32), Mat({ color: 0x2a7ad8, emissive: 0x2a5aff, emissiveIntensity: .15, transparent: true, opacity: .25, depthWrite: false })); coreWater.position.copy(RV); scene.add(coreWater);
  const fuelM = Mat({ color: 0x6ad08a, emissive: 0x30ff70, emissiveIntensity: .2 });
  const fuel = [];
  for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) { if (Math.abs(i) + Math.abs(j) > 3) continue; const r = new THREE.Mesh(new THREE.BoxGeometry(.32, 3.2, .32), fuelM); r.position.set(RV.x + i * .55, -.8, j * .55); scene.add(r); fuel.push(r); }
  const rodM = Mat({ color: 0x2a2e36, emissive: 0xffe040, emissiveIntensity: 0, shininess: 90 });
  const rods = []; [[-.275, -.275], [.275, .275], [-.275, .275], [.275, -.275]].forEach(([a, b]) => { const r = new THREE.Mesh(new THREE.CylinderGeometry(.11, .11, 3.6, 12), rodM); r.position.set(RV.x + a, 2.2, b); scene.add(r); rods.push(r); });
  const sparksCore = []; for (let i = 0; i < 24; i++) sparksCore.push(glow(0x8ad8ff, .08));
  const heatGlow = glow(0xff9040, 1.4); heatGlow.position.set(RV.x, -.8, 0);

  // steam generator at x=0
  const SG = V(0, .5, 0);
  const sgShell = new THREE.Mesh(new THREE.CapsuleGeometry(1.1, 4.2, 8, 28), Mat({ color: 0xc8ccd4, transparent: true, opacity: .3, depthWrite: false, side: THREE.DoubleSide })); sgShell.position.copy(SG); scene.add(sgShell);
  const uM = Mat({ color: 0xff6a3a, emissive: 0xff4020, emissiveIntensity: .3 });
  for (let k = 0; k < 4; k++) { const w = .25 + k * .17; const c = new THREE.CatmullRomCurve3([V(-w, -1.6, 0), V(-w, 1.2, 0), V(0, 1.2 + w, 0), V(w, 1.2, 0), V(w, -1.6, 0)]); const u = new THREE.Mesh(new THREE.TubeGeometry(c, 40, .06, 8), uM); u.position.copy(SG); u.position.z = (k % 2 ? .25 : -.25); scene.add(u); }
  const secW = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 2.4, 28), Mat({ color: 0x3a8ae8, transparent: true, opacity: .35, depthWrite: false })); secW.position.set(SG.x, SG.y - .6, 0); scene.add(secW);
  const bubbles = []; for (let i = 0; i < 26; i++) bubbles.push({ m: glow(0xffffff, .09), x: ((i * 37) % 17) / 17 * 1.6 - .8, z: ((i * 53) % 13) / 13 * 1.4 - .7, o: i / 26 });

  // primary loop pipes (red hot)
  const pM = Mat({ color: 0xd04a3a, emissive: 0xff3a20, emissiveIntensity: .1, transparent: true, opacity: .6, depthWrite: false });
  const hot = new THREE.CatmullRomCurve3([V(RV.x + 1.6, 1.3, 0), V(-3, 1.6, 0), V(-1.6, 1.6, 0), V(-.9, -.8, 0), V(SG.x - .4, SG.y - 1.9, 0)]);
  const cold = new THREE.CatmullRomCurve3([V(SG.x + .4, SG.y - 1.9, 0), V(.6, -2.6, .6), V(-2.4, -2.9, .9), V(-4, -2.0, 0), V(RV.x + 1.6, -1.6, 0)]);
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(hot, 60, .25, 12), pM)); scene.add(new THREE.Mesh(new THREE.TubeGeometry(cold, 60, .25, 12), pM));
  const pump = new THREE.Mesh(new RoundedBoxGeometry(.9, .9, .9, 2, .12), Mat({ color: 0x5a6a80 })); pump.position.copy(cold.getPoint(.5)); scene.add(pump);
  const pDrops = []; for (let i = 0; i < 30; i++) pDrops.push({ m: glow(0xff8a50, .11), o: i / 30 });
  const gauge = new THREE.Group(); gauge.position.set(-3, 2.5, .3); scene.add(gauge);
  gauge.add(new THREE.Mesh(new THREE.CylinderGeometry(.45, .45, .12, 28), Mat({ color: 0xeeeeee }))); gauge.children[0].rotation.x = Math.PI / 2;
  const needle = new THREE.Mesh(new THREE.BoxGeometry(.05, .38, .04), new THREE.MeshBasicMaterial({ color: 0xff3020 })); needle.geometry.translate(0, .17, 0); needle.position.z = .08; gauge.add(needle);
  const gStem = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .9, 8), Mat({ color: 0x9aa2ae })); gStem.position.set(-3, 1.95, .2); scene.add(gStem);

  // steam line to turbine at x=5
  const sM = Mat({ color: 0xdde4ee, transparent: true, opacity: .45, depthWrite: false });
  const steamC = new THREE.CatmullRomCurve3([V(SG.x, SG.y + 3.2, 0), V(1, 4.2, 0), V(3.2, 3.8, 0), V(4.2, 1.8, 0)]);
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(steamC, 50, .22, 12), sM));
  const puffs = []; for (let i = 0; i < 22; i++) puffs.push({ m: glow(0xffffff, .13), o: i / 22 });
  const TB = V(5.2, 1.0, 0);
  const tCase = new THREE.Mesh(new THREE.CylinderGeometry(.6, 1.2, 2.6, 28, 1, true), Mat({ color: 0x9aa6b6, transparent: true, opacity: .35, depthWrite: false, side: THREE.DoubleSide })); tCase.rotation.z = Math.PI / 2; tCase.position.copy(TB); scene.add(tCase);
  const rotor = new THREE.Group(); rotor.position.copy(TB); scene.add(rotor);
  const bladeM = Mat({ color: 0xe0a030, emissive: 0xffa040, emissiveIntensity: 0, shininess: 100 });
  for (let s = 0; s < 4; s++) { const R = .5 + s * .17; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const b = new THREE.Mesh(new THREE.BoxGeometry(.06, R, .14), bladeM); b.position.set(-.9 + s * .6, Math.cos(a) * R / 2, Math.sin(a) * R / 2); b.rotation.x = -a; b.rotation.y = .5; rotor.add(b); } }
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, 5.2, 12), Mat({ color: 0xb0b8c4, shininess: 100 })); shaft.rotation.z = Math.PI / 2; shaft.position.set(TB.x + 1.6, TB.y, 0); rotor.add(shaft); shaft.position.set(1.6, 0, 0);
  const GN = V(8.2, 1.0, 0);
  const gen = new THREE.Mesh(new RoundedBoxGeometry(1.8, 1.6, 1.6, 3, .25), Mat({ color: 0x3a6ab8, emissive: 0xffd040, emissiveIntensity: 0 })); gen.position.copy(GN); scene.add(gen);
  const lineC = new THREE.CatmullRomCurve3([V(GN.x, GN.y + .8, 0), V(GN.x + .6, 3.2, 0), V(GN.x + 2.4, 4.0, 0)]);
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(lineC, 20, .04, 6), Mat({ color: 0x30343c })));
  const zaps = []; for (let i = 0; i < 10; i++) zaps.push(glow(0xffd040, .1));
  // condenser below turbine, return line to SG
  const cond = new THREE.Mesh(new RoundedBoxGeometry(2.6, 1.0, 1.4, 2, .15), Mat({ color: 0x6aa8d8, emissive: 0x2a6aff, emissiveIntensity: 0 })); cond.position.set(5.2, -1.6, 0); scene.add(cond);
  const retC = new THREE.CatmullRomCurve3([V(3.9, -1.6, 0), V(2.4, -1.4, -.4), V(1.0, -1.2, -.6), V(SG.x + .9, SG.y - 1.0, -.3)]);
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(retC, 30, .15, 10), Mat({ color: 0x3a8ae8, transparent: true, opacity: .55, depthWrite: false })));
  const rDrops = []; for (let i = 0; i < 12; i++) rDrops.push({ m: glow(0x8ad8ff, .09), o: i / 12 });
  // containment dome hint behind
  const cont = new THREE.Mesh(new THREE.SphereGeometry(6.5, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2), Mat({ color: 0xc8c4ba, transparent: true, opacity: .1, depthWrite: false, side: THREE.DoubleSide })); cont.position.set(-3, -3.4, -.5); scene.add(cont);
  const ground = new THREE.Mesh(new THREE.BoxGeometry(60, .4, 14), Mat({ color: 0x3a4450 })); ground.position.set(-4, -3.6 - 1.2, -2); scene.add(ground);

  const shots = [
    [[MZ.x + .4, MZ.y + 2.0, 15.5], [MZ.x + .4, MZ.y - .2, 0]],
    [[MZ.x, MZ.y + 1.2, 14.5], [MZ.x, MZ.y, 0]],
    [[RV.x + 3.0, 3.4, 13.5], [RV.x, 0, 0]],
    [[-3.2, 1.6, 16.5], [-3, -.3, 0]],
    [[1.8, 2.4, 12.5], [SG.x, SG.y + .3, 0]],
    [[7.0, 2.8, 15.5], [6.4, .4, 0]],
    [[1.0, 6.0, 40], [1.2, .3, 0]],
  ];
  const cp = { p: V(), q: V() };
  let rot = 0, lastT = 0;

  function update(t, si, lt, sd) {
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const k = si === 0 ? 1 : ease(lt / 1.4);
    cp.p.set(...prev[0].map((v, i) => lerp(v, now[0][i], k)));
    cp.q.set(...prev[1].map((v, i) => lerp(v, now[1][i], k)));
    const o = Math.sin(t * .15) * .06;
    camera.position.set(cp.q.x + (cp.p.x - cp.q.x) * Math.cos(o) - cp.p.z * Math.sin(o), cp.p.y, cp.p.z * Math.cos(o) + (cp.p.x - cp.q.x) * Math.sin(o));
    camera.lookAt(cp.q);

    // step 0: pellet vs coal
    pellet.rotation.y = t * .6; pellet.rotation.z = .3;
    pelletMat.emissiveIntensity = si === 0 ? .45 + .2 * Math.sin(t * 5) : .2;
    eqM.opacity = si === 0 ? ease((lt - .8) / .5) : 0;
    const showPellet = si === 0 ? 1 : 0;
    pellet.visible = coal.visible = si === 0 || (si === 1 && lt < 1.2);
    // step 1: fission
    const fiss = si === 1 ? lt : si === 0 ? -1 : 99;
    const hitT = 1.6;
    atom.visible = si === 1 && fiss < hitT;
    atom.position.set(MZ.x, MZ.y + .04 * Math.sin(t * 20) * (fiss > 1 ? 1 : 0), 0);
    if (si === 1) {
      const u = Math.min(1, fiss / hitT);
      neutron.position.set(MZ.x - 4 + 4 * u, MZ.y + .2 * (1 - u), 0); neutron.material.opacity = fiss < hitT ? 1 : 0;
      const sp = Math.max(0, fiss - hitT);
      halfA.visible = halfB.visible = fiss >= hitT;
      halfA.position.set(MZ.x - 1.6 * Math.min(sp, 1.6), MZ.y + .9 * Math.min(sp, 1.6), 0);
      halfB.position.set(MZ.x + 1.6 * Math.min(sp, 1.6), MZ.y - .9 * Math.min(sp, 1.6), 0);
      halfA.material.emissiveIntensity = halfB.material.emissiveIntensity = .3 + .5 * Math.exp(-sp * 2);
      flash.position.copy(MZ); flash.material.opacity = fiss >= hitT ? .8 * Math.exp(-sp * 2.5) : 0; flash.scale.setScalar(1 + sp * 1.5);
      outN.forEach((m, i) => { const a = .5 + i * 2.1; m.position.set(MZ.x + Math.cos(a) * sp * 2.4, MZ.y + Math.sin(a) * sp * 2.4, Math.sin(i) * sp); m.material.opacity = fiss >= hitT ? 1 : 0; });
    } else { neutron.material.opacity = 0; halfA.visible = halfB.visible = false; flash.material.opacity = 0; outN.forEach(m => m.material.opacity = 0); }

    // step 2: chain + control rods
    const active = si >= 2 || si === 0 ? 1 : 0;
    const rodIn = si === 2 ? ease((lt - 1.5) / 1.5) * .6 : si > 2 ? .6 : 0;
    rods.forEach(r => r.position.y = 2.2 - rodIn * 2.2);
    rodM.emissiveIntensity = si === 2 ? .35 + .2 * Math.sin(t * 6) : 0;
    fuelM.emissiveIntensity = active ? (si === 2 ? .6 + .25 * Math.sin(t * 8) * (1 - rodIn) : .45) : .15;
    sparksCore.forEach((m, i) => { const u = fr(t * 1.3 + i / 24); const a = i * 2.39; m.position.set(RV.x + Math.cos(a) * 1.3 * u, -.8 + Math.sin(i * 3.1) * 1.4, Math.sin(a) * 1.3 * u); m.material.opacity = si === 2 ? Math.sin(u * Math.PI) * (1 - rodIn * .8) : 0; });
    heatGlow.material.opacity = active ? (si === 2 || si === 3 ? .35 + .1 * Math.sin(t * 4) : .2) : 0;

    // primary loop
    pM.emissiveIntensity = si === 3 ? .55 + .2 * Math.sin(t * 6) : active ? .25 : .05;
    pump.rotation.y = t * 2;
    pDrops.forEach(({ m, o: oo }) => { const u = fr(t * .25 + oo); m.position.copy(u < .5 ? hot.getPoint(u * 2) : cold.getPoint((u - .5) * 2)); m.material.opacity = active; m.material.color.setHex(u < .5 ? 0xff8a50 : 0xffc090); });
    needle.rotation.z = si === 3 ? lerp(1.2, -1.2, ease(lt / 1.6)) + .05 * Math.sin(t * 20) : si > 3 ? -1.2 : 1.2;
    uM.emissiveIntensity = si === 4 ? .7 + .3 * Math.sin(t * 6) : .3 * active;
    const boil = si >= 4 || si === 0 ? 1 : 0;
    bubbles.forEach(({ m, x, z, o: oo }) => { const u = fr(t * .6 + oo); m.position.set(SG.x + x * .8, SG.y - 1.8 + u * 3.6, z * .8); m.material.opacity = boil * Math.sin(u * Math.PI) * (si === 4 ? 1 : .6); });
    puffs.forEach(({ m, o: oo }) => { const u = fr(t * .5 + oo); m.position.copy(steamC.getPoint(u)); m.material.opacity = (si >= 4 || si === 0) && !(si === 4 && lt < 1.5) ? .9 : 0; });

    const dt = Math.min(.1, Math.max(0, t - lastT)); lastT = t;
    const spin = si >= 5 || si === 0 ? 1 : si === 4 ? .3 : 0;
    rot += dt * 6 * spin; rotor.rotation.x = rot;
    bladeM.emissiveIntensity = si === 5 ? .35 + .2 * Math.sin(t * 6) : 0;
    gen.material.emissiveIntensity = si === 5 ? .3 + .2 * Math.sin(t * 10) : 0;
    zaps.forEach((m, i) => { const u = fr(t * .5 + i / 10); m.position.copy(lineC.getPoint(u)); m.material.opacity = spin >= 1 ? 1 : 0; });
    cond.material.emissiveIntensity = si === 5 ? .35 : 0;
    rDrops.forEach(({ m, o: oo }) => { m.position.copy(retC.getPoint(fr(t * .3 + oo))); m.material.opacity = spin >= 1 ? 1 : 0; });
  }
  return { update };
}
