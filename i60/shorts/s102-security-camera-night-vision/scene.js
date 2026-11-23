// Inside 60 — Security camera night vision. Steps: 0 hook (camera in dark yard, IR cone), 1 dusk + light sensor,
// 2 IR-cut filter slides away (cutaway), 3 IR LED ring on, 4 light bounces back to lens, 5 black & white, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const day = new THREE.Color(0x5a86b8), dusk = new THREE.Color(0x0a0e1c);
  scene.background = day.clone(); scene.fog = new THREE.Fog(0x0a0e1c, 30, 80);
  const hemi = new THREE.HemisphereLight(0xfff4e8, 0x303040, 1.6); scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff, 1.0); key.position.set(6, 9, 8); scene.add(key);
  const root = new THREE.Group(); scene.add(root);
  const GY = -2.8;

  // yard: ground, house wall, tree, bench, ball, bike-ish box
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), Mat({ color: 0x4f8a48, shininess: 5 })); ground.rotation.x = -Math.PI / 2; ground.position.y = GY; root.add(ground);
  const wall = new THREE.Mesh(new THREE.BoxGeometry(16, 9, .4), Mat({ color: 0xd8c4a0, shininess: 10 })); wall.position.set(0, GY + 4.5, -4.5); root.add(wall);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.12, .14, 4.4, 12), Mat({ color: 0x505860 })); pole.position.set(-3.2, GY + 2.2, -.6); root.add(pole);
  const colored = [];
  const add = (geo, color, pos) => { const m = Mat({ color }); const o = new THREE.Mesh(geo, m); o.position.copy(pos); root.add(o); colored.push({ m, c: new THREE.Color(color) }); return o; };
  add(new THREE.CylinderGeometry(.25, .35, 3, 12), 0x7a4a28, V(3.4, GY + 1.5, -2.5));
  add(new THREE.ConeGeometry(1.6, 3.4, 16), 0x2e9a40, V(3.4, GY + 4.2, -2.5));
  add(new THREE.SphereGeometry(1.2, 16, 12), 0x38b050, V(3.4, GY + 3.2, -2.5));
  add(new THREE.BoxGeometry(2.4, .2, .8), 0xc86030, V(1.0, GY + .9, -.5));
  [-1, 1].forEach(s => add(new THREE.BoxGeometry(.15, .9, .7), 0x704020, V(1.0 + s * 1.0, GY + .45, -.5)));
  add(new THREE.SphereGeometry(.4, 20, 14), 0xe03040, V(-.6, GY + .4, 1.6));
  add(new THREE.BoxGeometry(1.2, .9, 1.2), 0x3070e0, V(2.6, GY + .45, 1.8));
  add(new THREE.CylinderGeometry(.5, .5, 1.2, 16), 0xf0c020, V(-1.6, GY + .6, -1.6));
  colored.push({ m: ground.material, c: new THREE.Color(0x4f8a48) }); colored.push({ m: wall.material, c: new THREE.Color(0xd8c4a0) });

  // camera on wall bracket
  const CAM = new THREE.Group(); CAM.position.set(-2.5, 1.4, 0);
  const arm2 = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, 1.0, 10), Mat({ color: 0x505860 })); arm2.position.set(-2.95, 1.55, -.35); arm2.rotation.set(Math.PI / 2, 0, .9); root.add(arm2); CAM.rotation.set(-.32, .55, 0); root.add(CAM);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, .7, 10), Mat({ color: 0xe8e8e8 })); arm.rotation.z = Math.PI / 2; arm.position.set(-.45, .2, -.6); arm.visible = false; CAM.add(arm);
  const shellM = Mat({ color: 0xf2f2f2, transparent: true, opacity: 1, shininess: 120 });
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, 1.6, 32, 1, true).rotateX(Math.PI / 2), shellM); CAM.add(shell);
  const back = new THREE.Mesh(new THREE.CircleGeometry(.42, 32), shellM); back.position.z = -.8; back.rotation.y = Math.PI; CAM.add(back);
  const visor = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, 1.7, 32, 1, true, -Math.PI / 2, Math.PI).rotateX(Math.PI / 2).rotateZ(Math.PI / 2), Mat({ color: 0xffffff, side: THREE.DoubleSide })); visor.position.set(0, .05, .1); CAM.add(visor);
  const faceM = Mat({ color: 0x111418, shininess: 200 });
  const face = new THREE.Mesh(new THREE.CircleGeometry(.4, 32), faceM); face.position.z = .8; CAM.add(face);
  const lensM = Mat({ color: 0x0a0c12, emissive: 0x3060ff, emissiveIntensity: .1, shininess: 250 });
  const lens = new THREE.Mesh(new THREE.SphereGeometry(.14, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2), lensM); lens.position.z = .8; CAM.add(lens);
  const irM = Mat({ color: 0x401010, emissive: 0xff2020, emissiveIntensity: 0 });
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; const l = new THREE.Mesh(new THREE.SphereGeometry(.035, 10, 8), irM); l.position.set(Math.cos(a) * .27, Math.sin(a) * .27, .81); CAM.add(l); }
  const ldrM = Mat({ color: 0x806020, emissive: 0xffd040, emissiveIntensity: 0 });
  const ldr = new THREE.Mesh(new THREE.CircleGeometry(.045, 16), ldrM); ldr.position.set(0, -.34, .812); CAM.add(ldr);
  // internals (seen when shell fades): image sensor + IR-cut filter
  const inner = new THREE.Group(); CAM.add(inner);
  const sensorM = Mat({ color: 0x204070, emissive: 0x3070ff, emissiveIntensity: .2, shininess: 200 });
  const pcb = new THREE.Mesh(new THREE.BoxGeometry(.6, .6, .05), Mat({ color: 0x1f7a3a })); pcb.position.z = .05; inner.add(pcb);
  const sensor = new THREE.Mesh(new THREE.BoxGeometry(.26, .2, .04), sensorM); sensor.position.z = .1; inner.add(sensor);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.14, .16, .55, 20).rotateX(Math.PI / 2), Mat({ color: 0x303338 })); barrel.position.z = .5; inner.add(barrel);
  const filtM = Mat({ color: 0xff4060, emissive: 0xff2040, emissiveIntensity: .25, transparent: true, opacity: .75 });
  const filt = new THREE.Mesh(new THREE.BoxGeometry(.3, .26, .02), filtM); filt.position.set(0, 0, .2); inner.add(filt);
  const clearM = Mat({ color: 0xc0e8ff, emissive: 0x60b0ff, emissiveIntensity: .2, transparent: true, opacity: .5 });
  const clear = new THREE.Mesh(new THREE.BoxGeometry(.3, .26, .02), clearM); clear.position.set(.34, 0, .2); inner.add(clear);
  inner.visible = false;
  const innerLight = new THREE.PointLight(0xffffff, 0, 6, 1); innerLight.position.set(1.2, 1.2, 1.5); CAM.add(innerLight);

  // IR cone + bounce particles
  const coneM = new THREE.MeshBasicMaterial({ color: 0xa040ff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(3.2, 7, 32, 1, true).translate(0, -3.5, 0).rotateX(-Math.PI / 2), coneM); cone.position.z = .8; CAM.add(cone);
  const pM = new THREE.MeshBasicMaterial({ color: 0xff70d0 });
  const camWorld = V(), targets = [V(1.0, GY + 1.0, -.5), V(-.6, GY + .5, 1.6), V(2.6, GY + .8, 1.8), V(-1.6, GY + 1.1, -1.6)];
  const parts = Array.from({ length: 24 }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), pM); m.userData = { tg: targets[i % 4], o: i / 24 }; root.add(m); return m; });

  const shots = [
    [[4.0, 3.2, 14.5], [-.2, -.7, 0]],    // 0 wide incl. camera
    [[-.9, 1.5, 2.6], [-2.5, 1.3, 0]],    // 1 sensor close (front)
    [[-.5, 1.9, .2], [-2.5, 1.4, 0]],     // 2 side cutaway
    [[-.6, 1.7, 3.0], [-2.4, 1.2, .2]],   // 3 LEDs
    [[4.6, 3.0, 13.5], [0, -.9, 0]],      // 4 bounce
    [[3.6, 2.4, 12.5], [.3, -1.1, 0]],    // 5 B&W
    [[4.4, 3.6, 15.5], [-.2, -.6, 0]],    // 6 recap
  ];
  const cp = { p: V(), q: V() }, grey = new THREE.Color();
  function update(t, si, lt, sd) {
    const pulse = .5 + .5 * Math.sin(t * 7);
    const f = Math.min(1, lt / Math.max(.1, sd));
    // darkness: day at step 1 start then dusk; night otherwise
    const dark = si === 1 ? ease(f / .6) : 1;
    scene.background.copy(day).lerp(dusk, dark);
    hemi.intensity = lerp(1.6, .55, dark); key.intensity = lerp(1.0, .1, dark);
    ldrM.emissiveIntensity = si === 1 ? (f > .5 ? .5 + .4 * pulse : .1) : 0;
    // IR on?
    const irOn = si === 0 || si >= 3 || (si === 2 && f > .8);
    irM.emissiveIntensity = irOn ? .5 + .3 * pulse : 0;
    coneM.opacity = irOn ? (si === 3 ? .08 + .1 * ease(f / .4) : .1) : 0;
    // cutaway
    const cut = si === 2 ? ease(f / .2) : 0;
    shellM.opacity = 1 - .88 * cut; shellM.transparent = cut > 0; faceM.transparent = cut > 0; faceM.opacity = 1 - .85 * cut;
    inner.visible = si === 2; visor.visible = si !== 2; back.visible = face.visible = !(si === 2 && cut > .5); lens.visible = face.visible; shellM.depthWrite = !(si === 2); innerLight.intensity = si === 2 ? 2.5 : 0;
    const slide = si === 2 ? ease((f - .3) / .4) : 1;
    filt.position.x = lerp(0, -.34, slide); clear.position.x = lerp(.34, 0, slide);
    sensorM.emissiveIntensity = si === 2 ? .2 + (slide > .9 ? .4 * pulse : 0) : .2;
    // bounce particles
    CAM.localToWorld(camWorld.set(0, 0, .8));
    parts.forEach(m => { const k = (t * .45 + m.userData.o) % 1; m.visible = si === 4; const tg = m.userData.tg; if (k < .5) m.position.copy(camWorld).lerp(tg, k * 2); else m.position.copy(tg).lerp(camWorld, (k - .5) * 2); m.scale.setScalar(k < .5 ? 1 : .7); });
    lensM.emissiveIntensity = si === 4 ? .3 + .3 * pulse : .1;
    // black & white
    const bw = si >= 5 ? (si === 5 ? ease(f / .25) : 1) : (si === 0 ? 1 : 0);
    colored.forEach(({ m, c }) => { const l = c.r * .3 + c.g * .59 + c.b * .11; grey.setRGB(l * .9 + .08, l * .9 + .08, l * .9 + .08); m.color.copy(c).lerp(grey, bw); m.emissive && m.emissive.setRGB(.05 * bw, .05 * bw, .05 * bw); });
    if (bw > 0) { hemi.intensity = lerp(hemi.intensity, 1.0, bw); }
    // camera
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const kk = si === 0 ? 1 : ease(lt / 1.4);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], kk))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], kk)));
    const ob = Math.sin(t * .25) * .06, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(ob) - dz * Math.sin(ob), cp.p.y, cp.q.z + dz * Math.cos(ob) + dx * Math.sin(ob));
    camera.lookAt(cp.q);
  }
  return { update };
}
