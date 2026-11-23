// Inside 60 — Steam iron. Steps: 0 hook, 1 heating element in soleplate, 2 bimetallic thermostat,
// 3 water drips from tank into steam chamber, 4 drops flash to steam, 5 steam out holes into fabric, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x1d2236);
  scene.add(new THREE.HemisphereLight(0xfff4ea, 0x404050, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, .9); key.position.set(4, 8, 10); scene.add(key);
  const root = new THREE.Group(); scene.add(root);

  // ironing board + fabric (wrinkled plane that flattens under the iron)
  const board = new THREE.Mesh(new THREE.BoxGeometry(12, .3, 5), Mat({ color: 0x5a6a80, shininess: 10 })); board.position.y = -1.35; root.add(board);
  const fabGeo = new THREE.PlaneGeometry(11, 4.4, 110, 44).rotateX(-Math.PI / 2);
  const fabBase = fabGeo.attributes.position.array.slice();
  const fabric = new THREE.Mesh(fabGeo, Mat({ color: 0x3f8fe0, shininess: 8, side: THREE.DoubleSide })); fabric.position.y = -1.15; root.add(fabric);

  // soleplate: pointed shape extruded
  const sh = new THREE.Shape(); sh.moveTo(-2.2, -1.1); sh.lineTo(1.0, -1.1); sh.quadraticCurveTo(2.4, -.6, 2.9, 0); sh.quadraticCurveTo(2.4, .6, 1.0, 1.1); sh.lineTo(-2.2, 1.1); sh.quadraticCurveTo(-2.4, 0, -2.2, -1.1);
  const soleM = Mat({ color: 0xc8ccd4, shininess: 200, emissive: 0xff3300, emissiveIntensity: 0, transparent: true, opacity: 1 });
  const sole = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: .35, bevelEnabled: true, bevelSize: .06, bevelThickness: .05, bevelSegments: 2 }).rotateX(-Math.PI / 2), soleM);
  const iron = new THREE.Group(); root.add(iron); iron.add(sole);
  // steam holes (dark dots on underside) shown as small cylinders around edge
  const holes = []; for (let i = 0; i < 14; i++) { const x = -1.8 + (i % 7) * .6, z = i < 7 ? -.6 : .6; holes.push(V(x, 0, z)); }
  // heating element: U tube inside soleplate
  const hc = new THREE.CatmullRomCurve3([V(-2.0, .18, -.75), V(.8, .18, -.75), V(2.1, .18, 0), V(.8, .18, .75), V(-2.0, .18, .75)]);
  const heatM = Mat({ color: 0x802010, emissive: 0xff4010, emissiveIntensity: .2, shininess: 150 });
  iron.add(new THREE.Mesh(new THREE.TubeGeometry(hc, 80, .11, 8, false), heatM));
  // steam chamber (cavity) in middle
  const chamM = Mat({ color: 0x444a55, emissive: 0xff6020, emissiveIntensity: .1 });
  const cham = new THREE.Mesh(new THREE.BoxGeometry(1.6, .12, .8), chamM); cham.position.set(.2, .36, 0); iron.add(cham);
  // body shell (transparent) + handle
  const bodyM = Mat({ color: 0xe84a6a, transparent: true, opacity: .25, side: THREE.DoubleSide });
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), bodyM); body.scale.set(2.5, 1.2, 1.15); body.position.set(-.1, .45, 0); iron.add(body);
  const handleM = Mat({ color: 0xe84a6a, shininess: 60 });
  const hcurve = new THREE.CatmullRomCurve3([V(-2.0, 1.2, 0), V(-1.6, 2.4, 0), V(.2, 2.55, 0), V(1.4, 1.6, 0)]);
  iron.add(new THREE.Mesh(new THREE.TubeGeometry(hcurve, 40, .22, 12, false), handleM));
  // water tank (transparent blue box) and water inside
  const tank = new THREE.Mesh(new THREE.BoxGeometry(1.8, .8, 1.3), Mat({ color: 0x99ccff, transparent: true, opacity: .3 })); tank.position.set(.1, 1.25, 0); iron.add(tank);
  const water = new THREE.Mesh(new THREE.BoxGeometry(1.7, .5, 1.2), Mat({ color: 0x3aa0ff, transparent: true, opacity: .7, emissive: 0x1060c0, emissiveIntensity: .2 })); water.position.set(.1, 1.12, 0); iron.add(water);
  // drip valve needle
  const valveM = Mat({ color: 0xffcc33, emissive: 0xffaa00, emissiveIntensity: .2 });
  const valve = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .5, 10), valveM); valve.position.set(.2, .7, 0); iron.add(valve);
  // bimetallic strip near back: two layered strips that bend
  const bimG = new THREE.Group(); bimG.position.set(-1.5, .55, 0); iron.add(bimG);
  const s1M = Mat({ color: 0xd08040, emissive: 0xff6000, emissiveIntensity: 0 }), s2M = Mat({ color: 0xc0c8d0 });
  const strip1 = new THREE.Mesh(new THREE.BoxGeometry(.9, .06, .3), s1M), strip2 = new THREE.Mesh(new THREE.BoxGeometry(.9, .06, .3), s2M);
  strip1.position.set(.45, .03, 0); strip2.position.set(.45, -.03, 0); bimG.add(strip1, strip2);
  const contact = new THREE.Mesh(new THREE.SphereGeometry(.1, 12, 8), Mat({ color: 0xffee88, emissive: 0xffdd00, emissiveIntensity: .5 })); contact.position.set(-.6, .62, 0); iron.add(contact);
  // drops and steam
  const dropM = Mat({ color: 0x40a8ff, emissive: 0x2070ff, emissiveIntensity: .4 });
  const drops = Array.from({ length: 4 }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(.08, 10, 8), dropM); m.userData.o = i / 4; iron.add(m); return m; });
  const stM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .75 });
  const puffs = Array.from({ length: 90 }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(.1, 8, 6), stM); m.userData.o = Math.random(); m.userData.h = i % holes.length; m.userData.a = Math.random() * 6.28; root.add(m); return m; });

  const IY = -.98; // iron sits on fabric
  const shots = [
    [[2.0, 2.6, 14], [0, -.2, 0]],       // 0 wide
    [[1.5, 5.0, 7.0], [0, -.2, 0]],      // 1 heater (from above, shell faded)
    [[-.6, 1.6, 6.0], [-1.0, -.4, 0]],   // 2 thermostat close
    [[2.4, 2.2, 7.0], [.2, -.1, 0]],     // 3 tank drip
    [[1.8, 1.0, 6.0], [.2, -.6, 0]],     // 4 chamber flash
    [[4.5, .8, 9.5], [.4, -.7, 0]],      // 5 low angle fabric + steam
    [[2.0, 2.6, 14], [0, -.2, 0]],       // 6 recap
  ];
  const cp = { p: V(), q: V() };
  function update(t, si, lt, sd) {
    const pulse = .5 + .5 * Math.sin(t * 6);
    // iron glides back and forth
    const ix = Math.sin(t * .5) * (si === 5 ? 1.8 : si === 0 || si === 6 ? 1.0 : .3);
    iron.position.set(ix, IY, 0);
    const hot = Math.min(1, t / 6);
    heatM.emissiveIntensity = si === 1 ? .7 + .3 * pulse : .35;
    soleM.emissiveIntensity = (si === 1 ? .25 : .12) * hot;
    soleM.opacity = si >= 1 && si <= 4 ? .4 : 1; soleM.depthWrite = soleM.opacity > .9;
    bodyM.opacity = si >= 1 && si <= 4 ? .14 : .45;
    // thermostat bending cycle
    const cyc = (Math.sin(t * (si === 2 ? 2 : .8)) + 1) / 2;
    bimG.rotation.z = cyc * .35; s1M.emissiveIntensity = cyc * .6;
    contact.material.emissiveIntensity = cyc > .5 ? .05 : 1;
    heatM.emissive.setHex(si === 2 && cyc > .5 ? 0x501008 : 0xff4010);
    valveM.emissiveIntensity = si === 3 ? .5 + .4 * pulse : .2;
    // drops fall from valve to chamber
    drops.forEach(m => { const k = (m.userData.o + t * .9) % 1; m.position.set(.2, .45 - k * .1 - k * k * .0, 0); m.position.y = .45 - k * .14; m.visible = si >= 3 && si <= 4 || si === 0; m.scale.setScalar(si === 4 ? 1 - k : 1); });
    chamM.emissiveIntensity = si === 4 ? .5 + .5 * pulse : .15;
    // steam out of holes
    const steamOn = si >= 4 || si === 0;
    puffs.forEach(m => { const h = holes[m.userData.h], k = (m.userData.o + t * .7) % 1;
      m.visible = steamOn; const r = .2 + k * 1.4;
      m.position.set(ix + h.x + Math.cos(m.userData.a) * r * .6, IY - .12 + k * (si === 5 ? .15 : .9) * (si === 5 ? 1 : 1), h.z * 1.2 + Math.sin(m.userData.a) * r);
      if (si !== 5) m.position.y = IY + .05 + k * 1.2;
      m.scale.setScalar(.4 + k * .9); });
    stM.opacity = (si >= 4 ? .6 : .4) * (1 - ((t * 0) ));
    // fabric wrinkles: flat under/behind iron path
    const p = fabGeo.attributes.position.array;
    for (let i = 0; i < p.length; i += 3) { const x = fabBase[i], z = fabBase[i + 2];
      const d = Math.abs(x - ix), flat = Math.max(0, Math.min(1, (d - 2.3) / 1.2));
      const amt = (si === 5 || si === 6 ? (x < ix ? 0 : flat) : flat) * .14;
      p[i + 1] = Math.sin(x * 3.1 + z * 1.7) * Math.cos(z * 2.3 - x) * amt; }
    fabGeo.attributes.position.needsUpdate = true;
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
