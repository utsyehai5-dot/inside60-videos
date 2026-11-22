// Inside 60 — Fire extinguisher. Steps: 0 hook (~10 s spray), 1 powder + nitrogen inside, 2 pin + lever, 3 siphon tube + nozzle, 4 fire triangle, 5 smother, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const ss = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 90, specular: 0x666666, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x141a2e); scene.fog = new THREE.Fog(0x141a2e, 30, 80);
  scene.add(new THREE.HemisphereLight(0xf4f6ff, 0x40404c, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.9); key.position.set(5, 10, 9); scene.add(key);
  const rim = new THREE.DirectionalLight(0xa0c8ff, .8); rim.position.set(-6, 2, -6); scene.add(rim);

  const floor = new THREE.Mesh(new THREE.CircleGeometry(30, 48), Mat({ color: 0x3a4052, shininess: 10 })); floor.rotation.x = -Math.PI / 2; scene.add(floor);

  // ===== Extinguisher (origin) =====
  const ex = new THREE.Group(); scene.add(ex);
  const prof = []; for (let k = 0; k <= 20; k++) { const a = k / 20; prof.push(new THREE.Vector2(a < .1 ? 1.0 * ss(0, .1, a) + .001 : a > .85 ? lerp(1.0, .35, ss(.85, 1, a)) : 1.0, a * 4.2)); }
  const bodyM = Mat({ color: 0xd8202a, transparent: true, opacity: 1, side: THREE.DoubleSide });
  const body = new THREE.Mesh(new THREE.LatheGeometry(prof, 48), bodyM); ex.add(body);
  const label = new THREE.Mesh(new THREE.CylinderGeometry(1.01, 1.01, 1.2, 48, 1, true), Mat({ color: 0xf2f2f2, transparent: true, opacity: 1 })); label.position.y = 2.0; ex.add(label);
  // inside: powder (bottom) + nitrogen (top)
  const powM = Mat({ color: 0xfff0a0, emissive: 0x403000, transparent: true, opacity: 0 });
  const pow = new THREE.Mesh(new THREE.CylinderGeometry(.92, .92, 2.4, 40), powM); pow.position.y = 1.35; ex.add(pow);
  const gasM = new THREE.MeshBasicMaterial({ color: 0x60b0ff, transparent: true, opacity: 0, depthWrite: false });
  const gas = []; for (let k = 0; k < 40; k++) { const m = new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 6), gasM); ex.add(m); gas.push([m, Math.random() * 7, Math.random() * 7, Math.random()]); }
  const tubeM = Mat({ color: 0xc0c8d8, transparent: true, opacity: 0 });
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 4.0, 12), tubeM); tube.position.y = 2.25; ex.add(tube);
  const flowM = new THREE.MeshBasicMaterial({ color: 0xffe860, transparent: true, opacity: 0 });
  const flow = []; for (let k = 0; k < 14; k++) { const m = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), flowM); ex.add(m); flow.push(m); }
  // valve head, handle, lever, pin, gauge
  const metal = Mat({ color: 0x9aa2b2, shininess: 140 });
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.33, .38, .5, 20), metal); neck.position.y = 4.4; ex.add(neck);
  const head = new THREE.Mesh(new THREE.BoxGeometry(.6, .5, .5), metal); head.position.y = 4.85; ex.add(head);
  const handle = new THREE.Mesh(new THREE.BoxGeometry(1.8, .12, .35), Mat({ color: 0x2a2e38 })); handle.position.set(-.7, 4.95, 0); ex.add(handle);
  const leverP = new THREE.Group(); leverP.position.set(.25, 5.2, 0); ex.add(leverP);
  const lever = new THREE.Mesh(new THREE.BoxGeometry(1.9, .12, .32), Mat({ color: 0x2a2e38 })); lever.position.set(-.9, .1, 0); leverP.add(lever);
  const pinM = Mat({ color: 0xffd020, emissive: 0x332200 });
  const pin = new THREE.Group(); pin.position.set(0, 5.05, 0); ex.add(pin);
  const pinRod = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .9, 8), pinM); pinRod.rotation.x = Math.PI / 2; pin.add(pinRod);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.22, .04, 8, 24), pinM); ring.position.z = .62; pin.add(ring);
  const gauge = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .1, 24), Mat({ color: 0xffffff })); gauge.rotation.x = Math.PI / 2; gauge.position.set(.35, 4.75, .3); ex.add(gauge);
  const needle = new THREE.Mesh(new THREE.BoxGeometry(.02, .16, .02), new THREE.MeshBasicMaterial({ color: 0x20c040 })); needle.position.set(.35, 4.79, .36); ex.add(needle);
  // hose + nozzle
  const hoseC = new THREE.CatmullRomCurve3([V(.3, 4.7, 0), V(.9, 4.5, 0), V(1.35, 3.0, .1), V(1.6, 2.2, .3), V(2.4, 2.6, .5)]);
  ex.add(new THREE.Mesh(new THREE.TubeGeometry(hoseC, 40, .09, 10), Mat({ color: 0x1c1c22 })));
  const noz = new THREE.Mesh(new THREE.CylinderGeometry(.16, .1, .5, 14), Mat({ color: 0x1c1c22 })); noz.position.set(2.55, 2.68, .55); noz.rotation.z = -Math.PI / 2.4; ex.add(noz);
  // spray particles (world)
  const sprM = new THREE.MeshBasicMaterial({ color: 0xfff4c0, transparent: true, opacity: 0, depthWrite: false });
  const spr = []; for (let k = 0; k < 60; k++) { const m = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 6), sprM); scene.add(m); spr.push([m, Math.random(), Math.random() - .5, Math.random() - .5]); }

  // ===== Fire tray (in front-right of extinguisher) =====
  const fireG = new THREE.Group(); fireG.position.set(5.2, 0, 1.2); scene.add(fireG);
  fireG.add(new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.2, .4, 32), Mat({ color: 0x505660 })));
  const logs = Mat({ color: 0x6a4024 });
  for (let k = 0; k < 3; k++) { const l = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, 2, 10), logs); l.rotation.z = Math.PI / 2; l.rotation.y = k * 1.05; l.position.y = .35; fireG.add(l); }
  const flames = [];
  const fcol = [0xff3000, 0xff7000, 0xffc000];
  for (let k = 0; k < 9; k++) { const m = new THREE.Mesh(new THREE.ConeGeometry(.35 - k * .02, 1.6, 12), new THREE.MeshPhongMaterial({ color: fcol[k % 3], emissive: fcol[k % 3], emissiveIntensity: 1, transparent: true, opacity: .85 }));
    const a = k * 2.4, r = k === 0 ? 0 : .55; m.position.set(Math.cos(a) * r, 1.1, Math.sin(a) * r); fireG.add(m); flames.push([m, Math.random() * 7]); }
  const powCoat = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, .5, 32), Mat({ color: 0xfff0b0, transparent: true, opacity: 0 })); powCoat.position.y = .45; fireG.add(powCoat);

  // ===== Fire triangle (x = 24) =====
  const tri = new THREE.Group(); tri.position.set(24, 3.2, 0); scene.add(tri);
  const triCols = [0xff3020, 0xa86a30, 0x40a0ff]; const triM = triCols.map(c => Mat({ color: c, emissive: c, emissiveIntensity: .5 }));
  const R = 2.0; const pts = [0, 1, 2].map(k => V(Math.cos(Math.PI / 2 + k * 2.094) * R, Math.sin(Math.PI / 2 + k * 2.094) * R, 0));
  const sides = [];
  for (let k = 0; k < 3; k++) { const a = pts[k], b = pts[(k + 1) % 3]; const L = a.distanceTo(b);
    const s = new THREE.Mesh(new THREE.BoxGeometry(L, .35, .35), triM[k]); s.position.copy(a).add(b).multiplyScalar(.5); s.rotation.z = Math.atan2(b.y - a.y, b.x - a.x); tri.add(s); sides.push([s, s.position.clone()]); }
  const triFlame = new THREE.Mesh(new THREE.ConeGeometry(.6, 1.6, 16), new THREE.MeshPhongMaterial({ color: 0xff8000, emissive: 0xff6000, transparent: true, opacity: 1 })); triFlame.position.y = -.2; tri.add(triFlame);

  const shots = [
    [[6.5, 5.0, 19.5], [3.0, 2.4, .5]],     // 0 extinguisher + fire
    [[4.0, 3.6, 14.5], [0, 2.6, 0]],        // 1 x-ray inside
    [[2.6, 6.0, 6.8], [-.3, 4.9, 0]],       // 2 pin + lever close
    [[4.5, 4.0, 15.0], [1.0, 2.8, 0]],      // 3 siphon tube + hose
    [[24, 3.2, 13.0], [24, 3.2, 0]],        // 4 triangle
    [[7.5, 4.5, 11.5], [4.4, 1.3, 1]],      // 5 smother
    [[7.0, 5.5, 21.0], [3.0, 2.4, .5]],     // 6 recap
  ];
  const cp = { p: V(), q: V() };
  function update(t, si, lt, sd) {
    const pulse = .5 + .5 * Math.sin(t * 6);
    const xray = si >= 1 && si <= 3;
    bodyM.opacity = xray ? lerp(1, .28, ss(0, 1, si === 1 ? lt : 1)) : 1; bodyM.depthWrite = bodyM.opacity > .9;
    label.material.opacity = bodyM.opacity; label.material.depthWrite = bodyM.depthWrite;
    powM.opacity = xray ? .95 : 0; gasM.opacity = xray ? .85 : 0; tubeM.opacity = xray ? .9 : 0;
    gas.forEach(([m, a, b, c]) => { const r = .75 * Math.sqrt(c); m.position.set(Math.cos(a + t * 1.5) * r, 2.7 + (.5 + .5 * Math.sin(b + t * 3)) * 1.3, Math.sin(a + t * 1.5) * r); });
    // trigger: pin out in step 2, lever squeezed late step 2 onward
    const pinOut = si === 2 ? ss(.3, 1.3, lt) : si > 2 ? 1 : 0; pin.position.z = pinOut * 1.4; pin.visible = pinOut < .99 || si === 2;
    const sq = si === 2 ? ss(1.8, 2.5, lt) : si >= 3 ? 1 : 0; leverP.rotation.z = -.28 * sq + .0;
    pinM.emissiveIntensity = si === 2 ? .4 + .6 * pulse : .1;
    // flow up the siphon tube
    flowM.opacity = si === 3 ? 1 : 0;
    flow.forEach((m, k) => { const u = ((t * .9 + k / flow.length) % 1); if (u < .7) m.position.set(0, .3 + u / .7 * 4.2, 0); else m.position.copy(hoseC.getPoint((u - .7) / .3)); });
    // spray: on in steps 0, 3, 5, 6
    const spraying = si === 0 || si === 3 || si === 5 || si === 6;
    sprM.opacity = spraying ? .75 : 0;
    const n0 = ex.localToWorld(V(2.8, 2.6, .6)), tgt = V(5.2, 1.1, 1.2);
    spr.forEach(([m, o, a, b]) => { const u = (t * 1.4 + o) % 1; m.position.lerpVectors(n0, tgt, u); m.position.x += a * u * 1.4; m.position.y += b * u * 1.0 + Math.sin(u * 3.1) * .5; m.position.z += a * u; m.scale.setScalar(.5 + u * 1.8); });
    // fire: shrinks when smothered (step 5 and 6)
    const out = si === 5 ? ss(.6, 3.0, lt) : si === 6 ? 1 : 0;
    flames.forEach(([m, ph], k) => { const f = 1 + .18 * Math.sin(t * 9 + ph); m.scale.set(1 - out * .95, (f) * (1 - out * .97), 1 - out * .95); m.material.opacity = .85 * (1 - out); });
    powCoat.material.opacity = out * .95;
    // triangle: oxygen side drops out late in step 4, flame dies
    const br = si === 4 ? ss(2.2, 3.2, lt) : 0;
    sides.forEach(([s, p], k) => { s.position.copy(p); if (k === 2) { s.position.x -= br * 1.6; s.position.y -= br * .8; s.rotation.z = Math.atan2(pts[0].y - pts[2].y, pts[0].x - pts[2].x) + br * .6; } });
    triM.forEach(m => m.emissiveIntensity = .4 + .3 * pulse);
    triFlame.scale.setScalar(Math.max(.02, (1 - br) * (1 + .12 * Math.sin(t * 9))));
    // camera
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const far = Math.abs(prev[1][0] - now[1][0]) > 8;
    const kk = si === 0 ? 1 : ease(lt / (far ? 1.1 : 1.4));
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], kk))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], kk)));
    const o = Math.sin(t * .2) * .1, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o));
    camera.lookAt(cp.q);
  }
  return { update };
}
