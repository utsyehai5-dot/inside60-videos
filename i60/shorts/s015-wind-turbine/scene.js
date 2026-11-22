// Inside 60 — How a Wind Turbine Works. Steps: 0 hook, 1 blades/lift, 2 slow rotor, 3 gearbox, 4 generator, 5 yaw + pitch control, 6 recap
export async function setup({ THREE, scene, camera }) {
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 50, specular: 0x333333, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const fr = x => x - Math.floor(x);

  scene.background = new THREE.Color(0x1c3656);
  scene.fog = new THREE.Fog(0x1c3656, 30, 70);
  scene.add(new THREE.HemisphereLight(0xeaf2ff, 0x2a4030, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(6, 10, 8); scene.add(key);
  const rim = new THREE.DirectionalLight(0x88ccff, 1.0); rim.position.set(-6, 4, -6); scene.add(rim);
  const mk = (c, r, parent) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, depthWrite: false })); (parent || scene).add(m); return m; };

  // ground + hills
  const ground = new THREE.Mesh(new THREE.CircleGeometry(60, 48), Mat({ color: 0x3f7a4a })); ground.rotation.x = -Math.PI / 2; ground.position.y = -6; scene.add(ground);
  [[-14, -18, 7], [12, -22, 9], [0, -30, 11]].forEach(([x, z, r]) => { const h = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), Mat({ color: 0x356a40 })); h.scale.y = .35; h.position.set(x, -6, z); scene.add(h); });

  // tower
  const white = Mat({ color: 0xf2f4f7, shininess: 70 });
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(.28, .5, 9.3, 28), white); tower.position.y = -1.35; scene.add(tower);
  const sub = new THREE.Mesh(new RoundedBoxGeometry(1.2, .9, .9, 2, .08), Mat({ color: 0x9aa6b6 })); sub.position.set(1.6, -5.55, .6); scene.add(sub);
  const towerPath = new THREE.CatmullRomCurve3([V(0, 3.0, .35), V(0, -1, .45), V(0, -5.4, .55), V(1.0, -5.5, .6)]);
  const sparks = []; for (let i = 0; i < 14; i++) sparks.push(mk(0xffd040, .1));

  // nacelle (yaws)
  const N = new THREE.Group(); N.position.y = 3.3; scene.add(N);
  const houseMat = Mat({ color: 0xf2f4f7, shininess: 80, transparent: true, opacity: 1 });
  const housing = new THREE.Mesh(new RoundedBoxGeometry(1.5, 1.6, 3.0, 3, .3), houseMat); housing.position.z = -.6; N.add(housing);
  // anemometer
  const anem = new THREE.Group(); anem.position.set(0, .95, -1.7); N.add(anem);
  anem.add(new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .4, 6), Mat({ color: 0x555a62 })));
  for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3; const c = new THREE.Mesh(new THREE.SphereGeometry(.08, 10, 6, 0, Math.PI), Mat({ color: 0x404650, side: THREE.DoubleSide })); c.position.set(Math.cos(a) * .25, .2, Math.sin(a) * .25); c.rotation.y = -a; anem.add(c); }
  // internals
  const steel = Mat({ color: 0xa8b2c0, shininess: 100, specular: 0xffffff });
  const lowShaft = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, 1.4, 16), steel); lowShaft.rotation.x = Math.PI / 2; lowShaft.position.set(0, .25, .3); N.add(lowShaft);
  const gear = (r, n, th, col) => { const g = new THREE.Group(); const m = Mat({ color: col, shininess: 90, emissive: col, emissiveIntensity: 0 }); const b = new THREE.Mesh(new THREE.CylinderGeometry(r, r, th, 32), m); b.rotation.x = Math.PI / 2; g.add(b); for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; const tth = new THREE.Mesh(new THREE.BoxGeometry(.09, .1, th), m); tth.position.set(Math.cos(a) * (r + .04), Math.sin(a) * (r + .04), 0); tth.rotation.z = a; g.add(tth); } return { g, m }; };
  const big = gear(.5, 22, .18, 0xe0a030); big.g.position.set(0, .25, -.4); N.add(big.g);
  const small = gear(.15, 7, .18, 0x4aa0ff); small.g.position.set(0, -.42, -.4); N.add(small.g);
  const fastShaft = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 1.2, 12), steel); fastShaft.rotation.x = Math.PI / 2; fastShaft.position.set(0, -.42, -.95); N.add(fastShaft);
  const genMat = Mat({ color: 0x5a6a80, transparent: true, opacity: .35, depthWrite: false });
  const gen = new THREE.Mesh(new THREE.CylinderGeometry(.34, .34, .8, 28, 1, true), genMat); gen.rotation.x = Math.PI / 2; gen.position.set(0, -.42, -1.6); N.add(gen);
  const genR = new THREE.Group(); genR.position.set(0, -.42, -1.6); N.add(genR);
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const m = new THREE.Mesh(new THREE.BoxGeometry(.14, .1, .6), Mat({ color: i % 2 ? 0xe04a4a : 0x3a6aff })); m.position.set(Math.cos(a) * .18, Math.sin(a) * .18, 0); m.rotation.z = a; genR.add(m); }
  const coilMat = Mat({ color: 0xd8823a, emissive: 0xffa040, emissiveIntensity: 0, shininess: 100 });
  for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.TorusGeometry(.33, .035, 8, 28), coilMat); c.position.set(0, -.42, -1.9 + i * .2); N.add(c); }
  const inside = [lowShaft, big.g, small.g, fastShaft, gen, genR];

  // rotor
  const R = new THREE.Group(); R.position.set(0, .25, 1.05); N.add(R);
  const spin = new THREE.Mesh(new THREE.SphereGeometry(.42, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), white); spin.rotation.x = Math.PI / 2; spin.scale.y = 1.5; R.add(spin);
  const bs = new THREE.Shape(); bs.moveTo(-.3, 0); bs.lineTo(.3, 0); bs.quadraticCurveTo(.5, .6, .38, 1.6); bs.lineTo(.12, 4.4); bs.lineTo(-.04, 4.5); bs.lineTo(-.16, 1.6); bs.quadraticCurveTo(-.3, .6, -.3, 0);
  const bladeGeo = new THREE.ExtrudeGeometry(bs, { depth: .08, bevelEnabled: true, bevelThickness: .03, bevelSize: .03, bevelSegments: 2 }); bladeGeo.translate(0, .3, -.04);
  const bladeMat = Mat({ color: 0xf6f7fa, emissive: 0x3a8aff, emissiveIntensity: 0, shininess: 80 });
  const pitchG = [];
  for (let i = 0; i < 3; i++) { const h = new THREE.Group(); h.rotation.z = i * Math.PI * 2 / 3; R.add(h); const p = new THREE.Group(); h.add(p); p.add(new THREE.Mesh(bladeGeo, bladeMat)); pitchG.push(p); }
  // lift arrows on blades (step 1)
  const liftMat = new THREE.MeshBasicMaterial({ color: 0xffe040, transparent: true, opacity: 0, depthWrite: false });
  const lifts = []; for (let i = 0; i < 3; i++) { const a = new THREE.Mesh(new THREE.ConeGeometry(.22, .6, 12), liftMat); R.add(a); lifts.push({ a, i }); }

  // wind streaks
  const windMat = new THREE.MeshBasicMaterial({ color: 0xdff2ff, transparent: true, opacity: 0, depthWrite: false });
  const streakGeo = new THREE.CylinderGeometry(.03, .03, 1.4, 6); streakGeo.rotateX(Math.PI / 2);
  const W = new THREE.Group(); W.position.y = 3.3; scene.add(W);
  const winds = []; for (let i = 0; i < 34; i++) { const m = new THREE.Mesh(streakGeo, windMat); W.add(m); winds.push({ m, x: -4.5 + (i * 2.71 % 9), y: -3.5 + (i * 1.93 % 7.5), o: i / 34 }); }
  const arrowMat = new THREE.MeshBasicMaterial({ color: 0x7ad8ff, transparent: true, opacity: 0, depthWrite: false });
  const windArrow = new THREE.Mesh(new THREE.ConeGeometry(.45, 1.2, 14), arrowMat); windArrow.rotation.x = -Math.PI / 2; windArrow.position.set(0, 2.4, 6); W.add(windArrow);

  const shots = [
    [[0, 3.4, 27], [0, 2.9, 0]],
    [[5.5, 4.0, 11], [0, 2.8, 0]],
    [[-10, 3.5, 22], [0, 3.3, 0]],
    [[3.4, 4.3, -3.0], [0, 3.0, -.7]],
    [[2.6, 3.8, -.6], [0, 2.6, -1.6]],
    [[-11, 6, 20], [0, 3.3, 0]],
    [[0, 3.4, 27], [0, 2.9, 0]],
  ];
  const cp = { p: V(), q: V() };
  let rot = 0, lastT = 0, fast = 0;

  function update(t, si, lt, sd) {
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const k = si === 0 ? 1 : ease(lt / 1.3);
    cp.p.set(...prev[0].map((v, i) => lerp(v, now[0][i], k)));
    cp.q.set(...prev[1].map((v, i) => lerp(v, now[1][i], k)));
    const o = Math.sin(t * .15) * .1;
    camera.position.set(cp.p.x * Math.cos(o) - cp.p.z * Math.sin(o), cp.p.y, cp.p.z * Math.cos(o) + cp.p.x * Math.sin(o));
    camera.lookAt(cp.q);

    const dt = Math.min(.1, Math.max(0, t - lastT)); lastT = t;
    const rs = si === 2 ? .55 : .9; rot += dt * rs; fast += dt * rs * 14;
    R.rotation.z = -rot;
    big.g.rotation.z = -rot; small.g.rotation.z = fast * 0 + rot * (.5 / .15); fastShaft.rotation.y = fast; genR.rotation.z = rot * (.5 / .15);
    lowShaft.rotation.y = rot;
    anem.rotation.y = t * 4;

    // wind direction / yaw
    let wa = 0;
    if (si === 5) wa = .75; else if (si === 6) wa = .75 * (1 - ease(lt / 1.5));
    let yaw = 0;
    if (si === 5) yaw = .75 * ease((lt - 1.2) / 2.2); else if (si === 6) yaw = .75 * (1 - ease(lt / 1.5));
    N.rotation.y = yaw; W.rotation.y = wa;
    const pitch = si === 5 ? .55 * ease((lt - 3.2) / 1.2) : 0;
    pitchG.forEach(p => p.rotation.y = .25 + pitch);

    // x-ray nacelle for 3/4
    const xr = si === 3 ? ease(lt / .9) : si === 4 ? 1 : si === 5 ? 1 - ease(lt / .8) : 0;
    houseMat.opacity = 1 - xr * .82; houseMat.depthWrite = xr < .1;
    inside.forEach(m => m.visible = xr > .02);
    big.m.emissiveIntensity = si === 3 ? .25 + .15 * Math.sin(t * 5) : 0;
    small.m.emissiveIntensity = si === 3 ? .5 + .3 * Math.sin(t * 7) : 0;
    coilMat.emissiveIntensity = si === 4 ? .7 + .4 * Math.sin(t * 12) : 0;
    bladeMat.emissiveIntensity = si === 1 ? .25 + .1 * Math.sin(t * 4) : 0;
    lifts.forEach(({ a, i }) => { const ang = i * Math.PI * 2 / 3; const r = 2.6; a.position.set(-Math.sin(ang) * r - Math.cos(ang) * .6, Math.cos(ang) * r - Math.sin(ang) * .6, .3); a.rotation.z = ang + Math.PI / 2; });
    liftMat.opacity = si === 1 ? ease((lt - .8) / .6) * (.7 + .3 * Math.sin(t * 6)) : 0;

    const windOn = si <= 2 || si >= 5 ? 1 : 0;
    windMat.opacity = windOn * .55;
    winds.forEach(({ m, x, y, o: oo }) => { const u = fr(t * .35 + oo); const z = lerp(12, -8, u); const spread = z < 1.2 ? 1 + (1.2 - z) * .05 : 1; m.position.set(x * spread, y * spread, z); m.scale.setScalar(Math.sin(u * Math.PI) + .01); });
    arrowMat.opacity = si === 5 ? ease(lt / .8) * .9 : 0;

    // electricity down tower
    const el = si === 4 || si === 0 || si === 6 ? 1 : 0;
    sparks.forEach((m, i) => { m.position.copy(towerPath.getPoint(fr(t * .3 + i / 14))); m.material.opacity = el * (si === 4 ? 1 : .8); });
    // when nacelle yaws, sparks start point fine (tower axis)
  }
  return { update };
}
