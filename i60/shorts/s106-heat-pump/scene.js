// Inside 60 — Heat pump. Steps: 0 hook (house + loop), 1 outdoor coil absorbs heat from cold air, 2 compressor makes it hot,
// 3 indoor coil + fan warms room, 4 expansion valve -> icy cold, 5 reversing valve (summer), 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x152238);
  scene.add(new THREE.HemisphereLight(0xf4f8ff, 0x404050, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, .9); key.position.set(4, 7, 10); scene.add(key);
  const root = new THREE.Group(); scene.add(root);
  const GY = -2.4;
  // ground: snow outside (x<0), floor inside (x>0)
  const snow = new THREE.Mesh(new THREE.BoxGeometry(12, .3, 10), Mat({ color: 0xeef4ff, shininess: 10 })); snow.position.set(-6.2, GY - .15, 0); root.add(snow);
  const flr = new THREE.Mesh(new THREE.BoxGeometry(12, .3, 10), Mat({ color: 0x9a7050, shininess: 20 })); flr.position.set(6.2, GY - .15, 0); root.add(flr);
  const wallM = Mat({ color: 0xd8c8b0, shininess: 10 });
  const wall = new THREE.Mesh(new THREE.BoxGeometry(.4, 7, 6), wallM); wall.position.set(0, GY + 3.5, -1); root.add(wall);
  const inner = new THREE.Mesh(new THREE.BoxGeometry(12, 7, .3), Mat({ color: 0xe8b070, shininess: 5 })); inner.position.set(6.2, GY + 3.5, -3.2); root.add(inner);
  // outdoor unit
  const OX = -2.4;
  const ouM = Mat({ color: 0xb8c0c8, transparent: true, opacity: 1, side: THREE.DoubleSide });
  const ou = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.4, 1.2), ouM); ou.position.set(OX, GY + 1.3, 0); root.add(ou);
  const fanG = new THREE.Group(); fanG.position.set(OX, GY + 1.6, .62); root.add(fanG);
  for (let i = 0; i < 4; i++) { const g = new THREE.Group(); g.rotation.z = i * Math.PI / 2; const b = new THREE.Mesh(new THREE.BoxGeometry(.6, .22, .03), Mat({ color: 0x303840 })); b.position.x = .32; b.rotation.x = .4; g.add(b); fanG.add(g); }
  // indoor unit (wall mounted)
  const IX = 2.6, IY = GY + 4.2;
  const iuM = Mat({ color: 0xf4f4f4, transparent: true, opacity: 1, side: THREE.DoubleSide });
  const iu = new THREE.Mesh(new THREE.BoxGeometry(2.6, .9, .8), iuM); iu.position.set(IX, IY, -2.6); root.add(iu);
  // refrigerant loop (heating direction)
  const P = [
    V(OX - .7, GY + .5, -.1), V(OX - .7, GY + 2.2, -.1),            // outdoor coil up
    V(OX + .5, GY + 2.2, -.1), V(OX + .5, GY + 1.0, -.1),            // to compressor
    V(OX + .9, GY + 1.0, -.1), V(.8, GY + 1.0, -.1), V(.8, IY, -2.4), // through wall, up to indoor
    V(IX + 1.0, IY, -2.4), V(IX + 1.0, IY - .25, -2.4), V(IX - 1.0, IY - .25, -2.4), // indoor coil
    V(-.6, IY - .25, -2.4), V(-.6, GY + .3, -.1), V(OX + .3, GY + .3, -.1), // back out, down to expansion valve
    V(OX - .7, GY + .3, -.1), V(OX - .7, GY + .5, -.1),
  ];
  const path = new THREE.CurvePath();
  for (let i = 0; i < P.length - 1; i++) path.add(new THREE.LineCurve3(P[i], P[i + 1]));
  const pipe = new THREE.Mesh(new THREE.TubeGeometry(path, 600, .06, 8, false), Mat({ color: 0xc08050, shininess: 150 })); root.add(pipe);
  // param ranges (by arc length) for segments
  const L = path.getCurveLengths(), TOT = L[L.length - 1];
  const at = i => (i === 0 ? 0 : L[i - 1]) / TOT;
  const U_COIL_OUT = [at(0), at(1)], U_COMP = at(3) + (at(4) - at(3)) * .5, U_IN = [at(7), at(10)], U_EXP = at(12) + (at(13) - at(12)) * .2;
  // coils (fins)
  const coilOutM = Mat({ color: 0x8090a0, emissive: 0x2080ff, emissiveIntensity: 0 });
  for (let i = 0; i < 9; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(.5, .04, .9), coilOutM); f.position.set(OX - .7, GY + .6 + i * .19, -.1); root.add(f); }
  const coilInM = Mat({ color: 0x8090a0, emissive: 0xff4010, emissiveIntensity: 0 });
  for (let i = 0; i < 12; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(.04, .5, .6), coilInM); f.position.set(IX - .9 + i * .17, IY - .12, -2.4); root.add(f); }
  // compressor
  const compM = Mat({ color: 0x404a58, emissive: 0xff3010, emissiveIntensity: 0 });
  const comp = new THREE.Mesh(new THREE.CylinderGeometry(.38, .38, .9, 24), compM); const cpp = path.getPointAt(U_COMP); comp.position.set(cpp.x, cpp.y - .1, cpp.z); root.add(comp);
  // expansion valve
  const expM = Mat({ color: 0xc0a040, emissive: 0x40c0ff, emissiveIntensity: 0, shininess: 150 });
  const exp = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, .5, 16).rotateZ(Math.PI / 2), expM); exp.position.copy(path.getPointAt(U_EXP)); root.add(exp);
  // reversing valve (block near compressor)
  const revM = Mat({ color: 0x806040, emissive: 0xffe040, emissiveIntensity: 0 });
  const rev = new THREE.Mesh(new THREE.BoxGeometry(.5, .28, .28), revM); rev.position.set(OX + .5, GY + 2.2, -.1); root.add(rev);
  // refrigerant particles
  const parts = Array.from({ length: 80 }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(.085, 8, 6), new THREE.MeshBasicMaterial({ color: 0x40a0ff })); m.userData.o = i / 80; root.add(m); return m; });
  const cCold = new THREE.Color(0x3aa0ff), cHot = new THREE.Color(0xff4020), cWarm = new THREE.Color(0xffb040), cIcy = new THREE.Color(0x9ae8ff);
  function tempAt(u) { // 0 icy .. 1 hot (heating mode)
    if (u < U_COIL_OUT[1]) return lerp(.05, .25, (u - U_COIL_OUT[0]) / (U_COIL_OUT[1] - U_COIL_OUT[0]));
    if (u < U_COMP) return .25;
    if (u < U_IN[0]) return 1;
    if (u < U_IN[1]) return lerp(1, .55, (u - U_IN[0]) / (U_IN[1] - U_IN[0]));
    if (u < U_EXP) return .55;
    return .05;
  }
  // heat arrows: outside air -> coil (orange dots), indoor warm air out
  const hM = new THREE.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: .9 });
  const hin = Array.from({ length: 24 }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), hM); m.userData = { o: i / 24, y: GY + .6 + Math.random() * 1.6, z: (Math.random() - .5) * .8 }; root.add(m); return m; });
  const wM = new THREE.MeshBasicMaterial({ color: 0xffa050, transparent: true, opacity: .9 });
  const wout = Array.from({ length: 30 }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(.08, 8, 6), wM); m.userData = { o: i / 30, x: IX + (Math.random() - .5) * 2.2 }; root.add(m); return m; });
  // snowflakes
  const sM = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const flakes = Array.from({ length: 40 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(.04, 6, 4), sM); m.userData = { x: -6 + Math.random() * 5.6, z: -2 + Math.random() * 4, o: Math.random() }; root.add(m); return m; });
  // sun for summer
  const sun = new THREE.Mesh(new THREE.SphereGeometry(.5, 24, 16), new THREE.MeshBasicMaterial({ color: 0xffd040 })); sun.position.set(-3.6, GY + 5.4, -1.5); root.add(sun);

  const shots = [
    [[.3, .4, 20.5], [.2, -.3, -1]],                  // 0 wide
    [[OX - 1.4, GY + 1.6, 4.4], [OX - .3, GY + 1.3, 0]], // 1 outdoor coil
    [[OX + 2.0, GY + 1.8, 3.4], [OX + .5, GY + 1.0, 0]], // 2 compressor
    [[IX + .6, IY + .1, 4.2], [IX, IY - .3, -2.4]],      // 3 indoor unit
    [[OX + 1.4, GY + .9, 4.0], [OX + .3, GY + .3, 0]],   // 4 expansion valve
    [[.3, .6, 20.5], [.2, -.1, -1]],                    // 5 summer wide
    [[.3, .4, 20.5], [.2, -.3, -1]],                  // 6 recap
  ];
  const cp = { p: V(), q: V() };
  let fa = 0, lastT = 0, s = 0, sumK = 0;
  const tmp = new THREE.Color();
  function update(t, si, lt, sd) {
    const dt = Math.min(.05, Math.max(0, t - lastT)); lastT = t;
    const f = Math.min(1, lt / Math.max(.1, sd)), pulse = .5 + .5 * Math.sin(t * 6);
    const summer = si === 5 ? ease((f - .1) / .25) : 0; sumK = summer;
    const dir = si === 5 && f > .22 ? -1 : 1;
    s += dir * dt * .07;
    fa += dt * 10; fanG.rotation.z = fa;
    const cut = si >= 1 && si <= 4; fanG.visible = !cut; ouM.opacity = cut ? .2 : 1; iuM.opacity = si === 3 ? .25 : 1;
    parts.forEach(m => { const u = ((m.userData.o + s) % 1 + 1) % 1; m.position.copy(path.getPointAt(u));
      let T = tempAt(u); if (sumK > .5) T = 1 - T;
      if (T < .3) tmp.copy(cIcy).lerp(cCold, T / .3); else if (T < .6) tmp.copy(cCold).lerp(cWarm, (T - .3) / .3); else tmp.copy(cWarm).lerp(cHot, (T - .6) / .4);
      m.material.color.copy(tmp); });
    coilOutM.emissiveIntensity = si === 1 ? .3 + .3 * pulse : (sumK > .5 ? 0 : .15); coilOutM.emissive.setHex(sumK > .5 ? 0xff4010 : 0x2080ff);
    if (sumK > .5) coilOutM.emissiveIntensity = .5;
    coilInM.emissiveIntensity = si === 3 ? .5 + .3 * pulse : .2; coilInM.emissive.setHex(sumK > .5 ? 0x2080ff : 0xff4010);
    compM.emissiveIntensity = si === 2 ? .35 + .35 * pulse : .1;
    comp.scale.set(1 + (si === 2 ? .04 * Math.sin(t * 30) : 0), 1, 1);
    expM.emissiveIntensity = si === 4 ? .5 + .4 * pulse : 0;
    revM.emissiveIntensity = si === 5 ? .5 + .5 * pulse : 0;
    // outside heat into coil (winter)
    hin.forEach(m => { const u = m.userData, k = (t * .5 + u.o) % 1; m.visible = (si <= 2 || si === 6) && sumK < .5; m.position.set(OX - 2.6 + k * 1.9, u.y, u.z); m.scale.setScalar(1 - k * .5); });
    // warm air from indoor unit (cool blue in summer)
    wM.color.setHex(sumK > .5 ? 0x80d0ff : 0xffa050);
    wout.forEach(m => { const u = m.userData, k = (t * .45 + u.o) % 1; m.visible = si === 0 || si >= 3; m.position.set(u.x, IY - .5 - k * 2.6, -2.1 + k * 2.4); m.scale.setScalar(1 - k * .5); });
    // snow vs sun
    snow.material.color.setHex(sumK > .5 ? 0x70a050 : 0xeef4ff);
    flakes.forEach(m => { const u = m.userData, k = (t * .12 + u.o) % 1; m.visible = sumK < .5; m.position.set(u.x + Math.sin(k * 9) * .2, GY + 6 - k * 6, u.z); });
    sun.visible = sumK > .5; scene.background.setHex(sumK > .5 ? 0x2a4a70 : 0x152238);
    // camera
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const kk = si === 0 ? 1 : ease(lt / 1.4);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], kk))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], kk)));
    const ob = Math.sin(t * .25) * .06, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(ob) - dz * Math.sin(ob), cp.p.y, cp.q.z + dz * Math.cos(ob) + dx * Math.sin(ob));
    camera.lookAt(cp.q);
  }
  return { update };
}
