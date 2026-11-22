// Inside 60 — Camera lens. Steps: 0 hook (flipped image), 1 glass bends rays, 2 rays cross at a point, 3 focus motor, 4 aperture blades, 5 color fringing + extra element, 6 recap
export async function setup({ THREE, scene, camera }) {
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const ss = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 90, specular: 0x666666, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x141d36); scene.fog = new THREE.Fog(0x141d36, 30, 80);
  scene.add(new THREE.HemisphereLight(0xf0f4ff, 0x40404c, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(4, 6, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0xa0c0ff, .8); rim.position.set(-6, -3, -6); scene.add(rim);

  const rig = new THREE.Group(); rig.rotation.y = .75; scene.add(rig); rig.updateMatrixWorld(true);
  // floor rail
  const rail = new THREE.Mesh(new RoundedBoxGeometry(11, .2, 1.6, 2, .08), Mat({ color: 0x2a3550, shininess: 30 })); rail.position.set(-.4, -2.1, 0); rig.add(rail);

  // object: tree at x=-5 (base y=-1, top y=1.2)
  const tree = new THREE.Group(); tree.position.set(-5, 0, 0); rig.add(tree);
  const mkTree = (g, glow) => {
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(.13, .16, .7, 12), Mat({ color: 0x8a5a2b, emissive: 0x804010, emissiveIntensity: glow }));
    tr.position.y = -.65; g.add(tr);
    [[.75, 1.0, -.05], [.6, .8, .45], [.42, .6, .85]].forEach(([r, h, y]) => { const c = new THREE.Mesh(new THREE.ConeGeometry(r, h, 18), Mat({ color: 0x3ccf6a, emissive: 0x20c050, emissiveIntensity: glow })); c.position.y = y; g.add(c); });
  };
  mkTree(tree, .15);
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(.6, .7, .9, 20), Mat({ color: 0x5a6478 })); stand.position.set(-5, -1.55, 0); rig.add(stand);

  // lens barrel (cut away toward camera), axis = x
  const barrelM = Mat({ color: 0x30343e, side: THREE.DoubleSide, shininess: 60, transparent: true, opacity: .18, depthWrite: false });
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, 3.6, 48, 1, true, Math.PI * .1, Math.PI * 1.3), barrelM);
  barrel.rotation.z = Math.PI / 2; barrel.rotation.y = 0; barrel.position.set(-.2, 0, 0); rig.add(barrel);
  [-2, 1.6].forEach(x => { const r = new THREE.Mesh(new THREE.TorusGeometry(1.45, .08, 10, 48), Mat({ color: 0xc8ced8, shininess: 150 })); r.rotation.y = Math.PI / 2; r.position.set(x, 0, 0); rig.add(r); });
  // camera body + sensor
  const body = new THREE.Mesh(new RoundedBoxGeometry(1.6, 3.6, 3.2, 3, .2), Mat({ color: 0x23262e, transparent: true, opacity: .35, depthWrite: false })); body.position.set(4.9, 0, 0); rig.add(body);
  const sensorM = Mat({ color: 0x3a4a8a, emissive: 0x3050ff, emissiveIntensity: .15, shininess: 160 });
  const sensor = new THREE.Mesh(new RoundedBoxGeometry(.12, 2.8, 2.8, 2, .04), sensorM); sensor.position.set(4.25, 0, 0); rig.add(sensor);
  for (let i = -4; i <= 4; i++) { const g1 = new THREE.Mesh(new THREE.BoxGeometry(.01, 2.7, .015), Mat({ color: 0x8090c0 })); g1.position.set(4.18, 0, i * .3); rig.add(g1); const g2 = new THREE.Mesh(new THREE.BoxGeometry(.01, .015, 2.7), Mat({ color: 0x8090c0 })); g2.position.set(4.18, i * .3, 0); rig.add(g2); }
  // flipped image on sensor
  const img = new THREE.Group(); img.position.set(4.14, 0, 0); img.rotation.z = Math.PI; img.scale.set(.05, 1, 1); rig.add(img); mkTree(img, .9);

  // glass elements (lathe around y, rotated to x axis)
  const glassM = Mat({ color: 0x9fe0ff, emissive: 0x2080ff, emissiveIntensity: .1, shininess: 200, specular: 0xffffff, transparent: true, opacity: .5, depthWrite: false });
  const lensGeo = (R, th, concave) => { const pts = []; for (let i = 0; i <= 16; i++) { const r = R * i / 16; pts.push(new THREE.Vector2(r, concave ? -(th * .3 + th * (r / R) ** 2) : -th * (1 - (r / R) ** 2) - .03)); }
    for (let i = 16; i >= 0; i--) { const r = R * i / 16; pts.push(new THREE.Vector2(r, concave ? (th * .3 + th * (r / R) ** 2) : th * (1 - (r / R) ** 2) + .03)); } return new THREE.LatheGeometry(pts, 40); };
  const focusG = new THREE.Group(); rig.add(focusG);
  const main = new THREE.Mesh(lensGeo(1.3, .32), glassM); main.rotation.z = Math.PI / 2; main.position.x = -.5; focusG.add(main);
  const front = new THREE.Mesh(lensGeo(1.3, .18), glassM); front.rotation.z = Math.PI / 2; front.position.x = -1.6; focusG.add(front);
  const flintM = glassM.clone(); flintM.color.set(0xd0b0ff); flintM.opacity = 0;
  const flint = new THREE.Mesh(lensGeo(1.2, .12, true), flintM); flint.rotation.z = Math.PI / 2; flint.position.x = .15; rig.add(flint);
  // focus motor ring
  const motorM = Mat({ color: 0xe8b040, emissive: 0xff9000, emissiveIntensity: 0, shininess: 120 });
  const motor = new THREE.Mesh(new THREE.TorusGeometry(1.62, .14, 10, 48), motorM); motor.rotation.y = Math.PI / 2; focusG.add(motor); motor.position.x = -1.05;

  // aperture blades at x=.9
  const AX = .95, bladeM = Mat({ color: 0x6a7080, emissive: 0x3090ff, emissiveIntensity: 0, shininess: 120 });
  const blades = [];
  for (let i = 0; i < 7; i++) { const g = new THREE.Group(); g.position.x = AX + i * .004; g.rotation.x = i / 7 * Math.PI * 2; rig.add(g);
    const b = new THREE.Mesh(new THREE.BoxGeometry(.03, .5, 1.0), bladeM); b.rotation.x = .3; g.add(b); blades.push(b); }
  const apRing = new THREE.Mesh(new THREE.TorusGeometry(1.62, .12, 10, 48), Mat({ color: 0xc8ced8, shininess: 150 })); apRing.rotation.y = Math.PI / 2; apRing.position.x = AX; rig.add(apRing);

  // rays (thin glowing cylinders between points)
  const unitCyl = new THREE.CylinderGeometry(1, 1, 1, 8, 1, true);
  const seg = (m, a, b, r) => { const d = b.clone().sub(a), L = d.length(); m.position.copy(a).add(b).multiplyScalar(.5); m.scale.set(r, L, r); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); };
  const rayM = new THREE.MeshBasicMaterial({ color: 0xfff2a0, transparent: true, opacity: .85, depthWrite: false });
  const TOP = V(-5, 1.2, 0), BOT = V(-5, -1, 0), ITOP = V(4.18, -1.2, 0), IBOT = V(4.18, 1, 0);
  const rays = [];
  [[TOP, ITOP], [BOT, IBOT]].forEach(([A, B]) => [.95, .1, -.85].forEach(h => {
    const L = V(-.5, h * (A === TOP ? 1 : 1), 0); const m1 = new THREE.Mesh(unitCyl, rayM), m2 = new THREE.Mesh(unitCyl, rayM); rig.add(m1, m2);
    rays.push({ A, L, B, m1, m2, h });
  }));
  const pulseM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1, depthWrite: false });
  const pulses = rays.map((r, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(.08, 10, 8), pulseM); rig.add(m); return { r, m, o: i * .17 }; });
  const crossM = new THREE.MeshBasicMaterial({ color: 0xffe060, transparent: true, opacity: 0, depthWrite: false });
  const cross = new THREE.Mesh(new THREE.SphereGeometry(.16, 14, 10), crossM); rig.add(cross);
  // colored rays for step 5
  const colRays = [[0xff4040, .6], [0x40ff60, 0], [0x4080ff, -.6]].map(([c, d]) => { const m = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, depthWrite: false });
    const a = new THREE.Mesh(unitCyl, m), b = new THREE.Mesh(unitCyl, m); rig.add(a, b); return { m, a, b, d }; });
  const fringeDots = colRays.map(c => { const s = new THREE.Mesh(new THREE.SphereGeometry(.12, 12, 8), c.m); rig.add(s); return s; });

  const shots = [
    [[1.5, 1.5, 24], [0, -.4, 0]],
    [[-2, 2.2, 10.5], [-2.4, -.3, 0]],
    [[2.2, 1, 11], [1.6, -.4, 0]],
    [[-1.2, 3, 10.5], [-.9, -.3, 0]],
    [[7.4, 1.6, 2], [.95, -.2, 0]],
    [[1.6, -.4, 11], [1.8, -.4, 0]],
    [[-1.5, 1.5, 24], [0, -.4, 0]],
  ];
  const cp = { p: V(), q: V() };
  function update(t, si, lt, sd) {
    sd = sd || 6;
    const pulse = .5 + .5 * Math.sin(t * 5);
    // focus motor: slide elements in step 3
    const fs = si === 3 ? .45 * Math.sin(ss(.3, sd, lt) * Math.PI * 2) : 0;
    focusG.position.x = fs;
    motor.rotation.x = t * (si === 3 ? 3 : .2);
    motorM.emissiveIntensity = si === 3 ? .4 + .4 * pulse : 0;
    // aperture: open radius
    let ap = 1.15;
    if (si === 4) ap = lerp(1.15, .45, ss(.8, 2.2, lt)) + lerp(0, .35, ss(sd * .55, sd * .8, lt));
    if (si === 0 || si === 6) ap = 1.15;
    blades.forEach(b => { b.position.y = ap + .25; });
    bladeM.emissiveIntensity = si === 4 ? .25 + .25 * pulse : 0;
    const light = Math.min(1, (ap / 1.15) ** 2 * 1.05);
    // rays
    const showMain = si !== 5;
    rays.forEach(r => {
      const L = r.L.clone(); L.x += fs; const clip = Math.abs(r.h) > ap + .05 && si === 4;
      const B = r.B.clone(); B.y += (r.A === TOP ? 1 : -1) * fs * -.6;
      seg(r.m1, r.A, L, .025); seg(r.m2, L, B, .025);
      r.m2.visible = showMain && !clip; r.m1.visible = showMain; r.cur = [r.A, L, B]; r.clip = clip;
    });
    rayM.opacity = showMain ? (si === 4 ? .35 + .5 * light : .85) : 0;
    pulses.forEach(p => { const u = (t * .45 + p.o) % 1; const [A, L, B] = p.r.cur; const k = u < .5 ? u * 2 : (u - .5) * 2;
      if (u < .5) p.m.position.lerpVectors(A, L, k); else p.m.position.lerpVectors(L, B, k);
      p.m.visible = showMain && !(p.r.clip && u >= .5); });
    crossM.opacity = si === 2 ? .7 + .3 * pulse : 0; cross.position.set(lerp(-.5, 4.18, .5) * 0 + 1.85 + fs * .3, 0.1 * 0 + .04, 0);
    // image brightness / sharpness
    const blur = si === 3 ? Math.abs(fs) / .45 : 0;
    img.children.forEach(c => { c.material.emissiveIntensity = (.25 + .75 * light) * (1 - .7 * blur) * (si === 0 || si === 2 || si === 6 ? .8 + .4 * pulse : 1); c.material.transparent = true; c.material.opacity = 1 - .6 * blur; });
    img.scale.y = 1 + .25 * blur; img.scale.z = 1 + .25 * blur;
    sensorM.emissiveIntensity = .1 + .35 * light * (si === 0 ? pulse : .5);
    // color fringing step 5
    const fr = si === 5 ? 1 - ss(sd * .5, sd * .75, lt) : 1;
    flintM.opacity = si === 5 ? .55 * ss(sd * .4, sd * .6, lt) : (si === 6 ? .4 : 0);
    const P = V(-.5, .95, 0), A = TOP;
    colRays.forEach((c, i) => { c.m.opacity = si === 5 ? ss(.2, .8, lt) : 0;
      const F = V(4.18, -1.2 + c.d * .6 * fr, 0);
      seg(c.a, A, P, .03); seg(c.b, P, F, .03); fringeDots[i].position.copy(F).setX(4.12); });
    // camera
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const k = si === 0 ? 1 : ease(lt / 1.3);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], k))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], k)));
    { const off = cp.p.clone().sub(cp.q); cp.q.applyMatrix4(rig.matrixWorld); cp.p.copy(cp.q).add(off); }
    const o = Math.sin(t * .2) * .08, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o));
    camera.lookAt(cp.q);
  }
  return { update };
}
