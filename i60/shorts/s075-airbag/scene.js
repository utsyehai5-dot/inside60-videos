// Inside 60 — Airbag. Steps: 0 hook (bag pops), 1 crash sensor, 2 igniter, 3 nitrogen gas, 4 bag bursts out, 5 vents deflate, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x141a2b); scene.fog = new THREE.Fog(0x141a2b, 30, 80);
  scene.add(new THREE.HemisphereLight(0xf4f8ff, 0x404050, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(6, 10, 8); scene.add(key);
  const rim = new THREE.DirectionalLight(0x90c0ff, .7); rim.position.set(-6, 4, -8); scene.add(rim);
  // dashboard
  const dash = new THREE.Mesh(new THREE.BoxGeometry(9, 1.6, 2.4), Mat({ color: 0x3a4050, shininess: 30 })); dash.position.set(0, -1.2, -1.4); scene.add(dash);
  // steering column + wheel (faces +z)
  const col = new THREE.Mesh(new THREE.CylinderGeometry(.18, .22, 2.2, 16), Mat({ color: 0x2a2e36 })); col.rotation.x = Math.PI / 2 - .5; col.position.set(0, -.6, -.9); scene.add(col);
  const wheel = new THREE.Group(); wheel.position.set(0, 0, 0); wheel.rotation.x = -.5; scene.add(wheel);
  const rimW = new THREE.Mesh(new THREE.TorusGeometry(1.6, .16, 14, 48), Mat({ color: 0x22262e, shininess: 40 })); wheel.add(rimW);
  for (const a of [0, Math.PI * 2 / 3, Math.PI * 4 / 3]) { const s = new THREE.Mesh(new THREE.BoxGeometry(1.5, .16, .12), Mat({ color: 0x2e333c })); s.rotation.z = a - Math.PI / 2; s.position.set(Math.cos(a - Math.PI / 2) * .8, Math.sin(a - Math.PI / 2) * .8, 0); wheel.add(s); }
  const hubM = Mat({ color: 0x3a404c, transparent: true, opacity: 1 });
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(.75, .8, .4, 32), hubM); hub.rotation.x = Math.PI / 2; hub.position.z = .1; wheel.add(hub);
  // inflator canister inside hub
  const canM = Mat({ color: 0xa8b0bc, emissive: 0x000000, shininess: 150 });
  const can = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, .3, 28), canM); can.rotation.x = Math.PI / 2; can.position.z = .05; wheel.add(can);
  const ignM = Mat({ color: 0xffcc40, emissive: 0x000000 });
  const ign = new THREE.Mesh(new THREE.SphereGeometry(.12, 16, 12), ignM); ign.position.z = .22; wheel.add(ign);
  // bag (sphere squashed), nylon look
  const bagM = Mat({ color: 0xf2f2ea, shininess: 25, transparent: true, opacity: 1 });
  const bag = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), bagM); bag.position.z = .3; wheel.add(bag);
  // vent holes (dark dots on bag sides) + puff particles
  const ventM = new THREE.MeshBasicMaterial({ color: 0x404858 });
  const vents = []; for (const s of [-1, 1]) { const v = new THREE.Mesh(new THREE.CircleGeometry(.1, 16), ventM); bag.add(v); v.userData.s = s; vents.push(v); }
  // crash sensor at front bumper (far -z), wire to wheel
  const SEN = V(0, -1.8, -9);
  const bumper = new THREE.Mesh(new THREE.BoxGeometry(8, .9, .7), Mat({ color: 0xc8ccd4, shininess: 150 })); bumper.position.set(0, -1.8, -9.6); scene.add(bumper);
  const senM = Mat({ color: 0x40a0ff, emissive: 0x000000 });
  const sen = new THREE.Mesh(new THREE.BoxGeometry(.8, .5, .5), senM); sen.position.copy(SEN); scene.add(sen);
  const massM = Mat({ color: 0xff7030, emissive: 0x301000 });
  const mass = new THREE.Mesh(new THREE.SphereGeometry(.14, 16, 12), massM); scene.add(mass);
  const wall = new THREE.Mesh(new THREE.BoxGeometry(10, 4, .8), Mat({ color: 0x7a5a48, shininess: 8 })); wall.position.set(0, -1, -11.2); scene.add(wall);
  const curve = new THREE.CatmullRomCurve3([V(0, -1.6, -8.7), V(0, -2.3, -6), V(.2, -2.0, -3), V(0, -1.2, -1.6), V(0, -.2, -.25)]);
  const wireM = Mat({ color: 0x2a3a5a, emissive: 0x000000 });
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 80, .05, 8), wireM));
  const sparkM = new THREE.MeshBasicMaterial({ color: 0xffee60 });
  const spark = new THREE.Mesh(new THREE.SphereGeometry(.16, 14, 10), sparkM); scene.add(spark);
  // gas particles (blue N2)
  const gasM = new THREE.MeshBasicMaterial({ color: 0x60d8ff, transparent: true, opacity: .85 });
  const gas = []; for (let k = 0; k < 40; k++) { const p = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), gasM); p.userData = { a: Math.random() * 6.28, b: Math.random() * 3.14, r: Math.random(), s: .5 + Math.random() }; wheel.add(p); gas.push(p); }
  const puffM = new THREE.MeshBasicMaterial({ color: 0xc8e8ff, transparent: true, opacity: .6 });
  const puffs = []; for (let k = 0; k < 16; k++) { const p = new THREE.Mesh(new THREE.SphereGeometry(.1, 8, 6), puffM); p.userData = { s: k % 2 ? 1 : -1, o: Math.random() }; wheel.add(p); puffs.push(p); }

  const shots = [
    [[3.5, 1.5, 7], [0, 0, .5]],          // 0 hook
    [[4, 1.2, -4], [0, -1.8, -9]],        // 1 sensor
    [[1.8, 1.2, 3.2], [0, 0, .2]],        // 2 igniter close
    [[2.2, .8, 3.6], [0, 0, .4]],         // 3 gas
    [[6, 2.2, 6.5], [0, 0, .6]],          // 4 burst
    [[-5.5, 1.5, 4.5], [0, 0, .6]],       // 5 vents
    [[7, 4, 8], [0, -.5, -2]],            // 6 recap
  ];
  shots.forEach(sh => { for (let i = 0; i < 3; i++) sh[0][i] = sh[1][i] + (sh[0][i] - sh[1][i]) * 1.25; });
  const cp = { p: V(), q: V() };
  function bagSize(si, lt, t) {
    if (si === 0) { const c = (lt % 3.2); return c < .6 ? ease(c / .35) : c < 2.4 ? 1 : 1 - ease((c - 2.4) / .5); }
    if (si === 4) return ease((lt - .4) / .5);
    if (si === 5) return lerp(1, .55, ease((lt - .3) / 3));
    if (si === 6) return .55;
    return 0;
  }
  function update(t, si, lt, sd) {
    const pulse = .5 + .5 * Math.sin(t * 7);
    // sensor: sliding mass jolts forward
    const jolt = si === 1 ? ease((lt % 2.2) / .25) : 0;
    mass.position.set(SEN.x - .15 + jolt * .3, SEN.y + .05, SEN.z + .1 - jolt * .0);
    mass.position.x = SEN.x - .2 + jolt * .4; mass.position.y = SEN.y + .33;
    senM.emissive.setHex(0x40a0ff); senM.emissiveIntensity = si === 1 ? (jolt > .9 ? .9 : .2) : 0;
    // signal along wire (steps 1-2)
    const sk = si === 1 ? ((lt * .5) % 1) : si === 2 ? Math.min(1, lt / 1.2) : -1;
    spark.visible = sk >= 0 && sk < 1; if (spark.visible) spark.position.copy(curve.getPoint(sk));
    wireM.emissive.setHex(0xffd040); wireM.emissiveIntensity = si === 1 || si === 2 ? .25 + .2 * pulse : 0;
    // igniter + canister glow
    const fire = si === 2 ? Math.max(0, (lt - 1.2)) : 0;
    ignM.emissive.setHex(0xffa020); ignM.emissiveIntensity = si === 2 ? (fire > 0 ? .9 + .1 * pulse : .2) : si === 3 ? .6 : 0;
    canM.emissive.setHex(0xff6010); canM.emissiveIntensity = si === 2 ? Math.min(.8, fire * .6) * (.7 + .3 * pulse) : si === 3 ? .4 : 0;
    hubM.opacity = (si === 2 || si === 3) ? .25 : 1;
    // gas: stream out of canister into growing cloud (step 3)
    gas.forEach((p, k) => {
      const u = p.userData; const g = si === 3 ? ((lt * .6 * u.s + u.r) % 1) : 0;
      p.visible = si === 3;
      const R = .3 + g * 1.4;
      p.position.set(Math.cos(u.a + t * .5) * Math.sin(u.b) * R, Math.sin(u.a + t * .5) * Math.sin(u.b) * R, .25 + Math.abs(Math.cos(u.b)) * R * .9);
    });
    // bag
    const b = bagSize(si, lt, t);
    bag.visible = b > .02;
    bag.scale.set(.2 + b * 1.45, .2 + b * 1.45, .05 + b * 1.15);
    bag.position.z = .3 + b * 1.1;
    vents.forEach(v => { v.position.set(v.userData.s * .97, .1, -.15); v.rotation.y = v.userData.s * Math.PI / 2; v.visible = si >= 5; });
    puffs.forEach((p, k) => {
      const u = p.userData; const a = ((lt * .8 + u.o) % 1);
      p.visible = si === 5;
      const bs = .2 + b * 1.45;
      p.position.set(u.s * (bs + a * 1.6), .1 + a * .5, bag.position.z - .15 * bs);
      p.scale.setScalar(.6 + a * 2); p.material.opacity = .6 * (1 - a);
    });
    // camera
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const kk = si === 0 ? 1 : ease(lt / 1.4);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], kk))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], kk)));
    const o = Math.sin(t * .25) * .12, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o));
    camera.lookAt(cp.q);
  }
  return { update };
}
