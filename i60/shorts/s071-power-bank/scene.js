// Inside 60 — Power bank. Steps: 0 hook (bank charging phone), 1 Li-ion cells (x-ray), 2 ions move into graphite, 3 boost converter 3.7V -> 5V, 4 losses (heat), 5 protection chip, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 90, specular: 0x555555, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x161a2a); scene.fog = new THREE.Fog(0x161a2a, 30, 80);
  scene.add(new THREE.HemisphereLight(0xf4f8ff, 0x404050, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.7); key.position.set(6, 10, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0x90d0ff, .8); rim.position.set(-6, 4, -6); scene.add(rim);
  const desk = new THREE.Mesh(new THREE.BoxGeometry(16, .5, 16), Mat({ color: 0x3a4a5e, shininess: 30 })); desk.position.y = -.25; scene.add(desk);
  // bank shell
  const shellM = Mat({ color: 0x2c3240, shininess: 120, transparent: true, opacity: 1 });
  const shell = new THREE.Mesh(new THREE.BoxGeometry(3.2, .9, 5.4), shellM); shell.position.set(0, .45, 0); scene.add(shell);
  const ledMs = []; for (let k = 0; k < 4; k++) { const m = Mat({ color: 0x1a2a20, emissive: 0x000000 }); const l = new THREE.Mesh(new THREE.BoxGeometry(.25, .06, .12), m); l.position.set(-.6 + k * .4, .91, 2.3); scene.add(l); ledMs.push(m); }
  // cells
  const cellM = Mat({ color: 0x3a90ff, emissive: 0x000000, shininess: 140 });
  const cells = []; for (let k = 0; k < 3; k++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, 3.4, 28), cellM); c.rotation.x = Math.PI / 2; c.position.set(-1 + k, .45, .6); scene.add(c); cells.push(c);
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, .12, 14), Mat({ color: 0xcccccc })); tip.rotation.x = Math.PI / 2; tip.position.set(-1 + k, .45, -1.15); scene.add(tip); }
  // pcb
  const pcbM = Mat({ color: 0x1f8040, emissive: 0x000000 });
  const pcb = new THREE.Mesh(new THREE.BoxGeometry(2.8, .08, 1.1), pcbM); pcb.position.set(0, .25, -2.0); scene.add(pcb);
  const indM = Mat({ color: 0xd88a40, emissive: 0x000000 });
  const ind = new THREE.Mesh(new THREE.TorusGeometry(.28, .12, 10, 24), indM); ind.rotation.x = Math.PI / 2; ind.position.set(-.7, .4, -2.0); scene.add(ind);
  const boostM = Mat({ color: 0x202020, emissive: 0x000000 });
  const boost = new THREE.Mesh(new THREE.BoxGeometry(.5, .14, .5), boostM); boost.position.set(.05, .36, -2.0); scene.add(boost);
  const protM = Mat({ color: 0x202020, emissive: 0x000000 });
  const prot = new THREE.Mesh(new THREE.BoxGeometry(.4, .14, .4), protM); prot.position.set(.85, .36, -1.95); scene.add(prot);
  const shieldM = new THREE.MeshBasicMaterial({ color: 0x40ff90, transparent: true, opacity: .6 });
  const shield = new THREE.Mesh(new THREE.TorusGeometry(.5, .04, 8, 40), shieldM); shield.position.set(.85, .5, -1.95); scene.add(shield);
  const port = new THREE.Mesh(new THREE.BoxGeometry(.9, .3, .2), Mat({ color: 0xb0b8c4 })); port.position.set(0, .45, -2.72); scene.add(port);
  // cable + phone
  const curve = new THREE.CatmullRomCurve3([V(0, .45, -2.8), V(0, .3, -3.6), V(.6, .15, -4.6), V(0, .4, -5.4)]);
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 30, .09, 8), Mat({ color: 0xe8e8e8 })));
  const phone = new THREE.Group(); phone.position.set(0, .2, -5.6); phone.rotation.x = -.18; scene.add(phone);
  const pb = new THREE.Mesh(new THREE.BoxGeometry(2.4, 4.8, .28), Mat({ color: 0x9098a8, shininess: 160 })); pb.position.y = 2.4; phone.add(pb);
  const scr = new THREE.Mesh(new THREE.BoxGeometry(2.25, 4.65, .02), Mat({ color: 0x101420, emissive: 0x101830 })); scr.position.set(0, 2.4, .15); phone.add(scr);
  const bOut = new THREE.Mesh(new THREE.BoxGeometry(.9, 1.6, .02), Mat({ color: 0xffffff, emissive: 0x606060 })); bOut.position.set(0, 2.5, .17); phone.add(bOut);
  const bFillM = Mat({ color: 0x40ff70, emissive: 0x30c050 });
  const bFill = new THREE.Mesh(new THREE.BoxGeometry(.75, 1.45, .03), bFillM); bFill.position.set(0, 2.5, .18); phone.add(bFill);
  // energy particles along cable; heat particles
  const enM = new THREE.MeshBasicMaterial({ color: 0xffe040 });
  const en = []; for (let k = 0; k < 14; k++) { const d = new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 6), enM); scene.add(d); en.push(d); }
  const htM = new THREE.MeshBasicMaterial({ color: 0xff5020, transparent: true, opacity: .8 });
  const ht = []; for (let k = 0; k < 18; k++) { const d = new THREE.Mesh(new THREE.SphereGeometry(.1, 8, 6), htM); d.userData = { x: Math.random() * 2.4 - 1.2, o: Math.random() }; scene.add(d); ht.push(d); }
  // chemistry close-up (floating above)
  const chem = new THREE.Group(); chem.position.set(0, 3.6, 0); scene.add(chem);
  const cath = new THREE.Mesh(new THREE.BoxGeometry(.5, 2.4, 2), Mat({ color: 0xd04060 })); cath.position.x = -1.4; chem.add(cath);
  const sep = new THREE.Mesh(new THREE.BoxGeometry(.05, 2.4, 2), Mat({ color: 0xffffff, transparent: true, opacity: .5 })); chem.add(sep);
  for (let k = 0; k < 6; k++) { const g = new THREE.Mesh(new THREE.BoxGeometry(.6, .14, 2), Mat({ color: 0x8a90a0 })); g.position.set(1.4, -1.05 + k * .42, 0); chem.add(g); }
  const ionM = Mat({ color: 0xffd030, emissive: 0x806000 });
  const ions = []; for (let k = 0; k < 12; k++) { const i = new THREE.Mesh(new THREE.SphereGeometry(.12, 10, 8), ionM); i.userData = { y: -1.05 + (k % 6) * .42 + .21, z: (k < 6 ? -.45 : .45), d: (k % 6) * .08 + (k < 6 ? 0 : .3) }; chem.add(i); ions.push(i); }
  // voltage bars
  const bars = new THREE.Group(); bars.position.set(0, .3, -2.0); scene.add(bars);
  const b37 = new THREE.Mesh(new THREE.BoxGeometry(.5, 1, .5), Mat({ color: 0x40c060, emissive: 0x206030 })); b37.position.x = -1.9; bars.add(b37);
  const b5 = new THREE.Mesh(new THREE.BoxGeometry(.5, 1, .5), Mat({ color: 0xffd030, emissive: 0x806000 })); b5.position.x = 1.9; bars.add(b5);

  const shots = [
    [[6, 8, 11], [0, 1.5, -2.5]],  // 0 hook
    [[3, 4.5, 5.5], [0, .5, .4]],   // 1 cells
    [[0, 4.8, 8], [0, 3.6, 0]],   // 2 chemistry
    [[3, 4.5, 4.5], [0, 1.0, -2.0]],   // 3 boost
    [[4.5, 4.5, 2.5], [0, 1.4, -3.4]], // 4 losses
    [[-2.5, 3.5, 1.5], [.6, .4, -2.0]], // 5 protection
    [[-6, 8, 11], [0, 1.5, -2.5]], // 6 recap
  ];
  shots.forEach(sh => { for (let i = 0; i < 3; i++) sh[0][i] = sh[1][i] + (sh[0][i] - sh[1][i]) * 1.35; });
  const cp = { p: V(), q: V() };
  function update(t, si, lt, sd) {
    const pulse = .5 + .5 * Math.sin(t * 6);
    const xr = si >= 1 && si <= 5;
    shellM.opacity = xr ? .18 : 1; shellM.depthWrite = !xr;
    ledMs.forEach((m, k) => { m.emissive.setHex(0x40ff80); m.emissiveIntensity = k < 3 + (si === 0 ? Math.round(pulse) : 0) ? .9 : 0; });
    cellM.emissive.setHex(0x2060ff); cellM.emissiveIntensity = si === 1 ? .3 + .3 * pulse : si === 2 ? .2 : 0;
    // chemistry
    chem.visible = si === 2; phone.visible = si !== 2;
    const ch = si === 2 ? ease((lt - .4) / (sd * .8)) : 0;
    ions.forEach(i => { const u = i.userData; const k = Math.min(1, Math.max(0, ch * 1.6 - u.d)); i.position.set(lerp(-1.4, 1.4, ease(k)), u.y + Math.sin(t * 5 + u.d * 10) * .04, u.z); });
    // boost
    bars.visible = si === 3;
    const bk = si === 3 ? ease((lt - .3) / 2.5) : 0;
    b37.scale.y = 3.7 * .5; b37.position.y = 3.7 * .25;
    const h5 = lerp(3.7, 5, bk) * .5; b5.scale.y = h5; b5.position.y = h5 / 2;
    indM.emissive.setHex(0xffa040); indM.emissiveIntensity = si === 3 ? .4 + .5 * pulse : 0;
    boostM.emissive.setHex(0x40a0ff); boostM.emissiveIntensity = si === 3 ? .5 + .4 * pulse : 0;
    // losses
    pcbM.emissive.setHex(0xff4010); pcbM.emissiveIntensity = si === 4 ? .3 + .3 * pulse : 0;
    ht.forEach(d => { const u = d.userData; const o = (u.o + t * .5) % 1; d.position.set(u.x, .4 + o * 2.2, -2.0 + Math.sin(t + u.x * 3) * .3); d.scale.setScalar(1 - o * .7); d.visible = si === 4; });
    en.forEach((d, k) => { const o = (k / en.length + t * .35) % 1; d.position.copy(curve.getPoint(o)); d.visible = si === 0 || si === 4 || si === 6; });
    // protection
    protM.emissive.setHex(0x40ff90); protM.emissiveIntensity = si === 5 ? .5 + .4 * pulse : 0;
    shield.visible = si === 5; shield.rotation.set(Math.PI / 2 + Math.sin(t * 2) * .4, t * 2, 0); shield.scale.setScalar(1 + .15 * pulse);
    // phone battery
    const lvl = si === 0 ? .2 + .3 * ease(lt / sd) : si >= 4 ? .5 + .4 * ((si - 4) / 2 + (lt / sd) / 3) : .5;
    bFill.scale.y = Math.min(1, lvl); bFill.position.y = 2.5 - 1.45 * (1 - Math.min(1, lvl)) / 2;
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
