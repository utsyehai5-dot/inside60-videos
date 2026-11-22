// Inside 60 — How Car Brakes Work. Steps: 0 hook (glowing rotor), 1 pedal + master cylinder, 2 brake lines + fluid, 3 caliper piston, 4 pads squeeze rotor, 5 heat + vented rotor, 6 recap
export async function setup({ THREE, scene, camera }) {
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 50, specular: 0x333333, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const fr = x => x - Math.floor(x);
  const glow = (c, r) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, depthWrite: false })); scene.add(m); return m; };

  scene.background = new THREE.Color(0x15203a);
  scene.fog = new THREE.Fog(0x15203a, 30, 70);
  scene.add(new THREE.HemisphereLight(0xeaf2ff, 0x30302a, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(6, 10, 9); scene.add(key);
  const rim = new THREE.DirectionalLight(0x88ccff, .9); rim.position.set(-7, 5, -6); scene.add(rim);

  // ---- pedal + master cylinder (left, x≈-7) ----
  const PV = V(-7.5, 0, 0);
  const pedal = new THREE.Group(); pedal.position.set(PV.x, PV.y + 2.2, 0); scene.add(pedal);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(.22, 3.0, .22), Mat({ color: 0x8a94a4, shininess: 90 })); arm.position.y = -1.5; pedal.add(arm);
  const pad = new THREE.Mesh(new RoundedBoxGeometry(1.1, .7, .25, 2, .08), Mat({ color: 0x2a2e36 })); pad.position.set(0, -3.0, .15); pedal.add(pad);
  const pivot = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, .5, 16), Mat({ color: 0x5a6270 })); pivot.rotation.x = Math.PI / 2; pedal.add(pivot);
  const mcM = Mat({ color: 0xb8c0cc, transparent: true, opacity: .4, depthWrite: false, side: THREE.DoubleSide });
  const mc = new THREE.Mesh(new THREE.CylinderGeometry(.45, .45, 2.4, 24, 1, true), mcM); mc.rotation.z = Math.PI / 2; mc.position.set(PV.x + 2.6, PV.y + 1.4, 0); scene.add(mc);
  const mcFluid = new THREE.Mesh(new THREE.CylinderGeometry(.4, .4, 1.6, 20), Mat({ color: 0xe0a020, emissive: 0xffa020, emissiveIntensity: .1, transparent: true, opacity: .75 })); mcFluid.rotation.z = Math.PI / 2; scene.add(mcFluid);
  const mcPiston = new THREE.Mesh(new THREE.CylinderGeometry(.4, .4, .3, 20), Mat({ color: 0x5a6270, emissive: 0xffe040, emissiveIntensity: 0 })); mcPiston.rotation.z = Math.PI / 2; scene.add(mcPiston);
  const pushrod = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, 1, 8), Mat({ color: 0x9aa2ae })); pushrod.rotation.z = Math.PI / 2; scene.add(pushrod);
  const res = new THREE.Mesh(new RoundedBoxGeometry(.9, .7, .6, 2, .1), Mat({ color: 0xeeeeee, transparent: true, opacity: .55, depthWrite: false })); res.position.set(PV.x + 2.7, PV.y + 2.3, 0); scene.add(res);

  // ---- wheel brake (right, x≈4) ----
  const W = V(4, 0, 0);
  const tire = new THREE.Mesh(new THREE.TorusGeometry(2.6, .75, 16, 48), Mat({ color: 0x23252b, shininess: 10, transparent: true, opacity: .35, depthWrite: false })); tire.position.set(W.x, W.y, -.9); scene.add(tire);
  const rotor = new THREE.Group(); rotor.position.copy(W); scene.add(rotor);
  const rotorM = Mat({ color: 0xa8acb4, emissive: 0xff3a10, emissiveIntensity: 0, shininess: 110 });
  [-.14, .14].forEach(z => { const d = new THREE.Mesh(new THREE.RingGeometry(.7, 1.9, 48), rotorM); d.position.z = z; rotor.add(d); const d2 = d.clone(); d2.rotation.y = Math.PI; rotor.add(d2); });
  const rimO = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, .28, 48, 1, true), rotorM); rimO.rotation.x = Math.PI / 2; rotor.add(rimO);
  const vanes = []; for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; const v = new THREE.Mesh(new THREE.BoxGeometry(1.1, .06, .24), rotorM); v.position.set(Math.cos(a) * 1.3, Math.sin(a) * 1.3, 0); v.rotation.z = a; rotor.add(v); vanes.push(v); }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(.7, .7, .6, 32), Mat({ color: 0x6a7280 })); hub.rotation.x = Math.PI / 2; hub.position.z = .2; rotor.add(hub);
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; const s = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, .3, 10), Mat({ color: 0xd8dce4 })); s.rotation.x = Math.PI / 2; s.position.set(Math.cos(a) * .42, Math.sin(a) * .42, .55); rotor.add(s); }
  // caliper at top of rotor
  const CP = V(W.x, W.y + 1.45, 0);
  const calM = Mat({ color: 0xd83a3a, transparent: true, opacity: .35, depthWrite: false, emissive: 0xff4040, emissiveIntensity: 0 });
  const calBody = new THREE.Group(); calBody.position.copy(CP); scene.add(calBody);
  [-.62, .62].forEach(z => { const h = new THREE.Mesh(new RoundedBoxGeometry(1.6, .9, .4, 2, .1), calM); h.position.z = z; calBody.add(h); });
  const bridge = new THREE.Mesh(new RoundedBoxGeometry(1.6, .3, 1.6, 2, .1), calM); bridge.position.y = .55; calBody.add(bridge);
  const padM = Mat({ color: 0x4a3a2a, emissive: 0xff5010, emissiveIntensity: 0 });
  const padF = new THREE.Mesh(new RoundedBoxGeometry(1.4, .7, .14, 2, .04), padM); const padB = padF.clone();
  calBody.add(padF); calBody.add(padB);
  const calPiston = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .3, 20), Mat({ color: 0xc0c6d0, emissive: 0xffe040, emissiveIntensity: 0, shininess: 100 })); calPiston.rotation.x = Math.PI / 2; calBody.add(calPiston);

  // brake line
  const line = new THREE.CatmullRomCurve3([V(PV.x + 3.8, PV.y + 1.4, 0), V(-2.5, 1.0, .6), V(0, -.4, .9), V(2.2, 1.8, 1.2), V(CP.x - .4, CP.y + .9, .7), V(CP.x, CP.y + .4, .7)]);
  const lineM = Mat({ color: 0x9aa2ae, transparent: true, opacity: .55, depthWrite: false, emissive: 0xffa020, emissiveIntensity: 0 });
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(line, 80, .1, 10), lineM));
  const drops = []; for (let i = 0; i < 26; i++) drops.push({ m: glow(0xffc040, .1), o: i / 26 });
  const heatP = []; for (let i = 0; i < 30; i++) heatP.push({ m: glow(0xff8a30, .12), o: i / 30, a: i * 2.4 });
  const airP = []; for (let i = 0; i < 20; i++) airP.push({ m: glow(0xbfe8ff, .09), o: i / 20, a: i * 1.9 });

  const shots = [
    [[W.x + 6.5, W.y + 3.5, 11], [W.x, W.y + .3, 0]],
    [[PV.x + 3.5, PV.y + 2.0, 14], [PV.x + 1.4, PV.y + .4, 0]],
    [[-1.8, 3.0, 31], [-1.6, .4, 0]],
    [[CP.x + 6.0, CP.y + 2.6, 2.2], [CP.x, CP.y - .1, 0]],
    [[CP.x + 5.2, CP.y + 1.6, 3.4], [CP.x, CP.y - .3, 0]],
    [[W.x + 6.0, W.y + 3.0, 10], [W.x, W.y + .3, 0]],
    [[-1.8, 3.5, 33], [-1.6, .3, 0]],
  ];
  const cp = { p: V(), q: V() };
  let ang = 0, lastT = 0;

  function update(t, si, lt, sd) {
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const k = si === 0 ? 1 : ease(lt / 1.3);
    cp.p.set(...prev[0].map((v, i) => lerp(v, now[0][i], k)));
    cp.q.set(...prev[1].map((v, i) => lerp(v, now[1][i], k)));
    const o = Math.sin(t * .2) * .07;
    const dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o));
    camera.lookAt(cp.q);

    // pedal press amount (0..1)
    const press = si === 1 ? ease((lt - .5) / 1.2) : si >= 2 && si <= 5 ? 1 : si === 0 ? .6 : 0;
    pedal.rotation.z = -press * .35;
    const pushX = press * .7;
    mcPiston.position.set(PV.x + 1.7 + pushX, PV.y + 1.4, 0);
    mcFluid.position.set(PV.x + 2.85 + pushX / 2, PV.y + 1.4, 0); mcFluid.scale.y = (1.6 - pushX) / 1.6;
    pushrod.position.set(PV.x + 1.0 + pushX / 2, PV.y + 1.4, 0); pushrod.scale.y = .9 + pushX * .4;
    mcPiston.material.emissiveIntensity = si === 1 ? .5 : 0;
    mcFluid.material.emissiveIntensity = si === 1 || si === 2 ? .45 : .1;

    // fluid flow along line
    lineM.emissiveIntensity = si === 2 ? .45 + .2 * Math.sin(t * 6) : 0;
    const flowOn = si >= 2 && si <= 5 ? 1 : si === 1 ? ease((lt - 1) / .8) : 0;
    drops.forEach(({ m, o: oo }) => { const u = fr(t * .35 + oo); m.position.copy(line.getPoint(u)); m.material.opacity = flowOn * (si === 2 ? 1 : .5); });

    // caliper squeeze
    const sq = si === 3 ? ease((lt - .5) / 1.4) * .5 : si >= 4 && si <= 5 ? 1 : si === 0 ? .7 : 0;
    const gap = .45 - sq * .22;
    padF.position.set(0, -.15, gap); padB.position.set(0, -.15, -gap);
    calPiston.position.set(0, -.15, gap + .22);
    calPiston.material.emissiveIntensity = si === 3 ? .5 + .2 * Math.sin(t * 6) : 0;
    calM.emissiveIntensity = si === 3 ? .15 : 0;
    padM.emissiveIntensity = si === 4 ? .4 + .2 * Math.sin(t * 10) : si === 5 ? .5 : 0;

    // rotor spin slowing when braking
    const dt = Math.min(.1, Math.max(0, t - lastT)); lastT = t;
    const speed = si === 0 ? 4 : si <= 3 ? 7 : si === 4 ? lerp(7, 2, ease(lt / sd)) : si === 5 ? 2 : 5;
    ang += dt * speed; rotor.rotation.z = -ang;
    const heat = si === 0 ? .9 : si === 4 ? ease((lt - .8) / 2) * .8 : si === 5 ? .9 + .1 * Math.sin(t * 4) : si === 6 ? .3 : 0;
    rotorM.emissiveIntensity = heat * .45; rotorM.color.setHex(heat > .5 ? 0xc89a8a : 0xa8acb4);
    heatP.forEach(({ m, o: oo, a }) => { const u = fr(t * .5 + oo); m.position.set(W.x + Math.cos(a) * 1.6 * (1 + u * .5), W.y + Math.sin(a) * 1.6 + u * 2.2, .3 + u * .6); m.material.opacity = (heat > .4 ? 1 : 0) * Math.sin(u * Math.PI) * .8; });
    airP.forEach(({ m, o: oo, a }) => { const u = fr(t * .7 + oo); const r = .7 + u * 1.8; const aa = a - ang; m.position.set(W.x + Math.cos(aa) * r, W.y + Math.sin(aa) * r, 0); m.material.opacity = si === 5 ? Math.sin(u * Math.PI) : 0; });
  }
  return { update };
}
