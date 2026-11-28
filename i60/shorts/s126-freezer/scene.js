// Inside 60 — Freezer. Steps: 0 hook (heat pumped out), 1 evaporator absorbs heat, 2 compressor squeezes,
// 3 condenser releases heat outside, 4 expansion valve -> cold, 5 fan + thermostat, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 70, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const rnd = (() => { let s = 53; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  scene.background = new THREE.Color(0x18202c);
  scene.add(new THREE.HemisphereLight(0xf0f6ff, 0x3a404c, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, .9); key.position.set(6, 9, 10); scene.add(key);
  const root = new THREE.Group(); scene.add(root); root.scale.setScalar(.75);
  const floor = new THREE.Mesh(new THREE.BoxGeometry(16, .3, 10), Mat({ color: 0x475569, shininess: 15 })); floor.position.y = -4.6; root.add(floor);

  // cabinet: inner back wall solid, ghost shell
  const W = 5, H = 7.6, D = 4.2, cy = -.6;
  const inner = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), Mat({ color: 0xe2e8f0, side: THREE.BackSide })); inner.position.y = cy; root.add(inner);
  const ghost = new THREE.Mesh(new THREE.BoxGeometry(W + .3, H + .3, D + .3), Mat({ color: 0xf8fafc, transparent: true, opacity: .1, depthWrite: false })); ghost.position.y = cy; root.add(ghost);
  // shelves + food
  const shelfM = Mat({ color: 0xcbd5e1, transparent: true, opacity: .6 });
  [-2.2, .2].forEach(y => { const s = new THREE.Mesh(new THREE.BoxGeometry(W - .2, .08, D - .4), shelfM); s.position.set(0, y, .2); root.add(s); });
  const foodCols = [0xef4444, 0x22c55e, 0xf59e0b, 0x3b82f6, 0xa855f7, 0xf97316];
  const foodM = foodCols.map(c => Mat({ color: c, emissive: 0xff5500, emissiveIntensity: 0 }));
  const foods = [];
  [[-1.4, -1.8], [.1, -1.85], [1.4, -1.75], [-1.1, .6], [.6, .65], [1.5, .55], [-.6, -3.8], [.9, -3.85]].forEach(([x, y], i) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(.9 + rnd() * .3, .7 + rnd() * .4, 1.1), foodM[i % 6]); m.position.set(x, y + .1, .6 + rnd() * .5); root.add(m); foods.push(m);
  });

  // refrigerant loop as polyline with segments: 0 evaporator, 1 suction line, 2 compressor->condenser, 3 condenser, 4 liquid line + valve
  const segs = [[], [], [], [], []];
  const zE = -D / 2 + .25, zC = -D / 2 - .45;
  // evaporator zigzag on inner back wall, top to bottom
  for (let r = 0; r < 6; r++) { const y = 2.6 - r * .55, a = r % 2 ? 1.9 : -1.9; segs[0].push(V(a, y, zE), V(-a, y, zE)); }
  segs[1].push(V(1.9, -.15, zE), V(2.2, -.4, zE - .3), V(2.0, -3.6, zC - .3), V(1.4, -3.9, zC - .6));
  segs[2].push(V(1.4, -3.9, zC - .6), V(1.4, -3.0, zC - .6), V(1.9, -2.6, zC));
  for (let r = 0; r < 8; r++) { const y = -2.6 + r * .7, a = r % 2 ? -1.9 : 1.9; segs[3].push(V(a, y, zC), V(-a, y, zC)); }
  segs[4].push(V(1.9, 2.3, zC), V(2.3, 2.6, zC), V(2.3, 3.0, zC + .2), V(2.0, 3.2, zE - .2), V(-1.9, 3.2, zE), V(-1.9, 2.6, zE));
  const segCol = [0x38bdf8, 0x60a5fa, 0xf97316, 0xef4444, 0x93c5fd];
  const pipeM = segCol.map(c => Mat({ color: 0x94a3b8, emissive: c, emissiveIntensity: 0 }));
  segs.forEach((pts, i) => { const c = new THREE.CurvePath(); for (let k = 0; k < pts.length - 1; k++) c.add(new THREE.LineCurve3(pts[k], pts[k + 1])); root.add(new THREE.Mesh(new THREE.TubeGeometry(c, pts.length * 12, .07, 8, false), pipeM[i])); });
  // flat polyline for particles
  const poly = [], tag = []; segs.forEach((pts, i) => pts.forEach(p => { poly.push(p); tag.push(i); }));
  const cum = [0]; for (let k = 1; k < poly.length; k++) cum.push(cum[k - 1] + poly[k].distanceTo(poly[k - 1]));
  const L = cum[cum.length - 1] + poly[0].distanceTo(poly[poly.length - 1]);
  const at = (s, out) => { s = ((s % L) + L) % L; let k = 0; while (k < cum.length - 1 && cum[k + 1] < s) k++; const a = poly[k], b = poly[(k + 1) % poly.length], seg = (cum[k + 1] ?? L) - cum[k]; out.lerpVectors(a, b, seg > 0 ? (s - cum[k]) / seg : 0); return tag[k]; };
  const partCol = [0xbae6fd, 0x93c5fd, 0xfb923c, 0xf87171, 0x7dd3fc];
  const pm = partCol.map(c => Mat({ color: c, emissive: c, emissiveIntensity: .9 }));
  const parts = Array.from({ length: 120 }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 6), pm[0]); m.userData = { s: i / 120 * L }; root.add(m); return m; });

  // compressor (dome) + valve + fan + thermostat
  const compM = Mat({ color: 0x1f2937, emissive: 0xf97316, emissiveIntensity: 0 });
  const comp = new THREE.Mesh(new THREE.CapsuleGeometry(.65, .8, 8, 20), compM); comp.position.set(1.4, -3.6, zC - .6); root.add(comp);
  const valveM = Mat({ color: 0xd1d5db, emissive: 0x38bdf8, emissiveIntensity: 0 });
  const valve = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .5, 16), valveM); valve.rotation.z = Math.PI / 2; valve.position.set(-1.2, 3.2, zE - .1); root.add(valve);
  const fan = new THREE.Group(); fan.position.set(1.1, 2.0, zE + .45); root.add(fan);
  const fanM = Mat({ color: 0x64748b, emissive: 0x7dd3fc, emissiveIntensity: 0 });
  for (let b = 0; b < 4; b++) { const bl = new THREE.Mesh(new THREE.BoxGeometry(.18, .7, .04), fanM); bl.position.y = .35; const g = new THREE.Group(); g.rotation.z = b * Math.PI / 2; g.add(bl); bl.rotation.y = .4; fan.add(g); }
  fan.add(new THREE.Mesh(new THREE.CylinderGeometry(.15, .15, .15, 12).rotateX(Math.PI / 2), fanM));
  const thM = Mat({ color: 0x0f172a, emissive: 0x22c55e, emissiveIntensity: 0 });
  const thermo = new THREE.Mesh(new THREE.BoxGeometry(.7, .45, .15), thM); thermo.position.set(-1.5, 1.95, zE + .2); root.add(thermo);

  // heat particles: from food to evaporator (inside), and out from condenser (outside, warm)
  const hM = Mat({ color: 0xffb347, emissive: 0xff6a00, emissiveIntensity: .9, transparent: true, opacity: .85, depthWrite: false });
  const heatIn = Array.from({ length: 50 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(.08, 6, 4), hM); m.userData = { o: rnd(), f: Math.floor(rnd() * foods.length), x: (rnd() - .5) * 3.6, y: rnd() * 3 - .3 }; root.add(m); return m; });
  const heatOut = Array.from({ length: 60 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(.1, 6, 4), hM); m.userData = { o: rnd(), x: (rnd() - .5) * 3.8, y: -2.6 + rnd() * 5 }; root.add(m); return m; });
  const cM = Mat({ color: 0xe0f2fe, emissive: 0x93c5fd, emissiveIntensity: .8, transparent: true, opacity: .75, depthWrite: false });
  const cold = Array.from({ length: 50 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(.07, 6, 4), cM); m.userData = { o: rnd(), a: (rnd() - .5) * 2.2, b: (rnd() - .5) * 1.2 }; root.add(m); return m; });

  const S = .75;
  const shots = [
    [[7, 3, 13], [0, -.6, 0]],          // 0 wide front-right
    [[3.5, 2.2, 6.5], [0, .8, -1.4]],     // 1 evaporator inside
    [[9, -1.2, -10], [1, -2.8, -2.6]],   // 2 compressor from back
    [[3.5, .5, -15], [0, -.3, -2.6]],        // 3 condenser back
    [[-4, 5.2, 4.5], [-1.2, 3.0, -1.8]],       // 4 valve top
    [[1.5, 5.2, 6.5], [-.2, 1.9, -1.6]],        // 5 fan + thermostat
    [[7, 3, 13], [0, -.6, 0]],            // 6 recap
  ].map(s => [s[0].map(v => v * S), s[1].map(v => v * S)]);
  const cp = { p: V(), q: V() }, tmp = V();
  function update(t, si, lt, sd) {
    const pulse = .5 + .5 * Math.sin(t * 6);
    const hi = [si === 1, si === 2, si === 2, si === 3, si === 4];
    pipeM.forEach((m, i) => m.emissiveIntensity = si === 0 || si === 6 ? .35 : hi[i] ? .6 + .4 * pulse : .12);
    const speed = si === 5 && Math.sin(t * .8) < -.6 ? 0 : 2.2;
    parts.forEach(m => { const u = m.userData; const g = at(u.s + t * speed, tmp); m.position.copy(tmp); m.material = pm[g]; m.scale.setScalar(g === 2 || g === 3 ? 1.1 : .8); });
    compM.emissiveIntensity = si === 2 ? .5 + .4 * pulse : si === 5 ? (speed ? .3 : 0) : .1;
    comp.position.x = 1.4 + (si === 2 ? Math.sin(t * 60) * .015 : 0);
    valveM.emissiveIntensity = si === 4 ? .7 + .3 * pulse : 0;
    fan.rotation.z = t * (si >= 5 || si === 0 ? 14 : 4); fanM.emissiveIntensity = si === 5 ? .4 : 0;
    thM.emissiveIntensity = si === 5 ? .6 + .4 * pulse : .1;
    foodM.forEach(m => m.emissiveIntensity = si === 1 ? .2 * pulse : 0);
    heatIn.forEach(m => { const u = m.userData, k = (u.o + t * .45) % 1, f = foods[u.f].position; m.position.set(lerp(f.x, u.x, k), lerp(f.y, u.y, k), lerp(f.z, zE + .1, k)); m.visible = si === 0 || si === 1; m.scale.setScalar(1 - k * .6); });
    heatOut.forEach(m => { const u = m.userData, k = (u.o + t * .5) % 1; m.position.set(u.x, u.y + k * 1.2, zC - .2 - k * 2.4); m.visible = si === 0 || si === 3 || si === 6; m.scale.setScalar(1.2 - k); });
    cold.forEach(m => { const u = m.userData, k = (u.o + t * .4) % 1; m.position.set(1.1 + u.a, 2.0 - k * 5, zE + .5 + k * 2.6 + u.b * .3); m.visible = si === 5 || si === 4; });
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const kk = si === 0 ? 1 : ease(lt / 1.4);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], kk))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], kk)));
    const ob = Math.sin(t * .25) * .08, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(ob) - dz * Math.sin(ob), cp.p.y, cp.q.z + dz * Math.cos(ob) + dx * Math.sin(ob));
    camera.lookAt(cp.q);
  }
  return { update };
}
