// Inside 60 — Forklift. Steps: 0 hook seesaw + front axle load, 1 front wheels pivot, 2 cast-iron counterweight, 3 hydraulic cylinder + chains lift, 4 stability triangle, 5 rear-wheel steering turn, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x182030); scene.fog = new THREE.Fog(0x182030, 30, 80);
  scene.add(new THREE.HemisphereLight(0xf4f8ff, 0x404050, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(6, 10, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0x90c0ff, .6); rim.position.set(-6, 4, -8); scene.add(rim);

  const GY = -2.0;
  const floor = new THREE.Mesh(new THREE.BoxGeometry(30, .2, 18), Mat({ color: 0x4a505a, shininess: 10 })); floor.position.y = GY - .1; scene.add(floor);
  // warehouse shelving in the back for context
  const shelfM = Mat({ color: 0x3a6ad0 });
  for (let k = 0; k < 3; k++) { const up = new THREE.Mesh(new THREE.BoxGeometry(.15, 5, .15), shelfM); up.position.set(-4 + k * 4, GY + 2.5, -5); scene.add(up); }
  for (let k = 0; k < 3; k++) { const bar = new THREE.Mesh(new THREE.BoxGeometry(8.2, .15, 1.2), Mat({ color: 0xff8a20 })); bar.position.set(0, GY + .8 + k * 1.7, -5); scene.add(bar); }

  const truck = new THREE.Group(); truck.position.set(-.6, GY, 0); scene.add(truck);
  const yellow = Mat({ color: 0xffc21a, emissive: 0x000000 });
  const dark = Mat({ color: 0x2b2f36, shininess: 20 });
  const steel = Mat({ color: 0x9aa4b2, shininess: 120 });
  const FX = 1.0, RX = -1.3, TW = .78;
  // body
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.6, .9, 1.5), yellow); body.position.set(-.25, .95, 0); truck.add(body);
  const cwM = Mat({ color: 0x505866, emissive: 0x000000, shininess: 60 });
  const cwShape = new THREE.Shape(); cwShape.moveTo(0, 0); cwShape.lineTo(.9, 0); cwShape.lineTo(.9, 1.5); cwShape.quadraticCurveTo(0, 1.6, -.15, .8); cwShape.lineTo(0, 0);
  const cw = new THREE.Mesh(new THREE.ExtrudeGeometry(cwShape, { depth: 1.55, bevelEnabled: true, bevelSize: .05, bevelThickness: .05, bevelSegments: 2 }), cwM); cw.rotation.y = Math.PI; cw.position.set(-1.25, .5, -.775); truck.add(cw);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(.5, .5, .6), dark); seat.position.set(-.5, 1.6, 0); truck.add(seat);
  const wheelSt = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, .04, 18), dark); wheelSt.position.set(.4, 2.0, 0); wheelSt.rotation.z = .6; truck.add(wheelSt);
  // overhead guard
  [[-.8, .65], [-.8, -.65], [.75, .65], [.75, -.65]].forEach(([x, z]) => { const p = new THREE.Mesh(new THREE.BoxGeometry(.08, 1.9, .08), dark); p.position.set(x, 2.35, z); truck.add(p); });
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.7, .08, 1.4), dark); roof.position.set(-.02, 3.3, 0); truck.add(roof);
  // wheels
  const frontWM = Mat({ color: 0x22252a, emissive: 0x000000, shininess: 10 });
  const fronts = [-1, 1].map(s => { const w = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, .38, 24), frontWM); w.rotation.x = Math.PI / 2; w.position.set(FX, .5, s * TW); truck.add(w); return w; });
  const rearWM = Mat({ color: 0x22252a, emissive: 0x000000, shininess: 10 });
  const rears = [-1, 1].map(s => { const g = new THREE.Group(); g.position.set(RX, .38, s * TW * .9); truck.add(g); const w = new THREE.Mesh(new THREE.CylinderGeometry(.38, .38, .3, 20), rearWM); w.rotation.x = Math.PI / 2; g.add(w); return g; });

  // mast: outer rails fixed, inner rails rise, carriage rises 2x
  const MX = 1.6;
  const mastM = Mat({ color: 0x3c424c });
  [-.42, .42].forEach(z => { const r = new THREE.Mesh(new THREE.BoxGeometry(.14, 3.0, .12), mastM); r.position.set(MX, 1.6, z); truck.add(r); });
  const outerTop = new THREE.Mesh(new THREE.BoxGeometry(.14, .12, .96), mastM); outerTop.position.set(MX, 3.1, 0); truck.add(outerTop);
  const inner = new THREE.Group(); truck.add(inner);
  [-.3, .3].forEach(z => { const r = new THREE.Mesh(new THREE.BoxGeometry(.12, 2.9, .1), steel); r.position.set(MX + .1, 1.6, z); inner.add(r); });
  const pulley = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, .5, 18), Mat({ color: 0x40e0ff, emissive: 0x20b0ff, emissiveIntensity: .2 })); pulley.rotation.x = Math.PI / 2; pulley.position.set(MX + .1, 3.05, 0); inner.add(pulley);
  // lift cylinder (barrel fixed, rod pushes inner mast head)
  const cylM = Mat({ color: 0x40d0ff, emissive: 0x000000, shininess: 140 });
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.11, .11, 2.0, 16), cylM); barrel.position.set(MX + .02, 1.15, 0); truck.add(barrel);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 1, 12), steel); truck.add(rod);
  // carriage + forks
  const carriage = new THREE.Group(); truck.add(carriage);
  const cbM = Mat({ color: 0x2f343c });
  const cplate = new THREE.Mesh(new THREE.BoxGeometry(.12, .7, 1.2), cbM); cplate.position.set(MX + .25, .35, 0); carriage.add(cplate);
  const forkM = Mat({ color: 0x9aa4b2, emissive: 0x000000, shininess: 120 });
  [-.32, .32].forEach(z => { const f = new THREE.Mesh(new THREE.BoxGeometry(1.5, .08, .16), forkM); f.position.set(MX + 1.05, .04, z); carriage.add(f); });
  // pallet + boxes
  const pallet = new THREE.Group(); carriage.add(pallet); pallet.position.set(MX + 1.1, .1, 0);
  const wood = Mat({ color: 0xc08a4a, shininess: 10 });
  const pTop = new THREE.Mesh(new THREE.BoxGeometry(1.5, .08, 1.3), wood); pTop.position.y = .14; pallet.add(pTop);
  [-.5, 0, .5].forEach(z => { const b = new THREE.Mesh(new THREE.BoxGeometry(1.5, .1, .14), wood); b.position.set(0, .05, z); pallet.add(b); });
  const boxM = Mat({ color: 0xe0b070, emissive: 0x000000, shininess: 20 });
  const boxes = [[-.35, -.3], [.35, -.3], [-.35, .3], [.35, .3]].map(([x, z], i) => { const b = new THREE.Mesh(new THREE.BoxGeometry(.66, .6, .56), boxM); b.position.set(x, .48 + (i > 1 ? 0 : 0), z); pallet.add(b); return b; });
  const box5 = new THREE.Mesh(new THREE.BoxGeometry(.66, .55, .56), boxM); box5.position.set(0, 1.05, 0); pallet.add(box5);
  // chains: from carriage over pulley down to anchor on outer frame
  const chainM = new THREE.MeshBasicMaterial({ color: 0xc0c8d0 });
  const chains = []; [-.2, .2].forEach(z => { const a = new THREE.Mesh(new THREE.BoxGeometry(.04, 1, .05), chainM); a.userData.z = z; truck.add(a); const b = a.clone(); b.userData.z = z; truck.add(b); chains.push([a, b]); });

  // helpers: arrows, pivot, triangle, CG ball
  function arrow(color, len, rad) {
    const g = new THREE.Group(); const m = new THREE.MeshBasicMaterial({ color });
    const sh = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, len, 12), m); sh.position.y = len / 2; g.add(sh);
    const hd = new THREE.Mesh(new THREE.ConeGeometry(rad * 2.4, rad * 4, 16), m); hd.position.y = len + rad * 2; g.add(hd);
    truck.add(g); return g;
  }
  const loadArrow = arrow(0xff7050, 1.2, .07); loadArrow.rotation.z = Math.PI;
  const cwArrow = arrow(0x50e0ff, 1.2, .07); cwArrow.rotation.z = Math.PI;
  const axleArrow = arrow(0xffe040, 1.0, .09); axleArrow.rotation.z = Math.PI;
  const liftArrow = arrow(0x50ff90, 1.0, .07);
  const pivM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true });
  const pivot = new THREE.Mesh(new THREE.ConeGeometry(.3, .5, 3), pivM); pivot.position.set(FX, .25 + 0, 1.25); truck.add(pivot);
  const tri = new THREE.Shape(); tri.moveTo(FX, TW); tri.lineTo(FX, -TW); tri.lineTo(RX, 0); tri.lineTo(FX, TW);
  const triM = new THREE.MeshBasicMaterial({ color: 0x40ff90, transparent: true, opacity: .45, side: THREE.DoubleSide, depthWrite: false });
  const triMesh = new THREE.Mesh(new THREE.ShapeGeometry(tri), triM); triMesh.rotation.x = Math.PI / 2; triMesh.position.y = .03; truck.add(triMesh);
  const triEdge = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([V(FX, .05, TW), V(FX, .05, -TW), V(RX, .05, 0)]), new THREE.LineBasicMaterial({ color: 0x80ffb0 })); truck.add(triEdge);
  const cg = new THREE.Mesh(new THREE.SphereGeometry(.16, 16, 12), new THREE.MeshBasicMaterial({ color: 0xff4060 })); truck.add(cg);
  const cgLine = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, 1, 6), new THREE.MeshBasicMaterial({ color: 0xff4060 })); truck.add(cgLine);

  [triM, triEdge.material, cg.material, cgLine.material].forEach(m => m.depthTest = false); [triMesh, triEdge, cg, cgLine].forEach(o => o.renderOrder = 10); cg.renderOrder = 11;
  const shots = [
    [[6, 3.5, 19], [.8, .1, 0]],         // 0 overview
    [[2, 1.2, 15], [.6, .2, 0]],      // 1 side: pivot at front wheels
    [[-8, 3, 9.5], [-1, 0, 0]],  // 2 counterweight (rear)
    [[9, 3.5, 13], [1.4, -.2, 0]],  // 3 mast lift
    [[2, 12, 7], [0.2, -1.5, 0]],    // 4 triangle from above
    [[3, 12, 13], [-.5, -1, 0]],     // 5 steering from above
    [[8, 3.5, 19], [.8, .1, 0]],       // 6 recap
  ];
  const cp = { p: V(), q: V() };
  let lastT = 0, heading = 0;
  const ORIG = V(-.6, GY, 0);
  function update(t, si, lt, sd) {
    const dt = Math.min(.1, Math.max(0, t - lastT)); lastT = t;
    const pulse = .5 + .5 * Math.sin(t * 7);
    // lift amount (inner mast rise h, carriage rises 2h)
    let h;
    if (si === 0) h = .25 * ease(lt / 2.5);
    else if (si === 3) h = .25 + .75 * ease((lt - .8) / 3.0);
    else if (si === 4) h = 1 - .9 * ease(lt / 2.5);
    else if (si >= 5) h = .1;
    else h = .25;
    inner.position.y = h;
    carriage.position.y = .12 + h * 2;
    rod.position.set(MX + .02, 2.15 + h / 2 + .45, 0); rod.scale.y = .9 + h; rod.position.y = 2.15 + (.9 + h) / 2;
    const pY = 3.05 + h, cTop = carriage.position.y + .6;
    chains.forEach(([a, b]) => { a.position.set(MX + .2, (pY + cTop) / 2, a.userData.z); a.scale.y = pY - cTop; b.position.set(MX - .02, (pY + 1.0) / 2, b.userData.z); b.scale.y = pY - 1.0; });
    // steering + driving arc
    let steer = 0;
    if (si === 5) { steer = .9 * ease(lt / 1) ; const k = ease((lt - .6) / 3.2); heading = k * Math.PI * .7; }
    else if (si === 6) { heading = Math.PI * .7 * (1 - ease(lt / 2)); steer = .9 * (1 - ease(lt / 1)); }
    else heading = 0;
    rears.forEach(r => r.rotation.y = steer);
    // pivot around a point beside the front axle to mimic tight turn
    const turnC = V(ORIG.x + FX, GY, 2.2);
    truck.rotation.y = heading;
    const off = V(ORIG.x - turnC.x, 0, ORIG.z - turnC.z).applyAxisAngle(V(0, 1, 0), heading);
    truck.position.set(turnC.x + off.x, GY, turnC.z + off.z);
    // glows
    frontWM.emissive.setHex(0xffd040); frontWM.emissiveIntensity = si === 0 || si === 1 ? .35 + .3 * pulse : 0;
    cwM.emissive.setHex(0x3080ff); cwM.emissiveIntensity = si === 2 ? .45 + .3 * pulse : si === 1 ? .2 : 0;
    cylM.emissive.setHex(0x20c0ff); cylM.emissiveIntensity = si === 3 ? .6 + .3 * pulse : 0;
    chainM.color.setHex(si === 3 ? (pulse > .5 ? 0xffe040 : 0xfff0a0) : 0xc0c8d0);
    rearWM.emissive.setHex(0x40ff90); rearWM.emissiveIntensity = si === 5 ? .5 + .3 * pulse : 0;
    boxM.emissive.setHex(0xff9030); boxM.emissiveIntensity = si === 1 ? .2 + .15 * pulse : 0;
    // arrows
    axleArrow.visible = si === 0; axleArrow.position.set(FX, 2.4 + .2 * pulse, 1.3);
    loadArrow.visible = si === 1; loadArrow.position.set(MX + 1.1, carriage.position.y + 2.7, .9);
    cwArrow.visible = si === 1 || si === 2; cwArrow.position.set(-1.7, 3.2, .9);
    liftArrow.visible = si === 3 && lt > .8 && lt < 4; liftArrow.position.set(MX + .5, carriage.position.y + .3, .95);
    pivot.visible = si === 1; pivM.opacity = .6 + .4 * pulse;
    // stability triangle + CG
    triMesh.visible = triEdge.visible = cg.visible = cgLine.visible = si === 4;
    triM.opacity = .35 + .2 * pulse;
    const cgx = .1 + .15 * h, cgy = .9 + 1.4 * h;
    cg.position.set(cgx, cgy, 0); cgLine.position.set(cgx, cgy / 2, 0); cgLine.scale.y = cgy;
    // camera
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const kk = si === 0 ? 1 : ease(lt / 1.4);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], kk))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], kk)));
    const o = Math.sin(t * .25) * .08, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o));
    camera.lookAt(cp.q);
  }
  return { update };
}
