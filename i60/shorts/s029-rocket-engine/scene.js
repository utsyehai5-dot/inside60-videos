// Inside 60 — Rocket engine. Steps: 0 hook, 1 oxidizer, 2 pumps, 3 burn, 4 nozzle, 5 cooling, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x666666, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x0e1a30);
  scene.fog = new THREE.Fog(0x0e1a30, 30, 80);
  scene.add(new THREE.HemisphereLight(0xeaf2ff, 0x302838, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(6, 10, 9); scene.add(key);
  const rim = new THREE.DirectionalLight(0x88ccff, .9); rim.position.set(-7, 4, -6); scene.add(rim);
  const fire = new THREE.PointLight(0xff8030, 0, 14); fire.position.set(0, -3.5, 0); scene.add(fire);

  // tanks (top): oxidizer (blue) left, fuel (orange) right
  const oxM = Mat({ color: 0x3a8cff, emissive: 0x1040ff, emissiveIntensity: .1 });
  const fuM = Mat({ color: 0xff9a30, emissive: 0xff6010, emissiveIntensity: .1 });
  const tank = (m, x) => { const g = new THREE.Group(); g.position.set(x, 3.2, 0); scene.add(g);
    const c = new THREE.Mesh(new THREE.CylinderGeometry(.75, .75, 1.3, 32), m); g.add(c);
    [-.65, .65].forEach(y => { const s = new THREE.Mesh(new THREE.SphereGeometry(.75, 32, 16, 0, Math.PI * 2, y > 0 ? 0 : Math.PI / 2, Math.PI / 2), m); s.position.y = y; g.add(s); });
    return g; };
  const oxT = tank(oxM, -.95), fuT = tank(fuM, .95);
  // pipes down to pump
  const pipeM = Mat({ color: 0x9aa6b8 });
  const mkPipe = (pts, m) => { const t = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, .12, 10), m); scene.add(t); return t; };
  mkPipe([V(-.95, 1.8, 0), V(-.95, 1.3, 0), V(-.4, 1.0, 0), V(-.25, .85, 0)], pipeM);
  mkPipe([V(.95, 1.8, 0), V(.95, 1.3, 0), V(.4, 1.0, 0), V(.25, .85, 0)], pipeM);
  // turbopump
  const pumpM = Mat({ color: 0xc8ccd6, shininess: 120 });
  const pump = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, .5, 28), pumpM); pump.position.y = .75; pump.rotation.x = Math.PI / 2; scene.add(pump);
  const rotor = new THREE.Group(); rotor.position.set(0, .75, .27); scene.add(rotor);
  const bladeM = Mat({ color: 0xffd040, emissive: 0xffa000, emissiveIntensity: .2 });
  for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.06, .34, .05), bladeM); b.rotation.z = i * Math.PI / 3; b.position.set(Math.sin(i * Math.PI / 3) * -.17, Math.cos(i * Math.PI / 3) * .17, 0); rotor.add(b); }
  // chamber + nozzle as one lathe profile (radius, y)
  const prof = [[.02, .45], [.55, .45], [.62, .3], [.62, -.4], [.5, -.75], [.3, -1.05], [.28, -1.15], [.36, -1.4], [.6, -1.9], [.85, -2.5], [1.05, -3.1], [1.18, -3.6]];
  const lathe = (p, off) => new THREE.LatheGeometry(p.map(([r, y]) => new THREE.Vector2(r + off, y)), 48);
  const bellM = Mat({ color: 0xb88a5a, shininess: 120, specular: 0xaa8866, side: THREE.DoubleSide, emissive: 0xff3000, emissiveIntensity: 0, transparent: true });
  const bell = new THREE.Mesh(lathe(prof, 0), bellM); scene.add(bell);
  // inner glow (chamber gas)
  const gasM = new THREE.MeshBasicMaterial({ color: 0xffb040, transparent: true, opacity: 0, depthWrite: false });
  const gas = new THREE.Mesh(lathe(prof.slice(1, -1), -.08), gasM); scene.add(gas);
  // throat ring highlight
  const throatM = new THREE.MeshBasicMaterial({ color: 0x40ffb0, transparent: true, opacity: 0 });
  const throat = new THREE.Mesh(new THREE.TorusGeometry(.33, .04, 8, 48), throatM); throat.rotation.x = Math.PI / 2; throat.position.y = -1.15; scene.add(throat);
  // cooling channels: helical-ish vertical tubes on bell surface
  const coolM = new THREE.MeshPhongMaterial({ color: 0x60c8ff, emissive: 0x2090ff, emissiveIntensity: 0, transparent: true, opacity: 0 });
  const chans = [];
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2;
    const pts = prof.slice(2).reverse().map(([r, y]) => V(Math.cos(a) * (r + .04), y, Math.sin(a) * (r + .04)));
    const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, .035, 6), coolM); scene.add(m); chans.push(m); }
  // particles: exhaust plume, propellant flow in pipes, coolant drops
  const pg = new THREE.SphereGeometry(.12, 8, 6);
  const ex = [];
  for (let i = 0; i < 260; i++) { const m = new THREE.Mesh(pg, new THREE.MeshBasicMaterial({ color: 0xffc060, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); scene.add(m); ex.push({ m, ph: i / 260, a: Math.random() * 6.28, r: Math.random() }); }
  const flows = [];
  const fpath = (x) => new THREE.CatmullRomCurve3([V(x, 2.6, 0), V(x, 1.3, 0), V(x * .42, 1.0, 0), V(x * .1, .75, .1), V(0, .35, 0), V(x * .25, -.2, 0)]);
  const cO = fpath(-.95), cF = fpath(.95);
  for (let i = 0; i < 40; i++) { const o = i % 2 === 0; const m = new THREE.Mesh(new THREE.SphereGeometry(.08, 6, 5), new THREE.MeshBasicMaterial({ color: o ? 0x7ab8ff : 0xffb060, transparent: true, opacity: 0 })); scene.add(m); flows.push({ m, c: o ? cO : cF, ph: (i >> 1) / 20 }); }
  const cools = [];
  for (let i = 0; i < 48; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(.06, 6, 5), new THREE.MeshBasicMaterial({ color: 0xbfeaff, transparent: true, opacity: 0 })); scene.add(m); cools.push({ m, ch: i % 16, ph: Math.floor(i / 16) / 3 }); }
  const chanCurves = []; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; chanCurves.push(new THREE.CatmullRomCurve3(prof.slice(2).reverse().map(([r, y]) => V(Math.cos(a) * (r + .07), y, Math.sin(a) * (r + .07))))); }

  const shots = [
    [[10, 1.5, 17], [0, .2, 0]],
    [[3, 4.5, 8], [0, 2.8, 0]],
    [[2.6, 1.6, 5], [0, .7, 0]],
    [[4, .2, 6.5], [0, -.3, 0]],
    [[5, -1.5, 8], [0, -1.6, 0]],
    [[-5, -.5, 8], [0, -1.6, 0]],
    [[-10, 1.5, 17], [0, .2, 0]],
  ];
  const cp = { p: V(), q: V() };
  let lastT = 0, spin = 0, burn = 0;
  function update(t, si, lt) {
    const dt = Math.min(.1, Math.max(0, t - lastT)); lastT = t;
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const k = si === 0 ? 1 : ease(lt / 1.3);
    cp.p.set(...prev[0].map((v, i) => lerp(v, now[0][i], k))); cp.q.set(...prev[1].map((v, i) => lerp(v, now[1][i], k)));
    const o = Math.sin(t * .2) * .12, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o)); camera.lookAt(cp.q);
    const bT = si === 1 || si === 2 ? 0 : si === 3 ? ease(lt / 1.5) : 1;
    burn += (bT - burn) * Math.min(1, dt * 3);
    spin += dt * (si >= 2 ? 25 : 4); rotor.rotation.z = spin;
    bladeM.emissiveIntensity = si === 2 ? .8 : .2;
    oxM.emissiveIntensity = si === 1 ? .5 + .2 * Math.sin(t * 5) : .1; fuM.emissiveIntensity = si === 1 ? .5 + .2 * Math.sin(t * 5 + 1) : .1;
    gasM.opacity = burn * (si === 3 ? .85 : .55) * (.9 + .1 * Math.sin(t * 30));
    bellM.emissiveIntensity = burn * (si === 5 ? .05 : .25); bellM.opacity = si === 3 ? 1 - .7 * ease((lt - .3) / 1) : 1; bellM.depthWrite = bellM.opacity > .99;
    fire.intensity = burn * 30;
    throatM.opacity = si === 4 ? .9 * Math.min(1, lt) : 0;
    const cOn = si === 5 ? Math.min(1, lt) : 0;
    coolM.opacity = cOn * .9; coolM.emissiveIntensity = cOn * .6;
    // propellant flow in pipes
    const fOn = si >= 1 && si <= 3 ? 1 : si === 0 || si === 6 ? .6 : 0;
    flows.forEach(f => { const u = (f.ph + t * (si >= 2 ? .5 : .25)) % 1; f.m.position.copy(f.c.getPoint(u)); f.m.material.opacity = fOn * Math.min(1, (1 - u) * 6); });
    // coolant through channels (from nozzle exit upward)
    cools.forEach(c => { const u = (c.ph + t * .3) % 1; c.m.position.copy(chanCurves[c.ch].getPoint(u)); c.m.material.opacity = cOn; });
    // exhaust plume, supersonic after throat
    const sp = si === 4 ? 1.3 : 1;
    ex.forEach(e => { const u = (e.ph + t * .9 * sp) % 1; const y = -1.2 - u * 6; const spread = (.25 + u * 1.0) * Math.sqrt(e.r);
      e.m.position.set(Math.cos(e.a) * spread, y, Math.sin(e.a) * spread);
      e.m.material.opacity = burn * (1 - u) * .6; e.m.scale.setScalar(1 + u * 3);
      e.m.material.color.setHex(u < .15 ? 0xffffff : u < .5 ? 0xffc060 : 0xff6a30); });
  }
  return { update };
}
