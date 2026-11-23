// Inside 60 — Impact wrench. Steps: 0 hook (whole tool + wheel nut), 1 motor spins hammer, 2 wind-up,
// 3 strike anvil, 4 ramp + spring repeat, 5 little reaction torque, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const X = g => g.rotateZ(-Math.PI / 2);
  scene.background = new THREE.Color(0x1b1f2e); scene.fog = new THREE.Fog(0x1b1f2e, 30, 80);
  scene.add(new THREE.HemisphereLight(0xfff8f0, 0x303040, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 1.2); key.position.set(5, 9, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0x80c0ff, .5); rim.position.set(-6, 4, -8); scene.add(rim);
  const root = new THREE.Group(); scene.add(root); root.position.set(-1.0, .6, 0);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(16, 48), Mat({ color: 0x2c3440, shininess: 5 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -4.6; root.add(floor);

  // housing (cutaway)
  const shellM = Mat({ color: 0xff7a20, transparent: true, opacity: .25, side: THREE.DoubleSide, depthWrite: false });
  const barrel = new THREE.Mesh(X(new THREE.CylinderGeometry(.85, .85, 3.6, 32, 1, true)), shellM); barrel.position.x = -1.0; root.add(barrel);
  const nose = new THREE.Mesh(X(new THREE.CylinderGeometry(.55, .85, .8, 32, 1, true)), shellM); nose.position.x = 1.2; root.add(nose);
  const grip = new THREE.Mesh(RoundedBox(THREE, .9, 2.4, .95, .3), Mat({ color: 0xff7a20 })); grip.position.set(-1.9, -1.9, 0); grip.rotation.z = -.18; root.add(grip);
  const gripRub = new THREE.Mesh(RoundedBox(THREE, .55, 2.0, 1.0, .2), Mat({ color: 0x202428 })); gripRub.position.set(-2.15, -1.9, 0); gripRub.rotation.z = -.18; root.add(gripRub);
  const bat = new THREE.Mesh(RoundedBox(THREE, 2.0, .85, 1.35, .2), Mat({ color: 0x303438 })); bat.position.set(-1.9, -3.4, 0); root.add(bat);
  const trigM = Mat({ color: 0x303438, emissive: 0xffc020, emissiveIntensity: 0 });
  const trig = new THREE.Mesh(RoundedBox(THREE, .35, .55, .4, .1), trigM); trig.position.set(-1.3, -1.2, 0); root.add(trig);

  // motor x -2.6..-1.4
  const coilM = Mat({ color: 0xc87533, emissive: 0xff6010, emissiveIntensity: 0, shininess: 140 });
  const rotor = new THREE.Group(); rotor.position.x = -2.0; root.add(rotor);
  for (let k = 0; k < 6; k++) { const c = new THREE.Mesh(new THREE.BoxGeometry(1.1, .22, .3), coilM); const a = k / 6 * Math.PI * 2; c.position.set(0, Math.cos(a) * .35, Math.sin(a) * .35); c.rotation.x = a; rotor.add(c); }
  rotor.add(new THREE.Mesh(X(new THREE.CylinderGeometry(.08, .08, 2.4, 10)), Mat({ color: 0xd0d8e0 })));
  const stator = new THREE.Mesh(X(new THREE.CylinderGeometry(.68, .68, 1.2, 28, 1, true)), Mat({ color: 0x506070, transparent: true, opacity: .5, depthWrite: false })); stator.position.x = -2.0; root.add(stator);

  // hammer (heavy block with two lugs) x ~ -.4
  const hamM = Mat({ color: 0x9aa4ae, emissive: 0xff5020, emissiveIntensity: 0, shininess: 160 });
  const hammer = new THREE.Group(); root.add(hammer);
  hammer.add(new THREE.Mesh(X(new THREE.CylinderGeometry(.62, .62, .8, 32)), hamM));
  for (let k = 0; k < 2; k++) { const lug = new THREE.Mesh(new THREE.BoxGeometry(.35, .3, .28), hamM); const a = k * Math.PI; lug.position.set(.55, Math.cos(a) * .42, Math.sin(a) * .42); hammer.add(lug); }
  const ballM = Mat({ color: 0xf0f4f8, emissive: 0x40c0ff, emissiveIntensity: 0, shininess: 200 });
  for (let k = 0; k < 2; k++) { const b = new THREE.Mesh(new THREE.SphereGeometry(.1, 12, 10), ballM); b.position.set(-.1, Math.cos(k * Math.PI + Math.PI / 2) * .14, Math.sin(k * Math.PI + Math.PI / 2) * .14); hammer.add(b); }
  // spring behind hammer
  const springPts = []; for (let k = 0; k <= 80; k++) { const a = k * .5; springPts.push(V(k / 80, Math.cos(a) * .32, Math.sin(a) * .32)); }
  const springM = Mat({ color: 0x40c0ff, emissive: 0x2080ff, emissiveIntensity: 0 });
  const spring = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(springPts), 160, .04, 6), springM); root.add(spring);
  // ramp (cam groove) shown as a glowing V on the shaft
  const rampM = new THREE.MeshBasicMaterial({ color: 0xffe040, transparent: true, opacity: 0 });
  const rampPts = []; for (let k = 0; k <= 40; k++) { const a = k / 40 * Math.PI * 2; rampPts.push(V(-.5 + .25 * Math.abs(Math.sin(a)), Math.cos(a) * .1, Math.sin(a) * .1)); }
  const ramp = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rampPts, true), 80, .025, 6), rampM); root.add(ramp);

  // anvil (output shaft with two jaws) + square drive + socket
  const anvM = Mat({ color: 0xffd040, emissive: 0xffa000, emissiveIntensity: 0, shininess: 150 });
  const anvil = new THREE.Group(); anvil.position.x = .45; root.add(anvil);
  anvil.add(new THREE.Mesh(X(new THREE.CylinderGeometry(.2, .2, 1.6, 16)), anvM).translateX(.6));
  for (let k = 0; k < 2; k++) { const j = new THREE.Mesh(new THREE.BoxGeometry(.3, .32, .26), anvM); const a = k * Math.PI + Math.PI / 2; j.position.set(0, Math.cos(a) * .42, Math.sin(a) * .42); anvil.add(j); }
  const drive = new THREE.Mesh(new THREE.BoxGeometry(.4, .3, .3), anvM); drive.position.x = 1.5; anvil.add(drive);
  const sockM = Mat({ color: 0xc8d0d8, shininess: 200 });
  const socket = new THREE.Mesh(X(new THREE.CylinderGeometry(.42, .42, .9, 6)), sockM); socket.position.x = 1.95; anvil.add(socket);
  // wheel hub + lug nut
  const hub = new THREE.Group(); hub.position.x = 3.2; root.add(hub);
  const hubM = Mat({ color: 0x404850, shininess: 40 });
  hub.add(new THREE.Mesh(X(new THREE.CylinderGeometry(2.4, 2.4, .3, 48)), hubM).translateX(.35));
  const tire = new THREE.Mesh(new THREE.TorusGeometry(2.6, .55, 16, 48), Mat({ color: 0x1a1a1c, shininess: 10 })); tire.rotation.y = Math.PI / 2; tire.position.x = .35; hub.add(tire);
  const nutG = new THREE.Group(); hub.add(nutG);
  const nutM = Mat({ color: 0xe0e4e8, emissive: 0xff4060, emissiveIntensity: 0, shininess: 200 });
  nutG.add(new THREE.Mesh(X(new THREE.CylinderGeometry(.36, .36, .4, 6)), nutM));
  for (let k = 1; k < 5; k++) { const n = new THREE.Mesh(X(new THREE.CylinderGeometry(.3, .3, .35, 6)), Mat({ color: 0xb0b8c0 })); const a = k / 5 * Math.PI * 2; n.position.set(0, Math.cos(a) * 1.3, Math.sin(a) * 1.3); hub.add(n); }
  // impact flash
  const flashM = new THREE.MeshBasicMaterial({ color: 0xfff0a0, transparent: true, opacity: 0, depthWrite: false });
  const flash = new THREE.Mesh(new THREE.SphereGeometry(.35, 16, 12), flashM); flash.position.set(.3, .42, 0); root.add(flash);
  // reaction-torque arrows around the grip (step 5)
  const arrM = new THREE.MeshBasicMaterial({ color: 0x40ff80, transparent: true, opacity: 0 });
  const arrow = new THREE.Mesh(new THREE.TorusGeometry(1.4, .07, 8, 40, Math.PI * 1.2), arrM); arrow.rotation.y = Math.PI / 2; arrow.position.set(-1.9, -1.6, 0); root.add(arrow);
  const arrHead = new THREE.Mesh(new THREE.ConeGeometry(.2, .45, 12), arrM); root.add(arrHead);
  const bigArrM = new THREE.MeshBasicMaterial({ color: 0xff4040, transparent: true, opacity: 0 });
  const bigArrow = new THREE.Mesh(new THREE.TorusGeometry(1.0, .12, 8, 40, Math.PI * 1.5), bigArrM); bigArrow.rotation.y = Math.PI / 2; bigArrow.position.set(2.6, 0, 0); root.add(bigArrow);

  const shots = [
    [[-9.5, 5.0, 15.5], [.6, -1.0, 0]],   // 0 whole tool + wheel
    [[-1.6, 2.0, 8.5], [-1.2, -.3, 0]],     // 1 motor + hammer
    [[.4, 1.8, 7.5], [-.3, 0, 0]],       // 2 hammer
    [[1.6, 1.6, 7.0], [.4, 0, 0]],       // 3 strike
    [[-.8, 3.2, 7.0], [-.4, 0, 0]],      // 4 ramp + spring
    [[-7.5, .6, 10.5], [-1.2, -1.4, 0]],  // 5 grip / arm
    [[-9.5, 5.0, 15.5], [.6, -1.0, 0]],   // 6 recap
  ];
  const cp = { p: V(), q: V() };
  let hA = 0, aA = 0, lastT = 0, lastHalf = 0, fl = 0;
  function update(t, si, lt) {
    const dt = Math.min(.05, Math.max(0, t - lastT)); lastT = t;
    const pulse = .5 + .5 * Math.sin(t * 7);
    trig.position.x = -1.3 - (si === 0 ? 0 : .15); trigM.emissiveIntensity = si === 1 ? .5 + .4 * pulse : 0;
    // hammer speed: slow-mo in close-ups so the strikes are readable
    const w = si === 0 || si === 6 ? 14 : si === 1 ? 2 + 4 * ease(lt / 2) : si === 5 ? 12 : 4.5;
    hA += dt * w; rotor.rotation.x = hA * 1.0;
    coilM.emissiveIntensity = si <= 1 ? .3 + .3 * pulse : 0;
    const half = Math.floor(hA / Math.PI), ph = (hA % Math.PI) / Math.PI;
    if (half !== lastHalf) { lastHalf = half; fl = 1; aA += .12; }
    fl = Math.max(0, fl - dt * 4);
    // axial: ramp pushes hammer back before each blow, spring snaps it forward
    const back = ph < .8 ? .28 * ease(ph / .8) : .28 * (1 - (ph - .8) / .2);
    hammer.position.x = -.3 - back; hammer.rotation.x = hA;
    spring.position.x = -1.4; spring.scale.x = .7 - back * .9;
    anvil.rotation.x = aA; nutG.rotation.x = aA; nutG.position.x = -.05 - Math.min(.6, aA * .01);
    hamM.emissiveIntensity = (si === 2 ? .2 + .5 * ph : 0) + (si >= 2 && si <= 4 ? fl * .6 : 0);
    anvM.emissiveIntensity = si === 3 || si === 4 ? .15 + fl * .8 : 0;
    flashM.opacity = (si >= 3 && si <= 4) || si === 0 || si === 6 ? fl * .9 : 0;
    flash.position.set(.3, Math.cos(hA) * .42, Math.sin(hA) * .42); flash.scale.setScalar(.6 + fl);
    rampM.opacity = si === 4 ? .9 : 0; ballM.emissiveIntensity = si === 4 ? .6 + .3 * pulse : 0;
    ramp.position.x = hammer.position.x + .35; ramp.rotation.x = 0;
    springM.emissiveIntensity = si === 4 ? .5 + .4 * pulse : 0;
    nutM.emissiveIntensity = si === 0 ? .3 + .3 * pulse : 0;
    shellM.opacity = si >= 1 && si <= 4 ? .1 : .3;
    // reaction torque: tiny green arrow on grip vs big red arrow on nut
    const show5 = si === 5 ? ease(lt / 1) : 0;
    arrM.opacity = show5 * .9; bigArrM.opacity = show5 * (.5 + .5 * fl);
    arrow.scale.setScalar(.6 + .05 * pulse); arrHead.position.set(-1.9, -1.6 + .49, .2); arrHead.scale.setScalar(.4); arrHead.rotation.x = Math.PI / 2;
    bigArrow.rotation.x = aA;
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
