// Inside 60 — Air purifier (tower, cutaway). Steps: 0 hook, 1 fan pulls air in sides, 2 pre-filter catches big dust,
// 3 activated carbon grabs odour molecules, 4 HEPA pleats snag fine particles, 5 clean air out the top, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x182236);
  scene.add(new THREE.HemisphereLight(0xfff4ea, 0x404050, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, .9); key.position.set(4, 8, 10); scene.add(key);
  const root = new THREE.Group(); scene.add(root);
  const floor = new THREE.Mesh(new THREE.BoxGeometry(16, .3, 10), Mat({ color: 0xc8b89c, shininess: 10 })); floor.position.y = -2.65; root.add(floor);
  const wall = new THREE.Mesh(new THREE.BoxGeometry(16, 12, .3), Mat({ color: 0x6f8aa0, shininess: 5 })); wall.position.set(0, 2, -4); root.add(wall);

  // tower: cylinder housing (cut open on the front half when inside view)
  const R = 1.5, H0 = -2.5, H1 = 2.3;
  const caseM = Mat({ color: 0xf4f4f4, transparent: true, opacity: 1, side: THREE.DoubleSide });
  const caseMesh = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H1 - H0, 48, 1, true), caseM); caseMesh.position.y = (H0 + H1) / 2; root.add(caseMesh);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(R, R, .3, 48), Mat({ color: 0x555a66 })); base.position.y = H0 + .15; root.add(base);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(R, R, .25, 48), Mat({ color: 0x555a66 })); top.position.y = H1; root.add(top);
  const grille = new THREE.Mesh(new THREE.TorusGeometry(.9, .06, 6, 40), Mat({ color: 0x88ddff, emissive: 0x33aaff, emissiveIntensity: .3 })); grille.rotation.x = Math.PI / 2; grille.position.y = H1 + .14; root.add(grille);
  // filter rings (cylindrical layers from outside to inside), occupying y -2.1 .. 1.2
  const FY0 = -2.1, FY1 = 1.2, FH = FY1 - FY0, FYc = (FY0 + FY1) / 2;
  const preM = Mat({ color: 0xbfc6cc, emissive: 0xffffff, emissiveIntensity: 0, transparent: true, opacity: .55, side: THREE.DoubleSide, wireframe: false });
  const pre = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, FH, 48, 8, true), preM); pre.position.y = FYc; root.add(pre);
  const preMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.36, 1.36, FH, 32, 10, true), new THREE.MeshBasicMaterial({ color: 0x556070, wireframe: true, transparent: true, opacity: .5 })); preMesh.position.y = FYc; root.add(preMesh);
  const carbM = Mat({ color: 0x222222, emissive: 0x30ff90, emissiveIntensity: 0, shininess: 10, side: THREE.DoubleSide });
  const carb = new THREE.Mesh(new THREE.CylinderGeometry(1.18, 1.18, FH, 48, 1, true), carbM); carb.position.y = FYc; root.add(carb);
  // HEPA pleated ring: zig-zag extruded star shape (lathe-like) built as a custom geometry
  const pleats = 48, rO = 1.0, rI = .72;
  const hs = new THREE.Shape();
  for (let i = 0; i <= pleats * 2; i++) { const a = i / (pleats * 2) * Math.PI * 2, r = i % 2 ? rI : rO; const x = Math.cos(a) * r, y = Math.sin(a) * r; i ? hs.lineTo(x, y) : hs.moveTo(x, y); }
  const hole = new THREE.Path(); hole.absarc(0, 0, .66, 0, Math.PI * 2, true); hs.holes.push(hole);
  const hepaM = Mat({ color: 0xf6f0dc, emissive: 0xffcc33, emissiveIntensity: 0, shininess: 20 });
  const hepa = new THREE.Mesh(new THREE.ExtrudeGeometry(hs, { depth: FH, bevelEnabled: false, curveSegments: 4 }).rotateX(-Math.PI / 2), hepaM); hepa.position.y = FY0; root.add(hepa);
  // fan at top center
  const fanM = Mat({ color: 0xffcc33, emissive: 0xffaa00, emissiveIntensity: .2 });
  const fan = new THREE.Group(); fan.position.y = 1.75; root.add(fan);
  for (let i = 0; i < 7; i++) { const g = new THREE.Group(); g.rotation.y = i * Math.PI * 2 / 7; const b = new THREE.Mesh(new THREE.BoxGeometry(.6, .08, .22), fanM); b.position.x = .32; b.rotation.x = .5; g.add(b); fan.add(g); }
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, .35, 16), Mat({ color: 0x445566 })); motor.position.y = 1.75; root.add(motor);

  // particles: big dust (caught at pre), odour molecules (caught at carbon), fine particles (caught at hepa)
  const types = [
    { n: 40, r: .09, c: 0x8a6a40, stop: 1.36 },   // dust/hair
    { n: 40, r: .05, c: 0x9a40d0, stop: 1.18 },   // odour
    { n: 70, r: .035, c: 0xff6040, stop: 1.0 },   // fine
  ];
  const parts = [];
  types.forEach((ty, ti) => { const m0 = Mat({ color: ty.c, emissive: ty.c, emissiveIntensity: .4 });
    for (let i = 0; i < ty.n; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(ty.r, 8, 6), m0);
      m.userData = { ti, a: Math.random() * Math.PI * 2, y: FY0 + .2 + Math.random() * (FH - .4), o: Math.random(), stop: ty.stop }; root.add(m); parts.push(m); } });
  // clean air: white/blue streams inside and out the top
  const airM = new THREE.MeshBasicMaterial({ color: 0xcfefff, transparent: true, opacity: .8 });
  const air = Array.from({ length: 70 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 6), airM); m.userData = { a: Math.random() * Math.PI * 2, o: Math.random() }; root.add(m); return m; });

  const shots = [
    [[2.5, 1.5, 14], [0, .0, 0]],          // 0 wide
    [[1.2, 3.6, 5.0], [0, 1.6, 0]],        // 1 fan
    [[4.2, .8, 7.8], [.5, -.4, 0]],       // 2 pre-filter
    [[3.6, .8, 7.0], [.4, -.4, 0]],       // 3 carbon
    [[.6, 6.5, 5.0], [0, .2, 0]],         // 4 hepa pleats from above
    [[2.5, 4.8, 10.5], [0, 2.0, 0]],      // 5 clean air out top
    [[2.5, 1.5, 14], [0, .0, 0]],          // 6 recap
  ];
  const cp = { p: V(), q: V() };
  function update(t, si, lt, sd) {
    const pulse = .5 + .5 * Math.sin(t * 6);
    fan.rotation.y = t * 14; fanM.emissiveIntensity = si === 1 ? .7 : .25;
    caseM.opacity = si === 0 ? .9 : (si === 6 ? .6 : .14);
    preM.emissiveIntensity = si === 2 ? .2 + .2 * pulse : 0; preM.opacity = si === 2 ? .7 : .4;
    carbM.emissiveIntensity = si === 3 ? .15 + .15 * pulse : 0;
    hepaM.emissiveIntensity = si === 4 ? .25 + .25 * pulse : 0;
    // hide outer layers so the inner one being explained is visible
    pre.visible = preMesh.visible = si !== 3 && si !== 4;
    carb.visible = si !== 4 && si !== 2;
    // particles fly in from outside toward centre and stop at their filter
    parts.forEach(m => { const u = m.userData, k = (u.o + t * .22) % 1, r = lerp(4.2, u.stop + .03, Math.min(1, k * 1.4));
      m.position.set(Math.cos(u.a) * r, u.y, Math.sin(u.a) * r);
      const show = si === 0 || si === 6 || si === 1 || (si === 2 && u.ti === 0) || (si === 3 && u.ti === 1) || (si === 4 && u.ti === 2) || si === 5;
      m.visible = show; });
    // clean air rises in the core and out of the top, then spreads
    air.forEach(m => { const u = m.userData, k = (u.o + t * .35) % 1; let x, y, z;
      if (k < .5) { const r = .35; y = lerp(FY0, 1.75, k / .5); x = Math.cos(u.a) * r; z = Math.sin(u.a) * r; }
      else { const kk = (k - .5) / .5, r = .5 + kk * 3.2; y = 2.4 + kk * 1.6 - kk * kk * .8; x = Math.cos(u.a) * r; z = Math.sin(u.a) * r; }
      m.position.set(x, y, z); m.visible = si >= 4 || si === 0 || si === 1; });
    airM.opacity = si === 5 ? .95 : .6;
    // camera
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const kk = si === 0 ? 1 : ease(lt / 1.4);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], kk))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], kk)));
    const ob = Math.sin(t * .25) * .1, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(ob) - dz * Math.sin(ob), cp.p.y, cp.q.z + dz * Math.cos(ob) + dx * Math.sin(ob));
    camera.lookAt(cp.q);
  }
  return { update };
}
