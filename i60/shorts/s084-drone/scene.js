// Inside 60 — Drone (quadcopter). Steps: 0 hook hover, 1 lift (air pushed down), 2 opposite spin cancels torque,
// 3 back props faster -> tilt + fly forward, 4 diagonal pair faster -> yaw, 5 flight controller + gyro, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x14203a); scene.fog = new THREE.Fog(0x14203a, 30, 80);
  scene.add(new THREE.HemisphereLight(0xf4f8ff, 0x404050, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(6, 10, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0x90c0ff, .6); rim.position.set(-6, 4, -8); scene.add(rim);

  const GY = -3.2;
  const ground = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, .2, 48), Mat({ color: 0x3a6a4a, shininess: 5 })); ground.position.y = GY - .1; scene.add(ground);
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, .05, 40), Mat({ color: 0x404858 })); pad.position.y = GY + .01; scene.add(pad);
  const ringH = new THREE.Mesh(new THREE.TorusGeometry(1.4, .06, 8, 40), new THREE.MeshBasicMaterial({ color: 0xffd040 })); ringH.rotation.x = Math.PI / 2; ringH.position.y = GY + .05; scene.add(ringH);

  const drone = new THREE.Group(); scene.add(drone);
  const tiltG = new THREE.Group(); drone.add(tiltG);
  const bodyM = Mat({ color: 0xf0f2f6 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(.7, 28, 16), bodyM); body.scale.set(1.2, .5, 1.2); tiltG.add(body);
  const topM = Mat({ color: 0xff8a20 });
  const top = new THREE.Mesh(new THREE.SphereGeometry(.45, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), topM); top.position.y = .2; tiltG.add(top);
  // front marker (camera eye) at +x
  const eye = new THREE.Mesh(new THREE.SphereGeometry(.18, 16, 12), Mat({ color: 0x202430, shininess: 140 })); eye.position.set(.82, -.05, 0); tiltG.add(eye);
  const armM = Mat({ color: 0x2b2f36, shininess: 30 });
  const R = 1.9;
  // motor layout: 0 front-left, 1 front-right, 2 back-right, 3 back-left; dir: +1 CW, -1 CCW (diagonals same)
  const pos = [[1, 1], [1, -1], [-1, -1], [-1, 1]].map(([x, z]) => [x * R / Math.SQRT2, z * R / Math.SQRT2]);
  const dirs = [1, -1, 1, -1];
  const cwCol = 0x40d0ff, ccwCol = 0xff5a7a;
  const motors = pos.map(([x, z], i) => {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(R, .12, .16), armM); arm.position.set(x / 2, 0, z / 2); arm.rotation.y = -Math.atan2(z, x); tiltG.add(arm);
    const mM = Mat({ color: 0x505866, emissive: 0x000000 });
    const m = new THREE.Mesh(new THREE.CylinderGeometry(.2, .22, .35, 18), mM); m.position.set(x, .12, z); tiltG.add(m);
    const prop = new THREE.Group(); prop.position.set(x, .34, z); tiltG.add(prop);
    const bM = Mat({ color: dirs[i] > 0 ? cwCol : ccwCol, emissive: dirs[i] > 0 ? cwCol : ccwCol, emissiveIntensity: .15 });
    [0, Math.PI].forEach(a => { const b = new THREE.Mesh(new THREE.BoxGeometry(.75, .03, .14), bM); b.position.x = Math.cos(a) * .38; b.position.z = Math.sin(a) * .38; b.rotation.y = -a; b.rotation.x = .25; prop.add(b); });
    const discM = new THREE.MeshBasicMaterial({ color: dirs[i] > 0 ? cwCol : ccwCol, transparent: true, opacity: .25, depthWrite: false, side: THREE.DoubleSide });
    const disc = new THREE.Mesh(new THREE.CircleGeometry(.8, 32), discM); disc.rotation.x = -Math.PI / 2; disc.position.set(x, .35, z); tiltG.add(disc);
    // spin-direction arrow ring
    const arc = new THREE.Mesh(new THREE.TorusGeometry(1.0, .04, 6, 30, Math.PI * 1.4), new THREE.MeshBasicMaterial({ color: dirs[i] > 0 ? cwCol : ccwCol }));
    arc.rotation.x = Math.PI / 2; arc.position.set(x, .45, z); tiltG.add(arc);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(.12, .3, 12), arc.material); arc.add(tip);
    const ta = Math.PI * 1.4; tip.position.set(Math.cos(ta), Math.sin(ta), 0); tip.rotation.z = ta + (dirs[i] > 0 ? Math.PI : 0);
    // airflow streaks under each prop
    const flow = []; for (let k = 0; k < 6; k++) { const s = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .6, 6), new THREE.MeshBasicMaterial({ color: 0xbfe8ff, transparent: true, opacity: .8 })); const a = k / 6 * Math.PI * 2; s.userData = { ox: x + Math.cos(a) * .45, oz: z + Math.sin(a) * .45, ph: k / 6 }; tiltG.add(s); flow.push(s); }
    return { prop, mM, bM, disc, discM, arc, flow, speed: 1 };
  });
  // legs
  [-1, 1].forEach(s => { const l = new THREE.Mesh(new THREE.BoxGeometry(1.2, .06, .08), armM); l.position.set(0, -.55, s * .55); tiltG.add(l); [-.4, .4].forEach(x => { const p = new THREE.Mesh(new THREE.BoxGeometry(.06, .4, .06), armM); p.position.set(x, -.35, s * .55); tiltG.add(p); }); });

  // big arrows (world space)
  function arrow(color, len, rad) {
    const g = new THREE.Group(); const m = new THREE.MeshBasicMaterial({ color });
    const sh = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, len, 12), m); sh.position.y = len / 2; g.add(sh);
    const hd = new THREE.Mesh(new THREE.ConeGeometry(rad * 2.4, rad * 4, 16), m); hd.position.y = len + rad * 2; g.add(hd);
    scene.add(g); return g;
  }
  const thrustA = arrow(0x50ff90, 1.6, .1);
  const weightA = arrow(0xff7050, 1.3, .1); weightA.rotation.z = Math.PI;
  const fwdA = arrow(0xffe040, 1.6, .1); fwdA.rotation.z = -Math.PI / 2;
  const yawRing = new THREE.Mesh(new THREE.TorusGeometry(3.0, .07, 8, 48, Math.PI * 1.5), new THREE.MeshBasicMaterial({ color: 0xffe040 })); yawRing.rotation.x = Math.PI / 2; scene.add(yawRing);
  const yawTip = new THREE.Mesh(new THREE.ConeGeometry(.22, .5, 14), yawRing.material); yawRing.add(yawTip); yawTip.position.set(Math.cos(Math.PI * 1.5) * 3, Math.sin(Math.PI * 1.5) * 3, 0); yawTip.rotation.z = Math.PI * 1.5 + Math.PI;

  // flight controller board + gyro (inside body, revealed in step 5)
  const fc = new THREE.Group(); tiltG.add(fc); fc.position.y = .05;
  const board = new THREE.Mesh(new THREE.BoxGeometry(.9, .05, .9), Mat({ color: 0x20a060, emissive: 0x20ff80, emissiveIntensity: 0 })); fc.add(board);
  const chip = new THREE.Mesh(new THREE.BoxGeometry(.3, .08, .3), Mat({ color: 0x15181e, emissive: 0x40e0ff, emissiveIntensity: 0 })); chip.position.set(.15, .06, .1); fc.add(chip);
  const gyro = new THREE.Group(); gyro.position.set(-.2, .25, -.15); fc.add(gyro);
  const gM = new THREE.MeshBasicMaterial({ color: 0xffd040 });
  const g1 = new THREE.Mesh(new THREE.TorusGeometry(.2, .02, 6, 24), gM), g2 = g1.clone(), g3 = new THREE.Mesh(new THREE.SphereGeometry(.07, 12, 8), gM);
  g2.rotation.y = Math.PI / 2; gyro.add(g1, g2, g3);
  const pulses = pos.map(() => { const s = new THREE.Mesh(new THREE.SphereGeometry(.09, 10, 8), new THREE.MeshBasicMaterial({ color: 0x40e0ff })); tiltG.add(s); return s; });

  const shots = [
    [[7, 3, 14], [0, .2, 0]],       // 0 hover overview
    [[10, 1.5, 9.5], [0, .8, 0]],   // 1 lift: side view
    [[.5, 14, 4], [0, .6, 0]],      // 2 top view spins
    [[2, 3, 15], [2, .6, 0]],       // 3 side: tilt forward (+x)
    [[3, 13, 9], [0, .6, 0]],       // 4 yaw from above
    [[4, 3.5, 6.5], [0, .6, 0]],    // 5 close-up FC
    [[8, 4, 15], [0, .6, 0]],       // 6 recap
  ];
  const cp = { p: V(), q: V() };
  const ang = pos.map(() => 0); let lastT = 0, yaw = 0, fx = 0;
  function update(t, si, lt, sd) {
    const dt = Math.min(.1, Math.max(0, t - lastT)); lastT = t;
    const pulse = .5 + .5 * Math.sin(t * 7);
    // motor speeds
    const sp = [1, 1, 1, 1];
    if (si === 1) { const k = ease(lt / 2); for (let i = 0; i < 4; i++) sp[i] = 1 + .35 * k; }
    if (si === 3) { const k = ease((lt - .3) / 1); sp[2] = sp[3] = 1 + .5 * k; sp[0] = sp[1] = 1 - .1 * k; }
    if (si === 4) { const k = ease((lt - .3) / 1); sp[0] = sp[2] = 1 + .5 * k; sp[1] = sp[3] = 1 - .2 * k; }
    // body motion
    let y = 0, tilt = 0;
    if (si === 0) y = -2.4 + 2.4 * ease(lt / 2.5);
    else if (si === 1) y = .6 * ease(lt / 2.5);
    else y = .6;
    y += Math.sin(t * 1.6) * .06;
    if (si === 3) { tilt = -.3 * ease((lt - .3) / 1); fx = 4 * ease((lt - .8) / Math.max(1, sd - 1.2)); }
    else if (si === 4) { fx = 4 * (1 - ease(lt / 1.5)); }
    else if (si > 4) fx = 0; else fx = si === 3 ? fx : 0;
    if (si === 4) yaw = Math.PI * 1.2 * ease((lt - .6) / Math.max(1, sd - 1));
    else if (si === 5) yaw = Math.PI * 1.2 * (1 - ease(lt / 1.2));
    else yaw = 0;
    drone.position.set(fx, y, 0); drone.rotation.y = yaw; tiltG.rotation.z = tilt;
    if (si === 5) { tiltG.rotation.x = Math.sin(t * 3) * .06 * (1 - ease(lt / 3)); tiltG.rotation.z = Math.sin(t * 2.3) * .06 * (1 - ease(lt / 3)); } else tiltG.rotation.x = 0;
    // props
    motors.forEach((m, i) => {
      ang[i] += dirs[i] * -sp[i] * 28 * dt; m.prop.rotation.y = ang[i];
      m.discM.opacity = .12 + .25 * (sp[i] - .8);
      const hot = sp[i] > 1.2 && (si === 3 || si === 4);
      m.mM.emissive.setHex(0xffb030); m.mM.emissiveIntensity = hot ? .5 + .4 * pulse : 0;
      m.bM.emissiveIntensity = hot ? .6 : .15;
      m.disc.scale.setScalar(hot ? 1.1 + .05 * pulse : 1);
      m.arc.visible = si === 2 || si === 4; m.arc.rotation.z = -dirs[i] * t * 2;
      m.flow.forEach(s => { s.visible = si === 1 || si === 0 || si === 6 || (hot); const ph = (t * 1.6 * sp[i] + s.userData.ph) % 1; s.position.set(s.userData.ox, -.1 - ph * 2.2, s.userData.oz); s.material.opacity = .85 * (1 - ph); });
    });
    // arrows
    thrustA.visible = si === 1; thrustA.position.set(0, y + 1.0, 0); thrustA.scale.setScalar(1 + .4 * ease(lt / 2));
    weightA.visible = si === 1; weightA.position.set(0, y - .9, 0);
    fwdA.visible = si === 3 && lt > .8; fwdA.position.set(fx + 1.4, y + 1.3, 0);
    yawRing.visible = si === 4 && lt > .5; yawRing.position.set(fx, y + .2, 0); yawRing.rotation.z = -t * .8;
    // FC
    const fcOn = si === 5;
    body.material.transparent = top.material.transparent = true;
    body.material.opacity = top.material.opacity = fcOn ? 1 - .75 * ease(lt / 1) : 1;
    board.material.emissiveIntensity = fcOn ? .3 + .2 * pulse : 0; chip.material.emissiveIntensity = fcOn ? .5 + .4 * pulse : 0;
    gyro.visible = fcOn; gyro.rotation.y = t * 3; g1.rotation.x = t * 4;
    pulses.forEach((p, i) => { p.visible = fcOn && lt > 1; const k = (t * 2.5 + i * .25) % 1; p.position.set(pos[i][0] * k, .15, pos[i][1] * k); });
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
