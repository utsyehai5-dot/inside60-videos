// Inside 60 — How a Hair Dryer Works. Steps: 0 fan over hot wire, 1 motor+fan, 2 nichrome coil, 3 hot air dries hair, 4 settings, 5 thermal cutoff, 6 recap
export async function setup({ THREE, scene, camera }) {
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 50, specular: 0x333333, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  scene.background = new THREE.Color(0x1a1430);
  scene.fog = new THREE.Fog(0x1a1430, 22, 48);
  scene.add(new THREE.HemisphereLight(0xf0e8ff, 0x302838, 1.4));
  const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(4, 9, 8); scene.add(key);
  const rim = new THREE.DirectionalLight(0xaa99ff, 1.0); rim.position.set(-6, 3, -5); scene.add(rim);

  const M = new THREE.Group(); scene.add(M);
  
  const AX = new THREE.Euler(0, 0, -Math.PI / 2); // cylinders along x
  const alongX = g => g.rotateZ(-Math.PI / 2);

  // body (cutaway)
  const shellMat = Mat({ color: 0xb06cff, transparent: true, opacity: 1, shininess: 80 });
  const barrel = new THREE.Mesh(alongX(new THREE.CylinderGeometry(.78, .82, 3.2, 36, 1, true)), shellMat); barrel.position.set(-.3, 0, 0); M.add(barrel);
  const nozzle = new THREE.Mesh(alongX(new THREE.CylinderGeometry(.5, .78, .8, 36, 1, true)), shellMat); nozzle.position.set(1.7, 0, 0); M.add(nozzle);
  const grille = new THREE.Mesh(alongX(new THREE.CylinderGeometry(.82, .82, .1, 36)), Mat({ color: 0x2a2440, transparent: true, opacity: .85 })); grille.position.set(-1.95, 0, 0); M.add(grille);
  for (let i = 0; i < 5; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(.15 + i * .15, .025, 6, 32).rotateY(Math.PI / 2), Mat({ color: 0x8a80a8 })); r.position.set(-2.02, 0, 0); M.add(r); }
  const handle = new THREE.Mesh(new RoundedBoxGeometry(.7, 2.5, .6, 4, .25), shellMat); handle.position.set(-.85, -1.75, 0); handle.rotation.z = -.18; M.add(handle);
  const cord = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(-.6, -2.95, 0), V(-.4, -3.4, .2), V(-.9, -3.9, .4), V(-1.8, -4.1, .3)]), 30, .06, 8), Mat({ color: 0x222222 })); M.add(cord);
  // switch on the handle
  const swMat = Mat({ color: 0xf2f2f2, emissive: 0x30c0ff, emissiveIntensity: 0 });
  const sw = new THREE.Mesh(new RoundedBoxGeometry(.2, .55, .12, 2, .05), swMat); sw.position.set(-.6, -1.4, .33); sw.rotation.z = -.18; M.add(sw);
  const sw2 = new THREE.Mesh(new RoundedBoxGeometry(.2, .35, .12, 2, .05), swMat); sw2.position.set(-.75, -2.1, .33); sw2.rotation.z = -.18; M.add(sw2);
  const wire = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(-.9, -2.6, 0), V(-.75, -1.6, 0), V(-.6, -.6, 0), V(-.3, -.35, 0)]), 30, .03, 6), Mat({ color: 0xffd23a, emissive: 0xffa000, emissiveIntensity: 0 })); M.add(wire);

  // motor + fan
  const motorMat = Mat({ color: 0xc87533, emissive: 0xff5a00, emissiveIntensity: 0, shininess: 80 });
  const motor = new THREE.Mesh(alongX(new THREE.CylinderGeometry(.26, .26, .5, 20)), motorMat); motor.position.set(-1.3, 0, 0); M.add(motor);
  const fanG = new THREE.Group(); fanG.position.set(-1.7, 0, 0); M.add(fanG);
  const fanMat = Mat({ color: 0xdde6f4, emissive: 0x3aa8ff, emissiveIntensity: 0, shininess: 90 });
  fanG.add(new THREE.Mesh(alongX(new THREE.CylinderGeometry(.12, .12, .2, 12)), fanMat));
  for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.06, .62, .2), fanMat); b.position.y = .36; const p = new THREE.Group(); p.rotation.x = i * Math.PI / 3; b.rotation.y = .5; p.add(b); fanG.add(p); }
  const blur = new THREE.Mesh(alongX(new THREE.CylinderGeometry(.7, .7, .12, 28)), new THREE.MeshBasicMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0, depthWrite: false })); blur.position.copy(fanG.position); M.add(blur);

  // heating element: mica cross + nichrome helix
  const mica = new THREE.Group(); M.add(mica);
  for (let i = 0; i < 2; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, .04), Mat({ color: 0xe8dcc0, transparent: true, opacity: .7 })); p.position.set(.15, 0, 0); p.rotation.x = i * Math.PI / 2; mica.add(p); }
  const coilMat = Mat({ color: 0x8a6a50, emissive: 0xff4a10, emissiveIntensity: 0, shininess: 60 });
  const helix = []; for (let i = 0; i <= 400; i++) { const f = i / 400, a = f * Math.PI * 2 * 26; helix.push(V(lerp(-.9, 1.2, f), Math.cos(a) * .5, Math.sin(a) * .5)); }
  const coil = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(helix), 1600, .035, 6), coilMat); M.add(coil);
  const heatLight = new THREE.PointLight(0xff6a20, 0, 6); heatLight.position.set(.2, 0, .6); M.add(heatLight);
  // thermal cutoff (bimetal disc) on top of the element
  const cutMat = Mat({ color: 0xc0c8d4, emissive: 0xff2a2a, emissiveIntensity: 0, shininess: 90 });
  const cut = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, .08, 20), cutMat); cut.position.set(1.0, .66, 0); M.add(cut);

  // hair tuft + water in front of the nozzle
  const hair = new THREE.Group(); hair.position.set(4.2, 0, 0); M.add(hair);
  const hairMat = Mat({ color: 0x5a3a24, shininess: 30 });
  for (let i = 0; i < 16; i++) { const z = -.6 + (i % 4) * .4, y0 = 1.2 - Math.floor(i / 4) * .12; const pts = []; for (let j = 0; j <= 8; j++) pts.push(V(.12 * Math.sin(j * .8 + i), y0 - j * .3, z + .05 * Math.cos(j + i))); const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, .045, 5), hairMat); m.userData.base = pts; hair.add(m); }
  const mk = (c, r) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, depthWrite: false })); M.add(m); return m; };
  const drops = []; for (let i = 0; i < 18; i++) { const m = mk(0x6ad0ff, .08); drops.push({ m, x: 4.15 + ((i * .37) % .3) - .15, y: 1.0 - (i * .41) % 2.2, z: -.6 + (i * .53) % 1.2 }); }
  const steam = []; for (let i = 0; i < 16; i++) steam.push({ m: mk(0xeef6ff, .13), o: i / 16, z: -.5 + (i * .29) % 1.0 });

  // air particles: in at the back, through fan + coil, out the nozzle
  const airP = []; for (let i = 0; i < 46; i++) airP.push({ m: mk(0x9fe8ff, .07), o: i / 46, r: .15 + (i * .37) % .45, a: i * 2.4 });
  const cCool = new THREE.Color(0x9fe8ff), cHot = new THREE.Color(0xff7a2a);
  function airPos(u, r, a, p) {
    // u 0..1 : x from -4 (behind) to 4.1 (hair)
    const x = lerp(-3.8, 4.1, u);
    let rr = r;
    if (x < -2) rr = r * (1 + (-2 - x) * .9);       // converging into intake
    else if (x > 1.5 && x < 2.1) rr = r * lerp(1, .7, (x - 1.5) / .6);
    else if (x >= 2.1) rr = r * .7 * (1 + (x - 2.1) * .45); // spreading jet
    const spin = x > -1.7 && x < 1.3 ? (x + 1.7) * 1.2 : 0;
    p.set(x, Math.cos(a + spin) * rr, Math.sin(a + spin) * rr);
    return x;
  }

  const shots = [
    [[2.6, 1.6, 19], [.8, -1.4, 0]],
    [[-4.2, 1.6, 4.4], [-2.4, 0, 0]],
    [[.4, 1.8, 6.0], [.1, 0, 0]],
    [[5.4, 1.2, 8.2], [3.7, .1, 0]],
    [[.4, -1.1, 7.6], [-.6, -1.9, 0]],
    [[-.2, 2.6, 6.0], [.7, .5, 0]],
    [[-1.2, 1.6, 19], [.8, -1.4, 0]],
  ];
  const cur = { p: V(), q: V() };
  let fanA = 0, lastT = 0, flow = 0;

  function update(t, si, lt, sd) {
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const k = si === 0 ? 1 : ease(lt / 1.3);
    cur.p.set(...prev[0].map((v, i) => lerp(v, now[0][i], k)));
    cur.q.set(...prev[1].map((v, i) => lerp(v, now[1][i], k)));
    const o = Math.sin(t * .15) * .07;
    camera.position.set(cur.p.x * Math.cos(o) - cur.p.z * Math.sin(o), cur.p.y, cur.p.z * Math.cos(o) + cur.p.x * Math.sin(o));
    camera.lookAt(cur.q);
    const dt = Math.max(0, Math.min(.1, t - lastT)); lastT = t;
    const focus = s => si === s ? 1 : 0;

    const xr = si === 0 ? ease((lt - 2.0) / 1.2) : si === 6 ? 1 - ease((lt - 1.2) / 1.2) * .5 : 1;
    shellMat.opacity = 1 - xr * .8; shellMat.depthWrite = shellMat.opacity > .9;

    const on = si === 0 ? ease((lt - .3) / 1) : 1;
    // settings step: fan speed toggles low/high
    const hi = si === 4 ? (Math.floor(lt / 1.6) % 2 === 0 ? .45 : 1.4) : 1;
    sw.position.y = -1.4 + (si === 4 ? (hi > 1 ? .12 : -.12) : 0);
    swMat.emissiveIntensity = focus(4) * (.6 + .3 * Math.sin(t * 6));
    wire.material.emissiveIntensity = focus(4) * .8 + focus(2) * .5;
    fanA += dt * 14 * on * hi * (si === 1 ? 1.3 : 1); fanG.rotation.x = fanA;
    blur.material.opacity = on * (.12 + focus(1) * .2) * Math.min(1, hi);
    motorMat.emissiveIntensity = .1 + focus(1) * (.5 + .3 * Math.sin(t * 12));
    fanMat.emissiveIntensity = focus(1) * .4;

    // heat: cutoff in step 5 makes it flicker off then on
    let heat = on * (si === 0 ? ease((lt - 1) / 1.5) : 1);
    if (si === 4) heat *= hi > 1 ? 1 : .55;
    let cutGlow = 0;
    if (si === 5) { const c = lt % 3.2; const off = c > 1.4 && c < 2.6; heat *= off ? .1 : 1; cutGlow = off ? 1 : .35; cut.position.y = .66 + (off ? .06 : 0); cut.scale.y = off ? 1.6 : 1; }
    coilMat.emissiveIntensity = heat * (.9 + focus(2) * (.4 + .2 * Math.sin(t * 6)));
    coilMat.color.setHex(heat > .5 ? 0xff7a3a : 0x8a6a50);
    heatLight.intensity = heat * 3;
    cutMat.emissiveIntensity = cutGlow * (.6 + .4 * Math.sin(t * 10));

    // air
    flow += dt * .17 * on * hi;
    const p = V();
    airP.forEach(({ m, o: oo, r, a }) => {
      const u = (flow + oo) % 1; const x = airPos(u, r, a, m.position);
      const h = Math.min(1, Math.max(0, (x + .9) / 2.1)) * heat;
      m.material.color.copy(cCool).lerp(cHot, h);
      m.material.opacity = on * .9 * Math.min(1, u * 6, (1 - u) * 6) * (si === 3 || si === 1 || si === 0 || si === 6 ? 1 : .7);
    });

    // hair: blown by air, water evaporating over time
    const blow = on * (si === 3 ? 1.2 : .7) * Math.min(1.3, hi);
    hair.children.forEach((m, i) => { m.rotation.z = -.08 * blow - .05 * blow * Math.sin(t * 7 + i); });
    const wet = Math.max(0, 1 - Math.max(0, t - 8) / 26);
    drops.forEach(({ m, x, y, z }, i) => { m.position.set(x, y, z); m.material.opacity = (i / drops.length < wet ? .9 : 0) * (si >= 3 || si === 0 ? 1 : .5); });
    const sv = si === 3 ? 1 : si >= 4 ? .4 : 0;
    steam.forEach(({ m, o: oo, z }) => { const u = (t * .3 + oo) % 1; m.position.set(4.2 + u * .9, lerp(-.2, 2.6, u), z); m.material.opacity = sv * wet * (1 - u) * .7; m.scale.setScalar(1 + u); });
  }
  return { update };
}
