// Inside 60 — Dehumidifier (cutaway). Steps: 0 hook, 1 fan pulls damp air, 2 cold coil, 3 condensation,
// 4 drops into tank, 5 warm coil + dry air out, 6 recap
export async function setup({ THREE, scene, camera }) {
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 70, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const rnd = (() => { let s = 11; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  scene.background = new THREE.Color(0x1a2433);
  scene.add(new THREE.HemisphereLight(0xfff4ea, 0x404050, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, .9); key.position.set(5, 8, 10); scene.add(key);
  const root = new THREE.Group(); scene.add(root);
  const floor = new THREE.Mesh(new THREE.BoxGeometry(18, .3, 12), Mat({ color: 0xbfae90, shininess: 10 })); floor.position.y = -3.25; root.add(floor);
  const wall = new THREE.Mesh(new THREE.BoxGeometry(18, 14, .3), Mat({ color: 0x5a7f6e, shininess: 5 })); wall.position.set(0, 3, -4); root.add(wall);

  // housing: transparent shell (x -2..2, y -3.1..2.9, z -1.2..1.2)
  const shellM = Mat({ color: 0xf2f4f7, transparent: true, opacity: .3, side: THREE.DoubleSide, depthWrite: false });
  const shell = new THREE.Mesh(new RoundedBoxGeometry(4, 6, 2.4, 5, .3), shellM); shell.position.y = -.1; root.add(shell);
  const back = new THREE.Mesh(new RoundedBoxGeometry(4, 6, .15, 3, .05), Mat({ color: 0xdfe3ea })); back.position.set(0, -.1, -1.15); root.add(back);
  // intake grille (left) and outlet grille (top)
  const grM = Mat({ color: 0x6b7280 });
  for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.08, .1, 2.1), grM); b.position.set(-2.02, .3 + i * .35, 0); root.add(b); }
  for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.1, .08, 2.1), grM); b.position.set(-.9 + i * .36, 2.92, 0); root.add(b); }

  // cold coil (evaporator) at x -1.0, warm coil (reheat) at x .4 — serpentine tubes
  function coil(x, color, emissive) {
    const m = Mat({ color, emissive, emissiveIntensity: .2 });
    const pts = []; for (let i = 0; i <= 8; i++) { const y = .2 + i * .28, z = (i % 2 ? 1 : -1) * .85; pts.push(V(x, y, -z), V(x, y, z)); }
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', .1), 200, .07, 8, false), m);
    root.add(tube);
    const fins = []; for (let i = 0; i < 12; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(.32, 2.4, .02), Mat({ color: 0xc8ced8, transparent: true, opacity: .6 })); f.position.set(x, 1.3, -.9 + i * .165); root.add(f); fins.push(f); }
    return m;
  }
  const coldM = coil(-1.0, 0x7fd3ff, 0x2aa8ff);
  const warmM = coil(.4, 0xff9a50, 0xff5a10);
  // fan at x 1.3 (spins in yz plane), blows air up/out
  const fan = new THREE.Group(); fan.position.set(1.35, 1.4, 0); root.add(fan);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, .25, 20), Mat({ color: 0x374151 })); hub.rotation.z = Math.PI / 2; fan.add(hub);
  for (let i = 0; i < 5; i++) { const bl = new THREE.Mesh(new THREE.BoxGeometry(.04, .85, .35), Mat({ color: 0x3b82f6 })); bl.position.y = .45; const g = new THREE.Group(); g.rotation.x = i * Math.PI * 2 / 5; bl.rotation.y = .4; g.add(bl); fan.add(g); }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.0, .05, 8, 40), Mat({ color: 0x6b7280 })); ring.rotation.y = Math.PI / 2; ring.position.copy(fan.position); root.add(ring);
  // compressor (bottom right) and refrigerant line
  const comp = new THREE.Mesh(new THREE.CylinderGeometry(.45, .45, 1.0, 24), Mat({ color: 0x334155, emissive: 0x60a5fa, emissiveIntensity: 0 })); comp.position.set(1.1, -.4, 0); root.add(comp);
  const lineM = Mat({ color: 0x9ca3af, emissive: 0x38bdf8, emissiveIntensity: 0 });
  const line = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(1.1, .1, .3), V(.4, -.05, .6), V(-1.0, -.05, .6), V(-1.0, .2, .85)]), 40, .045, 6, false), lineM); root.add(line);
  // drip tray + tank (y -3.0 .. -1.2)
  const tray = new THREE.Mesh(new THREE.BoxGeometry(1.0, .08, 2.0), Mat({ color: 0x94a3b8 })); tray.position.set(-1.0, -.05, 0); root.add(tray);
  const tankM = Mat({ color: 0xe5e7eb, transparent: true, opacity: .35, side: THREE.DoubleSide, depthWrite: false });
  const tank = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.7, 2.0, 1, 1, 1), tankM); tank.position.set(0, -2.15, 0); root.add(tank);
  const waterM = Mat({ color: 0x3aa0ff, emissive: 0x1070ff, emissiveIntensity: .35, transparent: true, opacity: .8 });
  const water = new THREE.Mesh(new THREE.BoxGeometry(3.3, 1, 1.9), waterM); root.add(water);
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 1.1, 8), Mat({ color: 0x94a3b8 })); pipe.position.set(-1.0, -.65, 0); root.add(pipe);

  // particles: damp air (pale blue, in from left), vapour on coil -> drops, dry warm air (orange, out top)
  const dampM = Mat({ color: 0xbfe6ff, emissive: 0x7cc8ff, emissiveIntensity: .5, transparent: true, opacity: .8 });
  const dryM = Mat({ color: 0xffd0a0, emissive: 0xff9040, emissiveIntensity: .6, transparent: true, opacity: .85 });
  const mk = (m, r) => new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), m);
  const damp = Array.from({ length: 50 }, () => { const s = mk(dampM, .07); s.userData = { y: .4 + rnd() * 2.2, z: (rnd() - .5) * 1.8, o: rnd() }; root.add(s); return s; });
  const dry = Array.from({ length: 40 }, () => { const s = mk(dryM, .06); s.userData = { z: (rnd() - .5) * 1.8, o: rnd(), x: (rnd() - .5) * 1.4 }; root.add(s); return s; });
  const beadM = Mat({ color: 0x8fd0ff, emissive: 0x40a0ff, emissiveIntensity: .7 });
  const beads = Array.from({ length: 60 }, () => { const s = mk(beadM, .05); s.userData = { y: .3 + rnd() * 2.3, z: (rnd() - .5) * 1.7, o: rnd() }; root.add(s); return s; });
  const dropM = Mat({ color: 0x4fb4ff, emissive: 0x2090ff, emissiveIntensity: .7 });
  const drops = Array.from({ length: 24 }, () => { const s = mk(dropM, .07); s.scale.y = 1.4; s.userData = { o: rnd(), z: (rnd() - .5) * .3 }; root.add(s); return s; });

  const shots = [
    [[4.5, 1.2, 13.5], [0, -.2, 0]],    // 0 wide
    [[-5.5, 1.8, 7.0], [-1.4, 1.2, 0]], // 1 intake / fan pull
    [[-2.6, 1.6, 4.2], [-1.0, 1.3, 0]], // 2 cold coil
    [[-1.8, 1.4, 3.0], [-1.0, 1.2, 0]], // 3 condensation close
    [[-1.5, -.6, 5.2], [-.5, -1.4, 0]], // 4 tank
    [[2.6, 2.6, 5.2], [.8, 1.6, 0]],    // 5 warm coil / outlet
    [[4.5, 1.2, 13.5], [0, -.2, 0]],    // 6 recap
  ];
  const cp = { p: V(), q: V() };
  function update(t, si, lt, sd) {
    const pulse = .5 + .5 * Math.sin(t * 6);
    fan.rotation.x = t * 14;
    coldM.emissiveIntensity = si === 2 || si === 3 ? .5 + .4 * pulse : .25;
    warmM.emissiveIntensity = si === 5 ? .5 + .4 * pulse : .25;
    comp.material.emissiveIntensity = si === 2 ? .3 + .3 * pulse : 0;
    lineM.emissiveIntensity = si === 2 ? .4 + .4 * pulse : 0;
    shellM.opacity = si >= 1 && si <= 5 ? .12 : .3;
    // damp air: from x -4 to coil at -1.0 then fade
    damp.forEach(m => { const u = m.userData, k = (u.o + t * .35) % 1; m.position.set(lerp(-4.2, -1.0, k), u.y, u.z); m.scale.setScalar(k > .9 ? (1 - k) * 10 : 1); });
    // dry air: after warm coil, through fan, up out of top grille
    dry.forEach(m => { const u = m.userData, k = (u.o + t * .35) % 1;
      if (k < .45) m.position.set(lerp(.5, 1.3, k / .45), 1.3 + (u.x * .8), u.z); else m.position.set(lerp(1.0, .2, (k - .45) / .55) + u.x * .3, lerp(1.6, 4.4, (k - .45) / .55), u.z); });
    // condensation beads on coil grow, slide down
    beads.forEach(m => { const u = m.userData, k = (u.o + t * .25) % 1; m.position.set(-1.0 + .17, u.y - k * .6, u.z); m.scale.setScalar(.4 + k * (si === 3 ? 1.4 : .9)); m.visible = si >= 2; });
    // drops fall from tray into tank
    const lvl = lerp(.25, 1.35, Math.min(1, t / 46) + (si === 4 ? ease(lt / sd) * .1 : 0));
    water.scale.y = lvl; water.position.set(0, -2.95 + lvl / 2, 0);
    drops.forEach(m => { const u = m.userData, k = (u.o + t * .9) % 1; m.position.set(-1.0, lerp(-1.2, -2.95 + lvl, k), u.z); m.visible = si >= 3; });
    // camera
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const kk = si === 0 ? 1 : ease(lt / 1.4);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], kk))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], kk)));
    const ob = Math.sin(t * .25) * .1, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(ob) - dz * Math.sin(ob), cp.p.y, cp.q.z + dz * Math.cos(ob) + dx * Math.sin(ob));
    camera.lookAt(cp.q);
  }
  return { update };
}
