// Inside 60 — Espresso machine. Steps: 0 hook, 1 boiler, 2 pump, 3 portafilter puck, 4 extraction, 5 crema, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 90, specular: 0x666666, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x221a18); scene.fog = new THREE.Fog(0x221a18, 30, 80);
  scene.add(new THREE.HemisphereLight(0xfff6ee, 0x403830, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.8); key.position.set(6, 10, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffc090, .7); rim.position.set(-6, 4, -6); scene.add(rim);
  const counter = new THREE.Mesh(new THREE.BoxGeometry(24, .6, 14), Mat({ color: 0x6a4a34, shininess: 20 })); counter.position.y = -.3; scene.add(counter);
  // machine body (x-ray able)
  const bodyM = Mat({ color: 0x2a8a8a, shininess: 160, transparent: true, opacity: 1 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(7, 7, 4.4), bodyM); body.position.set(0, 4.5, -2.2); scene.add(body);
  const neck = new THREE.Mesh(new THREE.BoxGeometry(1.6, .9, 1.4), Mat({ color: 0xc8ccd4, shininess: 180 })); neck.position.set(0, 4.75, .6); scene.add(neck);
  const base = new THREE.Mesh(new THREE.BoxGeometry(7, 1, 6), Mat({ color: 0x40444c })); base.position.set(0, .5, 0); scene.add(base);
  const tray = new THREE.Mesh(new THREE.BoxGeometry(4, .15, 2.6), Mat({ color: 0x9aa0aa })); tray.position.set(0, 1.08, 1.6); scene.add(tray);
  // boiler inside
  const boilM = Mat({ color: 0xd88a3a, emissive: 0x000000, shininess: 140 });
  const boiler = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 3.4, 32), boilM); boiler.rotation.z = Math.PI / 2; boiler.position.set(.6, 6.2, -2.2); scene.add(boiler);
  const coil = new THREE.Mesh(new THREE.TorusKnotGeometry(.6, .08, 64, 6, 2, 5), Mat({ color: 0xff4020, emissive: 0x000000 })); coil.position.set(.6, 6.2, -2.2); coil.rotation.y = Math.PI / 2; scene.add(coil);
  // pump
  const pumpM = Mat({ color: 0x3060c0, emissive: 0x000000 });
  const pump = new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, 1.8, 24), pumpM); pump.position.set(2.3, 2.3, -2.2); scene.add(pump);
  const piston = new THREE.Mesh(new THREE.CylinderGeometry(.35, .35, .5, 16), Mat({ color: 0xe0e4ea })); scene.add(piston);
  // pipe pump -> boiler -> group head
  const pipeM = new THREE.MeshPhongMaterial({ color: 0x40a0ff, emissive: 0x1060ff, emissiveIntensity: .3 });
  const path = new THREE.CatmullRomCurve3([V(2.3, 3.2, -2.2), V(2.3, 4.6, -2.2), V(2.2, 6.2, -2.2), V(-.8, 6.3, -1.6), V(-.4, 5.0, 0), V(0, 4.4, 1.2)]);
  const pipe = new THREE.Mesh(new THREE.TubeGeometry(path, 60, .14, 8), pipeM); scene.add(pipe);
  const flowM = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const flow = []; for (let k = 0; k < 14; k++) { const s = new THREE.Mesh(new THREE.SphereGeometry(.13, 8, 6), flowM); s.userData.o = k / 14; scene.add(s); flow.push(s); }
  // group head + portafilter
  const group = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.1, .8, 32), Mat({ color: 0xe8eaee, shininess: 200 })); group.position.set(0, 4.0, 1.2); scene.add(group);
  const pfM = Mat({ color: 0xd0d4dc, shininess: 200, transparent: true, opacity: 1, side: THREE.DoubleSide });
  const pf = new THREE.Group(); pf.position.set(0, 3.25, 1.2); scene.add(pf);
  const basket = new THREE.Mesh(new THREE.CylinderGeometry(1.0, .8, .8, 32, 1, true), pfM); pf.add(basket);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(.18, .22, 3, 12), Mat({ color: 0x201a16, shininess: 30 })); handle.rotation.x = Math.PI / 2; handle.position.set(0, -.1, 2.0); pf.add(handle);
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(.18, .12, .5, 12), pfM); spout.position.y = -.6; pf.add(spout);
  const puckM = Mat({ color: 0x5a3418, emissive: 0x000000, shininess: 10 });
  const puck = new THREE.Mesh(new THREE.CylinderGeometry(.92, .78, .5, 32), puckM); puck.position.y = -.05; pf.add(puck);
  // water drops through puck (inside group view)
  const dropM = new THREE.MeshBasicMaterial({ color: 0x80c8ff });
  const drops = []; for (let k = 0; k < 18; k++) { const s = new THREE.Mesh(new THREE.SphereGeometry(.06, 6, 5), dropM); s.userData = { x: (Math.random() - .5) * 1.3, z: (Math.random() - .5) * 1.3, o: Math.random() }; pf.add(s); drops.push(s); }
  // cup + coffee stream
  const cupM = Mat({ color: 0xffffff, shininess: 120, side: THREE.DoubleSide, transparent: true, opacity: 1 });
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(.75, .55, 1.2, 32, 1, true), cupM); cup.position.set(0, 1.78, 1.2); scene.add(cup);
  const cupB = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, .08, 32), cupM); cupB.position.set(0, 1.2, 1.2); scene.add(cupB);
  const coffeeM = Mat({ color: 0x3a1c0a, shininess: 60 });
  const coffee = new THREE.Mesh(new THREE.CylinderGeometry(.7, .56, 1, 32), coffeeM); coffee.position.set(0, 1.25, 1.2); scene.add(coffee);
  const cremaM = Mat({ color: 0xd8a060, emissive: 0x000000, shininess: 30 });
  const crema = new THREE.Mesh(new THREE.CylinderGeometry(.72, .72, .12, 32), cremaM); crema.position.set(0, 1.3, 1.2); scene.add(crema);
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(.05, .07, 1, 8), Mat({ color: 0x8a4a1a, emissive: 0x200800 })); scene.add(stream);
  const bubs = []; for (let k = 0; k < 20; k++) { const b = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), Mat({ color: 0xf0c080, emissive: 0x402000 })); b.userData = { a: Math.random() * 6.28, r: Math.random() * .6, o: Math.random() }; scene.add(b); bubs.push(b); }

  const shots = [
    [[11, 9, 17], [0, 4, -.5]],      // 0 whole machine
    [[8, 9, 11], [.6, 6, -2.2]],     // 1 boiler
    [[9, 6, 10], [1.5, 4, -1.5]],    // 2 pump
    [[4.5, 5.8, 8.5], [0, 3.2, 1.2]],// 3 portafilter
    [[3.5, 4.2, 8], [0, 2.6, 1.2]],  // 4 extraction
    [[2.2, 5, 6], [0, 1.8, 1.2]],    // 5 crema
    [[12, 10, 18], [0, 4, -.5]],     // 6 recap
  ];
  const cp = { p: V(), q: V() };
  function update(t, si, lt, sd) {
    const pulse = .5 + .5 * Math.sin(t * 6);
    const xr = si >= 1 && si <= 2; bodyM.opacity = xr ? .18 : 1; bodyM.depthWrite = !xr;
    const xp = si === 3 || si === 4; pfM.opacity = xp ? .3 : 1; pfM.depthWrite = !xp;
    boilM.emissive.setHex(0xff6020); boilM.emissiveIntensity = si === 1 ? .3 + .4 * pulse : 0;
    coil.material.emissive.setHex(0xff3010); coil.material.emissiveIntensity = si === 1 ? .8 + .4 * pulse : .2;
    pumpM.emissive.setHex(0x40a0ff); pumpM.emissiveIntensity = si === 2 ? .3 + .5 * pulse : 0;
    piston.position.set(2.3, 1.2 + .3 * Math.sin(t * 14), -2.2);
    puckM.emissive.setHex(0xffa040); puckM.emissiveIntensity = si === 3 ? .15 + .3 * pulse : 0;
    // flow along pipe: from step 2 on
    const fl = si >= 2 && si <= 5; pipeM.emissiveIntensity = si === 2 ? .5 + .4 * pulse : .3;
    flow.forEach(s => { const o = (s.userData.o + t * .5) % 1; s.position.copy(path.getPointAt(o)); s.visible = fl; });
    drops.forEach(s => { const u = s.userData, o = (u.o + t * .7) % 1; s.position.set(u.x * (1 - o * .4), .4 - o * .8, u.z * (1 - o * .4)); s.visible = si === 4 || si === 5; });
    // pour: coffee level rises during step 4..5
    const lvl = si < 4 ? 0 : si === 4 ? ease(lt / sd) * .7 : .75;
    coffee.scale.y = Math.max(.01, lvl); coffee.position.y = 1.24 + lvl / 2; coffee.visible = lvl > .02;
    const pouring = si === 4 || (si === 5 && lt < 1.5);
    const top = 2.6, bot = 1.24 + lvl; stream.visible = pouring; stream.scale.y = top - bot; stream.position.set(0, (top + bot) / 2, 1.2);
    const cr = si === 5 ? ease(lt / 2) : si > 5 ? 1 : si === 4 ? .3 * lvl : 0;
    crema.visible = cr > .02 && lvl > .05; crema.scale.y = .3 + cr * 1.5; crema.position.y = 1.24 + lvl + .02;
    cremaM.emissive.setHex(0xffb040); cremaM.emissiveIntensity = si === 5 ? .2 + .3 * pulse : 0;
    bubs.forEach(b => { const u = b.userData, o = (u.o + t * .4) % 1; b.position.set(Math.cos(u.a) * u.r, 1.24 + lvl - .3 + o * .35, 1.2 + Math.sin(u.a) * u.r); b.visible = si === 5; });
    // camera
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const kk = si === 0 ? 1 : ease(lt / 1.4);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], kk))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], kk)));
    const o = Math.sin(t * .25) * .15, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o));
    camera.lookAt(cp.q);
  }
  return { update };
}
