// Inside 60 — Chainsaw. Steps: 0 hook loop of teeth, 1 one-cylinder engine, 2 centrifugal clutch, 3 sprocket + guide bar,
// 4 teeth bite chips, 5 bar oil, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x1a2230); scene.fog = new THREE.Fog(0x1a2230, 30, 80);
  scene.add(new THREE.HemisphereLight(0xfff8f0, 0x303040, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 1.2); key.position.set(5, 9, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffc080, .5); rim.position.set(-6, 3, -8); scene.add(rim);
  const root = new THREE.Group(); scene.add(root);
  const saw = new THREE.Group(); root.add(saw); saw.position.x = -1.2;

  // floor
  const floor = new THREE.Mesh(new THREE.CircleGeometry(16, 48), Mat({ color: 0x3a3228, shininess: 5 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -2.6; root.add(floor);

  // guide bar (stadium plate) x 0..L
  const L = 5.0, R = .42;
  const bs = new THREE.Shape(); bs.moveTo(0, -R); bs.lineTo(L, -R); bs.absarc(L, 0, R, -Math.PI / 2, Math.PI / 2, false); bs.lineTo(0, R); bs.absarc(0, 0, R, Math.PI / 2, Math.PI * 1.5, false);
  const barG = new THREE.ExtrudeGeometry(bs, { depth: .08, bevelEnabled: false }); barG.translate(0, 0, -.04);
  const barM = Mat({ color: 0xb8c0c8, emissive: 0x40a0ff, emissiveIntensity: 0, shininess: 160 });
  const bar = new THREE.Mesh(barG, barM); saw.add(bar);
  const groove = new THREE.Mesh(new THREE.BoxGeometry(L, .05, .1), Mat({ color: 0x707880 })); groove.position.set(L / 2, 0, 0); saw.add(groove);

  // chain path
  const P = 2 * L + 2 * Math.PI * R;
  const pathAt = s => { // returns [x, y, angle]
    s = ((s % P) + P) % P;
    if (s < L) return [s, R, 0];
    s -= L; if (s < Math.PI * R) { const a = Math.PI / 2 - s / R; return [L + Math.cos(a) * R, Math.sin(a) * R, a - Math.PI / 2]; }
    s -= Math.PI * R; if (s < L) return [L - s, -R, Math.PI];
    s -= L; const a = -Math.PI / 2 - s / R; return [Math.cos(a) * R, Math.sin(a) * R, a - Math.PI / 2];
  };
  const N = 30, LINKS = 90;
  const linkM = Mat({ color: 0x80868c, shininess: 120 });
  const links = new THREE.InstancedMesh(new THREE.BoxGeometry(.16, .07, .14), linkM, LINKS); saw.add(links);
  const toothM = Mat({ color: 0xe8ecf0, emissive: 0xffe040, emissiveIntensity: 0, shininess: 200 });
  const tGeo = new THREE.BoxGeometry(.14, .16, .16); tGeo.translate(0, .1, 0);
  const teeth = new THREE.InstancedMesh(tGeo, toothM, N); saw.add(teeth);
  const dummy = new THREE.Object3D();

  // clutch drum + sprocket at x=0 (side cover off)
  const clutch = new THREE.Group(); clutch.position.set(0, 0, .25); saw.add(clutch);
  const drumM = Mat({ color: 0x9098a0, emissive: 0xff8020, emissiveIntensity: 0, side: THREE.DoubleSide, shininess: 140 });
  const drum = new THREE.Mesh(new THREE.TorusGeometry(.62, .07, 10, 40), drumM); clutch.add(drum);
  const drumBack = new THREE.Mesh(new THREE.CircleGeometry(.62, 40), Mat({ color: 0x505860, side: THREE.DoubleSide })); drumBack.position.z = -.12; clutch.add(drumBack);
  const sprocket = new THREE.Group(); sprocket.position.z = -.25; clutch.add(sprocket);
  const spM = Mat({ color: 0xd0a040, emissive: 0xffc040, emissiveIntensity: 0, shininess: 140 });
  sprocket.add(new THREE.Mesh(new THREE.CylinderGeometry(.34, .34, .1, 7).rotateX(Math.PI / 2), spM));
  const shaftRot = new THREE.Group(); clutch.add(shaftRot);
  const wM = Mat({ color: 0xf04030, emissive: 0xff3010, emissiveIntensity: 0, shininess: 100 });
  const weights = [];
  for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.BoxGeometry(.5, .22, .14), wM); shaftRot.add(w); weights.push([w, s]); }
  const spring = new THREE.Mesh(new THREE.TorusGeometry(.18, .03, 6, 20), Mat({ color: 0x40c0ff })); shaftRot.add(spring);
  shaftRot.add(new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .3, 12).rotateX(Math.PI / 2), Mat({ color: 0xd0d8e0 })));

  // engine housing (cut-away transparent shell) behind the clutch
  const houseM = Mat({ color: 0xf08020, transparent: true, opacity: .35, shininess: 60, depthWrite: false });
  const house = new THREE.Mesh(new RoundedBox(THREE, 3.0, 1.9, 1.5, .3), houseM); house.position.set(-1.7, .45, -.1); saw.add(house);
  const cylM = Mat({ color: 0x8890a0, transparent: true, opacity: .5, emissive: 0xff6020, emissiveIntensity: 0, depthWrite: false });
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, 1.3, 24, 1, true), cylM); cyl.position.set(-1.6, .75, -.1); saw.add(cyl);
  for (let k = 0; k < 6; k++) { const f = new THREE.Mesh(new THREE.CylinderGeometry(.62, .62, .04, 24), Mat({ color: 0x9aa0aa })); f.position.set(-1.6, .75 + k * .18, -.1); saw.add(f); }
  const pistonM = Mat({ color: 0xd8dce0, emissive: 0xffa040, emissiveIntensity: 0, shininess: 150 });
  const piston = new THREE.Mesh(new THREE.CylinderGeometry(.38, .38, .4, 24), pistonM); saw.add(piston);
  const rod = new THREE.Mesh(new THREE.BoxGeometry(.1, .9, .1), Mat({ color: 0xb0b8c0 })); saw.add(rod);
  const crank = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .15, 20).rotateX(Math.PI / 2), Mat({ color: 0x707880 })); crank.position.set(-1.6, -.25, -.1); saw.add(crank);
  const flash = new THREE.Mesh(new THREE.SphereGeometry(.3, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffa030, transparent: true, opacity: 0 })); flash.position.set(-1.6, 1.25, -.1); saw.add(flash);
  // handles
  const hM = Mat({ color: 0x282c30, shininess: 30 });
  const rear = new THREE.Mesh(new THREE.TorusGeometry(.6, .1, 8, 24, Math.PI), hM); rear.position.set(-3.4, .5, -.1); rear.rotation.z = Math.PI / 2; saw.add(rear);
  const top = new THREE.Mesh(new THREE.TorusGeometry(.85, .09, 8, 28, Math.PI), hM); top.position.set(-1.6, 1.4, -.1); top.rotation.y = Math.PI / 2; saw.add(top);
  // oil tank + drip line
  const oilTank = new THREE.Mesh(new THREE.CylinderGeometry(.25, .25, .6, 16), Mat({ color: 0x302010, emissive: 0xc08010, emissiveIntensity: 0 })); oilTank.position.set(-.5, -.35, .2); saw.add(oilTank);
  const dropM = Mat({ color: 0xffc030, emissive: 0xc08000, emissiveIntensity: .6, transparent: true, opacity: .9 });
  const drops = []; for (let i = 0; i < 8; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 8), dropM); saw.add(d); drops.push(d); }
  const oilSheen = new THREE.Mesh(new THREE.BoxGeometry(L, .03, .12), new THREE.MeshBasicMaterial({ color: 0xffc030, transparent: true, opacity: 0 })); oilSheen.position.set(L / 2, R + .02, 0); saw.add(oilSheen);

  // log
  const logM = Mat({ color: 0x8a5a30, shininess: 10 });
  const log = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 4, 28).rotateX(Math.PI / 2), logM); log.position.set(2.6, -1.6, -1.2); root.add(log);
  const endM = Mat({ color: 0xd8b070, shininess: 5 });
  const end = new THREE.Mesh(new THREE.CircleGeometry(1.0, 28), endM); end.position.set(2.6, -1.6, .81); root.add(end);
  for (let k = 1; k < 4; k++) { const ring = new THREE.Mesh(new THREE.RingGeometry(k * .22, k * .22 + .03, 28), Mat({ color: 0x9a6a38 })); ring.position.set(2.6, -1.6, .82); root.add(ring); }
  const chipM = Mat({ color: 0xf0d090 });
  const chips = []; for (let i = 0; i < 40; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(.1, .03, .07), chipM); root.add(c); chips.push({ m: c, ph: Math.random(), a: Math.random() }); }

  const shots = [
    [[2.5, 4.0, 16.5], [.4, -.4, 0]],     // 0 whole saw
    [[-2.6, 1.6, 5.0], [-2.6, .6, 0]],    // 1 engine
    [[-.4, .6, 4.8], [-1.2, 0, 0]],       // 2 clutch
    [[.6, 1.2, 6.0], [-.2, -.1, 0]],       // 3 sprocket + bar
    [[3.0, .2, 4.4], [1.6, -.9, 0]],      // 4 teeth into log
    [[1.0, 1.4, 4.6], [.0, .0, 0]],       // 5 oil
    [[2.5, 4.0, 16.5], [.4, -.6, 0]],     // 6 recap
  ];
  const cp = { p: V(), q: V() };
  let chainS = 0, crankA = 0, clutchA = 0, lastT = 0;
  function update(t, si, lt, sd) {
    const dt = Math.min(.05, Math.max(0, t - lastT)); lastT = t;
    const pulse = .5 + .5 * Math.sin(t * 7);
    // engine speed and clutch engagement per step
    let rev = 1, engage = 1;
    if (si === 1) { rev = .6; engage = 0; }
    if (si === 2) { const k = ease((lt - 1.6) / 1.8); rev = .35 + .65 * k; engage = k; }
    if (si === 4) rev = 1;
    const chainSpeed = si === 4 ? 1.4 : (si === 3 || si === 5 ? 1.8 : 6);
    crankA += dt * (si === 2 ? 4 + 10 * rev : 8) ;
    clutchA += dt * (si === 2 ? 4 + 10 * rev : 8);
    chainS += dt * chainSpeed * engage;
    // piston
    const py = .75 + Math.sin(crankA * 2) * .3;
    piston.position.set(-1.6, py, -.1); rod.position.set(-1.6, (py - .25) / 2 - .15, -.1);
    crank.rotation.z = crankA * 2;
    flash.material.opacity = si === 1 && Math.sin(crankA * 2) > .85 ? .9 : 0;
    cylM.emissiveIntensity = si === 1 ? .3 + .3 * pulse : 0; pistonM.emissiveIntensity = si === 1 ? .3 : 0;
    houseM.opacity = si === 1 || si === 2 ? .18 : .35;
    // clutch
    shaftRot.rotation.z = clutchA;
    const out = .08 + .22 * engage;
    weights.forEach(([w, s]) => { w.position.set(s * out, 0, 0); });
    spring.scale.setScalar(1 + engage * .5);
    wM.emissiveIntensity = si === 2 ? .2 + .5 * engage : 0;
    drumM.emissiveIntensity = si === 2 ? .5 * engage * pulse + .1 : 0;
    const drumA = -chainS / .34;
    drum.rotation.z = drumA; sprocket.rotation.z = drumA;
    spM.emissiveIntensity = si === 3 ? .4 + .4 * pulse : 0;
    barM.emissiveIntensity = si === 3 ? .25 + .2 * pulse : 0;
    // chain
    for (let i = 0; i < LINKS; i++) { const [x, y, a] = pathAt(chainS + i * P / LINKS); dummy.position.set(x, y, 0); dummy.rotation.set(0, 0, a); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); links.setMatrixAt(i, dummy.matrix); }
    links.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < N; i++) { const [x, y, a] = pathAt(chainS + i * P / N + .05); dummy.position.set(x, y, 0); dummy.rotation.set(0, 0, a); const big = si === 0 || si === 4 ? 1.3 : 1; dummy.scale.set(big, big, big); dummy.updateMatrix(); teeth.setMatrixAt(i, dummy.matrix); }
    teeth.instanceMatrix.needsUpdate = true;
    toothM.emissiveIntensity = si === 0 || si === 4 ? .4 + .4 * pulse : 0;
    // saw lowers into the log on step 4
    const cut = si === 4 ? ease(lt / 1.5) : (si > 4 ? 1 - ease(lt / 1) : 0);
    saw.position.y = -cut * .75;
    chips.forEach((c, i) => {
      c.m.visible = si === 4 && lt > .8;
      const ph = (t * 1.3 + c.ph) % 1;
      c.m.position.set(2.0 + (c.a - .5) * .8 - ph * 1.8, -.95 + ph * 1.2 - ph * ph * 1.4, .1 + (c.a - .5) * .6 + ph * .5);
      c.m.rotation.set(t * 6 + i, t * 4, i);
    });
    // oil
    drops.forEach((d, i) => {
      d.visible = si === 5;
      const ph = (t * .9 + i / 8) % 1;
      d.position.set(lerp(-.4, .5 + ph * 3.5, Math.min(1, ph * 2)), lerp(-.1, R + .06, Math.min(1, ph * 2)), .12);
    });
    oilSheen.material.opacity = si === 5 ? .5 + .3 * pulse : 0;
    oilTank.material.emissiveIntensity = si === 5 ? .4 + .3 * pulse : 0;
    // camera
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const kk = si === 0 ? 1 : ease(lt / 1.4);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], kk))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], kk)));
    const o = Math.sin(t * .25) * .1, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o));
    camera.lookAt(cp.q);
  }
  return { update };
}
function RoundedBox(THREE, w, h, d, r) {
  const s = new THREE.Shape(); const x = w / 2 - r, y = d / 2 - r;
  s.moveTo(-x, -y); s.lineTo(x, -y); s.lineTo(x, y); s.lineTo(-x, y); s.lineTo(-x, -y);
  const g = new THREE.ExtrudeGeometry(s, { depth: h - 2 * r, bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelSegments: 3 });
  g.rotateX(-Math.PI / 2); g.translate(0, -(h - 2 * r) / 2, 0); return g;
}
