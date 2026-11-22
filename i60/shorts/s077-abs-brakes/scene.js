// Inside 60 — ABS brakes. Steps: 0 locked wheel skids, 1 speed sensor + toothed ring, 2 computer, 3 valve releases pressure, 4 pulsing 15x/s + pedal, 5 grip + steer, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 90, specular: 0x555555, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x151a2a); scene.fog = new THREE.Fog(0x151a2a, 30, 80);
  scene.add(new THREE.HemisphereLight(0xf4f8ff, 0x404050, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(8, 10, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0x90c0ff, .7); rim.position.set(-6, 4, -8); scene.add(rim);
  // road (moves along z)
  const road = new THREE.Mesh(new THREE.BoxGeometry(8, .2, 60), Mat({ color: 0x343a46, shininess: 10 })); road.position.set(0, -1.55, 0); scene.add(road);
  const dashM = Mat({ color: 0xf0e070, emissive: 0x403810 });
  const dashes = []; for (let k = 0; k < 14; k++) { const d = new THREE.Mesh(new THREE.BoxGeometry(.18, .03, 1.4), dashM); d.position.set(-1.8, -1.44, 0); scene.add(d); dashes.push(d); }
  // wheel assembly (steerable group), wheel axis = x
  const steer = new THREE.Group(); scene.add(steer);
  const wheel = new THREE.Group(); steer.add(wheel);
  const tireM = Mat({ color: 0x1c1c22, shininess: 15, emissive: 0x000000 });
  const tire = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, .8, 40), tireM); tire.rotation.z = Math.PI / 2; wheel.add(tire);
  const rimM = Mat({ color: 0xb8c0cc, shininess: 180 });
  const rimD = new THREE.Mesh(new THREE.CylinderGeometry(.95, .95, .82, 32), rimM); rimD.rotation.z = Math.PI / 2; wheel.add(rimD);
  for (let k = 0; k < 5; k++) { const s = new THREE.Mesh(new THREE.BoxGeometry(.1, 1.7, .22), Mat({ color: 0x8a92a0 })); s.position.x = -.43; s.rotation.x = k / 5 * Math.PI; wheel.add(s); }
  // tone ring with teeth (inner side +x)
  const ring = new THREE.Group(); ring.position.x = .62; wheel.add(ring);
  { const rb = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, .12, 32), Mat({ color: 0x9098a8 })); rb.rotation.z = Math.PI / 2; ring.add(rb); }
  const toothM = Mat({ color: 0xffc840, emissive: 0x000000 });
  for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2; const t = new THREE.Mesh(new THREE.BoxGeometry(.12, .12, .09), toothM); t.position.set(0, Math.cos(a) * .6, Math.sin(a) * .6); t.rotation.x = -a; ring.add(t); }
  // brake disc + caliper (fixed, not rotating)
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(.85, .85, .08, 36), Mat({ color: 0x9aa0aa, emissive: 0x000000, shininess: 140 })); disc.rotation.z = Math.PI / 2; disc.position.x = .5; steer.add(disc);
  const calM = Mat({ color: 0xd03030, emissive: 0x000000 });
  const cal = new THREE.Mesh(new THREE.BoxGeometry(.4, .55, .7), calM); cal.position.set(.5, .55, -.45); steer.add(cal);
  // speed sensor near ring bottom
  const senM = Mat({ color: 0x40a0ff, emissive: 0x000000 });
  const sen = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .5, 14), senM); sen.position.set(.62, -.95, .0); steer.add(sen);
  // ECU + valve block + pedal
  const ECU = V(2.8, 1.6, -2.2), VAL = V(2.8, -.2, -3.2);
  const ecuM = Mat({ color: 0x2c3444, emissive: 0x000000 });
  const ecu = new THREE.Mesh(new THREE.BoxGeometry(1.3, .8, .9), ecuM); ecu.position.copy(ECU); scene.add(ecu);
  const lights = []; for (let k = 0; k < 4; k++) { const m = new THREE.MeshBasicMaterial({ color: 0x40ff80 }); const l = new THREE.Mesh(new THREE.SphereGeometry(.09, 12, 8), m); l.position.set(ECU.x - .45 + k * .3, ECU.y + .1, ECU.z + .47); scene.add(l); lights.push(m); }
  const valB = new THREE.Mesh(new THREE.BoxGeometry(1.0, .9, .9), Mat({ color: 0x8890a0, transparent: true, opacity: .55 })); valB.position.copy(VAL); scene.add(valB);
  const valveM = Mat({ color: 0xff50c0, emissive: 0x000000 });
  const valve = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, .6, 14), valveM); scene.add(valve);
  const pedal = new THREE.Group(); pedal.position.set(3.0, -.6, -5.2); scene.add(pedal);
  const pedM = Mat({ color: 0x505868 });
  const parm = new THREE.Mesh(new THREE.BoxGeometry(.12, 1.6, .12), pedM); parm.position.y = .8; pedal.add(parm);
  const pad = new THREE.Mesh(new THREE.BoxGeometry(.6, .12, .4), pedM); pad.position.set(0, 0, .1); pedal.add(pad);
  // wires / lines
  const senCurve = new THREE.CatmullRomCurve3([V(.7, -1.2, 0), V(1.6, -1.1, -.6), V(2.2, .4, -1.4), V(2.6, 1.2, -1.9)]);
  const wireM = Mat({ color: 0x2a3a5a, emissive: 0x000000 });
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(senCurve, 60, .04, 8), wireM));
  const ctlCurve = new THREE.CatmullRomCurve3([V(2.9, 1.2, -2.4), V(3.0, .6, -2.9), V(2.85, .25, -3.1)]);
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(ctlCurve, 30, .04, 8), wireM));
  const lineCurve = new THREE.CatmullRomCurve3([V(2.4, -.2, -3.0), V(1.4, .6, -2.2), V(.8, .9, -1.0), V(.6, .7, -.55)]);
  const lineM = Mat({ color: 0xff3030, emissive: 0xff2020, emissiveIntensity: .4 });
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(lineCurve, 60, .08, 10), lineM));
  const pedCurve = new THREE.CatmullRomCurve3([V(3.0, .9, -5.1), V(3.0, .2, -4.2), V(2.9, -.2, -3.6)]);
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(pedCurve, 30, .08, 10), lineM));
  const dotM = new THREE.MeshBasicMaterial({ color: 0x60e0ff });
  const dots = []; for (let k = 0; k < 6; k++) { const d = new THREE.Mesh(new THREE.SphereGeometry(.08, 10, 8), dotM); scene.add(d); dots.push(d); }
  // skid smoke
  const smokeM = new THREE.MeshBasicMaterial({ color: 0xd0d4dc, transparent: true, opacity: .5 });
  const smoke = []; for (let k = 0; k < 14; k++) { const p = new THREE.Mesh(new THREE.SphereGeometry(.2, 10, 8), smokeM.clone()); p.userData.o = k / 14; scene.add(p); smoke.push(p); }
  const shots = [
    [[6.5, 1.2, 3.5], [0, -.3, 0]],          // 0 locked skid (side)
    [[4.2, -.2, 3.2], [.6, -.6, 0]],         // 1 sensor+ring close
    [[5.8, 2.8, 1.2], [2.6, 1.4, -2.0]],     // 2 ECU
    [[6.2, 1.4, -.2], [2.2, -.1, -2.6]],     // 3 valve
    [[7.5, 1.6, -1.6], [2.8, -.1, -4.2]],    // 4 pedal pulsing
    [[4.5, 4.5, 5.5], [0, -.4, 0]],          // 5 grip + steer
    [[8, 4, 6], [1.4, 0, -1.6]],             // 6 recap
  ];
  shots.forEach(sh => { for (let i = 0; i < 3; i++) sh[0][i] = sh[1][i] + (sh[0][i] - sh[1][i]) * 1.2; });
  const cp = { p: V(), q: V() };
  let ang = 0, roadZ = 0, lastT = 0;
  function update(t, si, lt, sd) {
    const dt = Math.min(.1, Math.max(0, t - lastT)); lastT = t;
    const pulse = .5 + .5 * Math.sin(t * 7);
    const speed = 6;
    roadZ = (roadZ + speed * dt) % 4;
    dashes.forEach((d, k) => d.position.z = -26 + k * 4 + roadZ);
    // ABS cycle: pressure on/off
    const cyc = si === 4 ? 3 : 1.2; // visual cycles per second
    const released = si === 3 ? lt > 1.0 : si === 4 ? Math.sin(t * cyc * Math.PI * 2) > 0 : false;
    const locked = si === 0;
    if (!locked) ang -= (speed / 1.4) * dt * (si === 4 && !released ? .85 : 1);
    wheel.rotation.x = ang;
    steer.rotation.y = si === 5 ? Math.sin(lt * 1.2) * .35 : 0;
    tireM.emissive.setHex(0x30ff70); tireM.emissiveIntensity = si === 5 ? .04 + .04 * pulse : 0;
    calM.emissive.setHex(0xff3010); calM.emissiveIntensity = (locked || (si >= 3 && si <= 4 && !released)) ? .6 : 0;
    const press = released ? 0x3080ff : 0xff3030; lineM.color.setHex(press); lineM.emissive.setHex(press); lineM.emissiveIntensity = si >= 3 && si <= 4 ? .6 : .25;
    toothM.emissive.setHex(0xffa020); toothM.emissiveIntensity = si === 1 ? .3 + .3 * pulse : 0;
    senM.emissive.setHex(0x40a0ff); senM.emissiveIntensity = si === 1 || si === 2 ? .4 + .4 * pulse : 0;
    wireM.emissive.setHex(0x40a0ff); wireM.emissiveIntensity = (si >= 1 && si <= 4) ? .3 : 0;
    dots.forEach((d, k) => { const u = ((t * .7 + k / 6) % 1); d.visible = si >= 1 && si <= 3; d.position.copy(senCurve.getPoint(u)); });
    ecuM.emissive.setHex(0x2050a0); ecuM.emissiveIntensity = si === 2 ? .3 + .3 * pulse : 0;
    lights.forEach((m, k) => m.color.setHex(si === 2 && k === 1 && lt > 1.2 && Math.sin(t * 10) > -.3 ? 0xff3030 : 0x40ff80));
    // valve spool slides when released
    valve.position.set(VAL.x, VAL.y + (released ? .22 : -.05), VAL.z); valve.rotation.set(0, 0, 0);
    valveM.emissive.setHex(0xff30b0); valveM.emissiveIntensity = si >= 3 && si <= 4 ? .5 : 0;
    // pedal pulses
    pedal.rotation.x = .3 + (si === 4 ? (released ? .08 : 0) : 0);
    pedal.position.z = -5.2 + (si === 4 ? (released ? -.06 : 0) : 0);
    // smoke behind locked wheel
    smoke.forEach(p => { const a = ((lt * .9 + p.userData.o) % 1); p.visible = locked; p.position.set((p.userData.o - .5) * .6, -1.3 + a * .9, .6 + a * 3.5); p.scale.setScalar(.6 + a * 2.2); p.material.opacity = .5 * (1 - a); });
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
