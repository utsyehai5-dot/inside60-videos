// Inside 60 — How a Car Differential Works. Steps: 0 hook (turn paths), 1 locked axle skids, 2 pinion + ring, 3 spider gears, 4 straight, 5 turning, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 60, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  scene.background = new THREE.Color(0x152038);
  scene.fog = new THREE.Fog(0x152038, 30, 75);
  scene.add(new THREE.HemisphereLight(0xeaf2ff, 0x30302a, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(6, 10, 9); scene.add(key);
  const rim = new THREE.DirectionalLight(0x88ccff, .9); rim.position.set(-7, 5, -6); scene.add(rim);

  // bevel gear along local +y (small end at +y), inside orient -> spin groups
  function bevel(parent, r, h, color, orient, pos) {
    const o = new THREE.Group(); o.rotation.set(...orient); o.position.set(...pos); parent.add(o);
    const s = new THREE.Group(); o.add(s);
    const m = Mat({ color, emissive: color, emissiveIntensity: 0 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(r * .55, r, h, 32), m); s.add(body);
    const n = Math.max(8, Math.round(r * 16));
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; const t = new THREE.Mesh(new THREE.BoxGeometry(.11, h * .9, .14), m); t.position.set(Math.cos(a) * r * .8, 0, Math.sin(a) * r * .8); t.rotation.y = -a; t.rotation.z = .5 * Math.cos(0); s.add(t); }
    const mark = new THREE.Mesh(new THREE.BoxGeometry(r * .5, .04, .1), Mat({ color: 0xffffff })); mark.position.set(r * .35, h / 2 + .02, 0); s.add(mark);
    return { o, s, m };
  }
  const steelM = Mat({ color: 0xb0b8c4, shininess: 110, emissive: 0xffd040, emissiveIntensity: 0 });

  // ground + turn arcs
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), Mat({ color: 0x26324a, shininess: 5 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -1.25; scene.add(ground);
  const arcIn = new THREE.MeshBasicMaterial({ color: 0x40c8ff, transparent: true, opacity: 0 });
  const arcOut = new THREE.MeshBasicMaterial({ color: 0xffd040, transparent: true, opacity: 0 });
  const CX = 9; // turn center at x=+9 (turning right)
  const mkArc = (R, m) => { const a = new THREE.Mesh(new THREE.TorusGeometry(R, .09, 6, 80, Math.PI * .45), m); a.rotation.x = -Math.PI / 2; a.position.set(CX, -1.2, 0); a.rotation.z = Math.PI * .78; scene.add(a); return a; };
  mkArc(CX - 3.6, arcIn); mkArc(CX + 3.6, arcOut);

  // wheels
  const tyreM = Mat({ color: 0x2a2d33, shininess: 20 });
  function wheel(x) {
    const g = new THREE.Group(); g.position.set(x, 0, 0); scene.add(g);
    const t = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, .8, 36), tyreM); t.rotation.z = Math.PI / 2; g.add(t);
    const hubM = Mat({ color: 0xd0d6de, emissive: 0xffd040, emissiveIntensity: 0, shininess: 100 });
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(.65, .65, .84, 24), hubM); hub.rotation.z = Math.PI / 2; g.add(hub);
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; const sp = new THREE.Mesh(new THREE.BoxGeometry(.9, .14, .14), Mat({ color: 0x8a929e })); sp.position.set(0, Math.cos(a) * .4, Math.sin(a) * .4); g.add(sp); }
    const tread = new THREE.Mesh(new THREE.BoxGeometry(.84, .2, .35), Mat({ color: 0xff5a4a, emissive: 0xff5a4a, emissiveIntensity: .3 })); tread.position.set(0, 1.08, 0); g.add(tread);
    return { g, hubM };
  }
  const WX = 3.7;
  const WL = wheel(-WX), WR = wheel(WX);
  const axL = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, WX - .6, 14), steelM.clone()); axL.rotation.z = Math.PI / 2; axL.position.x = -(WX + .6) / 2; scene.add(axL);
  const axR = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, WX - .6, 14), steelM.clone()); axR.rotation.z = Math.PI / 2; axR.position.x = (WX + .6) / 2; scene.add(axR);
  // locked bar for step 1
  const lockM = new THREE.MeshBasicMaterial({ color: 0xff4040, transparent: true, opacity: 0 });
  const lockBar = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, WX * 2, 14), lockM); lockBar.rotation.z = Math.PI / 2; lockBar.position.y = -.0; scene.add(lockBar);
  const skidM = new THREE.MeshBasicMaterial({ color: 0xff6040, transparent: true, opacity: 0 });
  const skid = new THREE.Mesh(new THREE.BoxGeometry(.7, .03, 2.4), skidM); skid.position.set(-WX, -1.22, .3); scene.add(skid);

  // carrier (rotates about x with ring gear)
  const carrier = new THREE.Group(); scene.add(carrier);
  const ringM = Mat({ color: 0xe0a030, emissive: 0xffb020, emissiveIntensity: 0 });
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.75, .3, 48), ringM); ring.rotation.z = Math.PI / 2; ring.position.x = -1.05; carrier.add(ring);
  const ringHole = new THREE.Mesh(new THREE.CylinderGeometry(.9, .9, .32, 32), Mat({ color: 0x8a6a2a })); ringHole.rotation.z = Math.PI / 2; ringHole.position.x = -1.05; carrier.add(ringHole);
  for (let i = 0; i < 36; i++) { const a = i / 36 * Math.PI * 2; const t = new THREE.Mesh(new THREE.BoxGeometry(.22, .16, .12), ringM); t.position.set(-.82, Math.cos(a) * 1.55, Math.sin(a) * 1.55); t.rotation.x = -a; carrier.add(t); }
  const cageM = Mat({ color: 0x9aa6b6, transparent: true, opacity: .22, depthWrite: false, side: THREE.DoubleSide, emissive: 0x88ccff, emissiveIntensity: 0 });
  const cage = new THREE.Mesh(new THREE.SphereGeometry(1.05, 28, 18), cageM); carrier.add(cage);
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, 1.9, 12), Mat({ color: 0xd0d6de })); carrier.add(pin);
  const spU = bevel(carrier, .38, .32, 0xc060e0, [Math.PI, 0, 0], [0, .56, 0]);
  const spD = bevel(carrier, .38, .32, 0xc060e0, [0, 0, 0], [0, -.56, 0]);
  // side gears (not in carrier)
  const sgL = bevel(scene, .5, .32, 0x40c070, [0, 0, -Math.PI / 2], [-.5, 0, 0]);
  const sgR = bevel(scene, .5, .32, 0x40c070, [0, 0, Math.PI / 2], [.5, 0, 0]);
  // pinion + driveshaft (driveshaft goes toward -z)
  const pin2 = bevel(scene, .55, .5, 0x6aa8e8, [Math.PI / 2, 0, 0], [-.55, 0, -1.65]);
  const dsM = steelM.clone();
  const ds = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, 7, 14), dsM); ds.rotation.x = Math.PI / 2; ds.position.set(-.55, 0, -5.4); scene.add(ds);
  const dsMarks = []; for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.08, .36, .5), Mat({ color: 0xe04a4a })); b.position.set(-.55, 0, -3 - i * 1.6); scene.add(b); dsMarks.push(b); }

  const shots = [
    [[4.5, 10.5, 21], [0, -.8, 0]],
    [[-7.5, 6, 15], [-1.2, -.6, 0]],
    [[5.0, 4.0, -7.0], [-.6, 0, -1.2]],
    [[2.6, 2.1, 3.6], [0, 0, 0]],
    [[4.0, 6.5, 15], [0, -.4, 0]],
    [[4.2, 3.0, 6.0], [0, 0, 0]],
    [[4.5, 10.5, 21.5], [0, -.8, 0]],
  ];
  const cp = { p: V(), q: V() };
  let C = 0, S = 0, P = 0, lastT = 0, sRate = 0;

  function update(t, si, lt, sd) {
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const k = si === 0 ? 1 : ease(lt / 1.3);
    cp.p.set(...prev[0].map((v, i) => lerp(v, now[0][i], k)));
    cp.q.set(...prev[1].map((v, i) => lerp(v, now[1][i], k)));
    const o = Math.sin(t * .2) * .08;
    const dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o));
    camera.lookAt(cp.q);

    const dt = Math.min(.1, Math.max(0, t - lastT)); lastT = t;
    const cRate = 3.0;
    C += dt * cRate;
    // differential action: turning right -> left (outer) faster
    const turning = si === 0 || si === 5 || si === 6;
    const target = si === 5 ? (lt > 1.2 ? 1.2 : 0) : turning ? .9 : 0;
    sRate = lerp(sRate, target, Math.min(1, dt * 3)); S += dt * sRate;
    const locked = si === 1;
    const L = locked ? C : C + S, R = locked ? C : C - S;
    carrier.rotation.x = C;
    sgL.s.rotation.y = L; sgR.s.rotation.y = -R;
    spU.s.rotation.y = S * 1.3; spD.s.rotation.y = -S * 1.3;
    WL.g.rotation.x = L; WR.g.rotation.x = R; axL.rotation.y = 0;
    axL.rotation.x = 0; // shafts are smooth; their spin is shown by wheels/gears
    P += dt * cRate * 3.2; pin2.s.rotation.y = P;
    dsMarks.forEach(b => b.rotation.z = P);

    // highlights
    const pulse = .3 + .15 * Math.sin(t * 6);
    pin2.m.emissiveIntensity = si === 2 ? pulse : 0; ringM.emissiveIntensity = si === 2 ? pulse : 0;
    dsM.emissiveIntensity = si === 2 ? .4 : 0;
    spU.m.emissiveIntensity = spD.m.emissiveIntensity = (si === 3 || si === 5) ? pulse + .1 : 0;
    sgL.m.emissiveIntensity = sgR.m.emissiveIntensity = si === 3 ? pulse : 0;
    cageM.emissiveIntensity = si === 4 ? .5 : 0; cageM.opacity = si === 4 ? .35 : .22;
    WL.hubM.emissiveIntensity = (si === 5 && lt > 1.2) || si === 0 ? .5 : 0;
    // arcs
    arcOut.opacity = arcIn.opacity = (si === 0 ? Math.min(1, lt / .6) : si === 5 || si === 6 ? .8 : 0);
    // locked bar + skid
    lockM.opacity = locked ? Math.min(.85, lt / .5) * (.7 + .3 * Math.sin(t * 8)) : 0;
    skidM.opacity = locked ? .6 + .3 * Math.sin(t * 10) : 0;
    skid.position.z = .3 + (locked ? Math.sin(t * 9) * .15 : 0);
  }
  return { update };
}
