// Inside 60 — Blender. Steps: 0 hook, 1 motor + coupling, 2 blades, 3 vortex, 4 circulation, 5 jar ribs, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 90, specular: 0x666666, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x1a2228); scene.fog = new THREE.Fog(0x1a2228, 30, 80);
  scene.add(new THREE.HemisphereLight(0xf4fbff, 0x404448, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.8); key.position.set(6, 10, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0x90ffd0, .7); rim.position.set(-6, 4, -6); scene.add(rim);
  const counter = new THREE.Mesh(new THREE.BoxGeometry(20, .6, 12), Mat({ color: 0xe8e2d8, shininess: 40 })); counter.position.y = -.3; scene.add(counter);
  // base (x-ray able)
  const baseM = Mat({ color: 0xd03a3a, shininess: 120, transparent: true, opacity: 1 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(4.4, 3, 4.4), baseM); base.position.y = 1.5; scene.add(base);
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(.45, .45, .3, 24), Mat({ color: 0xeeeeee })); knob.rotation.x = Math.PI / 2; knob.position.set(0, 1.4, 2.3); scene.add(knob);
  // motor inside base
  const motorM = Mat({ color: 0xb87333, emissive: 0x000000, shininess: 140 });
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 1.8, 32), motorM); motor.position.y = 1.4; scene.add(motor);
  const rotor = new THREE.Group(); rotor.position.y = 1.4; scene.add(rotor);
  for (let k = 0; k < 6; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.18, 1.6, .7), Mat({ color: 0x707880 })); b.rotation.y = k / 6 * Math.PI; rotor.add(b); }
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, 1.6, 12), Mat({ color: 0xd0d4dc })); shaft.position.y = 2.6; scene.add(shaft);
  const coupM = Mat({ color: 0x60646c, emissive: 0x000000 });
  const coup = new THREE.Group(); coup.position.y = 3.05; scene.add(coup);
  coup.add(new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, .2, 24), coupM));
  for (let k = 0; k < 8; k++) { const tooth = new THREE.Mesh(new THREE.BoxGeometry(.18, .25, .3), coupM); const a = k / 8 * Math.PI * 2; tooth.position.set(Math.cos(a) * .5, .18, Math.sin(a) * .5); tooth.rotation.y = -a; coup.add(tooth); }
  // jar (square-ish with ribs)
  const jarM = Mat({ color: 0xd8f0ff, shininess: 200, transparent: true, opacity: .22, side: THREE.DoubleSide, depthWrite: false });
  const jar = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 1.6, 6, 4, 1, true), jarM); jar.rotation.y = Math.PI / 4; jar.position.y = 6.3; scene.add(jar);
  const jarBase = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.8, .5, 32), Mat({ color: 0x303438 })); jarBase.position.y = 3.3; scene.add(jarBase);
  const lid = new THREE.Mesh(new THREE.BoxGeometry(3.3, .4, 3.3), Mat({ color: 0x303438 })); lid.position.y = 9.5; scene.add(lid);
  const ribM = Mat({ color: 0x80e0ff, emissive: 0x000000, transparent: true, opacity: .5 });
  const ribs = []; for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + Math.PI / 4; const r = new THREE.Mesh(new THREE.BoxGeometry(.14, 5.6, .14), ribM); r.position.set(Math.cos(a) * 1.4, 6.3, Math.sin(a) * 1.4); r.rotation.set(Math.sin(a) * -.06, 0, Math.cos(a) * .06); scene.add(r); ribs.push(r); }
  // blades
  const bladeM = Mat({ color: 0xeef0f4, shininess: 220, emissive: 0x000000 });
  const blades = new THREE.Group(); blades.position.y = 4.0; scene.add(blades);
  blades.add(new THREE.Mesh(new THREE.CylinderGeometry(.2, .25, .5, 16), bladeM));
  [[0, .35], [Math.PI / 2, -.35], [Math.PI, .35], [Math.PI * 1.5, -.35]].forEach(([a, tilt]) => { const g = new THREE.Group(); g.rotation.y = a; const bl = new THREE.Mesh(new THREE.BoxGeometry(1.4, .06, .35), bladeM); bl.position.x = .75; bl.rotation.z = tilt; bl.rotation.x = .25; g.add(bl); blades.add(g); });
  // liquid with vortex (lathe profile, rebuilt cheaply by scaling)
  const liqM = Mat({ color: 0xff5a7a, transparent: true, opacity: .45, emissive: 0x300010, side: THREE.DoubleSide, depthWrite: false });
  function vortexGeo(d) { const pts = []; for (let i = 0; i <= 20; i++) { const r = .05 + i / 20 * 1.85; pts.push(new THREE.Vector2(r, 7.0 - d * Math.exp(-r * 1.4) * 3)); } pts.push(new THREE.Vector2(1.9, 7.0)); return pts; }
  const surfM = Mat({ color: 0xff7090, emissive: 0x400818, side: THREE.DoubleSide });
  let surf = new THREE.Mesh(new THREE.LatheGeometry(vortexGeo(0), 32), surfM); scene.add(surf);
  const liquid = new THREE.Mesh(new THREE.CylinderGeometry(1.95, 1.65, 3.0, 32), liqM); liquid.position.y = 5.5; scene.add(liquid);
  // fruit chunks
  const cols = [0xff3050, 0xffd030, 0x40d060, 0xff8030];
  const chunks = []; for (let k = 0; k < 26; k++) { const c = new THREE.Mesh(k % 3 ? new THREE.BoxGeometry(.38, .38, .38) : new THREE.SphereGeometry(.24, 10, 8), Mat({ color: cols[k % 4], emissive: 0x000000 })); c.userData = { p: Math.random(), a: Math.random() * 6.28, sp: .7 + Math.random() * .6 }; scene.add(c); chunks.push(c); }
  // circulation arrows (curved tubes)
  const arrM = new THREE.MeshBasicMaterial({ color: 0xffd030 });
  const arrows = new THREE.Group(); scene.add(arrows);
  for (const s of [-1, 1]) { const c = new THREE.CatmullRomCurve3([V(s * .3, 6.8, 2.2), V(s * .3, 4.4, 2.2), V(s * 1.5, 4.6, 2.2), V(s * 1.8, 6.6, 2.2), V(s * .8, 7.4, 2.2)]); arrows.add(new THREE.Mesh(new THREE.TubeGeometry(c, 40, .06, 6), arrM)); const hd = new THREE.Mesh(new THREE.ConeGeometry(.18, .4, 10), arrM); hd.position.set(s * .5, 7.2, 2.2); hd.rotation.z = s * -1.9; arrows.add(hd); }

  const shots = [
    [[8, 8, 13], [0, 5, 0]],       // 0 whole
    [[6.5, 4.8, 8.5], [0, 2.4, 0]],    // 1 motor (x-ray base)
    [[3.6, 6.2, 6.0], [0, 4.0, 0]],// 2 blades close
    [[4.5, 11, 8.5], [0, 5.6, 0]],// 3 vortex from above
    [[0, 6, 12.5], [0, 5.8, 0]],     // 4 side view circulation
    [[-7.5, 8, 8], [0, 6, 0]],     // 5 ribs
    [[9, 9, 14], [0, 5, 0]],       // 6 recap
  ];
  const cp = { p: V(), q: V() };
  let ang = 0, lastT = 0;
  function update(t, si, lt, sd) {
    const pulse = .5 + .5 * Math.sin(t * 6);
    const dt = Math.max(0, Math.min(.1, t - lastT)); lastT = t;
    // visual spin speed (slower in close-ups so blades stay readable)
    const spd = si === 2 ? 1.2 : si === 1 ? 2 : 9; ang += dt * spd * Math.PI * 2;
    blades.rotation.y = ang; rotor.rotation.y = ang; coup.rotation.y = ang;
    const xr = si === 1; baseM.opacity = xr ? .2 : 1; baseM.depthWrite = !xr;
    motorM.emissive.setHex(0xff8030); motorM.emissiveIntensity = si === 1 ? .2 + .4 * pulse : 0;
    coupM.emissive.setHex(0xffd030); coupM.emissiveIntensity = si === 1 ? .3 + .5 * pulse : 0;
    bladeM.emissive.setHex(0x60c0ff); bladeM.emissiveIntensity = si === 2 ? .3 + .5 * pulse : 0;
    ribM.emissive.setHex(0xffd030); ribM.emissiveIntensity = si === 5 ? .5 + .6 * pulse : 0; ribM.opacity = si === 5 ? .9 : .4;
    // vortex depth
    const vd = si <= 2 ? .15 : si === 3 ? .15 + .85 * ease(lt / 2) : .9;
    scene.remove(surf); surf.geometry.dispose(); surf = new THREE.Mesh(new THREE.LatheGeometry(vortexGeo(vd), 32), surfM); surf.rotation.y = -ang * .2; scene.add(surf); liquid.visible = surf.visible = !(si === 1 || si === 2);
    // chunks: spiral down center, out at blades, up walls, back in at top
    const mix = si >= 3 ? 1 : 0;
    chunks.forEach((c, k) => {
      const u = c.userData; const p = (u.p + t * .18 * u.sp * (si === 2 ? .3 : 1)) % 1; let r, y;
      if (p < .35) { const q = p / .35; r = lerp(.4, .2, q); y = lerp(6.6, 4.3, q); }
      else if (p < .5) { const q = (p - .35) / .15; r = lerp(.2, 1.7, q); y = 4.3 + q * .2; }
      else if (p < .85) { const q = (p - .5) / .35; r = 1.7 - q * .1; y = lerp(4.5, 6.8, q); }
      else { const q = (p - .85) / .15; r = lerp(1.6, .4, q); y = 6.8 + Math.sin(q * Math.PI) * .2; }
      if (!mix) { r = 1.2 * ((k * 7) % 5) / 5 + .2; y = 3.8 + .5 + (k % 5) * .4; }
      const a = u.a + (mix ? t * 2.2 * u.sp : 0); c.position.set(Math.cos(a) * r, y, Math.sin(a) * r); c.rotation.set(t * u.sp, t, 0); c.visible = !(si === 1 || si === 2);
      const sc = si >= 4 ? Math.max(.35, 1 - (si - 3) * .2 - (si === 4 ? lt / sd * .2 : 0)) : 1; c.scale.setScalar(sc);
    });
    arrows.visible = si === 4; arrows.rotation.y = 0;
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
