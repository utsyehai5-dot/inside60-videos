// Inside 60 — Wireless charger. Steps: 0 hook (phone drops on pad), 1 copper coil (x-ray pad), 2 magnetic field flips, 3 phone coil induced current, 4 rectifier -> DC to battery, 5 alignment/heat, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 90, specular: 0x555555, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x161c2c); scene.fog = new THREE.Fog(0x161c2c, 30, 80);
  scene.add(new THREE.HemisphereLight(0xf4f8ff, 0x404050, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.7); key.position.set(6, 10, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0x90d0ff, .8); rim.position.set(-6, 4, -6); scene.add(rim);
  const desk = new THREE.Mesh(new THREE.BoxGeometry(16, .5, 14), Mat({ color: 0x6a4a34, shininess: 30 })); desk.position.y = -.25; scene.add(desk);
  // pad
  const padM = Mat({ color: 0x2a2e36, shininess: 60, transparent: true, opacity: 1 });
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, .5, 48), padM); pad.position.y = .25; scene.add(pad);
  const ledM = Mat({ color: 0x40ff80, emissive: 0x20a040 });
  const led = new THREE.Mesh(new THREE.SphereGeometry(.1, 10, 8), ledM); led.position.set(0, .3, 2.55); scene.add(led);
  const cuM = Mat({ color: 0xd88a40, shininess: 140, emissive: 0x000000 });
  const padCoil = new THREE.Group(); padCoil.position.y = .3; scene.add(padCoil);
  for (let k = 0; k < 8; k++) { const c = new THREE.Mesh(new THREE.TorusGeometry(.5 + k * .19, .07, 8, 48), cuM); c.rotation.x = Math.PI / 2; padCoil.add(c); }
  // cable
  const cable = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(0, .25, -2.5), V(0, .1, -4), V(1.5, .1, -6), V(4, .1, -7)]), 30, .1, 8), Mat({ color: 0x202020 })); scene.add(cable);
  // current dots in pad coil
  const dotM = new THREE.MeshBasicMaterial({ color: 0xffe040 });
  const padDots = []; for (let k = 0; k < 16; k++) { const d = new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 6), dotM); scene.add(d); padDots.push(d); }
  // phone
  const phone = new THREE.Group(); scene.add(phone);
  const bodyM = Mat({ color: 0x8090a8, shininess: 160, transparent: true, opacity: 1 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(3, .32, 6), bodyM); phone.add(body);
  const scrM = Mat({ color: 0x101420, emissive: 0x000000, shininess: 200, transparent: true, opacity: 1 });
  const scr = new THREE.Mesh(new THREE.BoxGeometry(2.8, .02, 5.8), scrM); scr.position.y = .17; phone.add(scr);
  const pCuM = Mat({ color: 0xd88a40, shininess: 140, emissive: 0x000000 });
  const phCoil = new THREE.Group(); phCoil.position.set(0, -.08, .4); phone.add(phCoil);
  for (let k = 0; k < 6; k++) { const c = new THREE.Mesh(new THREE.TorusGeometry(.45 + k * .16, .05, 8, 40), pCuM); c.rotation.x = Math.PI / 2; phCoil.add(c); }
  const chipM = Mat({ color: 0x303030, emissive: 0x000000 });
  const chip = new THREE.Mesh(new THREE.BoxGeometry(.9, .16, .9), chipM); chip.position.set(.9, .02, -1.7); phone.add(chip);
  const batM = Mat({ color: 0x40c060, emissive: 0x000000 });
  const bat = new THREE.Mesh(new THREE.BoxGeometry(2.3, .14, 2.0), batM); bat.position.set(-.1, .05, -1.6); bat.scale.x = 1; phone.add(bat);
  const batFill = new THREE.Mesh(new THREE.BoxGeometry(2.3, .16, .1), Mat({ color: 0x80ff90, emissive: 0x40c050 })); batFill.position.set(-.1, .06, -2.55); phone.add(batFill);
  const phDots = []; for (let k = 0; k < 10; k++) { const d = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), dotM); phone.add(d); phDots.push(d); }
  // field arcs (vertical half-rings between coils)
  const fM = new THREE.MeshBasicMaterial({ color: 0x60e0ff, transparent: true, opacity: .7 });
  const arcs = []; for (let k = 0; k < 6; k++) { const a = new THREE.Mesh(new THREE.TorusGeometry(.9 + (k % 3) * .35, .035, 6, 40, Math.PI), fM); a.rotation.y = k < 3 ? 0 : Math.PI / 2; a.position.y = .35; scene.add(a); arcs.push(a); }
  const upM = new THREE.MeshBasicMaterial({ color: 0x60e0ff, transparent: true, opacity: .8 });
  const ups = []; for (let k = 0; k < 5; k++) { const g = new THREE.Group(); const sh = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .6, 8), upM); g.add(sh); const hd = new THREE.Mesh(new THREE.ConeGeometry(.15, .3, 10), upM); hd.position.y = .4; g.add(hd); g.position.set(-.8 + k * .4, .9, .4); scene.add(g); ups.push(g); }
  // heat glow for misalignment
  const heatM = new THREE.MeshBasicMaterial({ color: 0xff5020, transparent: true, opacity: 0 });
  const heat = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, .05, 40), heatM); heat.position.y = .53; scene.add(heat);

  const shots = [
    [[5, 9, 9], [0, .6, 0]],     // 0 hook
    [[2.5, 7, 5.5], [0, .3, 0]], // 1 pad coil
    [[5, 4, 6.5], [0, 1.0, .4]], // 2 field
    [[-4, 5, 6], [0, .9, 0]],    // 3 phone coil
    [[3.5, 5, 1.2], [.4, .7, -2.0]], // 4 chip/battery
    [[4, 9, 9.5], [.8, .5, .4]],   // 5 alignment
    [[6, 10, 11], [0, .6, 0]],   // 6 recap
  ];
  shots.forEach(sh => { for (let i = 0; i < 3; i++) sh[0][i] = sh[1][i] + (sh[0][i] - sh[1][i]) * 1.4; });
  const cp = { p: V(), q: V() };
  function update(t, si, lt, sd) {
    const pulse = .5 + .5 * Math.sin(t * 6);
    // phone placement
    const drop = si === 0 ? ease((lt - .3) / 1.5) : 1;
    let off = 0; if (si === 5) off = Math.sin(Math.min(1, lt / (sd * .8)) * Math.PI) * 2.0;
    phone.position.set(off, .62 + (1 - drop) * 3, -.4); phone.rotation.z = (1 - drop) * .25;
    const xr = si >= 1 && si <= 4;
    padM.opacity = si >= 1 && si <= 3 ? .3 : 1; padM.depthWrite = !(si >= 1 && si <= 3);
    bodyM.opacity = si >= 3 && si <= 4 ? .25 : 1; bodyM.depthWrite = !(si >= 3 && si <= 4);
    scrM.opacity = si === 1 || si === 2 ? .15 : (si >= 3 && si <= 4) ? .15 : 1; scrM.depthWrite = scrM.opacity === 1;
    phone.visible = !(si === 1 || si === 2) ;
    // coil current flipping
    const flip = Math.sin(t * 12) > 0;
    cuM.emissive.setHex(flip ? 0xff8020 : 0x2090ff); cuM.emissiveIntensity = si >= 1 && si !== 5 ? .7 : si === 5 ? .4 : 0;
    padDots.forEach((d, k) => { const a = k / 16 * 6.28 + (flip ? 1 : -1) * t * 2; const r = .6 + (k % 8) * .19; d.position.set(Math.cos(a) * r, .32, Math.sin(a) * r); d.visible = si === 1 || si === 2; });
    // field
    const fs = si === 5 ? 1 - .6 * Math.min(1, off / 2) : 1;
    arcs.forEach((a, k) => { a.visible = si >= 2 && si <= 3 || si === 6; a.scale.setScalar((.8 + .25 * Math.sin(t * 12 + k)) * fs); });
    ups.forEach((g, k) => { g.visible = si === 2 || si === 3; g.scale.y = flip ? 1 : -1; g.position.y = flip ? .9 : 1.3; });
    // phone coil induced
    const coupling = si === 5 ? Math.max(0, 1 - off / 1.6) : 1;
    pCuM.emissive.setHex(flip ? 0xff8020 : 0x2090ff); pCuM.emissiveIntensity = (si >= 3 ? .7 : 0) * coupling;
    phDots.forEach((d, k) => { const o = (k / 10 + t * .7) % 1; d.position.set(lerp(.2, .9, o), .08, lerp(.4, -1.7, o)); d.visible = si === 3 || si === 4; });
    chipM.emissive.setHex(0x40c0ff); chipM.emissiveIntensity = si === 4 ? .4 + .4 * pulse : 0;
    batM.emissive.setHex(0x20ff60); batM.emissiveIntensity = si === 4 || si === 6 ? .3 + .3 * pulse : 0;
    const lvl = si < 4 ? .3 : si === 4 ? .3 + .6 * ease(lt / sd) : .9;
    batFill.scale.z = 1; batFill.position.z = -2.55 + lvl * 1.9; 
    scrM.emissive.setHex(0x203860); scrM.emissiveIntensity = si === 0 || si === 6 ? .8 : 0;
    heatM.opacity = si === 5 ? .55 * Math.min(1, off / 1.6) * (.6 + .4 * pulse) : 0;
    ledM.emissive.setHex(si === 5 && off > 1.2 ? 0xa04010 : 0x20a040);
    // camera
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const kk = si === 0 ? 1 : ease(lt / 1.4);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], kk))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], kk)));
    const o = Math.sin(t * .25) * .15, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o));
    camera.lookAt(cp.q);
  }
  return { update };
}
