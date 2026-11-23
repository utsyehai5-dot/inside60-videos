// Inside 60 — Gas boiler (condensing). Steps: 0 hook (wide cutaway), 1 burner, 2 heat exchanger, 3 pump -> radiator/tap,
// 4 condensing (droplets), 5 fan + flue + drain, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x182030);
  scene.add(new THREE.HemisphereLight(0xfff4ea, 0x404050, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, .9); key.position.set(4, 7, 10); scene.add(key);
  const root = new THREE.Group(); scene.add(root);
  const tube = (pts, r, m) => { const c = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0); const g = new THREE.Mesh(new THREE.TubeGeometry(c, 64, r, 10, false), m); root.add(g); return c; };
  // wall behind
  const wall = new THREE.Mesh(new THREE.BoxGeometry(16, 12, .3), Mat({ color: 0x5a7890, shininess: 5 })); wall.position.set(0, 0, -1.2); root.add(wall);
  // casing
  const caseM = Mat({ color: 0xf4f4f4, transparent: true, opacity: 1, side: THREE.DoubleSide });
  const casing = new THREE.Mesh(new THREE.BoxGeometry(2.6, 4.0, 1.5), caseM); casing.position.set(0, 0, 0); root.add(casing);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(1.0, .35, .05), Mat({ color: 0x223344, emissive: 0x2288ff, emissiveIntensity: .5 })); panel.position.set(0, -1.6, .77); root.add(panel);
  // burner
  const burner = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, .18, 28), Mat({ color: 0x777777, shininess: 150 })); burner.position.set(0, -1.15, 0); root.add(burner);
  const flameM = new THREE.MeshBasicMaterial({ color: 0x3aa0ff, transparent: true, opacity: .9 });
  const flames = [];
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const f = new THREE.Mesh(new THREE.ConeGeometry(.07, .4, 10), flameM); f.position.set(Math.cos(a) * .4, -.85, Math.sin(a) * .4); root.add(f); flames.push(f); }
  // heat exchanger helix (water)
  const hexM = Mat({ color: 0xc0703a, emissive: 0xff4010, emissiveIntensity: 0, shininess: 150 });
  const hp = []; for (let i = 0; i <= 120; i++) { const u = i / 120, a = u * Math.PI * 2 * 4; hp.push(V(Math.cos(a) * .7, -.55 + u * 1.5, Math.sin(a) * .5)); }
  const helix = new THREE.CatmullRomCurve3(hp); root.add(new THREE.Mesh(new THREE.TubeGeometry(helix, 300, .09, 8, false), hexM));
  // water circuit: cold return in (bottom right) -> helix -> hot flow out (top right) -> pump -> radiator -> back
  const pipeM = Mat({ color: 0xb87a48, shininess: 150 });
  const RX = 4.2;
  const flowPts = [hp[120], V(1.0, 1.0, 0), V(1.0, 1.5, .3), V(1.9, 1.5, .3), V(RX - 1.1, 1.5, .3), V(RX - 1.1, .9, .3)];
  const retPts = [V(RX + 1.1, .9, .3), V(RX + 1.1, -2.6, .3), V(1.0, -2.6, .3), V(1.0, -.55, 0), hp[0]];
  const flowC = tube(flowPts, .07, pipeM), retC = tube(retPts, .07, pipeM);
  // pump
  const PU = V(1.9, 1.5, .3);
  const pumpM = Mat({ color: 0x2f6fc0, emissive: 0x3090ff, emissiveIntensity: 0 });
  const pump = new THREE.Mesh(new THREE.CylinderGeometry(.28, .28, .4, 20).rotateX(Math.PI / 2), pumpM); pump.position.copy(PU); pump.position.z += .15; root.add(pump);
  const imp = new THREE.Group(); imp.position.set(PU.x, PU.y, PU.z + .38); root.add(imp);
  for (let i = 0; i < 4; i++) { const g = new THREE.Group(); g.rotation.z = i * Math.PI / 2; const b = new THREE.Mesh(new THREE.BoxGeometry(.22, .06, .03), Mat({ color: 0xffffff })); b.position.x = .11; g.add(b); imp.add(g); }
  // radiator
  const radM = Mat({ color: 0xf6f6f6, emissive: 0xff5020, emissiveIntensity: 0 });
  const rad = new THREE.Group(); rad.position.set(RX, -.1, .3); root.add(rad);
  for (let i = 0; i < 12; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(.15, 1.9, .3), radM); c.position.set(-1.0 + i * .18, 0, 0); rad.add(c); }
  // tap
  const tapM = Mat({ color: 0xdadada, shininess: 200 });
  const tap = new THREE.Mesh(new THREE.TorusGeometry(.3, .07, 10, 20, Math.PI), tapM); tap.position.set(RX - .2, 1.9, .3); root.add(tap);
  const tapStem = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, .4, 10), tapM); tapStem.position.set(RX - .5, 1.7, .3); root.add(tapStem);
  const dripM = new THREE.MeshBasicMaterial({ color: 0xff7040 });
  const taps = Array.from({ length: 6 }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 6), dripM); m.userData.o = i / 6; root.add(m); return m; });
  // water particles
  const cHot = new THREE.Color(0xff3a18), cCool = new THREE.Color(0x40a0ff), tmp = new THREE.Color();
  const mk = (n, r) => Array.from({ length: n }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 })); m.userData.o = i / n; root.add(m); return m; });
  const wHelix = mk(50, .06), wFlow = mk(30, .07), wRet = mk(30, .07);
  // exhaust gas: rises from burner through helix centre, through condensing section (top), fan, flue out left
  const exC = new THREE.CatmullRomCurve3([V(0, -.9, 0), V(0, .2, 0), V(0, 1.2, 0), V(-.5, 1.6, 0), V(-.5, 2.3, 0), V(-.5, 2.9, .2), V(-1.4, 2.9, .2), V(-4.5, 2.9, .2)]);
  const flueM = Mat({ color: 0xdedede, shininess: 120, transparent: true, opacity: 1 });
  const flue = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(-.5, 2.0, 0), V(-.5, 2.9, .2), V(-1.4, 2.9, .2), V(-4.5, 2.9, .2)], false, 'catmullrom', 0), 40, .28, 14, false), flueM); root.add(flue);
  const gas = mk(70, .08);
  // condensing section: finned block above the helix
  const condM = Mat({ color: 0x9ab0c0, emissive: 0x40a0ff, emissiveIntensity: 0, shininess: 120 });
  const cond = new THREE.Group(); cond.position.set(0, 1.35, 0); root.add(cond);
  for (let i = 0; i < 8; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(1.6, .04, .9), condM); f.position.y = -.2 + i * .06; cond.add(f); }
  // droplets falling to trap + drain
  const dropM = new THREE.MeshBasicMaterial({ color: 0x60c8ff });
  const drops = Array.from({ length: 24 }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 6), dropM); m.userData.o = i / 24; m.userData.x = (Math.random() - .5) * 1.2; m.userData.z = (Math.random() - .5) * .6; root.add(m); return m; });
  const trap = new THREE.Mesh(new THREE.TorusGeometry(.18, .06, 8, 20), Mat({ color: 0xffffff })); trap.position.set(-.6, -1.75, .2); root.add(trap);
  const drainC = tube([V(-.6, -1.6, .2), V(-.6, -2.4, .2), V(-.6, -3.2, .2), V(-2.0, -3.2, .2)], .06, Mat({ color: 0xeeeeee }));
  const drains = Array.from({ length: 10 }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 6), dropM); m.userData.o = i / 10; root.add(m); return m; });
  // fan in flue
  const fan = new THREE.Group(); fan.position.set(-.5, 2.2, 0); root.add(fan);
  for (let i = 0; i < 5; i++) { const g = new THREE.Group(); g.rotation.y = i * Math.PI * 2 / 5; const b = new THREE.Mesh(new THREE.BoxGeometry(.22, .03, .1), Mat({ color: 0xffcc33, emissive: 0xffaa00, emissiveIntensity: .3 })); b.position.x = .12; b.rotation.x = .5; g.add(b); fan.add(g); }

  const shots = [
    [[.4, .4, 24], [.4, .2, 0]],            // 0 wide
    [[.8, -.4, 3.6], [0, -1.0, 0]],         // 1 burner
    [[1.2, .6, 4.6], [0, .2, 0]],           // 2 exchanger
    [[3.3, .7, 10.5], [3.3, .4, .3]],        // 3 pump -> radiator
    [[1.0, 1.4, 4.2], [0, .9, 0]],          // 4 condensing
    [[-1.6, .3, 14.5], [-1.6, 0, 0]],      // 5 flue + drain
    [[.4, .4, 24], [.4, .2, 0]],            // 6 recap
  ];
  const cp = { p: V(), q: V() };
  let lastT = 0, s = 0, ia = 0;
  function update(t, si, lt, sd) {
    const dt = Math.min(.05, Math.max(0, t - lastT)); lastT = t;
    const pulse = .5 + .5 * Math.sin(t * 6);
    s += dt * .12; ia += dt * 14; imp.rotation.z = -ia; fan.rotation.y = ia * 1.4;
    caseM.opacity = (si >= 1 && si <= 5) || si === 0 || si === 6 ? .18 : 1;
    flames.forEach((f, i) => { f.scale.y = .8 + .5 * Math.abs(Math.sin(t * 9 + i)); });
    flameM.color.setHex(si === 1 ? 0x50b8ff : 0x3aa0ff);
    hexM.emissiveIntensity = si === 2 ? .35 + .3 * pulse : .12;
    pumpM.emissiveIntensity = si === 3 ? .4 + .4 * pulse : 0;
    radM.emissiveIntensity = si === 3 ? .1 + .1 * pulse : .05;
    condM.emissiveIntensity = si === 4 ? .3 + .3 * pulse : 0;
    wHelix.forEach(m => { const u = (m.userData.o + s * .6) % 1; m.position.copy(helix.getPointAt(u)); m.position.z += .02; m.material.color.copy(tmp.copy(cCool).lerp(cHot, u)); });
    wFlow.forEach(m => { const u = (m.userData.o + s) % 1; m.position.copy(flowC.getPointAt(u)); m.material.color.copy(cHot); });
    wRet.forEach(m => { const u = (m.userData.o + s) % 1; m.position.copy(retC.getPointAt(u)); m.material.color.copy(tmp.copy(cHot).lerp(cCool, Math.min(1, u * 2))); });
    taps.forEach(m => { const u = (m.userData.o + t * .9) % 1; m.position.set(RX + .1, 1.85 - u * .8, .3); m.visible = si === 3; });
    gas.forEach(m => { const u = (m.userData.o + t * .08) % 1; m.position.copy(exC.getPointAt(u));
      m.position.x += Math.sin(m.userData.o * 40) * .15 * (u < .35 ? 1 : .3);
      const hot = Math.max(0, 1 - u * 2.4); m.material.color.setHex(0x9aa4b0).lerp(new THREE.Color(0xff8040), hot);
      m.material.opacity = .85; m.visible = si !== 3; });
    const showDrops = si === 0 || si >= 4;
    drops.forEach(m => { const u = (m.userData.o + t * .35) % 1; m.visible = showDrops; m.position.set(lerp(m.userData.x, -.6, u * u), 1.1 - u * 2.75, lerp(m.userData.z, .2, u)); });
    drains.forEach(m => { const u = (m.userData.o + t * .25) % 1; m.visible = showDrops; m.position.copy(drainC.getPointAt(u)); });
    // camera
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const kk = si === 0 ? 1 : ease(lt / 1.4);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], kk))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], kk)));
    const ob = Math.sin(t * .25) * .08, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(ob) - dz * Math.sin(ob), cp.p.y, cp.q.z + dz * Math.cos(ob) + dx * Math.sin(ob));
    camera.lookAt(cp.q);
  }
  return { update };
}
