// Inside 60 — Robot vacuum. Steps: 0 hook (room + laser), 1 lidar pulses, 2 map + lane path, 3 side brushes,
// 4 suction into bin (cutaway), 5 cliff sensor at stair edge + dock, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x1a2034);
  scene.add(new THREE.HemisphereLight(0xfff4ea, 0x404050, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, .9); key.position.set(5, 10, 8); scene.add(key);
  const root = new THREE.Group(); scene.add(root);

  // room: floor, two walls, a sofa block, a table, a stair drop at front-right
  const floorM = Mat({ color: 0xd8c4a0, shininess: 20 });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(14, .3, 9), floorM); floor.position.set(-1, -.15, -1.5); root.add(floor);
  const step = new THREE.Mesh(new THREE.BoxGeometry(4, .3, 9), floorM); step.position.set(8, -1.15, -1.5); root.add(step); // lower landing
  const wallM = Mat({ color: 0x7a90a8, shininess: 5 });
  const w1 = new THREE.Mesh(new THREE.BoxGeometry(14, 3, .3), wallM); w1.position.set(-1, 1.5, -6); root.add(w1);
  const w2 = new THREE.Mesh(new THREE.BoxGeometry(.3, 3, 9), wallM); w2.position.set(-8, 1.5, -1.5); root.add(w2);
  const sofa = new THREE.Mesh(new THREE.BoxGeometry(4, 1.2, 1.6), Mat({ color: 0xd06050, shininess: 10 })); sofa.position.set(-4.5, .6, -4.8); root.add(sofa);
  const tbl = new THREE.Mesh(new THREE.BoxGeometry(2, .15, 1.2), Mat({ color: 0x8a5a30 })); tbl.position.set(1.5, 1.0, -3.5); root.add(tbl);
  [[.7, -3], [2.3, -3], [.7, -4], [2.3, -4]].forEach(([x, z]) => { const l = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, 1, 8), Mat({ color: 0x8a5a30 })); l.position.set(x, .5, z); root.add(l); });
  // dirt specks
  const dirtM = Mat({ color: 0x5a4030, shininess: 2 });
  const dirt = Array.from({ length: 60 }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(.05, 6, 4), dirtM); m.position.set(-6 + Math.random() * 11, .03, -5 + Math.random() * 7); root.add(m); return m; });
  // dock
  const dock = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, .5), Mat({ color: 0x334455, emissive: 0x22ff88, emissiveIntensity: .2 })); dock.position.set(-7.5, .5, 0); root.add(dock);

  // robot
  const bot = new THREE.Group(); root.add(bot);
  const shellM = Mat({ color: 0xf2f2f2, transparent: true, opacity: 1, shininess: 120 });
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, .35, 48), shellM); shell.position.y = .3; bot.add(shell);
  const bumper = new THREE.Mesh(new THREE.TorusGeometry(1.0, .06, 8, 40, Math.PI), Mat({ color: 0x333333 })); bumper.rotation.x = Math.PI / 2; bumper.rotation.z = -Math.PI / 2; bumper.position.y = .25; bot.add(bumper);
  const turretM = Mat({ color: 0x333a44, emissive: 0xff3040, emissiveIntensity: .2 });
  const turret = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .2, 24), turretM); turret.position.y = .57; bot.add(turret);
  // inside parts (visible when shell fades): bin, fan, main brush
  const bin = new THREE.Mesh(new THREE.BoxGeometry(.9, .25, .5), Mat({ color: 0x88ccff, transparent: true, opacity: .6 })); bin.position.set(-.35, .3, 0); bot.add(bin);
  const fanM = Mat({ color: 0xffcc33, emissive: 0xffaa00, emissiveIntensity: .2 });
  const fan = new THREE.Group(); fan.position.set(-.35, .3, .45); bot.add(fan);
  for (let i = 0; i < 6; i++) { const g = new THREE.Group(); g.rotation.y = i * Math.PI / 3; const b = new THREE.Mesh(new THREE.BoxGeometry(.25, .12, .05), fanM); b.position.x = .12; g.add(b); fan.add(g); }
  const mainBrush = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, 1.0, 12), Mat({ color: 0x40c070 })); mainBrush.rotation.x = Math.PI / 2; mainBrush.position.set(.25, .12, 0); bot.add(mainBrush);
  const sideBrushes = [-1, 1].map(s => { const g = new THREE.Group(); g.position.set(.75, .05, s * .55); bot.add(g);
    for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.5, .03, .04), Mat({ color: 0x3a7ae0 })); b.position.x = .25; const h = new THREE.Group(); h.rotation.y = i * 2.094; h.add(b); g.add(h); } g.userData.s = s; return g; });
  // cliff sensors: small glowing eyes under front edge
  const cliffM = Mat({ color: 0x440000, emissive: 0xff2020, emissiveIntensity: .1 });
  const cliffs = [-.6, 0, .6].map(z => { const m = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), cliffM); m.position.set(.85, .03, z); bot.add(m); return m; });
  const irM = new THREE.MeshBasicMaterial({ color: 0xff4040, transparent: true, opacity: .5 });
  const irBeam = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 1, 6), irM); bot.add(irBeam);

  // laser rays from turret
  const rayM = new THREE.MeshBasicMaterial({ color: 0xff3050, transparent: true, opacity: .8 });
  const rays = Array.from({ length: 24 }, () => { const m = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, 1, 4), rayM); root.add(m); return m; });
  const hitM = new THREE.MeshBasicMaterial({ color: 0x40ff90 });
  const mapDots = []; // grows over time
  const dotGeo = new THREE.SphereGeometry(.06, 6, 4);
  // walls as segments for ray hits (x-z rectangle + furniture)
  const boxes = [[-7.85, -5.85, 6.0, 3.0], [-6.5, -5.6, -2.5, -4.0], [.6, -4.1, 2.4, -2.9]]; // [x0,z0,x1,z1]
  const room = { x0: -7.85, x1: 6.0, z0: -5.85, z1: 3.0 };
  function cast(ox, oz, a) { const dx = Math.cos(a), dz = Math.sin(a); let tmin = 20;
    const tx = dx > 0 ? (room.x1 - ox) / dx : (room.x0 - ox) / dx, tz = dz > 0 ? (room.z1 - oz) / dz : (room.z0 - oz) / dz; tmin = Math.min(tx, tz);
    for (const b of boxes.slice(1)) { const [x0, z0, x1, z1] = b; let t0 = -1e9, t1 = 1e9;
      for (const [o, d, lo, hi] of [[ox, dx, x0, x1], [oz, dz, z0, z1]]) { if (Math.abs(d) < 1e-6) { if (o < lo || o > hi) { t0 = 1e9; } continue; } let a1 = (lo - o) / d, a2 = (hi - o) / d; if (a1 > a2) [a1, a2] = [a2, a1]; t0 = Math.max(t0, a1); t1 = Math.min(t1, a2); }
      if (t0 < t1 && t0 > 0) tmin = Math.min(tmin, t0); }
    return tmin; }
  // lawnmower path
  const path = []; for (let r = 0; r < 5; r++) { const z = 1.8 - r * .9, a = r % 2 ? 4.5 : -6.5, b = r % 2 ? -6.5 : 4.5; path.push(V(a, 0, z), V(b, 0, z)); }
  const pathC = new THREE.CatmullRomCurve3(path, false, 'catmullrom', .05);
  const trail = new THREE.Mesh(new THREE.TubeGeometry(pathC, 300, .05, 4, false), new THREE.MeshBasicMaterial({ color: 0x40ff90, transparent: true, opacity: .6 })); trail.position.y = .02; root.add(trail);
  // suction particles (in cutaway)
  const sucM = new THREE.MeshBasicMaterial({ color: 0x8a6a50 });
  const suc = Array.from({ length: 20 }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(.04, 6, 4), sucM); m.userData.o = i / 20; bot.add(m); return m; });

  const shots = [
    [[3, 9, 12], [-1, 0, -1.5]],          // 0 wide room
    [[1.2, 3.2, 4.5], [0, .4, 0]],        // 1 turret close (follows bot)
    [[-1, 21, 5.5], [-1, 0, -1.0]],       // 2 top-down map
    [[3.0, 1.4, 3.0], [.6, .1, 0]],       // 3 side brushes
    [[.8, 2.2, 3.4], [-.2, .3, 0]],       // 4 cutaway bin
    [[8, 2.5, 5], [5.6, -.2, -.5]],       // 5 stair edge
    [[3, 9, 12], [-1, 0, -1.5]],          // 6 recap
  ];
  const cp = { p: V(), q: V() };
  let lastSi = -1, mapT = 0;
  const tmpQ = V();
  function update(t, si, lt, sd) {
    const pulse = .5 + .5 * Math.sin(t * 6);
    // robot pose by step
    let bx, bz, ang;
    if (si === 5) { // drives toward stair edge, stops, backs off
      const k = Math.min(1, lt / (sd * .45)), back = Math.max(0, (lt - sd * .5) / (sd * .5));
      bx = lerp(2.5, 5.05, ease(k)) - back * 2.0; bz = -.5; ang = 0;
    } else if (si === 3 || si === 4 || si === 1) { const u = .12 + ((t * .01) % .1); const p = pathC.getPointAt(u), p2 = pathC.getPointAt(u + .002); bx = p.x; bz = p.z; ang = Math.atan2(-(p2.z - p.z), p2.x - p.x); }
    else { const u = (t * .03) % 1; const p = pathC.getPointAt(u), p2 = pathC.getPointAt(Math.min(1, u + .002)); bx = p.x; bz = p.z; ang = Math.atan2(-(p2.z - p.z), p2.x - p.x); }
    bot.position.set(bx, 0, bz); bot.rotation.y = ang;
    turret.rotation.y = t * 8; turretM.emissiveIntensity = si === 1 ? .8 : .3;
    sideBrushes.forEach(g => g.rotation.y = -g.userData.s * t * 9);
    mainBrush.rotation.y = t * 12; fan.rotation.y = t * 20; fanM.emissiveIntensity = si === 4 ? .7 : .2;
    shellM.opacity = si === 4 ? .18 : 1;
    // laser rays
    const showRays = si <= 2 || si === 6;
    rays.forEach((m, i) => { m.visible = showRays; if (!showRays) return; const a = t * 3 + i / rays.length * Math.PI * 2;
      const d = cast(bx, bz, a); m.scale.y = d; m.position.set(bx + Math.cos(a) * d / 2, .57, bz + Math.sin(a) * d / 2);
      m.rotation.set(0, -a, Math.PI / 2); });
    rayM.opacity = si === 1 ? .9 : .5;
    // map dots accumulate during steps 1-2
    if (si >= 1 && si <= 2 && mapDots.length < 600 && Math.floor(t * 30) % 1 === 0) {
      for (let j = 0; j < 4; j++) { const a = Math.random() * Math.PI * 2, d = cast(bx, bz, a); const m = new THREE.Mesh(dotGeo, hitM); m.position.set(bx + Math.cos(a) * d, .08, bz + Math.sin(a) * d); root.add(m); mapDots.push(m); } }
    mapDots.forEach(m => m.visible = si >= 1 && si <= 2 || si === 6);
    trail.visible = si === 2 || si === 6;
    // dirt disappears when robot passes
    dirt.forEach(m => { if (m.visible && Math.hypot(m.position.x - bx, m.position.z - bz) < 1.0 && si !== 0) m.visible = false; });
    // suction particles rise from main brush into bin
    suc.forEach(m => { const k = (m.userData.o + t * 1.2) % 1; m.visible = si === 4 || si === 3; m.position.set(lerp(.25, -.35, k), .1 + Math.sin(k * Math.PI) * .2, (m.userData.o - .5) * .6 * (1 - k)); });
    // cliff sensor
    const atEdge = si === 5 && bx > 4.6;
    cliffM.emissiveIntensity = si === 5 ? (atEdge ? .6 + .4 * pulse : .4) : .1;
    irBeam.visible = si === 5; const beamLen = atEdge ? 1.2 : .2; irBeam.scale.y = beamLen; irBeam.position.set(.85, .03 - beamLen / 2, 0);
    dock.material.emissiveIntensity = si === 5 || si === 6 ? .4 + .4 * pulse : .2;
    // camera (shots 1,3,4 follow the robot in its frame)
    const sp = (s, idx) => { const [p, q] = shots[idx]; if (idx === 1 || idx === 3 || idx === 4) { const c = Math.cos(ang), sn = Math.sin(ang);
        const rot = v => [bx + v[0] * c + v[2] * sn, v[1], bz - v[0] * sn + v[2] * c]; return [rot(p), rot(q)]; } return [p, q]; };
    const prev = sp(0, Math.max(0, si - 1)), now = sp(0, si);
    const kk = si === 0 ? 1 : ease(lt / 1.4);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], kk))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], kk)));
    const ob = (si === 1 || si === 3 || si === 4) ? 0 : Math.sin(t * .25) * .07, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(ob) - dz * Math.sin(ob), cp.p.y, cp.q.z + dz * Math.cos(ob) + dx * Math.sin(ob));
    camera.lookAt(cp.q);
  }
  return { update };
}
