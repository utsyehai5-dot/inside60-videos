// Inside 60 — 3D printer (FDM). Steps: 0 hook 1984, 1 filament spool, 2 heated nozzle melts, 3 trace a slice, 4 next layer, 5 layers fuse as they cool, 6 recap
export async function setup({ THREE, scene, camera }) {
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const ss = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x555555, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x141c30); scene.fog = new THREE.Fog(0x141c30, 30, 70);
  scene.add(new THREE.HemisphereLight(0xf4f6ff, 0x40404c, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.9); key.position.set(5, 9, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0xa0c8ff, .7); rim.position.set(-6, -2, -6); scene.add(rim);

  const frameM = Mat({ color: 0x3a3f4c, shininess: 60 });
  const railM = Mat({ color: 0xc0c6d0, shininess: 140 });
  // base + bed
  const base = new THREE.Mesh(new RoundedBoxGeometry(7, .6, 6, 2, .15), frameM); base.position.y = .3; scene.add(base);
  const bed = new THREE.Mesh(new RoundedBoxGeometry(5, .2, 5, 2, .05), Mat({ color: 0x202430, shininess: 120 })); bed.position.y = .75; scene.add(bed);
  // uprights + top bar
  [-3.2, 3.2].forEach(x => { const u = new THREE.Mesh(new RoundedBoxGeometry(.4, 6.5, .4, 2, .08), frameM); u.position.set(x, 3.6, -2.4); scene.add(u); });
  const top = new THREE.Mesh(new RoundedBoxGeometry(6.8, .4, .4, 2, .08), frameM); top.position.set(0, 6.9, -2.4); scene.add(top);
  // X gantry (moves up with layers)
  const gantry = new THREE.Group(); scene.add(gantry);
  const rail = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 6.4, 10), railM); rail.rotation.z = Math.PI / 2; rail.position.z = -2.4; gantry.add(rail);
  // carriage + arm forward + hot end
  const carriage = new THREE.Group(); gantry.add(carriage);
  const cbox = new THREE.Mesh(new RoundedBoxGeometry(1.0, .8, .6, 2, .1), Mat({ color: 0xff8030 })); cbox.position.z = -2.4; carriage.add(cbox);
  const arm = new THREE.Mesh(new RoundedBoxGeometry(.3, .3, 2.4, 2, .08), railM); arm.position.set(0, 0, -1.2); carriage.add(arm);
  const hot = new THREE.Group(); carriage.add(hot); // hot end position set each frame (z)
  const block = new THREE.Mesh(new RoundedBoxGeometry(.7, .5, .7, 2, .08), Mat({ color: 0xb0b4bc, emissive: 0xff3000, emissiveIntensity: 0 })); block.position.y = -.2; hot.add(block);
  const heatM = block.material;
  const nozM = Mat({ color: 0xd4a030, emissive: 0xff5000, emissiveIntensity: 0 });
  const noz = new THREE.Mesh(new THREE.ConeGeometry(.2, .4, 16), nozM); noz.rotation.x = Math.PI; noz.position.y = -.65; hot.add(noz);
  const fan = new THREE.Mesh(new RoundedBoxGeometry(.7, .6, .2, 2, .05), Mat({ color: 0x2a2e3a })); fan.position.set(0, .25, .45); hot.add(fan);
  // spool at the side
  const spool = new THREE.Group(); spool.position.set(4.6, 5.0, -2.4); scene.add(spool);
  const filC = 0x30c0ff;
  const filM = Mat({ color: filC, shininess: 90 });
  const reel = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, .8, 32), filM); reel.rotation.x = Math.PI / 2; spool.add(reel);
  [-.45, .45].forEach(z => { const d = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, .08, 32), Mat({ color: 0x9aa4b8, transparent: true, opacity: .45, depthWrite: false })); d.rotation.x = Math.PI / 2; d.position.z = z; spool.add(d); });
  // filament tube from spool to hot end (rebuilt each frame cheaply via TubeGeometry update every few frames)
  let filTube = null; let lastKey = '';
  const filGlowM = Mat({ color: filC, emissive: filC, emissiveIntensity: 0 });
  // filament flow dots
  const dotM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
  const dots = [0, 1, 2, 3, 4, 5, 6, 7].map(i => { const d = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), dotM); scene.add(d); return { d, o: i / 8 }; });
  // printed object: a vase made of ring layers (wavy profile)
  const NL = 26, LH = .11, Y0 = .87;
  const layerMats = [], layers = [];
  const rad = i => .9 + .35 * Math.sin(i / NL * Math.PI * 1.2) ;
  for (let i = 0; i < NL; i++) {
    const m = Mat({ color: filC, emissive: 0xff6020, emissiveIntensity: 0, shininess: 70 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(rad(i), LH * .55, 6, 48), m); ring.rotation.x = Math.PI / 2; ring.position.y = Y0 + i * LH; ring.visible = false; scene.add(ring);
    layerMats.push(m); layers.push(ring);
  }
  // current partial layer (arc being traced)
  const arcM = Mat({ color: filC, emissive: 0xff6020, emissiveIntensity: .9 });
  let arc = null; let arcKey = -1;
  // molten bead at nozzle tip
  const bead = new THREE.Mesh(new THREE.SphereGeometry(.12, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: 0 })); scene.add(bead);
  // slice plane (step 3)
  const sliceM = new THREE.MeshBasicMaterial({ color: 0xffd040, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
  const slice = new THREE.Mesh(new THREE.RingGeometry(.0, 1.6, 48), sliceM); slice.rotation.x = -Math.PI / 2; scene.add(slice);
  const shots = [
    [[-3, 5, 10.5], [0, 2.8, 0]],
    [[7, 6, 8.5], [3, 4.6, -1.6]],
    [[2.8, 3.0, 5.8], [0, 1.8, .9]],
    [[0, 7, 6.5], [0, 1.4, 0]],
    [[-5, 4, 8], [0, 2.2, 0]],
    [[4, 4.6, 8.5], [0, 2.4, 0]],
    [[-4, 6, 13], [0, 3.4, 0]],
  ];
  const cp = { p: V(), q: V() };
  // print progress (# layers done) per step
  const progAt = (si, lt) => {
    if (si <= 2) return 3; if (si === 3) return 3 + Math.min(1, lt / 6) * .999;
    if (si === 4) return 4 + Math.min(1, lt / 5) * 8; if (si === 5) return 12 + Math.min(1, lt / 5) * 12; return NL;
  };
  function update(t, si, lt) {
    const pulse = .5 + .5 * Math.sin(t * 6);
    const prog = progAt(si, lt);
    const full = Math.floor(prog), frac = prog - full;
    const curL = Math.min(NL - 1, full);
    // nozzle path: circle at radius of current layer
    const ang = si <= 2 ? Math.PI / 2 + .35 * Math.sin(t * .8) : frac * Math.PI * 2 + (si === 6 ? t * .8 : 0);
    const r = rad(curL);
    const nx = Math.cos(ang) * r, nz = Math.sin(ang) * r;
    const ny = Y0 + curL * LH + .92;
    gantry.position.y = ny; carriage.position.x = nx;
    hot.position.set(0, 0, nz); arm.position.set(0, 0, (nz - 2.4) / 2); arm.scale.z = Math.max(.1, (nz + 2.4) / 2.4);
    // layers visibility + cooling glow
    layers.forEach((l, i) => { l.visible = i < full; const age = full - i; layerMats[i].emissiveIntensity = l.visible ? Math.max(0, .8 - age * .12) * (si === 5 ? 1 : .6) : 0; });
    // partial arc
    const showArc = si < 6 && frac > .02 && full < NL;
    const ak = curL * 100 + Math.floor(frac * 40);
    if (showArc && ak !== arcKey) { if (arc) { scene.remove(arc); arc.geometry.dispose(); } arc = new THREE.Mesh(new THREE.TorusGeometry(r, LH * .55, 6, 48, frac * Math.PI * 2), arcM); arc.rotation.x = Math.PI / 2; arc.position.y = Y0 + curL * LH; scene.add(arc); arcKey = ak; }
    if (arc) arc.visible = showArc;
    // heat
    const heat = si >= 2 ? 1 : 0;
    heatM.emissiveIntensity = heat * (.4 + .3 * pulse); nozM.emissiveIntensity = heat * (.8 + .4 * pulse);
    bead.position.set(nx, ny - .9, nz); bead.material.opacity = (si >= 2 && si <= 5) ? .9 : 0;
    // filament tube spool -> top of hot end
    const tip = V(nx, ny + .2, nz);
    const kkey = tip.toArray().map(v => v.toFixed(1)).join();
    if (kkey !== lastKey) { if (filTube) { scene.remove(filTube); filTube.geometry.dispose(); } const c = new THREE.CatmullRomCurve3([V(4.6, 3.9, -2.4), V(4.0, 6.6, -1.8), V((tip.x + 4.0) / 2, ny + 1.6, (tip.z - 1.8) / 2), tip]); filTube = new THREE.Mesh(new THREE.TubeGeometry(c, 40, .06, 6, false), filGlowM); scene.add(filTube); lastKey = kkey; filTube.userData.c = c; }
    filGlowM.emissiveIntensity = si === 1 ? .5 + .5 * pulse : .15;
    dots.forEach(d => { const k = (t * .35 + d.o) % 1; d.d.position.copy(filTube.userData.c.getPointAt(k)); d.d.material.opacity = si === 1 || si === 2 ? .9 : 0; });
    spool.rotation.z = -t * (si === 1 ? .8 : .2);
    // slice plane
    sliceM.opacity = si === 3 ? .2 * ss(.3, 1, lt) * (1 - ss(4.5, 5.5, lt)) : 0; slice.position.y = Y0 + curL * LH + .01;
    // camera
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const kk = si === 0 ? 1 : ease(lt / 1.4);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], kk))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], kk)));
    const o = Math.sin(t * .2) * .1, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o));
    camera.lookAt(cp.q);
  }
  return { update };
}
