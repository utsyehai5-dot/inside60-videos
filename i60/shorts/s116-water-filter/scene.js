// Inside 60 — Pitcher water filter (cutaway). Steps: 0 hook, 1 gravity through cartridge, 2 mesh stops grit,
// 3 carbon traps chlorine, 4 ion-exchange beads swap lead, 5 clean water fills pitcher, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  scene.background = new THREE.Color(0x16243a);
  scene.add(new THREE.HemisphereLight(0xfff4ea, 0x404050, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, .9); key.position.set(4, 8, 10); scene.add(key);
  const root = new THREE.Group(); scene.add(root);
  const floor = new THREE.Mesh(new THREE.BoxGeometry(16, .3, 10), Mat({ color: 0xd8c8a8, shininess: 10 })); floor.position.y = -3.05; root.add(floor);
  const wall = new THREE.Mesh(new THREE.BoxGeometry(16, 12, .3), Mat({ color: 0x4f7a8a, shininess: 5 })); wall.position.set(0, 2, -4); root.add(wall);

  // pitcher body (transparent), top reservoir y 0.6..2.6, lower jug y -2.9..0.4
  const jugM = Mat({ color: 0xcfe9ff, transparent: true, opacity: .25, side: THREE.DoubleSide });
  const jug = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 1.8, 5.6, 48, 1, true), jugM); jug.position.y = -.2; root.add(jug);
  const jugBot = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, .1, 48), Mat({ color: 0xbfdff5, transparent: true, opacity: .5 })); jugBot.position.y = -2.95; root.add(jugBot);
  const resM = Mat({ color: 0xe8eef4, transparent: true, opacity: .35, side: THREE.DoubleSide });
  const res = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.6, 1.8, 48, 1, true), resM); res.position.y = 1.6; root.add(res);
  const resFloor = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, .08, 48), Mat({ color: 0xdde4ea, transparent: true, opacity: .6 })); resFloor.position.y = .7; root.add(resFloor);
  // tap water in the reservoir (slightly cloudy) — level drops over time
  const tapM = Mat({ color: 0x8fb4c8, emissive: 0x405060, emissiveIntensity: .2, transparent: true, opacity: .55 });
  const tap = new THREE.Mesh(new THREE.CylinderGeometry(1.85, 1.62, 1.0, 40), tapM); root.add(tap);
  // cartridge: capsule through the reservoir floor, y -1.0 .. 1.9, cutaway layers
  const cartM = Mat({ color: 0xffffff, transparent: true, opacity: .9, side: THREE.DoubleSide });
  const cart = new THREE.Mesh(new THREE.CylinderGeometry(.62, .5, 2.9, 32, 1, true), cartM); cart.position.y = .45; root.add(cart);
  const cartCap = new THREE.Mesh(new THREE.SphereGeometry(.62, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), Mat({ color: 0xffffff })); cartCap.position.y = 1.9; root.add(cartCap);
  // mesh layer at the top (wireframe disc)
  const meshM = new THREE.MeshBasicMaterial({ color: 0x99a6b4, wireframe: true });
  const meshL = new THREE.Mesh(new THREE.CylinderGeometry(.58, .58, .12, 16, 1), meshM); meshL.position.y = 1.65; root.add(meshL);
  const meshGlowM = Mat({ color: 0xc0d0e0, emissive: 0xffffff, emissiveIntensity: 0, transparent: true, opacity: .4 });
  const meshGlow = new THREE.Mesh(new THREE.CylinderGeometry(.57, .57, .1, 24), meshGlowM); meshGlow.position.y = 1.65; root.add(meshGlow);
  // carbon granules y .55..1.5, resin beads y -.85..0.45
  const carbM = Mat({ color: 0x1a1a1a, emissive: 0x30ff90, emissiveIntensity: 0, shininess: 10 });
  const carbG = new THREE.DodecahedronGeometry(.08, 0);
  const carbon = []; for (let i = 0; i < 140; i++) { const r = Math.sqrt(rnd()) * .5, a = rnd() * 6.283; const m = new THREE.Mesh(carbG, carbM); m.position.set(Math.cos(a) * r, .6 + rnd() * .9, Math.sin(a) * r); m.rotation.set(rnd() * 3, rnd() * 3, 0); root.add(m); carbon.push(m); }
  const resinM = Mat({ color: 0xf0b030, emissive: 0xffa000, emissiveIntensity: 0, shininess: 120 });
  const resinG = new THREE.SphereGeometry(.075, 10, 8);
  const resin = []; for (let i = 0; i < 140; i++) { const r = Math.sqrt(rnd()) * .46, a = rnd() * 6.283; const m = new THREE.Mesh(resinG, resinM); m.position.set(Math.cos(a) * r, -.8 + rnd() * 1.2, Math.sin(a) * r); root.add(m); resin.push(m); }
  // lower jug clean water level rises
  const cleanM = Mat({ color: 0x40b0ff, emissive: 0x1080ff, emissiveIntensity: .3, transparent: true, opacity: .7 });
  const clean = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.75, 1, 40), cleanM); root.add(clean);

  // contaminants: grit (brown, stop at mesh), chlorine (green, stop in carbon), lead (grey, stop in resin)
  const types = [
    { n: 18, r: .07, c: 0x8a5a30, stop: 1.72 },
    { n: 26, r: .045, c: 0x60ff60, stop: 1.0 },
    { n: 22, r: .05, c: 0x8090a0, stop: -.2 },
  ];
  const parts = [];
  types.forEach((ty, ti) => { const m0 = Mat({ color: ty.c, emissive: ty.c, emissiveIntensity: .5 });
    for (let i = 0; i < ty.n; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(ty.r, 8, 6), m0); const r = Math.sqrt(rnd()) * .45, a = rnd() * 6.283;
      m.userData = { ti, x: Math.cos(a) * r, z: Math.sin(a) * r, o: rnd(), stop: ty.stop + (rnd() - .5) * .25 }; root.add(m); parts.push(m); } });
  // swapped-in ions (small white sparks leaving the resin) and clean water droplets
  const ionM = Mat({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: .8 });
  const ions = Array.from({ length: 20 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(.03, 6, 4), ionM); m.userData = { x: (rnd() - .5) * .7, z: (rnd() - .5) * .7, o: rnd() }; root.add(m); return m; });
  const dropM = Mat({ color: 0x55c0ff, emissive: 0x2090ff, emissiveIntensity: .6 });
  const drops = Array.from({ length: 30 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 6), dropM); m.userData = { x: (rnd() - .5) * .5, z: (rnd() - .5) * .5, o: rnd() }; root.add(m); return m; });
  // flow arrows (gravity) inside the cartridge
  const flowM = new THREE.MeshBasicMaterial({ color: 0x9fe0ff, transparent: true, opacity: .8 });
  const flows = Array.from({ length: 40 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(.035, 6, 4), flowM); const r = Math.sqrt(rnd()) * .5, a = rnd() * 6.283; m.userData = { x: Math.cos(a) * r, z: Math.sin(a) * r, o: rnd() }; root.add(m); return m; });

  const shots = [
    [[2.2, 1.0, 13.5], [0, -.2, 0]],      // 0 wide
    [[3.5, 1.5, 8.5], [0, .5, 0]],        // 1 gravity
    [[1.6, 3.4, 3.2], [0, 1.6, 0]],       // 2 mesh from above
    [[2.0, 1.4, 3.6], [0, 1.0, 0]],       // 3 carbon
    [[2.0, -.1, 3.6], [0, -.2, 0]],       // 4 resin
    [[3.5, -.6, 8.0], [0, -1.6, 0]],      // 5 clean water
    [[2.2, 1.0, 13.5], [0, -.2, 0]],      // 6 recap
  ];
  const cp = { p: V(), q: V() };
  function update(t, si, lt, sd) {
    const pulse = .5 + .5 * Math.sin(t * 6);
    const inside = si >= 2 && si <= 4;
    cartM.opacity = inside ? .12 : .85; jugM.opacity = inside ? .1 : .25; resM.opacity = inside ? .12 : .35;
    meshGlowM.emissiveIntensity = si === 2 ? .3 + .3 * pulse : 0;
    carbM.emissiveIntensity = si === 3 ? .15 + .2 * pulse : 0;
    resinM.emissiveIntensity = si === 4 ? .25 + .25 * pulse : .05;
    // overall progress: reservoir empties, jug fills
    const prog = Math.min(1, t / 45);
    const tl = lerp(1.6, .5, prog); tap.scale.y = tl; tap.position.y = .74 + tl / 2;
    const cl = lerp(.4, 1.8, si === 5 ? Math.min(1, prog + ease(lt / sd) * .2) : prog); clean.scale.y = cl; clean.position.y = -2.9 + cl / 2;
    // contaminants fall and stop at their layer
    parts.forEach(m => { const u = m.userData, k = (u.o + t * .2) % 1; const y = Math.max(u.stop, lerp(2.3, -1, k));
      m.position.set(u.x, y, u.z);
      m.visible = si === 0 || si === 6 || si === 1 || (si === 2 && u.ti === 0) || (si === 3 && u.ti === 1) || (si === 4 && u.ti === 2) || si === 5; });
    ions.forEach(m => { const u = m.userData, k = (u.o + t * .5) % 1; m.position.set(u.x * (1 - k * .3), lerp(-.2, -.95, k), u.z); m.visible = si === 4; });
    flows.forEach(m => { const u = m.userData, k = (u.o + t * .3) % 1; m.position.set(u.x, lerp(2.2, -1.0, k), u.z); m.visible = si === 1; });
    drops.forEach(m => { const u = m.userData, k = (u.o + t * .8) % 1; m.position.set(u.x, lerp(-1.05, -2.9 + cl, k), u.z); m.visible = true; });
    // camera
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const kk = si === 0 ? 1 : ease(lt / 1.4);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], kk))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], kk)));
    const ob = Math.sin(t * .25) * .12, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(ob) - dz * Math.sin(ob), cp.p.y, cp.q.z + dz * Math.cos(ob) + dx * Math.sin(ob));
    camera.lookAt(cp.q);
  }
  return { update };
}
