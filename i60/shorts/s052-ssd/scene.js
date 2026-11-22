// Inside 60 — SSD. Steps: 0 hook (0 moving parts), 1 NAND chips, 2 cell = transistor + floating gate, 3 write: electrons tunnel + trapped, 4 read: current blocked = 1/0, 5 3D layers + controller wear leveling, 6 recap
export async function setup({ THREE, scene, camera }) {
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const ss = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x555555, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x101a30); scene.fog = new THREE.Fog(0x101a30, 30, 80);
  scene.add(new THREE.HemisphereLight(0xf4f6ff, 0x40404c, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.9); key.position.set(5, 10, 9); scene.add(key);
  const rim = new THREE.DirectionalLight(0xa0c8ff, .8); rim.position.set(-6, 2, -6); scene.add(rim);

  // ===== SSD board (x≈0) =====
  const bd = new THREE.Group(); scene.add(bd);
  const pcb = new THREE.Mesh(new RoundedBoxGeometry(10, .25, 3.2, 2, .08), Mat({ color: 0x1f6a46, shininess: 60 })); bd.add(pcb);
  // gold contacts
  for (let k = 0; k < 14; k++) { const c = new THREE.Mesh(new THREE.BoxGeometry(.16, .27, .55), Mat({ color: 0xe0b040, shininess: 160, emissive: 0x302000 })); c.position.set(-4.75, 0, -1.3 + k * .2); c.rotation.y = Math.PI / 2; bd.add(c); }
  // traces
  const trM = new THREE.MeshBasicMaterial({ color: 0x60e0a0, transparent: true, opacity: .25 });
  for (let k = 0; k < 6; k++) { const tr = new THREE.Mesh(new THREE.BoxGeometry(8.4, .02, .04), trM); tr.position.set(.4, .14, -1.3 + k * .52); bd.add(tr); }
  const chipM = Mat({ color: 0x1c1e24, shininess: 50 });
  const ctrl = new THREE.Mesh(new RoundedBoxGeometry(1.5, .3, 1.5, 2, .06), Mat({ color: 0x2a2c34, emissive: 0x2060ff, emissiveIntensity: 0, shininess: 90 })); ctrl.position.set(-2.8, .27, 0); bd.add(ctrl);
  const chips = [-.6, 1.6, 3.8].map(x => { const c = new THREE.Mesh(new RoundedBoxGeometry(1.9, .32, 2.3, 2, .06), chipM.clone()); c.position.set(x, .28, 0); bd.add(c); return c; });
  const chipGlowM = new THREE.MeshBasicMaterial({ color: 0x40ffd0, transparent: true, opacity: 0, depthWrite: false });
  // cell grid printed on chip tops
  const chipCells = [];
  chips.forEach(c => { for (let i = 0; i < 6; i++) for (let j = 0; j < 7; j++) { const m = new THREE.Mesh(new THREE.BoxGeometry(.16, .02, .16), chipGlowM); m.position.set(c.position.x - .7 + i * .28, .45, -.9 + j * .3); bd.add(m); chipCells.push(m); } });
  // data pulses controller -> chips
  const pulM = new THREE.MeshBasicMaterial({ color: 0x80e0ff, transparent: true, opacity: 0 });
  const puls = []; for (let k = 0; k < 9; k++) { const p = new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 6), pulM); bd.add(p); puls.push({ p, o: k / 9, tgt: k % 3, z: -.8 + (k % 3) * .8 }); }

  // ===== Cell cutaway (x = 22) =====
  const cl = new THREE.Group(); cl.position.set(22, 0, 0); scene.add(cl);
  const sub = new THREE.Mesh(new RoundedBoxGeometry(7, 1.2, 2.4, 2, .08), Mat({ color: 0x5a6070, shininess: 40 })); sub.position.y = -.6; cl.add(sub);
  const sdM = Mat({ color: 0xd06030, shininess: 60 });
  const src = new THREE.Mesh(new RoundedBoxGeometry(1.6, .5, 2.2, 2, .06), sdM); src.position.set(-2.4, .2, 0); cl.add(src);
  const drn = src.clone(); drn.position.x = 2.4; cl.add(drn);
  const oxM = new THREE.MeshPhongMaterial({ color: 0xe0f0ff, transparent: true, opacity: .35, shininess: 120, depthWrite: false });
  const ox1 = new THREE.Mesh(new THREE.BoxGeometry(3.0, .3, 2.0), oxM); ox1.position.y = .15; cl.add(ox1);
  const fgM = Mat({ color: 0xd8b040, emissive: 0x40e0ff, emissiveIntensity: 0, shininess: 120, transparent: true, opacity: .45, depthWrite: false });
  const fg = new THREE.Mesh(new RoundedBoxGeometry(3.0, .55, 2.0, 2, .06), fgM); fg.position.y = .6; cl.add(fg);
  const ox2 = new THREE.Mesh(new THREE.BoxGeometry(3.0, .3, 2.0), oxM); ox2.position.y = 1.05; cl.add(ox2);
  const cgM = Mat({ color: 0x3a70e0, emissive: 0x2050ff, emissiveIntensity: 0, shininess: 100 });
  const cg = new THREE.Mesh(new RoundedBoxGeometry(3.0, .6, 2.0, 2, .06), cgM); cg.position.y = 1.5; cl.add(cg);
  const fgRingM = new THREE.MeshBasicMaterial({ color: 0xffe060, transparent: true, opacity: 0, depthWrite: false });
  const fgRing = new THREE.Mesh(new THREE.BoxGeometry(3.3, .75, 2.3), fgRingM); fgRing.position.y = .6; cl.add(fgRing);
  // electrons
  const eM = new THREE.MeshBasicMaterial({ color: 0x70f0ff });
  const els = []; for (let k = 0; k < 14; k++) { const e = new THREE.Mesh(new THREE.SphereGeometry(.16, 10, 8), eM); cl.add(e); els.push({ e, o: k / 14, x: -1.2 + (k % 7) * .4, z: .55 + Math.floor(k / 7) * .35 }); }
  // channel current (read)
  const curM = new THREE.MeshBasicMaterial({ color: 0x80ff90, transparent: true, opacity: 0 });
  const cur = []; for (let k = 0; k < 10; k++) { const c = new THREE.Mesh(new THREE.SphereGeometry(.13, 8, 6), curM); cl.add(c); cur.push({ c, o: k / 10, z: .3 + (k % 3) * .35 }); }
  const blockM = new THREE.MeshBasicMaterial({ color: 0xff4050, transparent: true, opacity: 0, depthWrite: false });
  const block = new THREE.Mesh(new THREE.BoxGeometry(.25, .5, 2.2), blockM); block.position.set(0, -.15, 0); cl.add(block);
  // voltage bolt above control gate (write)
  const boltM = new THREE.MeshBasicMaterial({ color: 0xffe040, transparent: true, opacity: 0 });
  const bolt = new THREE.Mesh(new THREE.ConeGeometry(.3, .8, 4), boltM); bolt.rotation.z = Math.PI; bolt.position.set(0, 2.5, 0); cl.add(bolt);

  // ===== 3D layers (x = -22) =====
  const st = new THREE.Group(); st.position.set(-22, 0, 0); scene.add(st);
  const LAY = 8, NXY = 6;
  const layerMs = [];
  for (let l = 0; l < LAY; l++) {
    const m = Mat({ color: new THREE.Color().setHSL(.5 + l * .03, .7, .5), emissive: 0x103040, emissiveIntensity: .3, transparent: true, opacity: 0 });
    layerMs.push(m);
    for (let i = 0; i < NXY; i++) for (let j = 0; j < NXY; j++) { const c = new THREE.Mesh(new RoundedBoxGeometry(.42, .22, .42, 1, .04), m); c.position.set(-1.5 + i * .6, l * .38, -1.5 + j * .6); st.add(c); }
  }
  const ctrl2 = new THREE.Mesh(new RoundedBoxGeometry(1.4, .3, 1.4, 2, .06), Mat({ color: 0x2a2c34, emissive: 0x2060ff, emissiveIntensity: .8 })); ctrl2.position.set(3.4, 0, 0); st.add(ctrl2);
  const hiM = new THREE.MeshBasicMaterial({ color: 0xffe060, transparent: true, opacity: 0, depthWrite: false });
  const hi = new THREE.Mesh(new THREE.BoxGeometry(.55, .3, .55), hiM); st.add(hi);
  const wire = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, 1, 6), hiM); st.add(wire);

  const shots = [
    [[3.5, 6.5, 8.5], [.4, .2, 0]],          // 0 board
    [[3.2, 3.6, 4.8], [1.6, .3, 0]],         // 1 chips
    [[26.5, 4.0, 12.5], [22, .7, 0]],         // 2 cell
    [[19.5, 4.6, 12.5], [22, .8, 0]],           // 3 write
    [[24.5, 2.4, 12.5], [22, .4, 0]],         // 4 read
    [[-18.5, 5.6, 8.5], [-21.5, 1.4, 0]],    // 5 layers
    [[4.5, 7.5, 9.5], [.4, .2, 0]],          // 6 recap
  ];
  const cp = { p: V(), q: V() };
  const stored = 0;
  function update(t, si, lt, sd) {
    const pulse = .5 + .5 * Math.sin(t * 6);
    bd.rotation.y = Math.sin(t * .3) * .06;
    ctrl.material.emissiveIntensity = si <= 1 || si === 6 ? .5 + .5 * pulse : .2;
    chipGlowM.opacity = si === 1 ? .35 + .35 * pulse : si === 0 || si === 6 ? .25 : 0;
    chipCells.forEach((m, k) => { m.visible = ((k * 7 + Math.floor(t * 3)) % 5) !== 0; });
    puls.forEach(p => { const k = (t * .9 + p.o) % 1; const tx = chips[p.tgt].position.x; p.p.position.set(lerp(-2.0, tx - .9, k), .2, p.z); });
    pulM.opacity = si === 0 || si === 1 || si === 6 ? 1 : 0;
    // cell: electron count trapped
    const vis = si >= 2 && si <= 4;
    let trapped = 0;
    if (si === 3) trapped = ss(.5, Math.max(1.5, (sd || 5) - .5), lt);
    if (si === 4) trapped = 1;
    cgM.emissiveIntensity = si === 3 ? .5 + .8 * pulse : .1;
    boltM.opacity = si === 3 ? .6 + .4 * pulse : 0;
    fgRingM.opacity = si === 2 ? .25 + .25 * pulse : 0;
    fgM.emissiveIntensity = trapped * .5;
    els.forEach((e, k) => {
      const kk = k / els.length;
      let y;
      if (si === 2) y = -.15 + Math.sin(t * 3 + k) * .04;
      else {
        const u = ss(kk * .85, kk * .85 + .15, trapped);
        y = lerp(-.15, .6, u) + Math.sin(t * 4 + k) * .05;
      }
      e.e.position.set(e.x + Math.sin(t * 2 + k) * .05, y, e.z);
      e.e.visible = vis;
    });
    // read: with charge trapped the current is blocked; show a flowing-then-blocked sequence
    const readPh = si === 4 ? (lt % 4) / 4 : 0;
    const blocked = si === 4 && readPh > .5; // first half: no charge (flow), second: charge (blocked)
    cur.forEach(c => { const k = (t * 1.0 + c.o) % 1; let x = -2.4 + k * 4.8; if (blocked && x > -.2) x = -.2 - (k * .3); c.c.position.set(x, -.15, c.z); });
    curM.opacity = si === 4 ? 1 : 0; blockM.opacity = blocked ? .6 + .3 * pulse : 0;
    if (si === 4) { els.forEach(e => e.e.visible = blocked); fgM.emissiveIntensity = blocked ? .6 : 0; }
    // layers
    layerMs.forEach((m, l) => { m.opacity = si === 5 ? ss(l * .35, l * .35 + .5, lt) : si === 6 ? 0 : 0; });
    const cell = Math.floor(t * 2.2) % (LAY * NXY);
    const hl = cell % LAY, hc = Math.floor(cell / LAY) % NXY;
    hi.position.set(-1.5 + hc * .6, hl * .38, -1.5 + ((cell * 5) % NXY) * .6);
    hiM.opacity = si === 5 && lt > 2.2 ? .9 : 0;
    const a = ctrl2.position, b = hi.position;
    wire.position.copy(a).add(b).multiplyScalar(.5); wire.scale.y = a.distanceTo(b); wire.lookAt(st.localToWorld(b.clone())); wire.rotateX(Math.PI / 2);
    // camera
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const far = Math.abs(prev[1][0] - now[1][0]) > 8;
    const kk = si === 0 ? 1 : ease(lt / (far ? 1.1 : 1.4));
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], kk))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], kk)));
    const o = Math.sin(t * .2) * .08, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o));
    camera.lookAt(cp.q);
  }
  return { update };
}
