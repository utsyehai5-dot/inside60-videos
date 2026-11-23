// Inside 60 — Angle grinder. Steps: 0 hook (grinder on steel bar + sparks), 1 motor along handle, 2 bevel gears 90°,
// 3 disc types, 4 sparks, 5 guard + rated RPM, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const X = g => g.rotateZ(-Math.PI / 2);
  scene.background = new THREE.Color(0x181c2a); scene.fog = new THREE.Fog(0x181c2a, 30, 80);
  scene.add(new THREE.HemisphereLight(0xfff8f0, 0x303040, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 1.2); key.position.set(5, 9, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0x80c0ff, .5); rim.position.set(-6, 4, -8); scene.add(rim);
  const root = new THREE.Group(); scene.add(root); root.position.set(-.6, .5, 0);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(16, 48), Mat({ color: 0x2c3440, shininess: 5 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -4; root.add(floor);
  // steel bar on a bench, along z, under the disc
  const bench = new THREE.Mesh(new THREE.BoxGeometry(4, .3, 4), Mat({ color: 0x506070 })); bench.position.set(2.2, -2.15, 0); root.add(bench);
  const barM = Mat({ color: 0x8890a0, emissive: 0xff5010, emissiveIntensity: 0, shininess: 150 });
  const bar = new THREE.Mesh(new THREE.BoxGeometry(.6, .6, 3.6), barM); bar.position.set(2.2, -1.7, 0); root.add(bar);
  const glowM = new THREE.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: 0 });
  const glow = new THREE.Mesh(new THREE.BoxGeometry(.12, .62, .62), glowM); glow.position.set(2.2, -1.7, 0); root.add(glow);

  // grinder: body along x (handle -3..0), head at x 0.2..1, disc spindle vertical at x = 2.2? keep head at x 1.6
  const g = new THREE.Group(); root.add(g);
  const shellM = Mat({ color: 0x20b070, transparent: true, opacity: .25, side: THREE.DoubleSide, depthWrite: false });
  const bodyShell = new THREE.Mesh(X(new THREE.CylinderGeometry(.6, .5, 3.4, 32, 1, true)), shellM); bodyShell.position.x = -.6; g.add(bodyShell);
  const tail = new THREE.Mesh(new THREE.SphereGeometry(.5, 24, 16), Mat({ color: 0x20b070 })); tail.position.x = -2.35; g.add(tail);
  const headM = Mat({ color: 0x707880, transparent: true, opacity: .35, depthWrite: false, side: THREE.DoubleSide });
  const head = new THREE.Mesh(new RoundedBox(THREE, 1.1, .8, 1.0, .2), headM); head.position.set(1.6, 0, 0); g.add(head);
  const side = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, 1.0, 12).rotateX(Math.PI / 2), Mat({ color: 0x202428 })); side.position.set(1.6, .1, -.9); g.add(side);
  // motor
  const coilM = Mat({ color: 0xc87533, emissive: 0xff6010, emissiveIntensity: 0, shininess: 140 });
  const rotor = new THREE.Group(); rotor.position.x = -1.0; g.add(rotor);
  for (let k = 0; k < 6; k++) { const c = new THREE.Mesh(new THREE.BoxGeometry(1.5, .18, .26), coilM); const a = k / 6 * Math.PI * 2; c.position.set(0, Math.cos(a) * .27, Math.sin(a) * .27); c.rotation.x = a; rotor.add(c); }
  const shaftM = Mat({ color: 0xd0d8e0, emissive: 0x40c0ff, emissiveIntensity: 0 });
  const shaft = new THREE.Mesh(X(new THREE.CylinderGeometry(.06, .06, 3.0, 10)), shaftM); shaft.position.x = -.3; rotor.add(shaft); shaft.position.x = .5;
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.5, .04, .04), new THREE.MeshBasicMaterial({ color: 0xffe040 })); stripe.position.y = .4; rotor.add(stripe);
  // bevel gears: pinion on horizontal shaft (axis x), crown on vertical spindle (axis y)
  const bevel = (r1, r2, h, teeth, col, axisX) => {
    const grp = new THREE.Group(); const m = Mat({ color: col, emissive: col, emissiveIntensity: 0, shininess: 160 });
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, 28), m); grp.add(cone);
    for (let k = 0; k < teeth; k++) { const a = k / teeth * Math.PI * 2; const tt = new THREE.Mesh(new THREE.BoxGeometry(.06, h * 1.05, .1), m); const rr = (r1 + r2) / 2 + .02; tt.position.set(Math.cos(a) * rr, 0, Math.sin(a) * rr); tt.rotation.y = -a; tt.rotation.z = Math.atan2(r2 - r1, h) * (axisX ? 1 : 1); grp.add(tt); }
    if (axisX) grp.rotation.z = Math.PI / 2; // cone axis -> x; small end toward +x
    grp.userData.m = m; const outer = new THREE.Group(); outer.add(grp); return outer;
  };
  const pinion = bevel(.12, .26, .22, 10, 0xffd040, true); pinion.position.set(1.32, .15, 0); g.add(pinion);
  const crown = bevel(.5, .3, .2, 22, 0x40c0ff, false); crown.position.set(1.65, .35, 0); g.add(crown);
  // vertical spindle + disc at bottom of head
  const spin = new THREE.Group(); spin.position.set(1.65, 0, 0); g.add(spin);
  spin.add(new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, 1.3, 10), Mat({ color: 0xd0d8e0 })).translateY(-.3));
  const discs = [];
  const mk = (geo, m) => { const d = new THREE.Group(); d.add(new THREE.Mesh(geo, m)); d.position.y = -.9; spin.add(d); discs.push(d); return d; };
  const cutM = Mat({ color: 0x5a5a64, shininess: 30, emissive: 0xffd040, emissiveIntensity: 0 });
  const dCut = mk(new THREE.CylinderGeometry(1.15, 1.15, .03, 48), cutM);
  dCut.add(new THREE.Mesh(new THREE.RingGeometry(.25, .45, 32).rotateX(-Math.PI / 2).translate(0, .02, 0), new THREE.MeshBasicMaterial({ color: 0x3060ff })));
  const grM = Mat({ color: 0x8a7a6a, shininess: 10, emissive: 0xffd040, emissiveIntensity: 0 });
  const dGr = mk(new THREE.CylinderGeometry(1.1, 1.1, .2, 48), grM);
  const wbM = Mat({ color: 0xc0a060, shininess: 160, emissive: 0xffd040, emissiveIntensity: 0 });
  const dWb = mk(new THREE.CylinderGeometry(.2, .2, .2, 16), wbM);
  for (let k = 0; k < 60; k++) { const a = k / 60 * Math.PI * 2; const w = new THREE.Mesh(new THREE.BoxGeometry(.75, .02, .02), wbM); w.position.set(Math.cos(a) * .55, (k % 3 - 1) * .05, Math.sin(a) * .55); w.rotation.y = -a; dWb.add(w); }
  const blurM = new THREE.MeshBasicMaterial({ color: 0xc8ccd4, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  const blur = new THREE.Mesh(new THREE.RingGeometry(.5, 1.16, 48).rotateX(-Math.PI / 2), blurM); blur.position.y = -.88; spin.add(blur);
  // guard (half shroud on the user's side, -x)
  const guardM = Mat({ color: 0xb8c0c8, side: THREE.DoubleSide, emissive: 0x40ff80, emissiveIntensity: 0, shininess: 140 });
  const guard = new THREE.Group(); guard.position.set(1.65, -.75, 0); g.add(guard);
  guard.add(new THREE.Mesh(new THREE.CylinderGeometry(1.28, 1.28, .3, 40, 1, true, Math.PI, Math.PI), guardM));
  guard.add(new THREE.Mesh(new THREE.RingGeometry(.3, 1.28, 40, 1, Math.PI, Math.PI).rotateX(-Math.PI / 2).translate(0, .15, 0), guardM));
  // 90° indicator arc
  const angM = new THREE.MeshBasicMaterial({ color: 0xffe040, transparent: true, opacity: 0 });
  const ang = new THREE.Mesh(new THREE.TorusGeometry(.45, .03, 6, 24, Math.PI / 2), angM); ang.position.set(1.65, .15, .55); ang.rotation.z = Math.PI; g.add(ang);
  // sparks
  const sparkM = new THREE.MeshBasicMaterial({ color: 0xffb040 });
  const sparks = []; for (let i = 0; i < 70; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(.04, .04, .22), sparkM); root.add(s); sparks.push({ m: s, s: Math.random(), v: V(.6 + Math.random() * 1.6, Math.random() * 1.2, (Math.random() - .5) * 1.6) }); }

  g.position.set(.55, -.48, 0); // disc edge on the bar at x ~ 2.2+... disc center x = 2.2
  const shots = [
    [[-5.0, 4.4, 11.0], [1.2, -.6, 0]],    // 0 hook
    [[-1.24, 2.1, 6.72], [-0.6, -0.3, 0.0]],     // 1 motor
    [[1.9, 1.5, 6.0], [1.6, .2, 0]],       // 2 gears close
    [[5.65, 2.85, 6.75], [2.2, -1.2, 0.0]],     // 3 discs
    [[7.8, 1.2, 7.5], [3.0, -1.2, 0.0]],      // 4 sparks
    [[-4.5, 2.6, 6.9], [1.8, -1.0, 0.0]],    // 5 guard from user side
    [[-5.0, 4.4, 11.0], [1.2, -.6, 0]],     // 6 recap
  ];
  const cp = { p: V(), q: V() };
  let mA = 0, lastT = 0;
  function update(t, si, lt) {
    const dt = Math.min(.05, Math.max(0, t - lastT)); lastT = t;
    const pulse = .5 + .5 * Math.sin(t * 7);
    const w = si === 2 ? 2.2 : si === 1 ? 3 + 25 * ease(lt / 2.5) : si === 3 ? 4 : 30;
    mA += dt * w;
    rotor.rotation.x = mA; pinion.children[0].rotation.y = 0; pinion.rotation.x = mA;
    crown.rotation.y = -mA * (10 / 22); spin.rotation.y = -mA * (10 / 22);
    coilM.emissiveIntensity = si === 1 ? .3 + .3 * pulse : 0; shaftM.emissiveIntensity = si === 1 ? .5 + .3 * pulse : 0;
    pinion.children[0].userData.m.emissiveIntensity = si === 2 ? .4 + .3 * pulse : 0;
    crown.children[0].userData.m.emissiveIntensity = si === 2 ? .4 + .3 * pulse : 0;
    angM.opacity = si === 2 ? ease((lt - 1) / 1) : 0;
    headM.opacity = si === 2 ? .12 : .35; shellM.opacity = si === 1 || si === 2 ? .12 : .3;
    // disc cycling at step 3
    const which = si === 3 ? Math.min(2, Math.floor(lt / 1.6)) : 0;
    discs.forEach((d, i) => { d.visible = i === which; d.children[0].material.emissiveIntensity = si === 3 ? .25 + .2 * pulse : 0; });
    blurM.opacity = w > 15 && which === 0 ? .35 : 0;
    // lift grinder off the bar during disc swap
    const lift = si === 3 ? .8 * Math.sin(Math.min(1, lt / 5.5) * Math.PI) : 0;
    g.position.y = -.48 + lift;
    const grinding = si === 0 || si >= 4;
    barM.emissiveIntensity = grinding ? .15 : 0; glowM.opacity = grinding ? .6 + .3 * pulse : 0;
    guardM.emissiveIntensity = si === 5 ? .35 + .3 * pulse : 0;
    sparks.forEach(s => {
      s.m.visible = grinding && si !== 3;
      s.s = (s.s + dt * 1.6) % 1; const k = s.s;
      s.m.position.set(3.3 + s.v.x * k * 2.5, -1.4 + s.v.y * k * 2 - 3 * k * k, s.v.z * k * 2);
      s.m.lookAt(s.m.position.x + s.v.x, s.m.position.y + s.v.y - 6 * k, s.m.position.z + s.v.z);
      s.m.scale.setScalar(1 - k * .7);
    });
    sparkM.color.setHex(si === 4 ? (pulse > .5 ? 0xffd060 : 0xff9030) : 0xffb040);
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const kk = si === 0 ? 1 : ease(lt / 1.4);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], kk))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], kk)));
    const o = Math.sin(t * .25) * .08, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o));
    camera.lookAt(cp.q);
  }
  return { update };
}
function RoundedBox(THREE, w, h, d, r) {
  const s = new THREE.Shape(); const x = w / 2 - r, y = d / 2 - r;
  s.moveTo(-x, -y); s.lineTo(x, -y); s.lineTo(x, y); s.lineTo(-x, y); s.lineTo(-x, -y);
  const g = new THREE.ExtrudeGeometry(s, { depth: h - 2 * r, bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelSegments: 3 });
  g.rotateX(-Math.PI / 2); g.translate(0, -(h - 2 * r) / 2, 0); return g;
}
