// Inside 60 — Diesel engine. Steps: 0 hook, 1 intake, 2 compression, 3 heat, 4 injection+power, 5 exhaust, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 60, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x181c2e);
  scene.fog = new THREE.Fog(0x181c2e, 30, 80);
  scene.add(new THREE.HemisphereLight(0xeaf2ff, 0x30302a, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(6, 10, 9); scene.add(key);
  const rim = new THREE.DirectionalLight(0x88ccff, .9); rim.position.set(-7, 5, -6); scene.add(rim);

  const R = 1.6, TOP = 2.0, STROKE = 3.0; // piston top travels TOP-.3 (TDC) .. TOP-.3-STROKE (BDC)
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(R + .1, R + .1, STROKE + 1.6, 40, 1, true), Mat({ color: 0x8aa6d0, transparent: true, opacity: .2, depthWrite: false, side: THREE.DoubleSide }));
  cyl.position.y = TOP - (STROKE + 1.6) / 2; scene.add(cyl);
  const head = new THREE.Mesh(new THREE.CylinderGeometry(R + .35, R + .35, .45, 40), Mat({ color: 0x5a6474, transparent: true, opacity: .6 })); head.position.y = TOP + .22; scene.add(head);
  const piston = new THREE.Group(); scene.add(piston);
  piston.add(new THREE.Mesh(new THREE.CylinderGeometry(R, R, 1.0, 40), Mat({ color: 0xc4cad2, shininess: 100 })));
  for (let i = 0; i < 3; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(R + .005, .03, 6, 40), Mat({ color: 0x6a707a })); r.rotation.x = Math.PI / 2; r.position.y = .35 - i * .14; piston.add(r); }
  const rod = new THREE.Mesh(new THREE.BoxGeometry(.4, 1, .4), Mat({ color: 0x8a929e })); scene.add(rod);
  const crankY = TOP - .3 - STROKE - 2.4, crR = STROKE / 2;
  const crank = new THREE.Group(); crank.position.set(0, crankY, 0); scene.add(crank);
  const web = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, .3, 30), Mat({ color: 0x707884 })); web.rotation.x = Math.PI / 2; web.position.z = -.35; crank.add(web);
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, .8, 14), Mat({ color: 0xd0d6de })); pin.rotation.x = Math.PI / 2; crank.add(pin);
  // valves
  const vM = Mat({ color: 0xb8bec6, shininess: 100 });
  function valve(x) { const g = new THREE.Group(); g.position.set(x, TOP, 0); scene.add(g);
    const d = new THREE.Mesh(new THREE.CylinderGeometry(.42, .5, .1, 24), vM); g.add(d);
    const s = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 1.6, 10), vM); s.position.y = .8; g.add(s); return g; }
  const vIn = valve(-.85), vEx = valve(.85);
  const inPipe = new THREE.CatmullRomCurve3([V(-4.6, 3.6, 0), V(-2.6, 3.2, 0), V(-1.2, 2.7, 0), V(-.85, 2.0, 0), V(-.6, .8, 0)]);
  const exPipe = new THREE.CatmullRomCurve3([V(.6, .8, 0), V(.85, 2.0, 0), V(1.2, 2.7, 0), V(2.6, 3.2, 0), V(4.6, 3.6, 0)]);
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(-4.6, 3.6, 0), V(-2.6, 3.2, 0), V(-1.2, 2.7, 0), V(-.85, 2.35, 0)]), 40, .38, 12, false), Mat({ color: 0x6a90c0, transparent: true, opacity: .3, depthWrite: false })));
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(.85, 2.35, 0), V(1.2, 2.7, 0), V(2.6, 3.2, 0), V(4.6, 3.6, 0)]), 40, .38, 12, false), Mat({ color: 0xa07050, transparent: true, opacity: .3, depthWrite: false })));
  // injector
  const injM = Mat({ color: 0x3a8a5a, emissive: 0x40ff90, emissiveIntensity: 0 });
  const inj = new THREE.Mesh(new THREE.CylinderGeometry(.16, .1, 1.5, 16), injM); inj.position.set(0, TOP + .9, 0); scene.add(inj);
  // gas volume
  const gasM = new THREE.MeshBasicMaterial({ color: 0x80c8ff, transparent: true, opacity: .2, depthWrite: false });
  const gas = new THREE.Mesh(new THREE.CylinderGeometry(R - .03, R - .03, 1, 40), gasM); scene.add(gas);
  const fireM = new THREE.MeshBasicMaterial({ color: 0xff9030, transparent: true, opacity: 0, depthWrite: false });
  const fire = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), fireM); scene.add(fire);
  const pg = new THREE.SphereGeometry(.08, 8, 6);
  const mk = (n, c) => Array.from({ length: n }, () => { const m = new THREE.Mesh(pg, new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0 })); scene.add(m); return m; });
  const airP = mk(30, 0x9ad8ff), exP = mk(30, 0x9a9090), spray = mk(24, 0xfff080), cloud = mk(60, 0x9ad8ff);
  const seed = cloud.map(() => [Math.random() * Math.PI * 2, Math.sqrt(Math.random()) * (R - .15), Math.random()]);

  const shots = [
    [[6.5, 3.5, 15.5], [0, .4, 0]],
    [[-6, 4.5, 8.5], [-1.4, 1.6, 0]],
    [[6, 2.5, 10.5], [0, 1.4, 0]],
    [[4.2, 3.2, 7.5], [0, 2.0, 0]],
    [[-4.5, 3.5, 10], [0, 1.0, 0]],
    [[7, 4.5, 11], [1.4, 2.0, 0]],
    [[6.5, 3.5, 16], [0, .4, 0]],
  ];
  const cp = { p: V(), q: V() }; const tmp = V();
  // crank angle a: 0 = TDC. piston top y
  const pY = a => TOP - .3 - crR * (1 - Math.cos(a));
  function update(t, si, lt) {
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const k = si === 0 ? 1 : ease(lt / 1.3);
    cp.p.set(...prev[0].map((v, i) => lerp(v, now[0][i], k))); cp.q.set(...prev[1].map((v, i) => lerp(v, now[1][i], k)));
    const o = Math.sin(t * .2) * .08, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o)); camera.lookAt(cp.q);
    // stroke: 0 intake,1 comp,2 power,3 exhaust; s = progress in stroke
    let stroke, s;
    if (si === 0 || si === 6) { const c = (t * .5) % 4; stroke = c | 0; s = c - stroke; }
    else if (si === 1) { stroke = 0; s = ease(lt / 2.2); }
    else if (si === 2) { stroke = 1; s = ease(lt / 2.6); }
    else if (si === 3) { stroke = 1; s = 1; }
    else if (si === 4) { stroke = 2; s = lt < .9 ? 0 : ease((lt - .9) / 1.6); }
    else { stroke = 3; s = ease(lt / 2.4); }
    const a = (stroke * Math.PI + s * Math.PI) + Math.PI; // intake starts at TDC (a=PI offset => use angle from TDC)
    const ang = stroke * Math.PI + s * Math.PI; // 0 at TDC start of intake
    const y = pY(ang);
    piston.position.y = y - .5;
    const px = -crR * Math.sin(ang), py = crR * Math.cos(ang);
    crank.rotation.z = ang; // visual
    const pinW = V(crR * Math.sin(-ang) * -1, crankY + py, 0); pin.position.set(-px * 0 + crR * Math.sin(ang) * 0, 0, 0);
    pin.position.set(0, crR, 0); // in crank local, rotates with crank
    const pinWorld = V(-crR * Math.sin(ang), crankY + crR * Math.cos(ang), 0);
    const top = V(0, y - 1.0, 0); const mid = top.clone().add(pinWorld).multiplyScalar(.5);
    rod.position.copy(mid); rod.scale.y = top.distanceTo(pinWorld); rod.rotation.z = Math.atan2(-(pinWorld.x - top.x), pinWorld.y - top.y) + Math.PI;
    vIn.position.y = TOP - (stroke === 0 ? .45 * Math.sin(s * Math.PI) : 0);
    vEx.position.y = TOP - (stroke === 3 ? .45 * Math.sin(s * Math.PI) : 0);
    const h = TOP - y; gas.scale.y = Math.max(.02, h); gas.position.y = y + h / 2;
    // heat level
    let heat = 0; if (stroke === 1) heat = s * s; if (stroke === 2) heat = 1;
    const blue = new THREE.Color(0x80c8ff), red = new THREE.Color(0xff5020);
    gasM.color.copy(blue).lerp(red, stroke === 3 ? .3 : heat); gasM.opacity = stroke === 1 ? .2 + .35 * heat : stroke === 3 ? .15 * (1 - s) + .05 : .2;
    if (stroke === 3) gasM.color.setHex(0x908080);
    // spray + fire in power stroke
    const inject = stroke === 2 && (si === 4 ? lt < 1.3 : s < .25);
    injM.emissiveIntensity = inject ? .9 : si === 4 ? .2 : 0;
    spray.forEach((p, i) => { const u = ((i / spray.length) + t * 2.5) % 1; const sa = (i % 6) / 6 * Math.PI * 2; p.position.set(Math.cos(sa) * u * 1.2, TOP - .05 - u * .45, Math.sin(sa) * u * 1.2); p.material.opacity = inject ? 1 - u * .5 : 0; });
    let f = 0; if (stroke === 2) f = si === 4 ? (lt > .5 ? Math.max(0, 1 - (lt - .5) / 2.5) : 0) : Math.max(0, 1 - s * 1.3);
    fireM.opacity = f * .85; const fs = (R - .1) * (1.1 - .5 * f); fire.scale.set(fs, Math.max(.1, h * .5), fs); fire.position.y = y + h / 2; fireM.color.setHex(f > .6 ? 0xffd060 : 0xff6020);
    // air in, exhaust out
    airP.forEach((p, i) => { const u = (i / airP.length + t * .5) % 1; inPipe.getPointAt(u, tmp); p.position.copy(tmp); p.material.opacity = stroke === 0 && u < .85 ? 1 : 0; });
    exP.forEach((p, i) => { const u = (i / exP.length + t * .5) % 1; exPipe.getPointAt(u, tmp); p.position.copy(tmp); p.material.opacity = stroke === 3 && u > .1 ? 1 : 0; });
    cloud.forEach((p, i) => { const [sa, rr, hh] = seed[i]; p.position.set(Math.cos(sa + t * .6) * rr, y + .05 + hh * Math.max(.05, h - .1), Math.sin(sa + t * .6) * rr);
      p.material.opacity = stroke === 3 || (stroke === 2 && f > .2) ? 0 : (stroke === 0 ? s : 1); p.material.color.copy(blue).lerp(red, heat); p.scale.setScalar(1 + heat * .6); });
  }
  return { update };
}
