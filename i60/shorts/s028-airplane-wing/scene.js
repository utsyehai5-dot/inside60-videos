// Inside 60 — Airplane wing. Steps: 0 hook, 1 shape/AoA, 2 pressure, 3 downwash, 4 lift, 5 flaps, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x666666, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x15233a);
  scene.fog = new THREE.Fog(0x15233a, 30, 75);
  scene.add(new THREE.HemisphereLight(0xeaf2ff, 0x303040, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(5, 10, 9); scene.add(key);
  const rim = new THREE.DirectionalLight(0x88ccff, .9); rim.position.set(-7, 5, -6); scene.add(rim);

  const C = 4.4, SPAN = 7;
  // cambered airfoil (NACA 4412-like), chord from x=-C/2 (leading edge) to +C/2
  function foil(x0, x1, scale, tk) {
    const up = [], lo = [], n = 40;
    for (let i = 0; i <= n; i++) {
      const b = (1 - Math.cos(i / n * Math.PI)) / 2, x = lerp(x0, x1, b);
      const yt = 5 * tk * (.2969 * Math.sqrt(x) - .126 * x - .3516 * x * x + .2843 * x ** 3 - .1036 * x ** 4);
      const m = .045, p = .4, yc = x < p ? m / (p * p) * (2 * p * x - x * x) : m / ((1 - p) ** 2) * ((1 - 2 * p) + 2 * p * x - x * x);
      up.push([(x - .5) * scale, (yc + yt) * scale]); lo.push([(x - .5) * scale, (yc - yt) * scale]);
    }
    const s = new THREE.Shape(); s.moveTo(...up[0]); up.slice(1).forEach(q => s.lineTo(...q)); lo.reverse().forEach(q => s.lineTo(...q)); s.closePath();
    return s;
  }
  const wing = new THREE.Group(); scene.add(wing);
  const wingM = Mat({ color: 0xdfe5ee, shininess: 110 });
  const main = new THREE.Mesh(new THREE.ExtrudeGeometry(foil(0, .8, C, .13), { depth: SPAN, bevelEnabled: false, curveSegments: 4 }), wingM);
  main.position.z = -SPAN; wing.add(main);
  // stripe on the end face
  const endM = Mat({ color: 0x2a7fff, emissive: 0x2050ff, emissiveIntensity: .25 });
  const endCap = new THREE.Mesh(new THREE.ShapeGeometry(foil(0, .8, C, .13)), endM); endCap.position.z = .01; wing.add(endCap);
  // flap: rear 20% of chord, separate piece
  const flapG = new THREE.Group(); flapG.position.set(.3 * C, 0, 0); wing.add(flapG);
  const flapShape = foil(.8, 1.0, C, .13);
  const flapMat = Mat({ color: 0xffc040, emissive: 0xff9020, emissiveIntensity: 0 });
  const flap = new THREE.Mesh(new THREE.ExtrudeGeometry(flapShape, { depth: SPAN * .7, bevelEnabled: false }), flapMat); flap.position.set(-.3 * C, 0, -SPAN * .85); flapG.add(flap);
  const flapCap = new THREE.Mesh(new THREE.ShapeGeometry(flapShape), flapMat); flapCap.position.set(-.3 * C, 0, -SPAN * .15 + .01); flapG.add(flapCap);
  // pressure clouds
  const lowM = new THREE.MeshBasicMaterial({ color: 0x40a0ff, transparent: true, opacity: 0, depthWrite: false });
  const hiM = new THREE.MeshBasicMaterial({ color: 0xff6040, transparent: true, opacity: 0, depthWrite: false });
  const low = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), lowM); low.scale.set(C * .5, .8, SPAN * .5); low.position.set(-.2, 1.0, -SPAN / 2); wing.add(low);
  const hi = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), hiM); hi.scale.set(C * .5, .6, SPAN * .5); hi.position.set(0, -.8, -SPAN / 2); wing.add(hi);
  // lift arrow
  const liftM = new THREE.MeshPhongMaterial({ color: 0x40ff90, emissive: 0x20c060, emissiveIntensity: .6, transparent: true, opacity: 0 });
  const lift = new THREE.Group(); lift.position.set(-.4, .6, -SPAN / 2); scene.add(lift);
  const ls = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, 1, 12), liftM); ls.position.y = .5; lift.add(ls);
  const lh = new THREE.Mesh(new THREE.ConeGeometry(.4, .8, 16), liftM); lift.add(lh);
  // airflow particles
  const pg = new THREE.SphereGeometry(.05, 6, 5);
  const lines = [];
  const YS = [-2.2, -1.5, -.9, -.45, .45, 1.0, 1.6, 2.3], ZS = [.5, -3.5];
  for (const z of ZS) for (const y0 of YS) for (let i = 0; i < 40; i++) {
    const m = new THREE.Mesh(pg, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 })); scene.add(m);
    lines.push({ m, y0, z, ph: i / 40 });
  }
  const shots = [
    [[9, 5, 13], [0, 0, -3]],
    [[1.5, .6, 12], [0, 0, -1]],
    [[5, 3, 11], [0, .2, -2]],
    [[.6, .1, 14], [.6, -.3, -1]],
    [[7, 3, 13], [0, .8, -3]],
    [[8, 1, 10], [1.2, -.2, -2]],
    [[-7, 5, 13], [0, .3, -3]],
  ];
  const cp = { p: V(), q: V() };
  let aoa = .08, fl = 0, lastT = 0, flow = 0;
  function update(t, si, lt) {
    const dt = Math.min(.1, Math.max(0, t - lastT)); lastT = t;
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const k = si === 0 ? 1 : ease(lt / 1.3);
    cp.p.set(...prev[0].map((v, i) => lerp(v, now[0][i], k))); cp.q.set(...prev[1].map((v, i) => lerp(v, now[1][i], k)));
    const o = Math.sin(t * .2) * .1, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o)); camera.lookAt(cp.q);
    // angle of attack & flaps
    let aT = .1, fT = 0;
    if (si === 1) aT = .1 + .12 * Math.sin(Math.min(1, lt / 2) * Math.PI);
    if (si === 4) aT = .1 + .08 * ease((lt - 1.5) / 1.5);
    if (si === 5) { aT = .12; fT = ease((lt - .6) / 1.8); }
    aoa += (aT - aoa) * Math.min(1, dt * 4); fl += (fT - fl) * Math.min(1, dt * 4);
    wing.rotation.z = -aoa;
    flapG.position.set(.3 * C + fl * .55, -fl * .25, 0); flapG.rotation.z = -fl * .45;
    flapMat.emissiveIntensity = si === 5 ? .5 : 0; flapMat.color.setHex(si === 5 ? 0xffc040 : 0xdfe5ee);
    endM.emissiveIntensity = si === 1 ? .7 : .25;
    lowM.opacity = si === 2 ? .3 * Math.min(1, lt) : 0; hiM.opacity = si === 2 ? .3 * Math.min(1, lt) : 0;
    const L = si === 4 ? .8 + 1.2 * ease((lt - .3) / 1.5) + .6 * ease((lt - 1.5) / 1.5) : si === 0 || si === 6 ? 1.5 : 0;
    liftM.opacity = L > 0 ? .95 : 0; ls.scale.y = Math.max(.01, L); lh.position.y = L + .35; lift.visible = L > 0;
    // airflow: deflect around wing, downwash after trailing edge
    const speed = si === 4 ? 1.0 : .7; flow += dt * speed;
    const down = (aoa + fl * .35) * 6.5;
    lines.forEach(({ m, y0, z, ph }) => {
      const u = (ph + flow * (y0 > 0 ? .19 : .15)) % 1; // top air moves faster
      const x = -8 + u * 16;
      const near = Math.exp(-(y0 * y0) / 3.5);
      const bump = (y0 > 0 ? 1 : -.35) * .55 * near * Math.exp(-((x + .3) ** 2) / 3.5);
      const dw = -down * near * (1 / (1 + Math.exp(-(x - .4) * 1.2))) * .9;
      const lead = -down * .12 * near * Math.exp(-((x + 2.5) ** 2) / 2); // slight upwash ahead (negative of downwash sign)
      m.position.set(x, y0 + bump + dw - lead, z);
      let op = 1; if (u < .06) op = u / .06; if (u > .94) op = (1 - u) / .06;
      const show = si !== 0 || true;
      m.material.opacity = show ? op * (z > 0 ? 1 : .7) : 0;
      const c = m.material.color;
      if (si === 2) c.setHex(y0 > 0 ? 0x60b8ff : 0xff8060);
      else if (si === 3) c.setHex(x > 1.5 ? 0xffe060 : 0xffffff);
      else c.setHex(0xcfe8ff);
    });
  }
  return { update };
}
