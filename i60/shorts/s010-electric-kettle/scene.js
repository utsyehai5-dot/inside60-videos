// Inside 60 — How an Electric Kettle Works. Steps: 0 steam+metal, 1 element, 2 convection, 3 boiling, 4 steam channel, 5 click off, 6 recap
export async function setup({ THREE, scene, camera }) {
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 50, specular: 0x333333, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const V2 = (x, y) => new THREE.Vector2(x, y);

  scene.background = new THREE.Color(0x121c2c);
  scene.fog = new THREE.Fog(0x121c2c, 22, 48);
  scene.add(new THREE.HemisphereLight(0xe8f0ff, 0x283038, 1.4));
  const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(5, 9, 7); scene.add(key);
  const rim = new THREE.DirectionalLight(0x88ccff, 1.0); rim.position.set(-6, 4, -5); scene.add(rim);

  const M = new THREE.Group(); scene.add(M);
  // counter + power base
  const counter = new THREE.Mesh(new RoundedBoxGeometry(8, .3, 6, 3, .1), Mat({ color: 0xe9e2d6, shininess: 30 })); counter.position.set(0, -2.95, 0); M.add(counter);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.65, .3, 40), Mat({ color: 0x2a3040, shininess: 70 })); base.position.set(0, -2.65, 0); M.add(base);
  const ledMat = new THREE.MeshBasicMaterial({ color: 0xff8a2a });
  const led = new THREE.Mesh(new THREE.SphereGeometry(.08, 10, 8), ledMat); led.position.set(.0, -2.62, 1.63); M.add(led);

  // kettle body (glass, lathe)
  const prof = [V2(0, -2.35), V2(1.2, -2.35), V2(1.28, -2.1), V2(1.22, -.5), V2(1.08, .9), V2(1.0, 1.25)];
  const glassMat = Mat({ color: 0xcfeeff, transparent: true, opacity: .32, shininess: 110, specular: 0xffffff, side: THREE.DoubleSide, depthWrite: false });
  const body = new THREE.Mesh(new THREE.LatheGeometry(prof, 48), glassMat); M.add(body);
  const footMat = Mat({ color: 0xdfe4ea, shininess: 90, specular: 0x999999, transparent: true, opacity: 1 });
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(1.28, 1.22, .32, 40), footMat); foot.position.set(0, -2.32, 0); M.add(foot);
  const lid = new THREE.Mesh(new THREE.SphereGeometry(1.0, 40, 12, 0, Math.PI * 2, 0, Math.PI / 2.6).scale(1, .45, 1), Mat({ color: 0xdfe4ea, shininess: 90 })); lid.position.set(0, 1.2, 0); M.add(lid);
  const knob = new THREE.Mesh(new RoundedBoxGeometry(.5, .2, .3, 2, .08), Mat({ color: 0x2a3040 })); knob.position.set(0, 1.6, 0); M.add(knob);
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(.22, .4, .8, 20, 1, true).rotateZ(-1.0), glassMat); spout.position.set(1.25, .95, 0); M.add(spout);
  // handle (on -x)
  const handleMat = Mat({ color: 0x2a3040, transparent: true, opacity: 1, shininess: 60 });
  const hCurve = new THREE.CatmullRomCurve3([V(-1.05, 1.05, 0), V(-1.9, .9, 0), V(-2.15, -.4, 0), V(-2.0, -1.7, 0), V(-1.3, -2.05, 0)]);
  const handle = new THREE.Mesh(new THREE.TubeGeometry(hCurve, 60, .24, 14), handleMat); M.add(handle);
  // switch lever at handle bottom
  const swMat = Mat({ color: 0xff8a2a, emissive: 0xff6a00, emissiveIntensity: .3 });
  const sw = new THREE.Mesh(new RoundedBoxGeometry(.5, .16, .3, 2, .06), swMat); sw.position.set(-1.75, -1.85, .0); M.add(sw);

  // heating element under the floor (flat spiral)
  const spiral = []; for (let i = 0; i <= 300; i++) { const f = i / 300, a = f * Math.PI * 2 * 3.2, r = lerp(.25, 1.0, f); spiral.push(V(Math.cos(a) * r, -2.3, Math.sin(a) * r)); }
  const elMat = Mat({ color: 0x8a6a50, emissive: 0xff3a00, emissiveIntensity: 0 });
  const element = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(spiral), 600, .06, 8), elMat); M.add(element);
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(1.18, 1.18, .05, 40), Mat({ color: 0xb8c0cc, emissive: 0xff4a00, emissiveIntensity: 0, shininess: 90, transparent: true, opacity: 1 })); plate.position.set(0, -2.17, 0); M.add(plate);
  const heatLight = new THREE.PointLight(0xff6a20, 0, 5); heatLight.position.set(0, -1.9, .8); M.add(heatLight);

  // water
  const waterMat = Mat({ color: 0x3a9aff, transparent: true, opacity: .4, shininess: 100, depthWrite: false, emissive: 0x0a2a60, emissiveIntensity: .3 });
  const water = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.21, 2.4, 40), waterMat); water.position.set(0, -.95, 0); M.add(water);
  const cCold = new THREE.Color(0x3a9aff), cHot = new THREE.Color(0xff8a5a);

  // steam channel: from top inside near the handle, down to the bimetal disc
  const chCurve = new THREE.CatmullRomCurve3([V(-.85, 1.05, .0), V(-1.25, .95, .0), V(-1.55, .2, 0), V(-1.6, -1.0, 0), V(-1.5, -1.6, 0)]);
  const chMat = Mat({ color: 0xdfe8f2, transparent: true, opacity: .55, emissive: 0x3aa8ff, emissiveIntensity: 0, depthWrite: false });
  M.add(new THREE.Mesh(new THREE.TubeGeometry(chCurve, 50, .09, 10), chMat));
  // bimetallic disc (two layers)
  const disc = new THREE.Group(); disc.position.set(-1.5, -1.68, 0); M.add(disc);
  const dA = new THREE.Mesh(new THREE.SphereGeometry(.34, 24, 8, 0, Math.PI * 2, 0, .5), Mat({ color: 0xd88a4a, emissive: 0xff7a00, emissiveIntensity: 0, side: THREE.DoubleSide }));
  const dB = new THREE.Mesh(new THREE.SphereGeometry(.31, 24, 8, 0, Math.PI * 2, 0, .5), Mat({ color: 0xc8d0dc, side: THREE.DoubleSide }));
  dA.position.y = -.3; dB.position.y = -.31; disc.add(dA, dB);
  const dScale = new THREE.Group(); // wrapper for flip
  disc.scale.set(1, 1, 1);

  const mk = (c, r) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, depthWrite: false })); M.add(m); return m; };
  // convection particles: up the middle, out, down the sides
  const conv = []; for (let i = 0; i < 40; i++) conv.push({ m: mk(0xffffff, .07), o: i / 40, a: i * 2.39 });
  function convPos(u, a, p) {
    let r, y;
    if (u < .4) { r = .15; y = lerp(-2.0, .3, u / .4); }
    else if (u < .5) { r = lerp(.15, .95, (u - .4) / .1); y = .3; }
    else if (u < .9) { r = .95; y = lerp(.3, -2.0, (u - .5) / .4); }
    else { r = lerp(.95, .15, (u - .9) / .1); y = -2.0; }
    p.set(Math.cos(a) * r, y, Math.sin(a) * r);
    return u < .5 ? 1 : 0;
  }
  const bubbles = []; for (let i = 0; i < 46; i++) bubbles.push({ m: mk(0xeaf8ff, .06 + (i % 4) * .025), o: i / 46, x: Math.cos(i * 2.4) * (.2 + (i * .37) % .8), z: Math.sin(i * 2.4) * (.2 + (i * .37) % .8) });
  const steamTop = []; for (let i = 0; i < 18; i++) steamTop.push({ m: mk(0xf2f8ff, .14), o: i / 18 });
  const steamCh = []; for (let i = 0; i < 14; i++) steamCh.push({ m: mk(0xffffff, .09), o: i / 14 });
  const hook = []; for (let i = 0; i < 12; i++) hook.push({ m: mk(0xffffff, .12), o: i / 12 });

  const shots = [
    [[3.2, 1.2, 15.5], [-.2, -1.3, 0]],
    [[3.6, -1.5, 6.6], [0, -2.0, 0]],
    [[4.2, .6, 8.0], [0, -.8, 0]],
    [[2.6, .4, 6.4], [0, -.9, 0]],
    [[-3.2, .6, 6.6], [-1.3, -.4, 0]],
    [[-3.2, -1.1, 3.4], [-1.5, -1.75, 0]],
    [[-3.2, 1.2, 15.5], [-.2, -1.3, 0]],
  ];
  const cur = { p: V(), q: V() };
  let lastT = 0, cf = 0;

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

    const xr = si === 0 ? 0 : si === 6 ? 1 - ease((lt - 1) / 1) : 1;
    footMat.opacity = 1 - xr * .75; plate.material.opacity = 1 - xr * .6; plate.material.depthWrite = xr < .1; footMat.depthWrite = footMat.opacity > .9;
    handleMat.opacity = (si === 4 || si === 5) ? .4 : 1; handleMat.depthWrite = handleMat.opacity > .9;
    // power: on until the click in step 5; hook (step 0) previews click at the end
    const clicked = (si === 5 && lt > 2.2) || (si === 0 && lt > 3.4) || (si === 6);
    const power = clicked ? 0 : si === 0 ? ease((lt - .3) / .8) : 1;
    // temperature 0..1 builds through steps 1..3
    const temp = si === 0 ? .9 : si === 1 ? .15 + lt / sd * .2 : si === 2 ? .35 + lt / sd * .4 : si >= 3 ? 1 : 0;
    elMat.emissiveIntensity = power * (.7 + focus(1) * (.5 + .3 * Math.sin(t * 6)));
    elMat.color.setHex(power > .5 ? 0xff7a3a : 0x8a6a50);
    plate.material.emissiveIntensity = power * (.15 + focus(1) * .3);
    heatLight.intensity = power * (1.5 + focus(1) * 2);
    ledMat.color.setHex(power > .5 ? 0xff8a2a : 0x333a48);
    swMat.emissiveIntensity = power > .5 ? .3 : 0;
    swMat.color.setHex(power > .5 ? 0xff8a2a : 0x8a909c);
    sw.position.y = -1.85 + (power > .5 ? 0 : .16); sw.rotation.z = power > .5 ? 0 : .25;
    waterMat.color.copy(cCold).lerp(cHot, temp * .55);

    // convection (strong in step 2)
    cf += dt * .09 * (power > .5 ? 1 : .3);
    const cv = si === 2 ? 1 : si === 1 ? .4 : si === 3 ? .3 : 0;
    conv.forEach(({ m, o: oo, a }) => { const u = (cf + oo) % 1; const up = convPos(u, a, m.position); m.material.color.setHex(up ? 0xff7a3a : 0x6ac8ff); m.material.opacity = cv * .95; });

    // bubbles: boiling in step 3 (and hook), small ones otherwise
    const boil = (si === 3 ? 1 : si === 4 ? .7 : si === 0 ? .8 : si === 2 ? .2 : si === 5 && !clicked ? .7 : 0) * (power > .5 ? 1 : 0);
    const calm = clicked ? Math.max(0, 1 - (si === 5 ? (lt - 2.2) : 2) * .8) : 1;
    bubbles.forEach(({ m, o: oo, x, z }, i) => { const u = (t * (.5 + boil * .5) + oo) % 1; m.position.set(x + .05 * Math.sin(t * 6 + i), lerp(-2.05, .2, u), z); m.material.opacity = Math.max(boil, clicked ? .6 * calm : 0) * .9 * Math.min(1, (1 - u) * 6); });
    // steam out the top/spout
    const st = si >= 3 ? (clicked ? calm * .6 : 1) : si === 0 ? .8 : 0;
    steamTop.forEach(({ m, o: oo }) => { const u = (t * .35 + oo) % 1; m.position.set(1.6 + u * .8, 1.3 + u * 2.0, .1 * Math.sin(oo * 9)); m.material.opacity = st * (1 - u) * .75; m.scale.setScalar(1 + u * 1.5); });
    // steam through the channel (step 4 focus, step 5 until click)
    const sc = (si === 4 ? 1 : si === 5 && !clicked ? 1 : 0);
    chMat.emissiveIntensity = focus(4) * (.6 + .3 * Math.sin(t * 6));
    steamCh.forEach(({ m, o: oo }) => { const u = (t * .45 + oo) % 1; m.position.copy(chCurve.getPoint(u)); m.material.opacity = sc * .95 * Math.min(1, u * 5, (1 - u) * 5); });
    // disc heats then snaps
    const dHeat = si === 4 ? ease(lt / sd) : si === 5 ? 1 : 0;
    dA.material.emissiveIntensity = dHeat * (.5 + .3 * Math.sin(t * 8)) * (clicked && si === 5 ? .5 : 1);
    const snapK = si === 5 ? ease((lt - 2.0) / .25) : si === 6 ? 1 : si === 0 ? ease((lt - 3.2) / .25) : 0;
    disc.scale.set(1.6, 1.6 * lerp(1, -1, snapK), 1.6);
    disc.position.y = -1.68 - snapK * .2 + (si === 5 && lt > 2.0 && lt < 2.6 ? .04 * Math.sin(lt * 60) : 0);
    // hook: white wisps travel from kettle to disc
    const hk = si === 0 ? Math.sin(Math.min(1, lt / 3.4) * Math.PI) : 0;
    hook.forEach(({ m, o: oo }) => { const u = (t * .5 + oo) % 1; m.position.copy(chCurve.getPoint(u)); m.material.opacity = hk * .9; });
  }
  return { update };
}
