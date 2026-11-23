// Inside 60 — Clothes dryer (vented). Steps: 0 hook (cutaway), 1 heater heats intake air, 2 drum tumbles clothes,
// 3 water evaporates into air, 4 fan pulls damp air through lint filter, 5 out the vent, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x1b2233);
  scene.add(new THREE.HemisphereLight(0xfff4ea, 0x404050, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, .9); key.position.set(4, 7, 10); scene.add(key);
  const root = new THREE.Group(); scene.add(root);
  const wall = new THREE.Mesh(new THREE.BoxGeometry(16, 12, .3), Mat({ color: 0x7a96a8, shininess: 5 })); wall.position.set(0, 0, -2.4); root.add(wall);
  const floor = new THREE.Mesh(new THREE.BoxGeometry(16, .3, 8), Mat({ color: 0xcfc6b8, shininess: 10 })); floor.position.set(0, -2.45, 1); root.add(floor);
  // cabinet
  const cabM = Mat({ color: 0xf6f6f6, transparent: true, opacity: 1, side: THREE.DoubleSide });
  const cab = new THREE.Mesh(new THREE.BoxGeometry(3.0, 4.2, 3.0), cabM); cab.position.set(0, -.2, -.6); root.add(cab);
  const ctrl = new THREE.Mesh(new THREE.BoxGeometry(3.0, .5, .2), Mat({ color: 0x334455, emissive: 0x2288ff, emissiveIntensity: .3 })); ctrl.position.set(0, 2.1, .9); root.add(ctrl);
  // drum: open cylinder lying along z, with lifting baffles
  const drumM = Mat({ color: 0xb8c4cc, shininess: 160, side: THREE.DoubleSide });
  const drum = new THREE.Group(); drum.position.set(0, .2, -.6); root.add(drum);
  drum.add(new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 2.4, 40, 1, true).rotateX(Math.PI / 2), drumM));
  const back = new THREE.Mesh(new THREE.CircleGeometry(1.25, 40), Mat({ color: 0x8a98a2 })); back.position.z = -1.2; drum.add(back);
  for (let i = 0; i < 3; i++) { const g = new THREE.Group(); g.rotation.z = i * Math.PI * 2 / 3; const b = new THREE.Mesh(new THREE.BoxGeometry(.25, .3, 2.3), drumM); b.position.y = 1.1; g.add(b); drum.add(g); }
  // clothes
  const cols = [0xe04848, 0x3a7ae0, 0xf0c030, 0x40c070, 0xa050d0, 0xff8a30, 0x30c0c0];
  const clothes = Array.from({ length: 9 }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(.32, 14, 10), Mat({ color: cols[i % cols.length], shininess: 10 })); m.scale.set(1.3, .6, 1); m.userData.o = i / 9; m.userData.z = -1.3 + (i % 3) * .55; root.add(m); return m; });
  // heater box at back-top with glowing coil
  const HX = -1.0, HY = 2.85, HZ = -1.6;
  const heatM = Mat({ color: 0xa04020, emissive: 0xff4010, emissiveIntensity: .2, shininess: 150 });
  const hp = []; for (let i = 0; i <= 160; i++) { const u = i / 160, a = u * Math.PI * 2 * 9; hp.push(V(HX - .8 + u * 1.6, HY + Math.cos(a) * .18, HZ + Math.sin(a) * .18)); }
  root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(hp), 400, .035, 6, false), heatM));
  const hbox = new THREE.Mesh(new THREE.BoxGeometry(2.0, .6, .6), Mat({ color: 0x888888, transparent: true, opacity: .25 })); hbox.position.set(HX, HY, HZ); root.add(hbox);
  // lint filter at front-bottom; fan below-right; vent duct out the back wall
  const LX = .9, LY = -1.4, LZ = .5;
  const lintM = Mat({ color: 0xdddddd, emissive: 0xffcc33, emissiveIntensity: 0, transparent: true, opacity: .8 });
  const lint = new THREE.Mesh(new THREE.BoxGeometry(1.2, .06, .7), lintM); lint.position.set(LX, LY, LZ); root.add(lint);
  const fluff = new THREE.Mesh(new THREE.BoxGeometry(1.0, .05, .55), Mat({ color: 0x9a9aa8, shininess: 2 })); fluff.position.set(LX, LY + .05, LZ); fluff.scale.y = .01; root.add(fluff);
  const FX = .9, FY = -1.85, FZ = -1.2;
  const fan = new THREE.Group(); fan.position.set(FX, FY, FZ); root.add(fan);
  const fanM = Mat({ color: 0xffcc33, emissive: 0xffaa00, emissiveIntensity: .2 });
  for (let i = 0; i < 6; i++) { const g = new THREE.Group(); g.rotation.z = i * Math.PI / 3; const b = new THREE.Mesh(new THREE.BoxGeometry(.3, .07, .2), fanM); b.position.x = .17; g.add(b); fan.add(g); }
  const ductM = Mat({ color: 0xc8c8c8, shininess: 160 });
  const ductC = new THREE.CatmullRomCurve3([V(FX, FY, FZ), V(1.9, FY, -1.7), V(2.6, -1.0, -2.0), V(3.6, .4, -2.0), V(5.6, .6, -2.0), V(7.5, .6, -2.0)], false, 'catmullrom', .2);
  root.add(new THREE.Mesh(new THREE.TubeGeometry(ductC, 80, .32, 16, false), ductM));
  const ventCap = new THREE.Mesh(new THREE.BoxGeometry(.9, .9, .3), Mat({ color: 0xffffff })); ventCap.position.set(5.2, .6, -2.2); root.add(ventCap);
  // airflow path: intake (left) -> heater -> into drum (back) -> swirls -> down front to lint -> fan -> duct out
  const airC = new THREE.CatmullRomCurve3([V(-3.2, 2.9, -1.6), V(HX - .9, HY, HZ), V(HX + .9, HY, HZ), V(.2, 1.6, -1.4), V(-.4, .6, -1.0), V(.4, -.2, -.5), V(.4, .5, 0), V(LX, -.9, .5), V(LX, LY - .1, LZ), V(FX, FY, FZ + .6), V(FX, FY, FZ), V(1.9, FY, -1.7), V(2.6, -1.0, -2.0), V(3.6, .4, -2.0), V(5.6, .6, -2.0), V(7.5, .6, -2.0)]);
  const airs = Array.from({ length: 90 }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(.08, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .9 })); m.userData.o = i / 90; root.add(m); return m; });
  const U_HEAT = [.06, .14], U_DRUM = [.18, .42];
  // vapour wisps rising from clothes
  const vapM = new THREE.MeshBasicMaterial({ color: 0xe8f6ff, transparent: true, opacity: .7 });
  const vaps = Array.from({ length: 30 }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), vapM); m.userData.o = i / 30; m.userData.c = i % 9; root.add(m); return m; });

  const shots = [
    [[1.2, .3, 23], [1.2, .1, -.6]],          // 0 wide
    [[-.4, 3.0, 4.2], [HX, HY - .2, HZ]],     // 1 heater
    [[.3, .5, 6.0], [0, .2, -.6]],            // 2 drum
    [[.6, .9, 4.2], [0, .0, -.6]],            // 3 vapour
    [[2.4, -.6, 4.4], [LX, -1.5, -.2]],       // 4 lint + fan
    [[4.6, .6, 9.5], [3.4, .1, -1.8]],        // 5 vent
    [[1.2, .3, 23], [1.2, .1, -.6]],          // 6 recap
  ];
  const cp = { p: V(), q: V() };
  let lastT = 0, rot = 0;
  function update(t, si, lt, sd) {
    const dt = Math.min(.05, Math.max(0, t - lastT)); lastT = t;
    const pulse = .5 + .5 * Math.sin(t * 6);
    rot += dt * 2.2; drum.rotation.z = rot; fan.rotation.z = -t * 16;
    cabM.opacity = .16;
    heatM.emissiveIntensity = si === 1 ? .6 + .4 * pulse : .35;
    lintM.emissiveIntensity = si === 4 ? .25 + .25 * pulse : 0;
    fanM.emissiveIntensity = si === 4 ? .5 : .2;
    fluff.scale.y = si >= 4 ? Math.min(1, (si === 4 ? lt / sd : 1)) : (si === 0 ? .4 : .01);
    // clothes tumble: carried up by drum then fall
    clothes.forEach(m => { const ph = (m.userData.o + t * .35) % 1, A1 = -Math.PI / 2 + 2.2; let x, y;
      if (ph < .6) { const a = -Math.PI / 2 + ph / .6 * 2.2; x = Math.cos(a) * .95; y = Math.sin(a) * .95; }
      else { const k = (ph - .6) / .4; x = lerp(Math.cos(A1) * .95, 0, k); y = lerp(Math.sin(A1) * .95, -.95, k * k); }
      m.position.set(x, .2 + y, m.userData.z);
      m.rotation.set(t * 1.3 + m.userData.o * 5, t * .9, t * .7 + m.userData.o * 3); });
    // air
    airs.forEach(m => { const u = (m.userData.o + t * .06) % 1; m.position.copy(airC.getPointAt(u));
      let c; if (u < U_HEAT[0]) c = 0x60b0ff; else if (u < U_DRUM[0]) c = 0xff5020; else if (u < U_DRUM[1]) c = 0xff9040; else c = 0xc8d8e8;
      m.material.color.setHex(c); m.visible = true; });
    const showVap = si === 0 || si === 3 || si === 2;
    vaps.forEach(m => { const c = clothes[m.userData.c], k = (m.userData.o * 3 + t * .8) % 1; m.visible = showVap; m.position.set(c.position.x + Math.sin(k * 9 + m.userData.o * 20) * .15, c.position.y + .2 + k * .9, c.position.z); m.scale.setScalar(1 + k); });
    vapM.opacity = si === 3 ? .85 : .5;
    // camera
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const kk = si === 0 ? 1 : ease(lt / 1.4);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], kk))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], kk)));
    const ob = Math.sin(t * .25) * .07, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(ob) - dz * Math.sin(ob), cp.p.y, cp.q.z + dz * Math.cos(ob) + dx * Math.sin(ob));
    camera.lookAt(cp.q);
  }
  return { update };
}
