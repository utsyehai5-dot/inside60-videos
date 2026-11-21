// Inside 60 — How a Car Engine Works. Steps: 0 hook, 1 intake, 2 compression, 3 power, 4 exhaust, 5 crankshaft, 6 recap
export async function setup({ THREE, scene, camera }) {
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Phong = (color, o = {}) => new THREE.MeshPhongMaterial({ color, shininess: 60, specular: 0x555555, ...o });

  scene.background = new THREE.Color(0x10182c);
  scene.fog = new THREE.Fog(0x10182c, 18, 40);
  scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x202838, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(5, 9, 7); scene.add(key);
  const rim = new THREE.DirectionalLight(0x88aaff, 1.2); rim.position.set(-6, 4, -5); scene.add(rim);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(14, 64), Phong(0x1c2640, { shininess: 5 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -1.6; scene.add(floor);

  const E = new THREE.Group(); scene.add(E);
  const R = 0.8, L = 2.4; // crank radius, rod length
  const BORE = 0.9, CYL0 = 1.4, HEAD = 4.25;

  // cylinder (see-through) + block frame
  const cylMat = Phong(0x9fc4ff, { transparent: true, opacity: .22, side: THREE.DoubleSide, depthWrite: false });
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(BORE + .06, BORE + .06, HEAD - CYL0, 48, 1, true), cylMat);
  cyl.position.y = (HEAD + CYL0) / 2; E.add(cyl);
  const ringMat = Phong(0x7d8796);
  for (const y of [CYL0, HEAD]) { const r = new THREE.Mesh(new THREE.TorusGeometry(BORE + .08, .05, 10, 48), ringMat); r.rotation.x = Math.PI / 2; r.position.y = y; E.add(r); }
  const head = new THREE.Mesh(new RoundedBoxGeometry(2.6, .5, 2.0, 4, .1), Phong(0x5b6577));
  head.position.y = HEAD + .25; E.add(head);

  // gas charge inside the cylinder (scaled each frame)
  const gasMat = new THREE.MeshPhongMaterial({ color: 0x4fa8ff, emissive: 0x1a5cff, emissiveIntensity: .3, transparent: true, opacity: .55, depthWrite: false });
  const gas = new THREE.Mesh(new THREE.CylinderGeometry(BORE - .02, BORE - .02, 1, 40), gasMat); E.add(gas);
  const fire = new THREE.PointLight(0xff7a1a, 0, 7); fire.position.set(0, 3.6, 0); E.add(fire);

  // piston + rings
  const piston = new THREE.Group(); E.add(piston);
  const pBody = new THREE.Mesh(new THREE.CylinderGeometry(BORE - .03, BORE - .03, .9, 40), Phong(0xd8dde6, { shininess: 90, specular: 0x999999 }));
  piston.add(pBody);
  for (const y of [.25, .1]) { const pr = new THREE.Mesh(new THREE.TorusGeometry(BORE - .02, .025, 8, 40), Phong(0x3a3f48)); pr.rotation.x = Math.PI / 2; pr.position.y = y; piston.add(pr); }

  // connecting rod
  const rod = new THREE.Mesh(new RoundedBoxGeometry(.28, 1, .22, 3, .08), Phong(0xb7c0cc, { shininess: 80, specular: 0x888888 }));
  E.add(rod);

  // crankshaft: main shaft along z, rotating web + pin, counterweight
  const crank = new THREE.Group(); E.add(crank);
  const shaftMat = Phong(0x9aa3b0, { shininess: 90, specular: 0xaaaaaa });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, 3.2, 32), shaftMat); shaft.rotation.x = Math.PI / 2; crank.add(shaft);
  const webMat = Phong(0x6f7a8a, { shininess: 50 });
  for (const z of [-.32, .32]) {
    const web = new THREE.Mesh(new RoundedBoxGeometry(.6, 1.5, .18, 3, .08), webMat); web.position.set(0, R / 2 - .1, z); crank.add(web);
    const cw = new THREE.Mesh(new THREE.CylinderGeometry(.75, .75, .18, 32, 1, false, Math.PI * .65, Math.PI * .7), webMat);
    cw.rotation.x = Math.PI / 2; cw.position.set(0, -.15, z); crank.add(cw);
  }
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, .8, 24), shaftMat); pin.rotation.x = Math.PI / 2; pin.position.y = R; crank.add(pin);
  const flyMat = Phong(0x44506a, { emissive: 0x2a6bff, emissiveIntensity: 0 });
  const fly = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, .2, 48), flyMat); fly.rotation.x = Math.PI / 2; fly.position.z = -1.5; crank.add(fly);
  const spoke = new THREE.Mesh(new THREE.BoxGeometry(.18, 2.2, .24), Phong(0xffc531, { emissive: 0xff9a1f, emissiveIntensity: .4 })); spoke.position.z = -1.5; crank.add(spoke);

  // valves (left intake = blue, right exhaust = orange) + spark plug
  const mkValve = (x, col) => {
    const g = new THREE.Group(); g.position.set(x, HEAD, 0); E.add(g);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(.28, .2, .08, 24), Phong(col, { emissive: col, emissiveIntensity: .25 })); g.add(disc);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 1.3, 12), Phong(0xc9ced6)); stem.position.y = .65; g.add(stem);
    const sp = new THREE.Mesh(new THREE.TorusGeometry(.14, .03, 6, 16), Phong(0xe0e4ea)); sp.rotation.x = Math.PI / 2; sp.position.y = 1.1; g.add(sp);
    return g;
  };
  const vIn = mkValve(-.48, 0x3ea0ff), vEx = mkValve(.48, 0xff8a2a);
  const plug = new THREE.Group(); plug.position.set(0, HEAD + .5, 0); E.add(plug);
  const ceramic = new THREE.Mesh(new THREE.CylinderGeometry(.11, .13, .9, 20), Phong(0xf4f4f0)); ceramic.position.y = .45; plug.add(ceramic);
  const hex = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, .2, 6), Phong(0xb0b6c0)); hex.position.y = .05; plug.add(hex);
  const sparkMat = new THREE.MeshBasicMaterial({ color: 0xbfe4ff, transparent: true, opacity: 0 });
  const spark = new THREE.Mesh(new THREE.SphereGeometry(.22, 16, 12), sparkMat); spark.position.y = -.55; plug.add(spark);

  // intake ports: little flowing particles above the valves
  const dots = [];
  for (let i = 0; i < 18; i++) {
    const d = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), new THREE.MeshBasicMaterial({ color: 0x8fd0ff, transparent: true, opacity: 0 }));
    E.add(d); dots.push(d);
  }

  const shots = [
    [[9.5, 6.5, 15.5], [0, 2.6, 0]],
    [[-5.5, 5.8, 9.6], [0, 3.7, 0]],
    [[5.2, 5.0, 9.4], [0, 3.7, 0]],
    [[0.4, 5.6, 10.6], [0, 3.8, 0]],
    [[6.4, 6.0, 8.6], [0, 3.7, 0]],
    [[7.2, 2.4, 8.0], [0, .2, 0]],
    [[-9.5, 6.5, 15.0], [0, 2.6, 0]],
  ];
  const cur = { p: new THREE.Vector3(), q: new THREE.Vector3() };
  const v = new THREE.Vector3();

  function update(t, si, lt, sd) {
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const k = si === 0 ? 1 : ease(lt / 1.2);
    cur.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], k)));
    cur.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], k)));
    const orbit = Math.sin(t * .15) * .12;
    camera.position.set(cur.p.x * Math.cos(orbit) - cur.p.z * Math.sin(orbit), cur.p.y, cur.p.z * Math.cos(orbit) + cur.p.x * Math.sin(orbit));
    camera.lookAt(cur.q);

    // crank angle: strokes 1..4 play slowly, one half-turn per step; other steps spin fast
    let th, phase; // phase 0 intake,1 compression,2 power,3 exhaust
    if (si >= 1 && si <= 4) { const f = Math.min(1, Math.max(0, (lt - .6) / (sd - 1.2))); th = (si - 1) * Math.PI + ease(f) * Math.PI; }
    else th = t * (si === 5 ? 7 : 11);
    const cyc = ((th % (4 * Math.PI)) + 4 * Math.PI) % (4 * Math.PI);
    phase = Math.floor(cyc / Math.PI); const pf = (cyc % Math.PI) / Math.PI;

    crank.rotation.z = -th;
    const px = R * Math.sin(th), py = R * Math.cos(th);
    const pinY = py + Math.sqrt(L * L - px * px);
    piston.position.y = pinY + .2;
    rod.position.set(px / 2, (py + pinY) / 2, 0);
    rod.scale.y = L; rod.rotation.z = Math.atan2(px, pinY - py);

    const top = pinY + .65;
    gas.position.y = (top + HEAD) / 2; gas.scale.y = Math.max(.02, HEAD - top);

    const open = s => Math.sin(Math.min(1, Math.max(0, s)) * Math.PI);
    vIn.position.y = HEAD - (phase === 0 ? open(pf) * .3 : 0);
    vEx.position.y = HEAD - (phase === 3 ? open(pf) * .3 : 0);

    // gas look per phase
    let col = [.25, .62, 1], em = .3, op = .5, boom = 0;
    if (phase === 1) { col = [.3, .7, 1]; em = .4 + pf * .5; op = .6 + pf * .25; }
    if (phase === 2) { boom = Math.max(0, 1 - pf * 1.4); col = [1, lerp(.42, .3, pf), .02]; em = .6 + boom * .9; op = .8 - pf * .2; }
    if (phase === 3) { col = [.55, .55, .6]; em = .05; op = .5 - pf * .3; }
    gasMat.color.setRGB(...col); gasMat.emissive.setRGB(col[0], col[1] * .6, col[2] * .6);
    gasMat.emissiveIntensity = em; gasMat.opacity = op;
    fire.intensity = boom * 40;
    sparkMat.opacity = phase === 2 && pf < .12 ? 1 : 0; spark.scale.setScalar(1 + boom);

    // flow dots into the intake (phase 0) / out of exhaust (phase 3)
    dots.forEach((d, i) => {
      const u = ((t * .9 + i / dots.length) % 1);
      if (phase === 0) { d.material.color.setHex(0x8fd0ff); d.position.set(-1.9 + u * 1.5, HEAD + .55 - u * .5, Math.sin(i * 2.1) * .25); d.material.opacity = .9 * Math.sin(u * Math.PI); }
      else if (phase === 3) { d.material.color.setHex(0xb8b8c0); d.position.set(.5 + u * 1.6, HEAD + .1 + u * .5, Math.sin(i * 2.1) * .25); d.material.opacity = .8 * Math.sin(u * Math.PI); }
      else d.material.opacity = 0;
    });

    flyMat.emissiveIntensity = si === 5 ? .6 + .3 * Math.sin(t * 6) : 0;
    E.rotation.y = -0.2 + Math.sin(t * .3) * .05;
  }
  return { update };
}
