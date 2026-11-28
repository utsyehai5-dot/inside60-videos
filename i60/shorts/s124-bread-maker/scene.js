// Inside 60 — Bread maker (cutaway). Steps: 0 hook ingredients in, 1 motor spins paddle, 2 gluten strands,
// 3 rest + warmth, dough rises, 4 heating element bakes, 5 timer chip runs stages / golden crust, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 70, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const rnd = (() => { let s = 91; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  scene.background = new THREE.Color(0x1a2130);
  scene.add(new THREE.HemisphereLight(0xfff4ea, 0x404050, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, .9); key.position.set(4, 9, 10); scene.add(key);
  const root = new THREE.Group(); scene.add(root);
  const counter = new THREE.Mesh(new THREE.BoxGeometry(18, .4, 9), Mat({ color: 0x57534e, shininess: 20 })); counter.position.y = -3.6; root.add(counter);

  // outer housing: back half solid + ghost front
  const shell = (m) => new THREE.Mesh(new THREE.BoxGeometry(7, 6.6, 5.6), m);
  const back = shell(Mat({ color: 0xe5e7eb, side: THREE.BackSide })); back.position.y = -.1; root.add(back);
  const ghost = shell(Mat({ color: 0xf1f5f9, transparent: true, opacity: .1, depthWrite: false })); ghost.position.y = -.1; root.add(ghost);
  // control panel with timer chip display
  const panel = new THREE.Mesh(new THREE.BoxGeometry(3.4, .2, 1.4), Mat({ color: 0x111827 })); panel.position.set(0, 3.3, 2.0); root.add(panel);
  const chipM = Mat({ color: 0x0f172a, emissive: 0x22c55e, emissiveIntensity: 0 });
  const chip = new THREE.Mesh(new THREE.BoxGeometry(1.1, .2, .7), chipM); chip.position.set(2.2, -2.75, 1.5); root.add(chip);
  for (let i = 0; i < 6; i++) for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(.08, .1, .25), Mat({ color: 0xd1d5db })); p.position.set(1.8 + i * .16, -2.75, 1.5 + s * .45); root.add(p); }
  // stage lights on panel: 4 (knead, rise, bake, done)
  const stageM = [0xfacc15, 0x60a5fa, 0xf97316, 0x22c55e].map(c => Mat({ color: 0x334155, emissive: c, emissiveIntensity: 0 }));
  stageM.forEach((m, i) => { const l = new THREE.Mesh(new THREE.SphereGeometry(.16, 12, 10), m); l.position.set(-1.2 + i * .8, 3.45, 2.2); root.add(l); });

  // loaf pan: open box, y -1.8..1.4
  const panM = Mat({ color: 0x9ca3af, shininess: 120, side: THREE.DoubleSide });
  const pw = 4.2, ph = 3.2, pd = 3.0, py = -.2;
  const wall = (w, h, d, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), panM); b.position.set(x, y, z); root.add(b); };
  wall(pw, .1, pd, 0, py - ph / 2, 0); wall(.1, ph, pd, -pw / 2, py, 0); wall(.1, ph, pd, pw / 2, py, 0); wall(pw, ph, .1, 0, py, -pd / 2);
  wall(pw, ph, .05, 0, py, pd / 2); panM.transparent = false;
  const frontGlass = root.children[root.children.length - 1]; frontGlass.material = Mat({ color: 0xcbd5e1, transparent: true, opacity: .15, depthWrite: false });
  // heating element ring around pan bottom
  const elM = Mat({ color: 0x57534e, emissive: 0xff3a00, emissiveIntensity: 0 });
  const ep = []; for (let i = 0; i <= 64; i++) { const a = i / 64 * Math.PI * 2; ep.push(V(Math.cos(a) * 2.9, -2.3, Math.sin(a) * 2.25)); }
  root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ep, true), 160, .1, 10, true), elM));
  // motor + belt + shaft
  const motorM = Mat({ color: 0x475569, emissive: 0x60a5fa, emissiveIntensity: 0 });
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, 1, 24), motorM); motor.position.set(-2.2, -2.9, .4); root.add(motor);
  const pulleyA = new THREE.Mesh(new THREE.CylinderGeometry(.35, .35, .2, 20), Mat({ color: 0xcbd5e1 })); pulleyA.position.set(-2.2, -2.35, .4); root.add(pulleyA);
  const pulleyB = new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, .2, 24), Mat({ color: 0xcbd5e1 })); pulleyB.position.set(0, -2.55, 0); root.add(pulleyB);
  const belt = new THREE.Mesh(new THREE.BoxGeometry(2.3, .12, .9), Mat({ color: 0x111827 })); belt.position.set(-1.1, -2.45, .2); belt.rotation.y = .18; root.add(belt);
  const spokes = new THREE.Mesh(new THREE.BoxGeometry(1.1, .22, .12), Mat({ color: 0xef4444 })); spokes.position.copy(pulleyB.position); root.add(spokes);
  // paddle
  const paddle = new THREE.Group(); paddle.position.set(0, py - ph / 2 + .05, 0); root.add(paddle);
  const padM = Mat({ color: 0x374151, emissive: 0xfacc15, emissiveIntensity: 0 });
  const blade = new THREE.Mesh(new THREE.BoxGeometry(1.8, .7, .14), padM); blade.position.y = .4; blade.rotation.z = .25; paddle.add(blade);
  paddle.add(new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, .8, 16), padM));

  // dough: squashed sphere that grows
  const doughM = Mat({ color: 0xfef3c7, emissive: 0xf59e0b, emissiveIntensity: 0, shininess: 30 });
  const dough = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), doughM); root.add(dough);
  // ingredients falling (step 0)
  const ingM = [Mat({ color: 0xffffff }), Mat({ color: 0x7dd3fc, emissive: 0x38bdf8, emissiveIntensity: .5, transparent: true, opacity: .8 }), Mat({ color: 0xd6a35c })];
  const ing = Array.from({ length: 60 }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 6), ingM[i % 3]); m.userData = { o: rnd(), x: (rnd() - .5) * 2.4, z: (rnd() - .5) * 1.6 }; root.add(m); return m; });
  // gluten strands: glowing tubes inside dough, stretched
  const glM = Mat({ color: 0xfde68a, emissive: 0xfacc15, emissiveIntensity: .9, transparent: true, opacity: 0 });
  const strands = Array.from({ length: 9 }, () => { const pts = []; const y = -1.2 + rnd() * .8, z = (rnd() - .5) * 1.6; for (let k = 0; k <= 8; k++) pts.push(V(-1.6 + k * .4, y + Math.sin(k * 1.3 + rnd()) * .15, z + (rnd() - .5) * .3)); const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, .035, 6, false), glM); root.add(m); return m; });
  // yeast bubbles (CO2) + warmth / heat particles
  const bubM = Mat({ color: 0xffffff, emissive: 0xbae6fd, emissiveIntensity: .6, transparent: true, opacity: .7 });
  const bubs = Array.from({ length: 40 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(.08, 8, 6), bubM); m.userData = { o: rnd(), x: (rnd() - .5) * 2.8, z: (rnd() - .5) * 1.8 }; root.add(m); return m; });
  const heatM = Mat({ color: 0xffa94d, emissive: 0xff6a00, emissiveIntensity: .9, transparent: true, opacity: .8, depthWrite: false });
  const heat = Array.from({ length: 70 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(.07, 6, 4), heatM); m.userData = { o: rnd(), a: rnd() * 6.283 }; root.add(m); return m; });

  const shots = [
    [[4, 4.5, 13.5], [0, 0, 0]],          // 0 wide
    [[3.2, -1.0, 7.0], [-.8, -2.2, 0]],   // 1 motor + paddle
    [[2.2, .8, 5.8], [0, -1.0, 0]],       // 2 gluten close
    [[3.0, 2.4, 8.5], [0, .2, 0]],        // 3 rise
    [[4.5, -.8, 8.5], [0, -1.4, 0]],      // 4 element
    [[4.6, -1.0, 7.0], [2.0, -2.4, 1.4]],  // 5 chip
    [[4, 4.5, 13.5], [0, 0, 0]],          // 6 recap
  ];
  const cp = { p: V(), q: V() };
  function update(t, si, lt, sd) {
    const pulse = .5 + .5 * Math.sin(t * 6);
    const prog = sd > 0 ? Math.min(1, lt / sd) : 0;
    const spin = si === 1 || si === 2 ? 5 : 0;
    paddle.rotation.y = spin ? t * spin : paddle.rotation.y; spokes.rotation.y = paddle.rotation.y; pulleyA.rotation.y = -paddle.rotation.y * 1.7;
    padM.emissiveIntensity = si === 1 ? .2 + .3 * pulse : 0;
    motorM.emissiveIntensity = si === 1 ? .3 + .3 * pulse : 0;
    // dough size: rises during 3, holds after
    const rise = si < 3 ? 0 : si === 3 ? ease(prog) : 1;
    const wob = spin ? .08 * Math.sin(t * 10) : 0;
    const bottom = py - ph / 2 + .05;
    const sx = lerp(1.5, 1.95, rise) + wob, sy = lerp(.75, 1.3, rise), sz = lerp(1.05, 1.4, rise) - wob;
    dough.scale.set(sx, sy, sz); dough.position.set(0, bottom + sy * .85, 0);
    if (si === 0) { const k = Math.min(1, lt / 3); dough.scale.multiplyScalar(lerp(.4, 1, k)); dough.position.y = bottom + sy * .85 * lerp(.4, 1, k); }
    // bake browning
    const brown = si < 4 ? 0 : si === 4 ? prog * .6 : si === 5 ? lerp(.6, 1, prog) : 1;
    doughM.color.setRGB(lerp(.99, .72, brown), lerp(.95, .40, brown), lerp(.78, .10, brown));
    doughM.emissiveIntensity = si === 4 ? .15 * pulse : 0;
    doughM.transparent = si === 2; doughM.opacity = si === 2 ? .45 : 1; doughM.depthWrite = si !== 2;
    elM.emissiveIntensity = si === 4 || si === 5 ? .7 + .3 * pulse : si === 3 ? .25 : 0;
    ing.forEach(m => { const u = m.userData, k = (u.o + t * .6) % 1; m.position.set(u.x, lerp(4.5, bottom + .5, k), u.z); m.visible = si === 0 && lt < 3.5; });
    glM.opacity = si === 2 ? Math.min(.95, lt / .8) : 0;
    strands.forEach((m, i) => { m.scale.x = 1 + .15 * Math.sin(t * 4 + i); });
    bubs.forEach(m => { const u = m.userData, k = (u.o + t * .3) % 1; m.position.set(u.x * sx / 2, bottom + .2 + k * sy * 1.5, u.z * sz / 2); m.scale.setScalar(.5 + k); m.visible = si === 3; });
    heat.forEach(m => { const u = m.userData, k = (u.o + t * .4) % 1; m.position.set(Math.cos(u.a) * 2.7, -2.2 + k * 3.8, Math.sin(u.a) * 2.0); m.visible = si === 3 || si === 4; m.scale.setScalar(si === 3 ? .6 : 1); });
    chipM.emissiveIntensity = si === 5 ? .4 + .5 * pulse : .1;
    const stage = si <= 2 ? 0 : si === 3 ? 1 : si === 4 ? 2 : 3;
    stageM.forEach((m, i) => m.emissiveIntensity = (si === 5 ? (i <= Math.floor(prog * 4)) : i === stage) ? 1 : 0);
    // camera
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const kk = si === 0 ? 1 : ease(lt / 1.4);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], kk))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], kk)));
    const ob = Math.sin(t * .25) * .08, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(ob) - dz * Math.sin(ob), cp.p.y, cp.q.z + dz * Math.cos(ob) + dx * Math.sin(ob));
    camera.lookAt(cp.q);
  }
  return { update };
}
