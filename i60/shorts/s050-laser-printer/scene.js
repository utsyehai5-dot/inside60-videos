// Inside 60 — Laser printer. Steps: 0 hook (200C fuser), 1 drum charged, 2 laser erases charge, 3 toner sticks, 4 transfer to paper, 5 fuser melts, 6 recap
export async function setup({ THREE, scene, camera }) {
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const ss = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x555555, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x15203a); scene.fog = new THREE.Fog(0x15203a, 30, 70);
  scene.add(new THREE.HemisphereLight(0xf4f6ff, 0x40404c, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.9); key.position.set(6, 10, 9); scene.add(key);
  const rim = new THREE.DirectionalLight(0xa0c8ff, .7); rim.position.set(-6, -2, -6); scene.add(rim);

  // base / frame
  const frameM = Mat({ color: 0x3a3f4c, shininess: 50 });
  const base = new THREE.Mesh(new RoundedBoxGeometry(9, .5, 12, 3, .15), frameM); base.position.set(0, .15, .5); scene.add(base);
  const sideL = new THREE.Mesh(new RoundedBoxGeometry(.4, 4, 3.2, 2, .1), frameM); sideL.position.set(-3.6, 2.2, 0); scene.add(sideL);
  const sideR = sideL.clone(); sideR.position.x = 3.6; scene.add(sideR);

  // drum (axis along x, centre y=2.2, z=0)
  const DR = 1.2, DY = 2.2;
  const drumG = new THREE.Group(); drumG.position.set(0, DY, 0); scene.add(drumG);
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(DR, DR, 6.4, 48), Mat({ color: 0x2f8f5a, shininess: 120 }));
  drum.rotation.z = Math.PI / 2; drumG.add(drum);
  const capM = Mat({ color: 0xc0c6d0, shininess: 140 });
  [-3.25, 3.25].forEach(x => { const c = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, .2, 24), capM); c.rotation.z = Math.PI / 2; c.position.x = x; drumG.add(c); });
  // charge dots + toner grains on drum surface
  const NA = 28, NX = 26;
  const plusM = new THREE.MeshPhongMaterial({ color: 0xff4040, emissive: 0xff2020, emissiveIntensity: .6, transparent: true, opacity: 0 });
  const offM = new THREE.MeshPhongMaterial({ color: 0x60a0ff, emissive: 0x2050ff, emissiveIntensity: .5, transparent: true, opacity: 0 });
  const tonerM = Mat({ color: 0x151518, shininess: 30, transparent: true, opacity: 0 });
  const dotGeo = new THREE.SphereGeometry(.07, 8, 6), grainGeo = new THREE.SphereGeometry(.11, 8, 6);
  const isInk = (i, j) => { const row = j % 4; if (row === 3) return false; const len = 6 + ((j * 7) % 13); return i >= 3 && i < 3 + len; };
  const cells = [];
  for (let j = 0; j < NA; j++) for (let i = 0; i < NX; i++) {
    const a = j / NA * Math.PI * 2, x = -3 + i * (6 / (NX - 1));
    const p = V(x, Math.cos(a) * (DR + .03), Math.sin(a) * (DR + .03));
    const ink = isInk(i, j);
    const d = new THREE.Mesh(dotGeo, plusM); d.position.copy(p); drumG.add(d);
    let off = null, g = null;
    if (ink) {
      off = new THREE.Mesh(dotGeo, offM); off.position.copy(p); off.visible = false; drumG.add(off);
      g = new THREE.Mesh(grainGeo, tonerM); g.position.copy(p.clone().multiplyScalar(1.03)); g.visible = false; drumG.add(g);
    }
    cells.push({ d, off, g, a, ink });
  }

  // laser unit above, mirror + beam hitting drum top-back
  const lu = new THREE.Mesh(new RoundedBoxGeometry(7.6, .8, 2.2, 2, .12), Mat({ color: 0x4a5060 })); lu.position.set(0, 5.6, -1.4); scene.add(lu);
  const mirror = new THREE.Mesh(new THREE.CylinderGeometry(.4, .4, .3, 6), Mat({ color: 0xd0e0ff, shininess: 200, emissive: 0x203040 })); mirror.position.set(0, 5.0, -1.4); scene.add(mirror);
  const beamM = new THREE.MeshBasicMaterial({ color: 0xff3050, transparent: true, opacity: 0, depthWrite: false });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, 1, 8), beamM); scene.add(beam);
  const spotM = new THREE.MeshBasicMaterial({ color: 0xff8090, transparent: true, opacity: 0, depthWrite: false });
  const spot = new THREE.Mesh(new THREE.SphereGeometry(.18, 12, 8), spotM); scene.add(spot);
  const HIT = Math.PI * .25; // angle (from +y towards -z) where laser hits
  // charge roller (front-top)
  const cr = new THREE.Mesh(new THREE.CylinderGeometry(.35, .35, 6.2, 24), Mat({ color: 0x505868, emissive: 0xff2020, emissiveIntensity: 0 })); cr.rotation.z = Math.PI / 2; cr.position.set(0, DY + 1.1, 1.1); scene.add(cr);
  // toner hopper (back-low) with powder
  const hop = new THREE.Mesh(new RoundedBoxGeometry(6.4, 1.6, 1.8, 2, .15), Mat({ color: 0x2a2c34 })); hop.position.set(0, DY - .2, -2.3); scene.add(hop);
  const devRoll = new THREE.Mesh(new THREE.CylinderGeometry(.4, .4, 6.2, 24), Mat({ color: 0x202024 })); devRoll.rotation.z = Math.PI / 2; devRoll.position.set(0, DY - .5, -1.55); scene.add(devRoll);
  const puffs = [];
  for (let k = 0; k < 30; k++) { const m = new THREE.MeshBasicMaterial({ color: 0x303036, transparent: true, opacity: 0 }); const s = new THREE.Mesh(new THREE.SphereGeometry(.06, 6, 5), m); scene.add(s); puffs.push({ s, m, o: Math.random(), x: -3 + Math.random() * 6 }); }

  // paper: plane under drum, moving along +z, canvas texture painted with "text"
  const pc = document.createElement('canvas'); pc.width = 512; pc.height = 1024; const pg = pc.getContext('2d');
  pg.fillStyle = '#fbfbf6'; pg.fillRect(0, 0, 512, 1024);
  const ptex = new THREE.CanvasTexture(pc);
  const paperM = new THREE.MeshPhongMaterial({ map: ptex, shininess: 5 });
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 10.4), paperM); paper.rotation.x = -Math.PI / 2; scene.add(paper);
  const PY = DY - DR - .02;
  // fuser rollers at z = 4.6
  const FZ = 4.6;
  const fuseM = Mat({ color: 0x8a5030, emissive: 0xff5000, emissiveIntensity: 0, shininess: 100 });
  const fTop = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, 6.0, 32), fuseM); fTop.rotation.z = Math.PI / 2; fTop.position.set(0, PY + .57, FZ); scene.add(fTop);
  const fBot = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, 6.0, 32), Mat({ color: 0x404650 })); fBot.rotation.z = Math.PI / 2; fBot.position.set(0, PY - .52, FZ); scene.add(fBot);
  const heatM = new THREE.MeshBasicMaterial({ color: 0xff7a20, transparent: true, opacity: 0, depthWrite: false });
  const heat = new THREE.Mesh(new THREE.CylinderGeometry(.95, .95, 6.2, 24, 1, true), heatM); heat.rotation.z = Math.PI / 2; heat.position.copy(fTop.position); scene.add(heat);
  const wisps = [];
  for (let k = 0; k < 10; k++) { const m = new THREE.MeshBasicMaterial({ color: 0xffb070, transparent: true, opacity: 0, depthWrite: false }); const s = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 6), m); scene.add(s); wisps.push({ s, m, o: k / 10, x: -2.5 + k * .55 }); }

  const shots = [
    [[3.5, 3.4, 9.5], [0, PY + .3, FZ - .3]],      // 0 hook: fuser glow
    [[5.5, 4.6, 6.5], [0, DY, 0]],                  // 1 drum charged
    [[4.5, 7.2, 3.8], [0, DY + .6, -.6]],           // 2 laser
    [[5.8, 2.8, -5.5], [0, DY - .2, -1.0]],         // 3 toner (from back)
    [[6.5, 3.0, 5.5], [0, PY, 1.2]],                // 4 transfer
    [[3.0, 3.0, 9.5], [0, PY + .3, FZ]],            // 5 fuser
    [[7.5, 7.5, 10.5], [0, DY - .2, 1.5]],          // 6 recap
  ];
  const cp = { p: V(), q: V() };
  let painted = 0;
  function paintTo(rows) {
    for (let r = painted; r < rows; r++) {
      if (r % 4 === 3) continue;
      const len = 120 + ((r * 53) % 260);
      pg.fillStyle = '#141418'; pg.fillRect(60, 1000 - r * 22, len, 13);
    }
    painted = Math.max(painted, rows); ptex.needsUpdate = true;
  }
  function update(t, si, lt, sd) {
    const pulse = .5 + .5 * Math.sin(t * 6);
    const rot = t * .9; drumG.rotation.x = -rot;
    devRoll.rotation.x = rot * 2; fTop.rotation.x = -t * 2; fBot.rotation.x = t * 2; cr.rotation.x = rot * 3;
    const showCharge = si >= 1 ? 1 : 0, discharge = si >= 2, toner = si >= 3;
    plusM.opacity = showCharge * (si === 1 ? ss(0, 1, lt) : 1);
    offM.opacity = 1;
    cr.material.emissiveIntensity = si === 1 ? .5 + .5 * pulse : 0;
    // world angle of a surface point: a - rot? surface rotates with drumG.rotation.x=-rot
    // laser hit at world angle HIT measured from +y towards -z
    cells.forEach(c => {
      // world angle measured from +y toward +z: a - rot ; convert to "from +y toward -z": -(a - rot)
      let w = ((-(c.a - rot)) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2); // 0 at top, grows toward back
      const passedLaser = discharge && (si > 2 || w > HIT || lt > 3.2);
      if (c.ink) {
        const off = passedLaser;
        c.d.visible = !off; c.off.visible = off && !toner;
        // toner grains: after the developer roller (w beyond ~ .75 pi) in step 3; all on in 4+, removed at bottom (transfer) in 4+
        let g = false;
        if (si === 3) g = off && (w > Math.PI * .7 || lt > 3.4);
        if (si >= 4) g = !(w > Math.PI * .95 && w < Math.PI * 1.9) || si === 6;
        c.g.visible = toner && g;
        if (toner && !g) { c.off.visible = false; c.d.visible = false; }
      } else c.d.visible = true;
    });
    tonerM.opacity = toner ? 1 : 0;
    // laser beam
    const laserOn = si === 2 ? 1 : si === 6 ? .6 : 0;
    const bx = Math.sin(t * 9) * 2.9;
    const hit = V(bx, DY + Math.cos(HIT) * DR, -Math.sin(HIT) * DR);
    const from = V(bx * .15, 5.0, -1.4);
    beam.position.copy(from).add(hit).multiplyScalar(.5);
    beam.scale.y = from.distanceTo(hit); beam.lookAt(hit); beam.rotateX(Math.PI / 2);
    beamM.opacity = laserOn * (.75 + .25 * pulse); spot.position.copy(hit); spotM.opacity = laserOn;
    mirror.rotation.y = t * 8;
    // toner puffs from hopper toward drum
    puffs.forEach(p => { const k = (t * .8 + p.o) % 1; p.s.position.set(p.x, DY - .6 + k * .5, -2.0 + k * .7); p.m.opacity = si === 3 ? .9 * (1 - k) : 0; });
    // paper slides forward
    let pz = -2.5;
    if (si >= 4) pz = -2.5 + ss(0, Math.max(2, (sd || 6)), lt) * 3.5 + (si >= 5 ? 3.5 : 0);
    if (si === 6) pz = 4.5;
    paper.position.set(0, PY, pz);
    const rows = si >= 4 ? Math.floor((si === 4 ? ss(0, Math.max(2, (sd || 6)), lt) : 1) * 40) : 0;
    if (rows > painted) paintTo(rows);
    // fuser heat
    const hot = si === 0 || si === 5 ? 1 : si === 6 ? .5 : .15;
    fuseM.emissiveIntensity = hot * (.8 + .4 * pulse); heatM.opacity = hot * .25;
    wisps.forEach(w => { const k = (t * .6 + w.o) % 1; w.s.position.set(w.x, PY + .4 + k * 1.6, FZ + .9); w.m.opacity = (si === 0 || si === 5) ? .5 * (1 - k) : 0; });
    // camera
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const kk = si === 0 ? 1 : ease(lt / 1.4);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], kk))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], kk)));
    const o = Math.sin(t * .2) * .08, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o));
    camera.lookAt(cp.q);
  }
  return { update };
}
