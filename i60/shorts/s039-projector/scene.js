// Inside 60 — Projector (DLP). Steps: 0 hook (mirror chip), 1 lamp, 2 mirrors tilt lens/trap, 3 flicker = shades, 4 color wheel, 5 lens to screen, 6 recap
export async function setup({ THREE, scene, camera }) {
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const ss = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 90, specular: 0x666666, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x161a34); scene.fog = new THREE.Fog(0x161a34, 30, 80);
  scene.add(new THREE.HemisphereLight(0xf0f4ff, 0x40404c, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(4, 6, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0xa0c0ff, .8); rim.position.set(-6, -3, -6); scene.add(rim);
  const unitCyl = new THREE.CylinderGeometry(1, 1, 1, 10, 1, true);
  const seg = (m, a, b, r) => { const d = b.clone().sub(a), L = d.length(); m.position.copy(a).add(b).multiplyScalar(.5); m.scale.set(r, L, r); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); };
  const cone = (m, a, b, r0, r1) => { const g = new THREE.CylinderGeometry(r1, r0, 1, 32, 1, true); const mesh = new THREE.Mesh(g, m); const d = b.clone().sub(a), L = d.length(); mesh.position.copy(a).add(b).multiplyScalar(.5); mesh.scale.set(1, L, 1); mesh.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); scene.add(mesh); return mesh; };

  const CHIP = V(0, 0, 0), LAMP = V(-3.3, -3.3, 3), LENS = V(2.5, 2.4, 2.4), TRAP = V(3.2, -2.6, 2), SCREEN = V(-.6, 4.3, -2.6);
  // chip package
  const pkg = new THREE.Mesh(new RoundedBoxGeometry(5.2, 5.2, .4, 3, .12), Mat({ color: 0x2a2e38, shininess: 50 })); pkg.position.set(0, 0, -.35); scene.add(pkg);
  for (let i = 0; i < 12; i++) [-1, 1].forEach(s => { const p = new THREE.Mesh(new THREE.BoxGeometry(.12, .4, .08), Mat({ color: 0xe8c060, shininess: 150 })); p.position.set(-2.2 + i * .4, s * 2.75, -.4); scene.add(p); });
  const frame = new THREE.Mesh(new THREE.BoxGeometry(4.4, 4.4, .1), Mat({ color: 0x505868 })); frame.position.z = -.12; scene.add(frame);
  // mirrors 6x6
  const MAP = ['001100', '011110', '111111', '010010', '010110', '010110'];
  const mirrors = [];
  const axis = V(1, -1, 0).normalize();
  for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) {
    const m = Mat({ color: 0x5a6478, emissive: 0xffffff, emissiveIntensity: 0, shininess: 200, specular: 0xffffff });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(.56, .56, .06), m);
    const p = V(-1.625 + c * .65, 1.625 - r * .65, 0); mesh.position.copy(p); scene.add(mesh);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .1, 6), Mat({ color: 0x404040 })); post.rotation.x = Math.PI / 2; post.position.copy(p).setZ(-.07); scene.add(post);
    const rm = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false });
    const ray = new THREE.Mesh(unitCyl, rm); scene.add(ray);
    mirrors.push({ mesh, m, p, r, c, on: MAP[r][c] === '1', ray, rm, level: (c + 1) / 6, ph: (r * 7 + c * 3) % 10 / 10 });
  }
  // lamp: reflector + bulb, aimed at chip
  const lampG = new THREE.Group(); lampG.position.copy(LAMP); lampG.lookAt(CHIP); scene.add(lampG);
  const refPts = []; for (let i = 0; i <= 14; i++) { const r = .15 + .85 * i / 14; refPts.push(new THREE.Vector2(r, r * r * .9)); }
  const refl = new THREE.Mesh(new THREE.LatheGeometry(refPts, 40), Mat({ color: 0xd8dde6, side: THREE.DoubleSide, shininess: 200, specular: 0xffffff })); refl.rotation.x = Math.PI / 2; refl.position.z = -.6; lampG.add(refl);
  const bulbM = Mat({ color: 0xffffff, emissive: 0xfff4c0, emissiveIntensity: .6 });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(.28, 20, 14), bulbM); bulb.position.z = -.35; lampG.add(bulb);
  const housing = new THREE.Mesh(new RoundedBoxGeometry(1.5, 1.5, 1.1, 3, .15), Mat({ color: 0x3a4050 })); housing.position.z = -.9; lampG.add(housing);
  // light beam lamp -> chip
  const beamM = new THREE.MeshBasicMaterial({ color: 0xfff6d0, transparent: true, opacity: .16, depthWrite: false, side: THREE.DoubleSide });
  const beam = cone(beamM, LAMP.clone().lerp(CHIP, .08), CHIP.clone().lerp(LAMP, .05), .9, 2.4);
  // color wheel
  const WH = LAMP.clone().lerp(CHIP, .38);
  const wheelG = new THREE.Group(); wheelG.position.copy(WH); wheelG.lookAt(CHIP); scene.add(wheelG);
  const spin = new THREE.Group(); wheelG.add(spin);
  const wcol = [0xff3030, 0x30e050, 0x3070ff];
  const wMats = wcol.map((c, i) => { const m = Mat({ color: c, emissive: c, emissiveIntensity: .25, transparent: true, opacity: .85, side: THREE.DoubleSide }); const s = new THREE.Mesh(new THREE.CircleGeometry(1.2, 32, i * Math.PI * 2 / 3, Math.PI * 2 / 3), m); spin.add(s); return m; });
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .3, 16), Mat({ color: 0x505868 })); hub.rotation.x = Math.PI / 2; wheelG.add(hub);
  const wmotor = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .6, 16), Mat({ color: 0x707888 })); wmotor.rotation.x = Math.PI / 2; wmotor.position.set(0, -.9, -.4); wheelG.add(wmotor);
  // lens
  const lensG = new THREE.Group(); lensG.position.copy(LENS); lensG.lookAt(SCREEN); scene.add(lensG);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.75, .65, 1.6, 32), Mat({ color: 0x2c3038, shininess: 70 })); barrel.rotation.x = Math.PI / 2; lensG.add(barrel);
  const lensRing = new THREE.Mesh(new THREE.TorusGeometry(.76, .07, 8, 32), Mat({ color: 0xe8b040, emissive: 0xff9000, emissiveIntensity: 0 })); lensRing.position.z = .5; lensG.add(lensRing);
  const glassM = Mat({ color: 0xa8e4ff, emissive: 0x40a0ff, emissiveIntensity: .2, transparent: true, opacity: .8, shininess: 220, specular: 0xffffff });
  const glass = new THREE.Mesh(new THREE.SphereGeometry(.68, 32, 12, 0, Math.PI * 2, 0, .55), glassM); glass.rotation.x = Math.PI / 2; glass.position.z = .5; lensG.add(glass);
  // trap
  const trap = new THREE.Mesh(new RoundedBoxGeometry(1.2, 1.2, 1.2, 3, .12), Mat({ color: 0x14161c, emissive: 0x401010, emissiveIntensity: 0, shininess: 10 })); trap.position.copy(TRAP); scene.add(trap);
  // screen with 6x6 pixels
  const scr = new THREE.Mesh(new RoundedBoxGeometry(4.2, 3.2, .12, 2, .05), Mat({ color: 0xe8ecf2, shininess: 20 })); scr.position.copy(SCREEN); scene.add(scr);
  const pix = [];
  for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) { const m = new THREE.MeshBasicMaterial({ color: 0x000000 }); const b = new THREE.Mesh(new THREE.PlaneGeometry(.46, .46), m); b.position.set(SCREEN.x - 1.4 + c * .56, SCREEN.y + 1.4 - r * .5, SCREEN.z + .07); b.scale.y = .9; scene.add(b); pix.push({ m, r, c, on: MAP[r][c] === '1' }); }
  const outM = new THREE.MeshBasicMaterial({ color: 0xfff6d0, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  const outBeam = cone(outM, LENS.clone().lerp(SCREEN, .1), SCREEN.clone().add(V(0, 0, .3)), .5, 2.0);

  const shots = [
    [[3.5, 1.5, 38], [0, 1, 0]],
    [[-9.5, -1.5, 9.5], [-2.4, -2.4, 1.8]],
    [[4, -3.2, 10.5], [.3, -.2, .5]],
    [[-1.5, 1.2, 13], [-.3, 1.8, -1]],
    [[-8.5, 0, 8.5], [-1.6, -1.4, 1.4]],
    [[6.5, 4.5, 13.5], [.8, 2.8, 0]],
    [[-3.5, 1.5, 38], [0, 1, 0]],
  ];
  const cp = { p: V(), q: V() };
  const C = new THREE.Color(), W = new THREE.Color(0xfff6d0), ROOF = new THREE.Color(0xff5a40), WALL = new THREE.Color(0xffd040);
  function update(t, si, lt, sd) {
    sd = sd || 6;
    const pulse = .5 + .5 * Math.sin(t * 5);
    // wheel color index (visual, slowed)
    spin.rotation.z = -t * (si === 4 ? 2.2 : 6);
    const wa = ((t * (si === 4 ? 2.2 : 6)) % (Math.PI * 2)) / (Math.PI * 2); const wi = Math.floor(wa * 3) % 3;
    const colorMode = si === 4 ? 1 : 0; const blend = si === 4 ? ss(sd * .6, sd * .85, lt) : (si >= 5 ? 1 : 0);
    const lc = colorMode && blend < 1 ? new THREE.Color(wcol[wi]).lerp(W, blend) : W;
    beamM.color.copy(lc); beamM.opacity = si === 1 ? .2 + .08 * pulse : .14;
    bulbM.emissiveIntensity = si === 1 ? .8 + .4 * pulse : .7;
    wMats.forEach((m, i) => { m.emissiveIntensity = si === 4 && i === wi ? .9 : .25; });
    // mirrors
    mirrors.forEach(M => {
      let on = M.on;
      if (si === 3) on = ((t * 2.5 + M.ph) % 1) < M.level;
      if (si === 2) on = M.on; if (si === 0 || si === 6) on = M.on;
      const ang = (on ? 1 : -1) * .35;
      M.cur = lerp(M.cur ?? ang, ang, .35);
      M.mesh.quaternion.setFromAxisAngle(axis, M.cur);
      M.m.emissiveIntensity = on ? .75 : 0; M.m.emissive.copy(on ? lc : W);
      const showRays = si === 2 || si === 3 || si === 4 || si === 0 || si === 6;
      seg(M.ray, M.p, on ? LENS : TRAP, .025); M.rm.color.copy(on ? lc : new THREE.Color(0x8090a0));
      M.rm.opacity = showRays ? (on ? .5 : (si === 2 ? .25 : .08)) : 0;
    });
    trap.material.emissiveIntensity = si === 2 ? .3 * pulse : 0;
    lensRing.material.emissiveIntensity = si === 5 ? .4 + .4 * pulse : (si === 2 ? .3 * pulse : 0);
    // screen pixels
    pix.forEach(P => {
      let b = P.on ? 1 : 0;
      if (si === 3) { const M = mirrors[P.r * 6 + P.c]; b = M.level; }
      const base = P.r < 3 ? ROOF : WALL;
      if (si <= 3) C.copy(W).multiplyScalar(b * .95);
      else if (si === 4) { const fc = new THREE.Color(wcol[wi]); const ch = [base.r, base.g, base.b][wi]; C.copy(fc).multiplyScalar(ch * b).lerp(base.clone().multiplyScalar(b), blend); }
      else C.copy(base).multiplyScalar(b);
      if (si === 1) C.multiplyScalar(.15);
      P.m.color.copy(C);
    });
    outM.color.copy(lc); outM.opacity = si === 5 ? .12 + .06 * pulse : (si >= 2 ? .07 : 0);
    // camera
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const k = si === 0 ? 1 : ease(lt / 1.3);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], k))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], k)));
    const o = Math.sin(t * .2) * .08, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o));
    camera.lookAt(cp.q);
  }
  return { update };
}
