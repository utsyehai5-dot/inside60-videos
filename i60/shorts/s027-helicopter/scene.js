// Inside 60 — Helicopter. Steps: 0 hook, 1 lift/downwash, 2 collective climb, 3 swashplate, 4 cyclic tilt forward, 5 tail rotor torque, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 70, specular: 0x555555, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x1a2438);
  scene.fog = new THREE.Fog(0x1a2438, 35, 90);
  scene.add(new THREE.HemisphereLight(0xeaf2ff, 0x303a30, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(6, 10, 9); scene.add(key);
  const rim = new THREE.DirectionalLight(0x88ccff, .9); rim.position.set(-7, 5, -6); scene.add(rim);
  // helipad
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, .1, 60), Mat({ color: 0x3a4252 })); pad.position.y = -1.6; scene.add(pad);
  const padRing = new THREE.Mesh(new THREE.TorusGeometry(4.5, .08, 6, 80), Mat({ color: 0xffd040, emissive: 0xffc020, emissiveIntensity: .4 })); padRing.rotation.x = Math.PI / 2; padRing.position.y = -1.54; scene.add(padRing);

  const heli = new THREE.Group(); scene.add(heli); // pivot at mast base
  const yawG = new THREE.Group(); heli.add(yawG);
  const bodyM = Mat({ color: 0xe8483a, shininess: 90 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), bodyM); body.scale.set(2.0, 1.15, 1.1); yawG.add(body);
  const glass = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 18), Mat({ color: 0x7ac8ff, transparent: true, opacity: .85, shininess: 120 }));
  glass.scale.set(.95, .8, .92); glass.position.set(1.25, .22, 0); yawG.add(glass);
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(.18, .42, 4.6, 16), bodyM); boom.rotation.z = Math.PI / 2; boom.position.set(-3.6, .25, 0); yawG.add(boom);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(.7, 1.3, .1), bodyM); fin.position.set(-5.8, .8, 0); fin.rotation.z = .35; yawG.add(fin);
  const skM = Mat({ color: 0x40464e });
  for (const z of [-.8, .8]) {
    const sk = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, 3.6, 8), skM); sk.rotation.z = Math.PI / 2; sk.position.set(.1, -1.5, z); yawG.add(sk);
    for (const x of [-.8, 1]) { const st = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .75, 6), skM); st.position.set(x, -1.15, z * .85); st.rotation.x = z > 0 ? -.3 : .3; yawG.add(st); }
  }
  // mast + swashplate
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, 1.4, 12), Mat({ color: 0x9aa2ae })); mast.position.y = 1.5; yawG.add(mast);
  const swLow = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, .1, 28), Mat({ color: 0x3a90ff, emissive: 0x2070ff, emissiveIntensity: 0 })); swLow.position.y = 1.25; yawG.add(swLow);
  const swUpG = new THREE.Group(); swUpG.position.y = 1.4; yawG.add(swUpG);
  const swUp = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, .08, 28), Mat({ color: 0xffa030, emissive: 0xff8020, emissiveIntensity: 0 })); swUpG.add(swUp);
  // rotor
  const tilt = new THREE.Group(); tilt.position.y = 2.2; yawG.add(tilt);
  const rotor = new THREE.Group(); tilt.add(rotor);
  rotor.add(new THREE.Mesh(new THREE.CylinderGeometry(.28, .28, .25, 16), Mat({ color: 0x707884 })));
  const blades = [], links = [];
  const bladeM = Mat({ color: 0x2c3138, emissive: 0x40c0ff, emissiveIntensity: 0 });
  for (let i = 0; i < 3; i++) {
    const arm = new THREE.Group(); arm.rotation.y = i / 3 * Math.PI * 2; rotor.add(arm);
    const pitch = new THREE.Group(); arm.add(pitch);
    const b = new THREE.Mesh(new THREE.BoxGeometry(4.6, .06, .42), bladeM); b.position.x = 2.55; pitch.add(b);
    const tip = new THREE.Mesh(new THREE.BoxGeometry(.25, .065, .43), Mat({ color: 0xffd040 })); tip.position.x = 4.75; pitch.add(tip);
    blades.push(pitch);
    const l = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .8, 6), Mat({ color: 0xd0d6de })); scene.add(l); links.push(l);
  }
  // tail rotor
  const tailR = new THREE.Group(); tailR.position.set(-5.85, .85, .2); yawG.add(tailR);
  for (let i = 0; i < 2; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.12, 1.5, .03), Mat({ color: 0x2c3138 })); b.rotation.z = i * Math.PI / 2; tailR.add(b); }
  // arrows: torque (arc around body) + tail thrust
  const arrM = new THREE.MeshBasicMaterial({ color: 0xff5050, transparent: true, opacity: 0 });
  const torq = new THREE.Group(); torq.position.y = -.2; yawG.add(torq);
  const tArc = new THREE.Mesh(new THREE.TorusGeometry(3.0, .09, 8, 40, Math.PI * .7), arrM); tArc.rotation.x = Math.PI / 2; torq.add(tArc);
  const tHead = new THREE.Mesh(new THREE.ConeGeometry(.25, .6, 12), arrM); tHead.position.set(3.0, 0, 0); tHead.rotation.x = Math.PI; torq.add(tHead);
  const thrM = new THREE.MeshBasicMaterial({ color: 0x40ff90, transparent: true, opacity: 0 });
  const thr = new THREE.Group(); thr.position.set(-5.85, .85, .5); yawG.add(thr);
  const thS = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 1.4, 8), thrM); thS.rotation.x = Math.PI / 2; thS.position.z = .7; thr.add(thS);
  const thH = new THREE.Mesh(new THREE.ConeGeometry(.25, .5, 12), thrM); thH.rotation.x = Math.PI / 2; thH.position.z = 1.6; thr.add(thH);
  // downwash particles
  const pg = new THREE.SphereGeometry(.07, 6, 5), dw = [];
  for (let i = 0; i < 90; i++) { const m = new THREE.Mesh(pg, new THREE.MeshBasicMaterial({ color: 0x9ad8ff, transparent: true, opacity: 0 })); scene.add(m); dw.push([m, Math.random() * Math.PI * 2, .8 + Math.random() * 3.8, Math.random()]); }
  const disc = new THREE.Mesh(new THREE.CircleGeometry(4.9, 48), new THREE.MeshBasicMaterial({ color: 0x9ad8ff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })); disc.rotation.x = -Math.PI / 2; tilt.add(disc);

  const shots = [
    [[9, 3.5, 17], [-1, .6, 0], 1],
    [[7, .5, 13], [-.5, 0, 0], 1],
    [[-6, 2, 20], [-.8, 1.9, 0], 0],
    [[3.6, 2.4, 6.5], [0, 1.4, 0], 1],
    [[9, 4.5, 18], [.6, 2.6, 0], 0],
    [[1, 15, 17], [-2.6, 0, 0], 1],
    [[10, 4.5, 17], [-1, .6, 0], 1],
  ];
  const cp = { p: V(), q: V() };
  let rotA = 0, lastT = 0, hY = 0, hX = 0;
  const w = V(), wp = V();
  function update(t, si, lt) {
    const dt = Math.min(.1, Math.max(0, t - lastT)); lastT = t;
    // rotor speed (visual, slow enough to read) & controls
    const spin = si === 3 ? 2.2 : 7;
    rotA += spin * dt; rotor.rotation.y = rotA; tailR.rotation.z += spin * 2.2 * dt;
    let coll = .08, cyc = 0, targetY = .6, targetX = 0, pitchBody = 0;
    if (si === 0) { targetY = .6 + Math.sin(t * .8) * .15; }
    if (si === 1) targetY = .6;
    if (si === 2) { coll = .08 + .17 * ease(lt / 1.2); targetY = .6 + 2.2 * ease((lt - .6) / 3); }
    if (si === 3) { coll = .14; cyc = .14 * Math.min(1, lt / 1.5); targetY = 2.2; }
    if (si === 4) { coll = .14; cyc = .18; targetY = 2.2; targetX = 2.2 * ease((lt - .8) / 3); pitchBody = -.18 * ease(lt / 1.5); }
    if (si >= 5) { coll = .12; targetY = 2.2; targetX = 0; }
    hY += (targetY - hY) * Math.min(1, dt * 3); hX += (targetX - hX) * Math.min(1, dt * 2.5);
    heli.position.set(hX, hY, 0);
    {
      const prev = shots[Math.max(0, si - 1)], now = shots[si];
      const k = si === 0 ? 1 : ease(lt / 1.3);
      const off = f => [hX * f, hY * f, 0];
      const po = off(prev[2]), no = off(now[2]);
      cp.p.set(...prev[0].map((v, i) => lerp(v + po[i], now[0][i] + no[i], k))); cp.q.set(...prev[1].map((v, i) => lerp(v + po[i], now[1][i] + no[i], k)));
      const o = Math.sin(t * .2) * .1, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
      camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o)); camera.lookAt(cp.q);
    }
    heli.rotation.z = lerp(heli.rotation.z, pitchBody, Math.min(1, dt * 3));
    tilt.rotation.z = -cyc * .9; swUpG.rotation.z = -cyc * .9; swLow.rotation.z = -cyc * .9;
    swLow.position.y = 1.25 + coll * 1.2; swUpG.position.y = 1.4 + coll * 1.2;
    swLow.material.emissiveIntensity = swUp.material.emissiveIntensity = si === 3 ? .7 : 0;
    blades.forEach((b, i) => { const az = rotA + i / 3 * Math.PI * 2; b.rotation.x = coll + cyc * Math.sin(az); });
    bladeM.emissiveIntensity = si === 2 ? .5 : 0;
    // pitch links: from upper swashplate rim to blade root (world space)
    links.forEach((l, i) => {
      const az = rotA + i / 3 * Math.PI * 2;
      swUp.localToWorld(w.set(Math.cos(az) * .45, 0, -Math.sin(az) * .45));
      blades[i].localToWorld(wp.set(.45, 0, -.2));
      l.position.copy(w).add(wp).multiplyScalar(.5); l.scale.y = w.distanceTo(wp) / .8;
      l.quaternion.setFromUnitVectors(V(0, 1, 0), wp.clone().sub(w).normalize());
      l.visible = si === 3 || si === 4 || si === 6;
    });
    // yaw: torque reaction in step 5 (tail rotor off then on)
    let yaw = 0, tailOn = 1;
    if (si === 5) { const a = Math.min(lt, 2.2); yaw = -.35 * Math.sin(Math.min(1, a / 2.2) * Math.PI / 2) * (lt < 2.2 ? 1 : Math.max(0, 1 - (lt - 2.2) / 1.2)); tailOn = lt > 2.0 ? 1 : 0; }
    yawG.rotation.y = yaw;
    arrM.opacity = si === 5 && lt < 2.6 ? .9 : 0; thrM.opacity = si === 5 && lt > 2.0 ? .95 : 0;
    // downwash
    const lift = coll / .14;
    disc.material.opacity = si === 1 ? .12 : .05;
    dw.forEach(([m, a, r, ph]) => {
      const u = (ph + t * .9) % 1;
      tilt.localToWorld(w.set(Math.cos(a) * r, -.2 - u * 4.5, Math.sin(a) * r));
      m.position.copy(w); m.material.opacity = (si === 1 || si === 2 ? .9 : si === 3 || si === 5 ? 0 : .45) * (1 - u) * Math.min(1, lift);
    });
  }
  return { update };
}
