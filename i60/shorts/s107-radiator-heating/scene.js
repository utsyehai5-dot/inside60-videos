// Inside 60 — Radiator heating. Steps: 0 hook (room, convection loop), 1 boiler heats water, 2 pump pushes water,
// 3 water through panel -> metal hot, 4 convection loop, 5 cool water returns, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x1a2030);
  scene.add(new THREE.HemisphereLight(0xfff4ea, 0x404050, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, .9); key.position.set(4, 7, 10); scene.add(key);
  const root = new THREE.Group(); scene.add(root);
  const GY = -2.6, CY = 3.4;
  const floor = new THREE.Mesh(new THREE.BoxGeometry(14, .3, 10), Mat({ color: 0x9a7050, shininess: 20 })); floor.position.set(0, GY - .15, 0); root.add(floor);
  const wall = new THREE.Mesh(new THREE.BoxGeometry(14, CY - GY, .3), Mat({ color: 0x6a8aa0, shininess: 5 })); wall.position.set(0, (CY + GY) / 2, -1.6); root.add(wall);
  const ceil = new THREE.Mesh(new THREE.BoxGeometry(14, .3, 10), Mat({ color: 0xece6da, shininess: 5 })); ceil.position.set(0, CY + .15, 0); root.add(ceil);
  // boiler
  const BX = -2.5;
  const boilM = Mat({ color: 0xf2f2f2, transparent: true, opacity: 1, side: THREE.DoubleSide });
  const boil = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.2, 1.0), boilM); boil.position.set(BX, GY + 3.0, -.9); root.add(boil);
  const flames = [];
  const flameM = new THREE.MeshBasicMaterial({ color: 0x40a0ff, transparent: true, opacity: .9 });
  for (let i = 0; i < 6; i++) { const fl = new THREE.Mesh(new THREE.ConeGeometry(.08, .35, 10), flameM); fl.position.set(BX - .5 + i * .2, GY + 2.15, -.9); root.add(fl); flames.push(fl); }
  const hexM = Mat({ color: 0xa06040, emissive: 0xff4010, emissiveIntensity: 0, shininess: 150 });
  const hex = new THREE.Mesh(new THREE.TorusKnotGeometry(.32, .07, 80, 8, 2, 3), hexM); hex.position.set(BX, GY + 3.0, -.9); root.add(hex);
  // radiator panel
  const RX = 1.9, RY = GY + 1.1;
  const radM = Mat({ color: 0xf6f6f6, emissive: 0xff5020, emissiveIntensity: 0, transparent: true, opacity: 1, shininess: 90 });
  const rad = new THREE.Group(); rad.position.set(RX, RY, -1.1); root.add(rad);
  for (let i = 0; i < 14; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(.16, 1.4, .3), radM); c.position.set(-1.1 + i * .17, 0, 0); rad.add(c); }
  [-1, 1].forEach(s => { const b = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 2.6, 12).rotateZ(Math.PI / 2), radM); b.position.set(0, s * .7, 0); rad.add(b); });
  // pipe loop: boiler top -> pump -> radiator top -> snakes down through panel -> bottom -> back to boiler bottom
  const z = -1.1;
  const P = [V(BX + .4, GY + 4.1, -.9), V(BX + .4, GY + 4.4, z), V(-.6, GY + 4.4, z), V(-.6, RY + .7, z), V(RX - 1.3, RY + .7, z)];
  // through panel (zig-zag)
  for (let i = 0; i < 7; i++) { const x = RX - 1.1 + i * .34; P.push(V(x, RY + .7, z), V(x, RY - .7, z), V(x + .17, RY - .7, z), V(x + .17, RY + .7, z)); }
  P.push(V(RX + 1.3, RY + .7, z), V(RX + 1.3, RY - .7, z), V(RX + 1.3, GY + .25, z), V(BX + .4, GY + .25, z), V(BX + .4, GY + 1.9, -.9));
  const loop = new THREE.CurvePath();
  for (let i = 0; i < P.length - 1; i++) loop.add(new THREE.LineCurve3(P[i], P[i + 1]));
  const L = loop.getCurveLengths(), TOT = L[L.length - 1];
  const at = i => (i === 0 ? 0 : L[i - 1]) / TOT;
  const U_PANEL = [at(4), at(4 + 28)];
  // visible pipes (skip the zig-zag inside panel)
  const pipeM = Mat({ color: 0xc08050, shininess: 150 });
  for (let i = 0; i < P.length - 1; i++) { if (i >= 4 && i < 4 + 28) continue; const c = new THREE.LineCurve3(P[i], P[i + 1]); root.add(new THREE.Mesh(new THREE.TubeGeometry(c, 2, .07, 8, false), pipeM)); }
  // pump on supply pipe
  const PU = V(-1.5, GY + 4.4, z);
  const pumpM = Mat({ color: 0x2f6fc0, emissive: 0x3090ff, emissiveIntensity: 0 });
  const pump = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .45, 20).rotateX(Math.PI / 2), pumpM); pump.position.copy(PU); pump.position.z += .1; root.add(pump);
  const imp = new THREE.Group(); imp.position.set(PU.x, PU.y, PU.z + .36); root.add(imp);
  for (let i = 0; i < 4; i++) { const g = new THREE.Group(); g.rotation.z = i * Math.PI / 2; const b = new THREE.Mesh(new THREE.BoxGeometry(.24, .06, .03), Mat({ color: 0xffffff })); b.position.x = .12; g.add(b); imp.add(g); }
  // water particles
  const parts = Array.from({ length: 110 }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff4020 })); m.userData.o = i / 110; root.add(m); return m; });
  const cHot = new THREE.Color(0xff3a18), cCool = new THREE.Color(0x40a0ff), tmp = new THREE.Color();
  // convection air loop (in room, in front of radiator)
  const airM = new THREE.MeshBasicMaterial({ color: 0xffa050, transparent: true, opacity: .85 });
  const AL = new THREE.CatmullRomCurve3([V(RX, RY + 1.0, -.6), V(RX, CY - .5, -.2), V(RX - 2.5, CY - .3, .6), V(-4.0, CY - .8, .8), V(-4.4, GY + 1.5, .8), V(-3.0, GY + .3, .5), V(RX - 1.0, GY + .3, -.2), V(RX, RY - .9, -.6)], true);
  const air = Array.from({ length: 60 }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 6), airM.clone()); m.userData.o = i / 60; root.add(m); return m; });

  const shots = [
    [[.2, .6, 17.5], [-.2, .2, -1]],                  // 0 wide
    [[BX + 1.6, GY + 3.6, 3.2], [BX, GY + 2.9, -.9]],  // 1 boiler
    [[-1.0, GY + 4.6, 2.8], [-1.4, GY + 4.2, z]],      // 2 pump
    [[RX + .4, RY + .3, 3.6], [RX, RY, z]],            // 3 panel
    [[.4, .4, 13.5], [0, .3, -.5]],                    // 4 convection
    [[-.3, GY + 1.6, 6.5], [-.4, GY + .6, z]],         // 5 return pipe
    [[.2, .6, 17.5], [-.2, .2, -1]],                   // 6 recap
  ];
  const cp = { p: V(), q: V() };
  let s = 0, lastT = 0, ia = 0;
  function update(t, si, lt, sd) {
    const dt = Math.min(.05, Math.max(0, t - lastT)); lastT = t;
    const f = Math.min(1, lt / Math.max(.1, sd)), pulse = .5 + .5 * Math.sin(t * 6);
    s += dt * .045; ia += dt * 14; imp.rotation.z = -ia;
    const cut = si === 1 || si === 3;
    boilM.opacity = si === 1 ? .2 : 1; radM.opacity = si === 3 ? .35 : 1;
    flames.forEach((fl, i) => { fl.scale.y = .8 + .4 * Math.abs(Math.sin(t * 9 + i)); fl.visible = si === 1; });
    hexM.emissiveIntensity = si === 1 ? .4 + .3 * pulse : .1;
    pumpM.emissiveIntensity = si === 2 ? .4 + .4 * pulse : 0;
    radM.emissiveIntensity = si === 3 ? .12 + .1 * pulse : (si === 0 || si >= 4 ? .08 : 0);
    parts.forEach(m => { const u = (m.userData.o + s) % 1; m.position.copy(loop.getPointAt(u));
      let T = 1; if (u > U_PANEL[0] && u < U_PANEL[1]) T = 1 - (u - U_PANEL[0]) / (U_PANEL[1] - U_PANEL[0]); else if (u >= U_PANEL[1]) T = 0;
      m.material.color.copy(tmp.copy(cCool).lerp(cHot, T));
      const inPanel = u > U_PANEL[0] && u < U_PANEL[1]; m.visible = !inPanel || si === 3; m.position.z += inPanel ? .2 : 0;
      m.scale.setScalar(si === 5 && T < .2 ? 1.4 : 1); });
    const showAir = si === 0 || si >= 4;
    air.forEach(m => { const k = (m.userData.o + t * .05) % 1; m.visible = showAir; m.position.copy(AL.getPointAt(k));
      const warm = 1 - Math.min(1, Math.abs(((k + .5) % 1) - .5) * 2.6); // hot near radiator (k~0), cool far side
      m.material.color.setHex(0x60b0ff).lerp(new THREE.Color(0xff9040), warm); });
    // camera
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const kk = si === 0 ? 1 : ease(lt / 1.4);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], kk))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], kk)));
    const ob = Math.sin(t * .25) * .06, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(ob) - dz * Math.sin(ob), cp.p.y, cp.q.z + dz * Math.cos(ob) + dx * Math.sin(ob));
    camera.lookAt(cp.q);
  }
  return { update };
}
