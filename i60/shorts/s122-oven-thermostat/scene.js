// Inside 60 — Oven thermostat (cutaway oven). Steps: 0 hook on/off, 1 sensor probe, 2 resistance rises, 3 element on,
// 4 power cut / cools, 5 temperature wave around set point, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 70, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const rnd = (() => { let s = 77; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  scene.background = new THREE.Color(0x182030);
  scene.add(new THREE.HemisphereLight(0xfff4ea, 0x404050, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, .9); key.position.set(5, 9, 10); scene.add(key);
  const root = new THREE.Group(); scene.add(root);

  // oven cavity: back, floor, ceiling, left wall solid; front glass ghost
  const wallM = Mat({ color: 0x334155, shininess: 30, side: THREE.DoubleSide });
  const enamel = Mat({ color: 0x1e293b, shininess: 50, side: THREE.DoubleSide });
  const box = (w, h, d, m, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); root.add(b); return b; };
  box(8, 6, .2, enamel, 0, 0, -3);       // back
  box(8, .2, 6, enamel, 0, -3, 0);       // floor
  box(8, .2, 6, enamel, 0, 3, 0);        // ceiling
  box(.2, 6, 6, enamel, -4, 0, 0);       // left
  box(.2, 6, 6, wallM, 4, 0, 0);         // right
  box(8, 6, .1, Mat({ color: 0x93c5fd, transparent: true, opacity: .08, depthWrite: false }), 0, 0, 3);
  box(8.6, 1.4, 6.4, Mat({ color: 0x64748b }), 0, 3.8, 0); // control panel top
  // dial
  const dial = new THREE.Mesh(new THREE.CylinderGeometry(.45, .45, .3, 32), Mat({ color: 0xe5e7eb }));
  dial.rotation.x = Math.PI / 2; dial.position.set(-2.5, 3.8, 3.3); root.add(dial);
  const tick = new THREE.Mesh(new THREE.BoxGeometry(.08, .35, .05), Mat({ color: 0xef4444 })); tick.position.set(0, .2, .17); tick.rotation.x = -Math.PI / 2;
  const dialG = new THREE.Group(); dialG.position.copy(dial.position); dialG.add(tick); root.add(dialG);
  // rack + dish
  const rackM = Mat({ color: 0xcbd5e1, shininess: 120 });
  for (let i = -3; i <= 3; i++) box(.05, .05, 5.6, rackM, i * 1.1, -.6, 0);
  box(7.4, .06, .06, rackM, 0, -.6, 2.8); box(7.4, .06, .06, rackM, 0, -.6, -2.8);
  const dishM = Mat({ color: 0xfbbf24, emissive: 0xff8a00, emissiveIntensity: 0 });
  const dish = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.3, .6, 40), Mat({ color: 0xf1f5f9 })); dish.position.set(0, -.25, 0); root.add(dish);
  const cake = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, .5, 40), dishM); cake.position.set(0, -.05, 0); root.add(cake);

  // bottom heating element: zigzag tube
  const elM = Mat({ color: 0x57534e, emissive: 0xff3a00, emissiveIntensity: 0 });
  const ep = [V(-3.6, -2.6, 2.4)];
  for (let i = 0; i < 6; i++) { const x = -3.2 + i * 1.3; ep.push(V(x, -2.6, (i % 2 ? -2.2 : 2.2))); }
  ep.push(V(3.6, -2.6, -2.4));
  root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ep, false, 'catmullrom', .1), 200, .09, 10, false), elM));

  // sensor probe: rod from back wall, upper left
  const probeM = Mat({ color: 0xd1d5db, emissive: 0x22d3ee, emissiveIntensity: 0, shininess: 140 });
  const probe = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, 2.4, 16), probeM); probe.rotation.x = Math.PI / 2; probe.position.set(-2.6, 2.2, -1.8); root.add(probe);
  const mount = new THREE.Mesh(new THREE.CylinderGeometry(.25, .25, .2, 20), Mat({ color: 0x94a3b8 })); mount.rotation.x = Math.PI / 2; mount.position.set(-2.6, 2.2, -2.95); root.add(mount);
  // sensor internal "resistance" coil (visible glowing spiral beside probe, step 2)
  const coilPts = []; for (let i = 0; i <= 120; i++) { const a = i / 120 * Math.PI * 16; coilPts.push(V(-2.6 + Math.cos(a) * .2, 2.2 + Math.sin(a) * .2, -2.6 + i / 120 * 2.0)); }
  const coilM = Mat({ color: 0xfacc15, emissive: 0xfacc15, emissiveIntensity: 0, transparent: true, opacity: 0 });
  root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(coilPts), 300, .025, 6, false), coilM));
  // signal pulses travelling from probe up to control
  const sigM = Mat({ color: 0x67e8f9, emissive: 0x22d3ee, emissiveIntensity: 1 });
  const sig = Array.from({ length: 10 }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(.09, 10, 8), sigM); m.userData = { o: i / 10 }; root.add(m); return m; });

  // big thermometer gauge on right side (outside oven)
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(.35, .35, 5, 24, 1, true), Mat({ color: 0xffffff, transparent: true, opacity: .25, side: THREE.DoubleSide, depthWrite: false }));
  tube.position.set(5.4, 0, 1); root.add(tube);
  const fillM = Mat({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: .5 });
  const fill = new THREE.Mesh(new THREE.CylinderGeometry(.26, .26, 1, 20), fillM); fill.position.set(5.4, 0, 1); root.add(fill);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(.55, 24, 16), fillM); bulb.position.set(5.4, -2.7, 1); root.add(bulb);
  const setMark = new THREE.Mesh(new THREE.BoxGeometry(1.3, .08, .08), Mat({ color: 0x4ade80, emissive: 0x22c55e, emissiveIntensity: .8 })); setMark.position.set(5.4, .2, 1); root.add(setMark);
  // relay switch on right: base + lever
  const relayBase = box(1.2, .3, 1.0, Mat({ color: 0x111827 }), 6.8, .8, 1);
  const contact = box(.3, .25, .3, Mat({ color: 0xfbbf24, emissive: 0xf59e0b, emissiveIntensity: .3 }), 7.3, 1.05, 1);
  const lever = new THREE.Group(); lever.position.set(6.35, 1.05, 1); root.add(lever);
  const lv = new THREE.Mesh(new THREE.BoxGeometry(1.1, .1, .2), Mat({ color: 0xe5e7eb })); lv.position.x = .55; lever.add(lv);
  const sparkM = Mat({ color: 0xffffff, emissive: 0x93c5fd, emissiveIntensity: 1 });
  const spark = new THREE.Mesh(new THREE.OctahedronGeometry(.18), sparkM); spark.position.set(7.3, 1.25, 1); root.add(spark);

  // heat particles rising from element
  const heatM = Mat({ color: 0xffa94d, emissive: 0xff6a00, emissiveIntensity: .9, transparent: true, opacity: .8, depthWrite: false });
  const heat = Array.from({ length: 90 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(.07, 6, 4), heatM); m.userData = { o: rnd(), x: (rnd() - .5) * 7, z: (rnd() - .5) * 5 }; root.add(m); return m; });

  // simulated oven temperature 0..1 around set point .5
  const tempAt = (si, lt, t) => {
    if (si === 3) return lerp(.25, .58, Math.min(1, lt / 4));
    if (si === 4) return lerp(.58, .42, Math.min(1, lt / 4));
    return .5 + .09 * Math.sin(t * 1.3);
  };
  const shots = [
    [[6, 3.5, 14.5], [1, .2, 0]],      // 0 wide
    [[-0.5, 3.0, 3.2], [-2.6, 2.1, -1.6]], // 1 probe
    [[-1.0, 2.6, 2.0], [-2.6, 2.2, -1.8]], // 2 coil close
    [[1.5, -.4, 7.5], [0, -2.0, 0]],   // 3 element
    [[10.5, 1.5, 10.5], [6.0, .4, 1]],  // 4 relay + gauge
    [[4, 1.6, 12], [2, 0, 0]],         // 5 wave
    [[6, 3.5, 14.5], [1, .2, 0]],      // 6 recap
  ];
  const cp = { p: V(), q: V() };
  function update(t, si, lt, sd) {
    const pulse = .5 + .5 * Math.sin(t * 6);
    const T = tempAt(si, lt, t);
    const on = si === 3 ? true : si === 4 ? false : (Math.cos(t * 1.3) > 0); // heating while temp rising
    elM.emissiveIntensity = lerp(elM.emissiveIntensity, on ? 1.0 : 0.05, .08);
    elM.color.setHex(on ? 0x7c2d12 : 0x57534e);
    heat.forEach(m => { const u = m.userData, k = (u.o + t * .35) % 1; m.position.set(u.x + Math.sin(t + u.o * 9) * .2, -2.5 + k * 5.2, u.z); m.visible = elM.emissiveIntensity > .3; m.scale.setScalar(1 - k * .6); });
    fill.scale.y = .4 + T * 4.4; fill.position.y = -2.4 + fill.scale.y / 2;
    lever.rotation.z = on ? -.18 : .35;
    spark.visible = on && si >= 3 && pulse > .6; spark.scale.setScalar(.6 + pulse);
    probeM.emissiveIntensity = si === 1 || si === 2 ? .4 + .4 * pulse : .1;
    coilM.opacity = si === 2 ? Math.min(1, lt / .8) : 0; coilM.emissiveIntensity = si === 2 ? .3 + Math.min(1, lt / sd) * .9 : 0;
    sig.forEach(m => { const k = (m.userData.o + t * .6) % 1; m.position.set(-2.6, lerp(2.2, 3.4, k), lerp(-2.6, -2.9, k)); m.visible = si === 2; });
    dishM.emissiveIntensity = .15 * T;
    dialG.rotation.z = -1.2;
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
