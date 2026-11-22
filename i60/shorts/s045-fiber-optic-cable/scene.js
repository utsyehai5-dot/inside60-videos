// Inside 60 — Fiber optic cable. Steps: 0 hook (light in glass), 1 core + cladding, 2 total internal reflection, 3 laser blinks 1/0, 4 colors share a fiber, 5 speed, 6 recap
export async function setup({ THREE, scene, camera }) {
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const ss = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 90, specular: 0x666666, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x0c1426); scene.fog = new THREE.Fog(0x0c1426, 30, 70);
  scene.add(new THREE.HemisphereLight(0xf0f4ff, 0x404050, 1.4));
  const key = new THREE.DirectionalLight(0xffffff, 1.9); key.position.set(4, 8, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0x90c0ff, .8); rim.position.set(-6, -3, -6); scene.add(rim);

  const L = 18, X0 = -9; // fiber from x=-9 to x=9
  const RC = 1.0, RCL = 1.55, RJ = 1.85;
  const F = new THREE.Group(); scene.add(F);
  const alongX = m => { m.rotation.z = Math.PI / 2; return m; };
  const coreM = new THREE.MeshPhongMaterial({ color: 0x9fe8ff, emissive: 0x2080a0, emissiveIntensity: .25, transparent: true, opacity: .28, shininess: 150, depthWrite: false });
  const core = alongX(new THREE.Mesh(new THREE.CylinderGeometry(RC, RC, L, 48, 1, true), coreM)); F.add(core);
  const cladM = new THREE.MeshPhongMaterial({ color: 0xd8f0ff, transparent: true, opacity: .14, shininess: 150, depthWrite: false, side: THREE.DoubleSide });
  const clad = alongX(new THREE.Mesh(new THREE.CylinderGeometry(RCL, RCL, L - 1.5, 48, 1, true, Math.PI * .55, Math.PI * 1.15), cladM)); clad.position.x = .75; clad.rotation.y = 0; F.add(clad);
  const jackM = Mat({ color: 0xf0a020, side: THREE.DoubleSide, shininess: 40 });
  const jack = alongX(new THREE.Mesh(new THREE.CylinderGeometry(RJ, RJ, L - 5, 48, 1, true, Math.PI * .65, Math.PI * .95), jackM)); jack.position.x = 2.5; F.add(jack);
  // end caps rings to show layers
  const capCore = new THREE.Mesh(new THREE.CircleGeometry(RC, 48), new THREE.MeshPhongMaterial({ color: 0xbff4ff, emissive: 0x40c0ff, emissiveIntensity: .3, transparent: true, opacity: .7 }));
  capCore.rotation.y = -Math.PI / 2; capCore.position.x = X0 + .01; F.add(capCore);
  const capClad = new THREE.Mesh(new THREE.RingGeometry(RC, RCL, 48), new THREE.MeshPhongMaterial({ color: 0xc8d8e8, transparent: true, opacity: .55, side: THREE.DoubleSide }));
  capClad.rotation.y = -Math.PI / 2; capClad.position.x = X0 + .75 + .01; F.add(capClad);
  // labels as glowing bands
  const bandCore = alongX(new THREE.Mesh(new THREE.TorusGeometry(RC + .02, .04, 6, 48), new THREE.MeshBasicMaterial({ color: 0x60e0ff, transparent: true, opacity: 0 }))); bandCore.rotation.set(0, Math.PI / 2, 0); bandCore.position.x = -6; F.add(bandCore);
  const bandClad = new THREE.Mesh(new THREE.TorusGeometry(RCL + .02, .05, 6, 48), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 })); bandClad.rotation.set(0, Math.PI / 2, 0); bandClad.position.x = -5; F.add(bandClad);

  // laser box at the start
  const laser = new THREE.Group(); laser.position.set(X0 - 1.6, 0, 0); scene.add(laser);
  laser.add(new THREE.Mesh(new RoundedBoxGeometry(2.4, 2.4, 2.4, 3, .25), Mat({ color: 0x3a3f4c })));
  const lensM = Mat({ color: 0x401010, emissive: 0xff3040, emissiveIntensity: .2 });
  const lens = alongX(new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, .3, 24), lensM)); lens.position.x = 1.25; laser.add(lens);

  // light pulses: zigzag inside the core
  const zig = (x, period, ph) => { const u = ((x + ph) / period) % 1; const tri = u < .5 ? u * 4 - 1 : 3 - u * 4; return tri * (RC * .88); };
  const cols = [0xff4050, 0x40ff80, 0x4090ff];
  const P = [];
  for (let i = 0; i < 90; i++) { const m = new THREE.MeshBasicMaterial({ color: 0xff4050, transparent: true, opacity: 0, depthWrite: false }); const s = new THREE.Mesh(new THREE.SphereGeometry(.13, 10, 8), m); scene.add(s); P.push({ s, m, i }); }
  // zigzag guide line (step 2)
  const gpts = []; for (let x = X0; x <= 9; x += .05) gpts.push(V(x, zig(x - X0, 3.2, 0), 0));
  const guideM = new THREE.LineBasicMaterial({ color: 0xffe040, transparent: true, opacity: 0 });
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(gpts), guideM));
  // bounce flashes at the wall
  const flashes = [];
  for (let k = 0; k < 6; k++) { const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }); const f = new THREE.Mesh(new THREE.SphereGeometry(.28, 12, 8), m); scene.add(f); flashes.push({ f, m, x: X0 + 1.6 * (2 * k + 1) * .5 + 1.6 * k * 0 }); }
  // bits display (1/0 blocks) above the fiber
  const bits = [1, 0, 1, 1, 0, 1, 0, 0];
  const bitBlocks = bits.map((b, i) => { const m = Mat({ color: b ? 0xffe040 : 0x30343e, emissive: b ? 0xffc020 : 0x000000, emissiveIntensity: b ? .6 : 0, transparent: true, opacity: 0 }); const c = new THREE.Mesh(new RoundedBoxGeometry(.7, .7, .7, 2, .1), m); c.position.set(-6 + i * 1.1, 2.6, 0); scene.add(c); return { c, m, b }; });

  const shots = [
    [[-13, 4, 9], [-7, 0, 0]],
    [[-7, 4, 9], [-5, 0, 0]],
    [[0, 1.5, 12], [-1, 0, 0]],
    [[-2.2, 3.5, 12], [-2.2, 1.1, 0]],
    [[4, 2.5, 11], [1, 0, 0]],
    [[0, 7, 17], [0, 0, 0]],
    [[-12, 5, 13], [-3, 0, 0]],
  ];
  const cp = { p: V(), q: V() };
  function update(t, si, lt) {
    const pulse = .5 + .5 * Math.sin(t * 7);
    bandCore.material.opacity = si === 1 ? ss(.3, 1, lt) * (.5 + .5 * pulse) : 0;
    bandClad.material.opacity = si === 1 ? ss(1.8, 2.5, lt) * (.5 + .5 * pulse) : 0;
    coreM.emissiveIntensity = si === 1 ? .25 + .3 * pulse * ss(.3, 1, lt) : .25;
    guideM.opacity = si === 2 ? .55 : 0;
    // pulses
    const multi = si === 4 || si === 6;
    const spd = si === 5 ? 9 : si === 0 ? 3 : 2.2;
    const blink = si === 3;
    P.forEach(p => {
      const lane = multi ? p.i % 3 : 0;
      const per = [3.2, 2.2, 4.4][lane];
      const ph = lane * 1.1;
      const n = multi ? 30 : 90;
      const idx = multi ? Math.floor(p.i / 3) : p.i;
      let x = X0 + ((t * spd + idx * (L / n)) % L);
      p.s.position.set(x, zig(x - X0, per, ph), multi ? (lane - 1) * .25 : 0);
      let on = 1;
      if (blink) on = bits[Math.floor(idx * (L / n) / 1.5) % 8];
      p.m.color.setHex(multi ? cols[lane] : 0xff4050);
      p.s.scale.setScalar(si === 5 ? 1.3 : 1);
      p.m.opacity = on * ss(X0, X0 + .5, x) * (1 - ss(8.4, 9, x)) * .9;
    });
    lensM.emissiveIntensity = blink ? .2 + .9 * (Math.floor(t * 3) % 2) : .6 + .3 * pulse;
    // bounce flashes on the wall (step 2)
    flashes.forEach((f, k) => { const x = X0 + 1.6 + k * 3.2; const yy = RC * .88; f.f.position.set(x, k % 2 ? -yy : yy, 0); f.m.opacity = si === 2 ? .7 * (.5 + .5 * Math.sin(t * 5 - k)) : 0; });
    bitBlocks.forEach((bb, i) => { bb.m.opacity = si === 3 ? ss(.2 + i * .25, .6 + i * .25, lt) : 0; bb.c.position.y = 2.6 + (si === 3 ? .1 * Math.sin(t * 3 + i) : 0); });
    // camera
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const k = si === 0 ? 1 : ease(lt / 1.4);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], k))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], k)));
    const o = Math.sin(t * .2) * .06, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o));
    camera.lookAt(cp.q);
  }
  return { update };
}
