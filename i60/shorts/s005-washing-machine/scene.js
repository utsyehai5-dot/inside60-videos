// Inside 60 — How a Washing Machine Works. Steps: 0 hook spin, 1 fill, 2 tumble, 3 motor, 4 drain/rinse, 5 spin, 6 recap
export async function setup({ THREE, scene, camera }) {
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 50, specular: 0x333333, ...o });

  scene.background = new THREE.Color(0x10182c);
  scene.fog = new THREE.Fog(0x10182c, 20, 45);
  scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x202838, 1.4));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(5, 9, 7); scene.add(key);
  const rim = new THREE.DirectionalLight(0x88aaff, 1.0); rim.position.set(-6, 4, -5); scene.add(rim);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(16, 64), Mat({ color: 0x1c2640, shininess: 5 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -1.3; scene.add(floor);

  const C = new THREE.Vector3(0, 1.6, 0); // drum centre
  const M = new THREE.Group(); scene.add(M);
  // cabinet (goes see-through)
  const cabMat = Mat({ color: 0xeef2f8, transparent: true, opacity: 1, shininess: 70 });
  const cab = new THREE.Mesh(new RoundedBoxGeometry(4.8, 5.4, 4.4, 6, .3), cabMat); cab.position.set(0, 1.4, 0); M.add(cab);
  const panel = new THREE.Mesh(new RoundedBoxGeometry(4.6, .7, .2, 3, .08), Mat({ color: 0x3a4256 })); panel.position.set(0, 3.65, 2.2); M.add(panel);
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(.24, .24, .16, 24), Mat({ color: 0xc8d0dc })); knob.rotation.x = Math.PI / 2; knob.position.set(1.5, 3.65, 2.36); M.add(knob);
  const leds = [-1.4, -1.0, -.6].map(x => { const m = new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 8), new THREE.MeshBasicMaterial({ color: 0x7cff6b })); m.position.set(x, 3.65, 2.33); M.add(m); return m; });
  // door
  const door = new THREE.Group(); door.position.set(C.x, C.y, 2.25); M.add(door);
  door.add(new THREE.Mesh(new THREE.TorusGeometry(1.55, .2, 14, 48), Mat({ color: 0xb8c2d0, shininess: 90, specular: 0x999999 })));
  const glassMat = Mat({ color: 0x9fd4ff, transparent: true, opacity: .25, shininess: 100, specular: 0xffffff });
  door.add(new THREE.Mesh(new THREE.CircleGeometry(1.5, 48), glassMat));

  // drum (rotates around z)
  const D = new THREE.Group(); D.position.copy(C); M.add(D);
  const R = 1.75, L = 3.2;
  const drumMat = Mat({ color: 0xaab4c4, side: THREE.DoubleSide, shininess: 90, specular: 0x888888, emissive: 0x111822 });
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(R, R, L, 48, 1, true), drumMat); drum.rotation.x = Math.PI / 2; D.add(drum);
  const backDisc = new THREE.Mesh(new THREE.CircleGeometry(R, 48), drumMat); backDisc.position.z = -L / 2; D.add(backDisc);
  const holeGeo = new THREE.CircleGeometry(.07, 10), holeMat = new THREE.MeshBasicMaterial({ color: 0x223044, side: THREE.DoubleSide });
  for (let a = 0; a < 24; a++) for (let z = 0; z < 6; z++) {
    const ang = a / 24 * Math.PI * 2 + z * .13, h = new THREE.Mesh(holeGeo, holeMat);
    h.position.set(Math.cos(ang) * (R - .01), Math.sin(ang) * (R - .01), -L / 2 + .35 + z * .5);
    h.lookAt(0, 0, h.position.z); D.add(h);
  }
  const padMat = Mat({ color: 0x5ad1ff, emissive: 0x1a7fb0, emissiveIntensity: .4 });
  const paddles = [0, 1, 2].map(i => { const a = i * Math.PI * 2 / 3; const p = new THREE.Mesh(new RoundedBoxGeometry(.5, .35, L - .3, 3, .1), padMat); p.position.set(Math.cos(a) * (R - .2), Math.sin(a) * (R - .2), 0); p.rotation.z = a; D.add(p); return p; });

  // clothes
  const clothCols = [0xff5e7a, 0xffd23d, 0x7cff6b, 0xff8a3d, 0xa47bff, 0x3dd6ff, 0xffffff];
  const clothes = clothCols.map((c, i) => { const m = new THREE.Mesh(new RoundedBoxGeometry(.9, .45, .9, 3, .2), Mat({ color: c, shininess: 10 })); m.position.set(0, 0, -1 + (i % 3) * .9); M.add(m); return { m, i }; });

  // water inside drum: circular segment, rebuilt when level changes
  const waterMat = Mat({ color: 0x3aa8ff, transparent: true, opacity: .55, emissive: 0x0a4a8a, emissiveIntensity: .5, shininess: 100 });
  const water = new THREE.Mesh(new THREE.BufferGeometry(), waterMat); water.position.set(C.x, C.y, -L / 2 + .05); M.add(water);
  let lastLevel = -1;
  function setWater(lv) { // lv 0..1 of drum height
    lv = Math.round(lv * 40) / 40; if (lv === lastLevel) return; lastLevel = lv;
    water.geometry.dispose();
    if (lv <= 0.01) { water.visible = false; water.geometry = new THREE.BufferGeometry(); return; }
    water.visible = true;
    const r = R - .08, y = -r + lv * 2 * r, half = Math.acos(Math.max(-1, Math.min(1, y / r)));
    const s = new THREE.Shape(); const a0 = Math.PI / 2 + half, a1 = Math.PI / 2 - half + Math.PI * 2;
    s.moveTo(Math.cos(a0) * r, Math.sin(a0) * r); s.absarc(0, 0, r, a0, a1, false); s.closePath();
    water.geometry = new THREE.ExtrudeGeometry(s, { depth: L - .1, bevelEnabled: false, curveSegments: 40 });
  }

  // inlet valve + pipe on top, falling stream
  const pipeMat = Mat({ color: 0x8a95a8, shininess: 80 });
  const inPipe = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-2.6, 4.4, -1.6), new THREE.Vector3(-1.2, 4.0, -1.6), new THREE.Vector3(-.6, 3.6, -1.2)]), 30, .12, 10), pipeMat); M.add(inPipe);
  const valveMat = Mat({ color: 0x5a6478, emissive: 0x7cff6b, emissiveIntensity: 0 });
  const valve = new THREE.Mesh(new RoundedBoxGeometry(.5, .5, .5, 3, .1), valveMat); valve.position.set(-1.2, 4.0, -1.6); M.add(valve);
  const streamMat = Mat({ color: 0x5ac8ff, transparent: true, opacity: 0, emissive: 0x1a8aff, emissiveIntensity: .6 });
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(.1, .14, 1.6, 12), streamMat); stream.position.set(-.6, 2.85, -1.2); M.add(stream);
  // soap bubbles
  const bubbles = []; for (let i = 0; i < 26; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(.08 + (i % 4) * .03, 10, 8), new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0, shininess: 100 })); M.add(b); bubbles.push(b); }
  // motor behind drum with belt
  const motorMat = Mat({ color: 0xff8a3d, emissive: 0xff5a00, emissiveIntensity: 0 });
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, 1.1, 28), motorMat); motor.rotation.x = Math.PI / 2; motor.position.set(1.0, -.4, -2.0); M.add(motor);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, .5, 12), pipeMat); shaft.rotation.x = Math.PI / 2; shaft.position.set(C.x, C.y, -1.9); M.add(shaft);
  const pulley = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, .15, 40), Mat({ color: 0x8a95a8, shininess: 90 })); pulley.rotation.x = Math.PI / 2; pulley.position.set(C.x, C.y, -2.15); M.add(pulley);
  const spoke = new THREE.Mesh(new THREE.BoxGeometry(2.2, .18, .05), Mat({ color: 0x3a4256 })); spoke.position.y = -.1; pulley.add(spoke);
  const beltPts = []; for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 2; const big = Math.sin(a) > -.3; beltPts.push(new THREE.Vector3(big ? C.x + Math.cos(a) * 1.22 : 1.0 + Math.cos(a) * .3, big ? C.y + Math.sin(a) * 1.22 : -.4 + Math.sin(a) * .3, -2.15)); }
  const belt = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(C.x - 1.22, C.y, -2.15), new THREE.Vector3(C.x, C.y + 1.22, -2.15), new THREE.Vector3(C.x + 1.22, C.y, -2.15), new THREE.Vector3(1.35, -.4, -2.15), new THREE.Vector3(1.0, -.72, -2.15), new THREE.Vector3(.65, -.4, -2.15)], true), 80, .05, 8), Mat({ color: 0x222222 })); M.add(belt);
  // drain pump + hose
  const pumpMat = Mat({ color: 0x3dd6ff, emissive: 0x1a8aff, emissiveIntensity: 0 });
  const pump = new THREE.Mesh(new RoundedBoxGeometry(.8, .6, .8, 3, .15), pumpMat); pump.position.set(-1.3, -.7, .6); M.add(pump);
  const drainCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(-.6, -.15, .3), new THREE.Vector3(-1.3, -.5, .6), new THREE.Vector3(-2.2, -.7, .6), new THREE.Vector3(-3.0, .2, .2), new THREE.Vector3(-3.0, 1.8, -.4)]);
  M.add(new THREE.Mesh(new THREE.TubeGeometry(drainCurve, 50, .12, 10), Mat({ color: 0x8a95a8, transparent: true, opacity: .6 })));
  const flow = []; for (let i = 0; i < 18; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(.1, 8, 6), new THREE.MeshBasicMaterial({ color: 0x8fa070, transparent: true, opacity: 0 })); M.add(f); flow.push(f); }
  // spin droplets
  const drops = []; for (let i = 0; i < 44; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), new THREE.MeshBasicMaterial({ color: 0x7fd4ff, transparent: true, opacity: 0 })); M.add(d); drops.push({ d, a: i * 2.399, z: -1.3 + (i % 6) * .5, o: (i * .37) % 1 }); }

  const shots = [
    [[5.5, 4.2, 13.5], [0, 1.5, 0]],     // hook
    [[-6.5, 7.5, 9.5], [-.4, 2.0, 0]],    // fill from top-left
    [[2.0, 2.6, 11.0], [0, 1.6, 0]],      // tumble, front
    [[6.5, 3.0, -9.5], [.4, .9, -1.5]],   // motor from behind
    [[-8.0, 1.8, 9.0], [-1.0, 1.0, 0]],   // drain, low left
    [[3.0, 3.4, 12.0], [0, 1.6, 0]],      // spin
    [[5.5, 4.6, 14.5], [0, 1.4, 0]],      // recap
  ];
  const cur = { p: new THREE.Vector3(), q: new THREE.Vector3() };
  let ang = 0, lastT = 0;

  function update(t, si, lt, sd) {
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const k = si === 0 ? 1 : ease(lt / 1.3);
    cur.p.set(...prev[0].map((v, i) => lerp(v, now[0][i], k)));
    cur.q.set(...prev[1].map((v, i) => lerp(v, now[1][i], k)));
    const o = Math.sin(t * .15) * .07;
    camera.position.set(cur.p.x * Math.cos(o) - cur.p.z * Math.sin(o), cur.p.y, cur.p.z * Math.cos(o) + cur.p.x * Math.sin(o));
    camera.lookAt(cur.q);
    const dt = Math.max(0, Math.min(.1, t - lastT)); lastT = t;

    // see-through cabinet after the hook
    const xr = si === 0 ? ease((lt - 2.2) / 1) : si === 6 ? 1 - ease((lt - .8) / 1.2) : 1;
    cabMat.opacity = 1 - xr * .82; cabMat.depthWrite = cabMat.opacity > .9;
    glassMat.opacity = .25 - xr * .15;

    // drum speed (rad/s): hook fast spin, tumble back-and-forth, spin very fast
    let w = 0;
    if (si === 0) w = 18 * (1 - ease((lt - 2.0) / 1));
    else if (si === 2 || si === 3) w = Math.sin(lt * 1.3) > 0 ? 2.2 : -2.2;
    else if (si === 4) w = .8;
    else if (si === 5) w = 2 + 22 * ease(lt / 2.0);
    else if (si === 6) w = 1.2;
    ang += w * dt; D.rotation.z = ang;
    pulley.rotation.set(Math.PI / 2, ang, 0);
    motor.rotation.set(Math.PI / 2, ang * 4, 0);
    motorMat.emissiveIntensity = si === 3 ? .6 + .3 * Math.sin(t * 8) : Math.min(.4, Math.abs(w) / 40);

    // water level
    let lv = 0;
    if (si === 1) lv = .38 * ease((lt - .6) / (sd - 1.2));
    else if (si === 2 || si === 3) lv = .38;
    else if (si === 4) lv = lt < sd * .45 ? .38 * (1 - ease(lt / (sd * .45))) : .3 * ease((lt - sd * .55) / (sd * .4));
    else if (si === 5) lv = .3 * (1 - ease(lt / 1.2));
    setWater(lv);
    waterMat.color.setHex(si === 4 && lt < sd * .45 ? 0x6a9ab0 : 0x3aa8ff);
    water.position.y = C.y + Math.sin(t * 3) * .02;

    // fill stream + valve
    const fillOn = si === 1 ? ease(lt / .5) * (1 - ease((lt - sd + .6) / .5)) : (si === 4 && lt > sd * .55 ? 1 : 0);
    streamMat.opacity = fillOn * .8; stream.scale.y = .6 + .4 * Math.sin(t * 20) * .1 + .4;
    valveMat.emissiveIntensity = fillOn;
    // bubbles (detergent) step 1-3
    const bub = si === 1 ? ease((lt - 1.2) / 1) : si === 2 || si === 3 ? 1 : si === 4 ? 1 - ease(lt / 1.5) : 0;
    bubbles.forEach((b, i) => { const a = i * 2.4 + t * .4, rr = .4 + (i % 5) * .25; b.position.set(C.x + Math.cos(a) * rr, C.y - R + lv * 2 * R * .96 + Math.sin(t * 2 + i) * .08, -1.3 + (i % 7) * .42); b.material.opacity = bub * .7; });

    // clothes: tumble at bottom, lifted by paddles; pinned to wall while spinning
    clothes.forEach(({ m, i }) => {
      let a, r = 1.2;
      if (si === 5 || (si === 0 && w > 8)) { a = ang + i * .9; r = R - .3; }
      else if (si === 2 || si === 3 || si === 6) { const ph = (t * .55 + i / clothes.length) % 1; a = -Math.PI / 2 + (ph < .6 ? -1 + ph / .6 * 2.6 : 1.6 - (ph - .6) / .4 * 2.6) * Math.sign(w || 1); r = ph < .6 ? R - .35 : 1.0; }
      else { a = -Math.PI / 2 + (i - 3) * .32; r = R - .35; }
      m.position.set(C.x + Math.cos(a) * r, C.y + Math.sin(a) * r, -1.1 + (i % 3) * .95);
      m.rotation.set(t * .7 + i, a, i);
    });

    // drain flow
    const dr = si === 4 && lt < sd * .5 ? 1 : 0;
    pumpMat.emissiveIntensity = dr ? .7 + .3 * Math.sin(t * 10) : 0;
    flow.forEach((f, i) => { const u = (t * .7 + i / flow.length) % 1; f.position.copy(drainCurve.getPointAt(u)); f.material.opacity = dr * .9; });

    // spin droplets fly out through holes
    const sp = si === 5 ? ease((lt - .8) / 1) : 0;
    drops.forEach(({ d, a, z, o: oo }) => {
      const u = (t * 1.3 + oo) % 1, aa = a + ang * .2, rr = R + u * 1.6;
      d.position.set(C.x + Math.cos(aa) * rr, C.y + Math.sin(aa) * rr, z);
      d.material.opacity = sp * (1 - u);
    });
    leds.forEach((l, n) => l.material.color.setHex(n === Math.min(2, Math.max(0, si - 1) % 3) ? 0x7cff6b : 0x2a4a3a));
    M.rotation.y = Math.sin(t * .3) * .04;
  }
  return { update };
}
