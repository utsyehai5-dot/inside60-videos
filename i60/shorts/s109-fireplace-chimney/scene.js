// Inside 60 — Fireplace chimney. Steps: 0 hook (house cutaway, heat going up), 1 fire + smoke, 2 draft (air in, smoke up),
// 3 warm room air pulled up, 4 damper closes, 5 chimney top above roof + wind, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 40, specular: 0x333333, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x1a2438);
  scene.add(new THREE.HemisphereLight(0xfff4ea, 0x404050, 1.4));
  const key = new THREE.DirectionalLight(0xffffff, .9); key.position.set(4, 7, 10); scene.add(key);
  const fireL = new THREE.PointLight(0xff8030, 3, 8, 1.5); fireL.position.set(0, -2.6, .6); scene.add(fireL);
  const root = new THREE.Group(); scene.add(root);
  const GY = -3.5, CEIL = 1.5, ROOF = 3.4, TOP = 6.2;
  const brickM = Mat({ color: 0xa8553a, shininess: 10 });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(12, .3, 6), Mat({ color: 0x8a6040, shininess: 20 })); floor.position.set(0, GY - .15, .8); root.add(floor);
  const wall = new THREE.Mesh(new THREE.BoxGeometry(12, CEIL - GY, .3), Mat({ color: 0xd8c8a8, shininess: 5 })); wall.position.set(0, (CEIL + GY) / 2, -1.6); root.add(wall);
  [-1, 1].forEach(s => { const c = new THREE.Mesh(new THREE.BoxGeometry(5.1, .3, 6), Mat({ color: 0xece6da, shininess: 5 })); c.position.set(s * 3.45, CEIL + .15, .8); root.add(c); });
  // roof (two slopes, seen as a gable cross-section)
  const roofM = Mat({ color: 0x504a55, shininess: 20 });
  [-1, 1].forEach(s => { const r = new THREE.Mesh(new THREE.BoxGeometry(6.0, .25, 5.2), roofM); r.position.set(s * 3.6, ROOF - 1.7, .4); r.rotation.z = -s * .55; root.add(r); });
  // chimney: hearth box + throat + flue cut open (back + side walls only)
  const FW = 1.0;
  const hearthBack = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.0, .3), brickM); hearthBack.position.set(0, GY + 1.0, -1.2); root.add(hearthBack);
  [-1, 1].forEach(s => { const w = new THREE.Mesh(new THREE.BoxGeometry(.4, 2.0, 1.4), brickM); w.position.set(s * 1.5, GY + 1.0, -.5); root.add(w); });
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(3.4, .5, 1.4), brickM); lintel.position.set(0, GY + 2.25, -.5); root.add(lintel);
  const hearthFloor = new THREE.Mesh(new THREE.BoxGeometry(3.4, .12, 1.8), Mat({ color: 0x555555 })); hearthFloor.position.set(0, GY + .06, -.3); root.add(hearthFloor);
  // flue walls from throat up to top
  const flueBack = new THREE.Mesh(new THREE.BoxGeometry(FW + .8, TOP - (GY + 2.5), .3), brickM); flueBack.position.set(0, (TOP + GY + 2.5) / 2, -1.2); root.add(flueBack);
  [-1, 1].forEach(s => { const w = new THREE.Mesh(new THREE.BoxGeometry(.4, TOP - (GY + 2.5), 1.4), brickM); w.position.set(s * (FW / 2 + .2), (TOP + GY + 2.5) / 2, -.5); root.add(w); });
  const cap = new THREE.Mesh(new THREE.BoxGeometry(FW + 1.4, .18, 1.8), Mat({ color: 0x777777 })); cap.position.set(0, TOP + .55, -.5); root.add(cap);
  [-1, 1].forEach(s => { const p = new THREE.Mesh(new THREE.BoxGeometry(.12, .45, .12), Mat({ color: 0x777777 })); p.position.set(s * .7, TOP + .25, -.5); root.add(p); });
  // damper (plate in throat, hinged at back)
  const damper = new THREE.Group(); damper.position.set(0, GY + 2.6, -1.0); root.add(damper);
  const dampM = Mat({ color: 0x404040, emissive: 0xffcc33, emissiveIntensity: 0, shininess: 120 });
  const plate = new THREE.Mesh(new THREE.BoxGeometry(FW - .05, .06, .9), dampM); plate.position.z = .45; damper.add(plate);
  // logs + flames
  const logM = Mat({ color: 0x6a4428, shininess: 5 });
  [[-.4, .3], [.4, -.3], [0, 0]].forEach(([x, r], i) => { const l = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, 1.5, 12).rotateZ(Math.PI / 2), logM); l.position.set(x * .3, GY + .3 + (i === 2 ? .25 : 0), -.4); l.rotation.y = r; root.add(l); });
  const flameM = new THREE.MeshBasicMaterial({ color: 0xff8a20, transparent: true, opacity: .9 });
  const flameM2 = new THREE.MeshBasicMaterial({ color: 0xffd040, transparent: true, opacity: .9 });
  const flames = Array.from({ length: 9 }, (_, i) => { const f = new THREE.Mesh(new THREE.ConeGeometry(.16, .8, 10), i % 2 ? flameM2 : flameM); f.position.set(-.6 + i * .15, GY + .85, -.4 + (i % 3) * .1); root.add(f); return f; });
  // smoke / hot gas path up the flue and out
  const upC = new THREE.CatmullRomCurve3([V(0, GY + .7, -.4), V(0, GY + 2.0, -.6), V(0, GY + 2.9, -.6), V(0, CEIL, -.5), V(0, TOP, -.5), V(.4, TOP + 1.2, -.5), V(2.2, TOP + 2.0, -.5)]);
  const smoke = Array.from({ length: 70 }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(.13, 8, 6), new THREE.MeshBasicMaterial({ color: 0x888888, transparent: true, opacity: .8 })); m.userData.o = i / 70; m.userData.j = Math.random() - .5; root.add(m); return m; });
  // fresh / room air flowing into fireplace from the room
  const inC = new THREE.CatmullRomCurve3([V(4.5, GY + 2.6, 2.2), V(3.0, GY + 1.0, 2.0), V(1.4, GY + .5, 1.2), V(.3, GY + .6, -.2), V(0, GY + 1.6, -.5), V(0, GY + 3.0, -.6), V(0, CEIL + 1, -.5)]);
  const airs = Array.from({ length: 40 }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(.1, 8, 6), new THREE.MeshBasicMaterial({ color: 0x60b0ff, transparent: true, opacity: .9 })); m.userData.o = i / 40; m.userData.j = Math.random() - .5; root.add(m); return m; });
  // wind particles across roof top
  const winds = Array.from({ length: 18 }, (_, i) => { const m = new THREE.Mesh(new THREE.CapsuleGeometry(.04, .5, 4, 8).rotateZ(Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xcfe8ff })); m.userData.o = i / 18; m.userData.y = TOP + .6 + (i % 5) * .35; root.add(m); return m; });
  // heat arrows (big orange arrow going up the chimney)
  const arrowM = new THREE.MeshBasicMaterial({ color: 0xffb030, transparent: true, opacity: .0 });
  const arrow = new THREE.Group(); arrow.position.set(0, 0, .6); root.add(arrow);
  const sh = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, 3.0, 12), arrowM); arrow.add(sh);
  const hd = new THREE.Mesh(new THREE.ConeGeometry(.45, .8, 16), arrowM); hd.position.y = 1.9; arrow.add(hd);

  const shots = [
    [[0, .6, 31], [0, .4, 0]],          // 0 wide house
    [[.8, GY + 1.4, 5.0], [0, GY + 1.0, -.4]], // 1 fire
    [[2.2, GY + 2.6, 9.5], [.6, GY + 2.2, 0]], // 2 draft
    [[3.0, -.6, 14.5], [1.2, -.6, 0]],    // 3 room air pulled up
    [[.9, GY + 3.0, 4.0], [0, GY + 2.6, -.6]], // 4 damper
    [[1.5, TOP - .6, 8.5], [.6, TOP + .2, -.5]], // 5 top
    [[0, .6, 31], [0, .4, 0]],          // 6 recap
  ];
  const cp = { p: V(), q: V() };
  function update(t, si, lt, sd) {
    const pulse = .5 + .5 * Math.sin(t * 6);
    const closed = si === 4 ? ease((lt - 1.2) / 1.2) : 0;
    damper.rotation.x = lerp(-1.3, 0, closed);
    dampM.emissiveIntensity = si === 4 ? .2 + .2 * pulse : 0;
    const fire = si === 4 ? 1 - ease((lt - .6) / 1.0) : 1;
    flames.forEach((f, i) => { f.scale.set(fire, (.7 + .5 * Math.abs(Math.sin(t * 8 + i * 1.7))) * Math.max(.01, fire), fire); f.visible = fire > .02; });
    fireL.intensity = 3 * fire;
    smoke.forEach(m => { const u = (m.userData.o + t * .09) % 1; m.position.copy(upC.getPointAt(u)); m.position.x += m.userData.j * .5 * Math.min(1, u * 3);
      const hot = Math.max(0, 1 - u * 3); m.material.color.setHex(0x8a8a8a).lerp(new THREE.Color(0xff9040), hot);
      m.scale.setScalar(.7 + u * 1.2); m.visible = closed < .5 && si !== 4 || si === 4 && closed < .5; m.material.opacity = .8 * (1 - closed); });
    const showAir = si === 2 || si === 3 || si === 0;
    airs.forEach(m => { const u = (m.userData.o + t * .12) % 1; m.position.copy(inC.getPointAt(u)); m.position.y += m.userData.j * .4 * (1 - u); m.visible = showAir;
      const warm = si === 3 ? 1 : 0; m.material.color.setHex(0x60b0ff).lerp(new THREE.Color(0xffb060), warm * (1 - u * .5)); });
    winds.forEach(m => { const u = (m.userData.o + t * .25) % 1; m.position.set(-4 + u * 8, m.userData.y, -.5 + (m.userData.o * 7 % 1)); m.visible = si === 5 || si === 0 || si === 6; });
    arrowM.opacity = (si === 0 || si === 3 || si === 6) ? .55 + .2 * pulse : 0;
    arrow.position.y = CEIL + 1.5 + ((t * .8) % 1) * .4;
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
