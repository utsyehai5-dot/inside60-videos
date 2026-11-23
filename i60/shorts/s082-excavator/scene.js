// Inside 60 — Excavator. Steps: 0 hook bucket force, 1 diesel + pump pressure, 2 three cylinders, 3 dig cycle, 4 swing 360, 5 tracks spin in place, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x1a1f2c); scene.fog = new THREE.Fog(0x1a1f2c, 35, 90);
  scene.add(new THREE.HemisphereLight(0xfff8f0, 0x403830, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(8, 12, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0x90c0ff, .6); rim.position.set(-8, 5, -8); scene.add(rim);

  const GY = -2.4;
  const dirtM = Mat({ color: 0x8a6a45, shininess: 5 });
  const ground = new THREE.Mesh(new THREE.BoxGeometry(30, .2, 16), dirtM); ground.position.y = GY - .1; scene.add(ground);
  const pile = new THREE.Mesh(new THREE.SphereGeometry(1.4, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), Mat({ color: 0x9a7650, shininess: 5 })); pile.scale.set(1.3, .7, 1.1); pile.position.set(5.2, GY, 0); scene.add(pile);
  const yellow = Mat({ color: 0xffb81c });
  const dark = Mat({ color: 0x2b2f36, shininess: 20 });
  const steel = Mat({ color: 0xa8b2c0, shininess: 140 });

  // undercarriage
  const under = new THREE.Group(); under.position.set(0, GY, 0); scene.add(under);
  const trackMs = [], sprockets = [];
  [-1, 1].forEach(s => {
    const m = Mat({ color: 0x33373e, emissive: 0x000000, shininess: 10 }); trackMs.push(m);
    const tr = new THREE.Mesh(new THREE.BoxGeometry(4.2, .85, .75), m); tr.position.set(0, .45, s * 1.2); under.add(tr);
    for (let k = 0; k < 12; k++) { const sh = new THREE.Mesh(new THREE.BoxGeometry(.12, .1, .78), dark); sh.position.set(-1.9 + k * .35, .92, s * 1.2); under.add(sh); }
    const sp = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, .8, 10), Mat({ color: 0x55606c })); sp.rotation.x = Math.PI / 2; sp.position.set(-2.05, .45, s * 1.2); under.add(sp); sprockets.push(sp);
    const motorM = Mat({ color: 0x40d0ff, emissive: 0x000000 }); const mo = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .3, 16), motorM); mo.rotation.x = Math.PI / 2; mo.position.set(-2.05, .45, s * 1.62); under.add(mo); sp.userData.m = motorM;
  });
  const carbody = new THREE.Mesh(new THREE.BoxGeometry(1.8, .45, 1.8), dark); carbody.position.y = .95; under.add(carbody);
  const slewM = Mat({ color: 0x8090a0, emissive: 0x000000 });
  const slew = new THREE.Mesh(new THREE.CylinderGeometry(.95, .95, .22, 40), slewM); slew.position.y = 1.28; under.add(slew);
  // gear teeth
  for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2; const tth = new THREE.Mesh(new THREE.BoxGeometry(.1, .2, .12), slewM); tth.position.set(Math.cos(a) * 1.0, 1.28, Math.sin(a) * 1.0); tth.rotation.y = -a; under.add(tth); }

  // house (rotates)
  const house = new THREE.Group(); house.position.set(0, GY + 1.4, 0); scene.add(house);
  const body = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.2, 2.3), yellow); body.position.set(-.6, .6, 0); house.add(body);
  const cw = new THREE.Mesh(new THREE.BoxGeometry(.6, 1.0, 2.3), Mat({ color: 0x3a3f48 })); cw.position.set(-2.4, .55, 0); house.add(cw);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.3, .95), Mat({ color: 0x9fd0ff, transparent: true, opacity: .7, shininess: 200 })); cab.position.set(.4, 1.85, .62); house.add(cab);
  const cabRoof = new THREE.Mesh(new THREE.BoxGeometry(1.15, .1, 1.0), yellow); cabRoof.position.set(.4, 2.55, .62); house.add(cabRoof);
  // engine + pump (shown with cutaway glow)
  const engM = Mat({ color: 0xff6a3d, emissive: 0x000000 });
  const engine = new THREE.Mesh(new THREE.BoxGeometry(1.0, .55, .8), engM); engine.position.set(-1.3, 1.45, -.45); house.add(engine);
  const pumpM = Mat({ color: 0x40d0ff, emissive: 0x000000 });
  const pump = new THREE.Mesh(new THREE.CylinderGeometry(.25, .25, .6, 18), pumpM); pump.rotation.z = Math.PI / 2; pump.position.set(-.5, 1.45, -.45); house.add(pump);
  const tank = new THREE.Mesh(new THREE.BoxGeometry(.7, .6, .6), Mat({ color: 0x6a7380 })); tank.position.set(.3, 1.45, -.75); house.add(tank);
  const fan = new THREE.Mesh(new THREE.BoxGeometry(.05, .5, .05), dark); fan.position.set(-1.85, 1.45, -.45); house.add(fan);

  // arm: boom -> stick -> bucket, planar in XY at z = -.3 (house-local)
  const AZ = -.25;
  const boomPiv = V(.9, .9, AZ), BOOM_L = 3.6, STICK_L = 2.4;
  const boomG = new THREE.Group(); boomG.position.copy(boomPiv); house.add(boomG);
  const armM = Mat({ color: 0xffb81c, emissive: 0x000000 });
  const boomMesh = new THREE.Mesh(new THREE.BoxGeometry(BOOM_L, .42, .4), armM); boomMesh.position.x = BOOM_L / 2; boomG.add(boomMesh);
  const stickG = new THREE.Group(); stickG.position.x = BOOM_L; boomG.add(stickG);
  const stickMesh = new THREE.Mesh(new THREE.BoxGeometry(STICK_L, .32, .34), armM); stickMesh.position.x = STICK_L / 2; stickG.add(stickMesh);
  const bucketG = new THREE.Group(); bucketG.position.x = STICK_L; stickG.add(bucketG);
  const bucketM = Mat({ color: 0x5a6068, emissive: 0x000000 });
  const bshape = new THREE.Shape(); bshape.moveTo(0, 0); bshape.lineTo(.9, -.1); bshape.quadraticCurveTo(1.0, -.7, .5, -.95); bshape.lineTo(.05, -.55); bshape.lineTo(0, 0);
  const bucket = new THREE.Mesh(new THREE.ExtrudeGeometry(bshape, { depth: .9, bevelEnabled: false }), bucketM); bucket.position.z = -.45; bucketG.add(bucket);
  for (let k = 0; k < 4; k++) { const tooth = new THREE.Mesh(new THREE.ConeGeometry(.06, .22, 6), steel); tooth.position.set(.45, -1.02, -.33 + k * .22); tooth.rotation.z = .5; bucketG.add(tooth); }
  const dirt = new THREE.Mesh(new THREE.SphereGeometry(.38, 12, 8), Mat({ color: 0x9a7650, shininess: 5 })); dirt.position.set(.55, -.45, 0); dirt.scale.set(1, .7, 1.1); bucketG.add(dirt);

  // hydraulic cylinders: barrel + rod between two points (house-local, updated per frame)
  const cylMs = [];
  function makeCyl(rad) {
    const m = Mat({ color: 0x40d0ff, emissive: 0x000000, shininess: 140 }); cylMs.push(m);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, 1, 16), m); house.add(barrel);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(rad * .5, rad * .5, 1, 12), steel); house.add(rod);
    return { barrel, rod, m };
  }
  function place(mesh, a, b) { const d = b.clone().sub(a); const L = d.length(); mesh.scale.y = L; mesh.position.copy(a).addScaledVector(d, .5); mesh.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); }
  function setCyl(c, a, b) { const d = b.clone().sub(a); const L = d.length(); const bl = Math.min(1.4, L * .55); place(c.barrel, a, a.clone().addScaledVector(d, bl / L)); place(c.rod, a.clone().addScaledVector(d, (bl - .05) / L), b); }
  const cBoom = makeCyl(.14), cStick = makeCyl(.12), cBucket = makeCyl(.1);
  // oil hoses glow dots from pump to cylinders
  const dots = []; for (let k = 0; k < 14; k++) { const d = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd040 })); d.userData.o = k / 14; d.userData.c = k % 3; house.add(d); dots.push(d); }

  const tmpA = V(), tmpB = V();
  const local = (obj, x, y) => { house.worldToLocal(obj.localToWorld(tmpB.set(x, y, 0))); return tmpB.clone(); };

  const shots = [
    [[8, 4, 27], [2.4, 0.5, 0]],          // 0 overview
    [[-7, 5, -11], [-.6, .5, 0]],         // 1 engine + pump (from behind/left)
    [[6, 3, 15], [2.8, .9, 0]],        // 2 cylinders side
    [[10, 3.5, 16], [3.5, .5, 0]],          // 3 dig
    [[-9, 13, 18], [0, -.5, 0]],          // 4 swing from above
    [[-13, 8, 18], [0, -.4, 0]],         // 5 tracks
    [[10, 4, 27], [2.4, 0.5, 0]],          // 6 recap
  ];
  const cp = { p: V(), q: V() };
  let lastT = 0, spin = 0, sprA = 0;
  function update(t, si, lt, sd) {
    const dt = Math.min(.1, Math.max(0, t - lastT)); lastT = t;
    const pulse = .5 + .5 * Math.sin(t * 7);
    // dig cycle phase 0..1
    let ph;
    if (si === 0) ph = (t * .22) % 1;
    else if (si === 3) ph = (lt * .3) % 1;
    else if (si === 2) ph = .35 + .15 * Math.sin(lt * 1.6);
    else ph = .75;
    // poses: reach out (0) -> down into ground (.3) -> curl (.55) -> raise (.8) -> dump (1)
    const k1 = Math.sin(ph * Math.PI * 2);
    const boomA = .45 - .35 * Math.max(0, Math.sin((ph - .05) * Math.PI * 1.6)) + .2 * Math.max(0, (ph - .55) * 2);
    const stickA = -1.6 + .7 * Math.max(0, Math.sin(ph * Math.PI)) ;
    const bucketA = -.9 + 1.3 * ease((ph - .25) / .3) - 1.4 * ease((ph - .85) / .15);
    boomG.rotation.z = Math.min(.75, boomA); stickG.rotation.z = stickA; bucketG.rotation.z = bucketA;
    dirt.visible = ph > .45 && ph < .9;
    // swing / spin
    if (si === 4) house.rotation.y = -ease(lt / 3.6) * Math.PI * 2;
    else if (si === 0) house.rotation.y = ph > .55 ? -.6 * ease((ph - .55) / .3) : -.6 * (1 - ease(ph / .2)) * (t > 3 ? 1 : 0);
    else house.rotation.y = 0;
    if (si === 5) { spin = ease(lt / 3.4) * Math.PI * .9; } else if (si === 6) spin = Math.PI * .9 * (1 - ease(lt / 2)); else spin = 0;
    under.rotation.y = spin; if (si === 5 || si === 6) house.rotation.y = spin;
    sprA += (si === 5 ? 4 : 0) * dt; sprockets[0].rotation.y = sprA; sprockets[1].rotation.y = -sprA;
    // cylinders (house-local anchors)
    house.updateMatrixWorld(true);
    setCyl(cBoom, V(.7, .45, AZ), local(boomG, 1.5, -.25));
    setCyl(cStick, local(boomG, 1.9, .35), local(stickG, -.35, .2));
    setCyl(cBucket, local(stickG, .5, .2), local(bucketG, .15, .15));
    // glows
    engM.emissive.setHex(0xff3010); engM.emissiveIntensity = si === 1 ? .45 + .3 * pulse : 0;
    pumpM.emissive.setHex(0x20b0ff); pumpM.emissiveIntensity = si === 1 ? .5 + .3 * pulse : 0;
    fan.rotation.x = t * 20;
    const hi = Math.floor(lt * 1.2) % 3;
    cylMs.forEach((m, i) => { m.emissive.setHex(0x20c0ff); m.emissiveIntensity = si === 2 ? (i === hi ? .7 + .3 * pulse : .15) : si === 3 ? .35 : 0; });
    armM.emissive.setHex(0xff9000); armM.emissiveIntensity = si === 0 ? .1 : 0;
    bucketM.emissive.setHex(0xffd040); bucketM.emissiveIntensity = si === 0 ? .25 + .2 * pulse : 0;
    slewM.emissive.setHex(0x40e0ff); slewM.emissiveIntensity = si === 4 ? .6 + .3 * pulse : 0;
    sprockets.forEach(s => { s.userData.m.emissive.setHex(0x20c0ff); s.userData.m.emissiveIntensity = si === 5 ? .7 + .3 * pulse : 0; });
    trackMs[0].emissive.setHex(0x40ff90); trackMs[1].emissive.setHex(0xff6040);
    trackMs.forEach(m => m.emissiveIntensity = si === 5 ? .3 + .2 * pulse : 0);
    // oil dots: pump -> each cylinder base
    const targets = [V(.7, .45, AZ), cStick.barrel.position, cBucket.barrel.position];
    dots.forEach(d => { const a = (t * .8 + d.userData.o) % 1; d.visible = si === 1 || si === 2; d.position.copy(pump.position).lerp(targets[d.userData.c], a); });
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
