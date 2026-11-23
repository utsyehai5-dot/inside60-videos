// Inside 60 — Doorbell camera. Steps: 0 hook (180° view fan + visitor walking up), 1 PIR heat sensing,
// 2 camera starts recording, 3 Wi-Fi -> router -> phone alert, 4 two-way audio, 5 IR night vision, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const bg = new THREE.Color(0x161b28), bgNight = new THREE.Color(0x05070c);
  scene.background = bg.clone(); scene.fog = new THREE.Fog(0x161b28, 30, 80);
  const hemi = new THREE.HemisphereLight(0xfff8f0, 0x303040, 1.6); scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff, 1.0); key.position.set(5, 8, 10); scene.add(key);
  const root = new THREE.Group(); scene.add(root);
  const GY = -2.6;

  // porch: wall, door, floor
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), Mat({ color: 0x4a525e, shininess: 5 })); floor.rotation.x = -Math.PI / 2; floor.position.set(0, GY, 6); root.add(floor);
  const wall = new THREE.Mesh(new THREE.BoxGeometry(14, 8, .3), Mat({ color: 0xc8b89c, shininess: 10 })); wall.position.set(0, 1.4, -.15); root.add(wall);
  const door = new THREE.Mesh(new THREE.BoxGeometry(2.4, 5.2, .1), Mat({ color: 0x2f5a8a, shininess: 60 })); door.position.set(-2.1, GY + 2.6, .05); root.add(door);
  const handle = new THREE.Mesh(new THREE.SphereGeometry(.12, 16, 12), Mat({ color: 0xd8b860, shininess: 160 })); handle.position.set(-1.15, GY + 2.5, .18); root.add(handle);
  // doorbell unit
  const DB = new THREE.Group(); root.add(DB);
  const shellM = Mat({ color: 0x23272e, transparent: true, opacity: 1, shininess: 140 });
  const shell = new THREE.Mesh(new THREE.BoxGeometry(.62, 1.75, .22), shellM); shell.position.z = .11; DB.add(shell);
  const face = new THREE.Mesh(new THREE.BoxGeometry(.56, 1.66, .02), Mat({ color: 0x15181d, shininess: 200 })); face.position.z = .23; DB.add(face);
  const lensM = Mat({ color: 0x0a0c10, emissive: 0x3080ff, emissiveIntensity: 0, shininess: 250 });
  const lens = new THREE.Mesh(new THREE.SphereGeometry(.15, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2), lensM); lens.position.set(0, .48, .24); DB.add(lens);
  const irM = Mat({ color: 0x401010, emissive: 0xff2020, emissiveIntensity: 0 });
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const led = new THREE.Mesh(new THREE.SphereGeometry(.028, 10, 8), irM); led.position.set(Math.cos(a) * .22, .48 + Math.sin(a) * .22, .245); DB.add(led); }
  const recM = new THREE.MeshBasicMaterial({ color: 0xff3030 });
  const rec = new THREE.Mesh(new THREE.CircleGeometry(.03, 12), recM); rec.position.set(.2, .76, .245); DB.add(rec);
  const micM = Mat({ color: 0x505860, emissive: 0x40e0ff, emissiveIntensity: 0 });
  const mic = new THREE.Mesh(new THREE.CircleGeometry(.025, 12), micM); mic.position.set(-.18, .76, .245); DB.add(mic);
  const btnRingM = Mat({ color: 0x40a0ff, emissive: 0x40a0ff, emissiveIntensity: .4 });
  const btnRing = new THREE.Mesh(new THREE.TorusGeometry(.15, .02, 8, 32), btnRingM); btnRing.position.set(0, -.25, .245); DB.add(btnRing);
  const btn = new THREE.Mesh(new THREE.CircleGeometry(.13, 32), Mat({ color: 0x30343c })); btn.position.set(0, -.25, .246); DB.add(btn);
  const pirM = Mat({ color: 0xf0f0f0, emissive: 0xff8020, emissiveIntensity: 0, transparent: true, opacity: .9, shininess: 200 });
  const pir = new THREE.Mesh(new THREE.SphereGeometry(.1, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2), pirM); pir.position.set(0, -.58, .24); DB.add(pir);
  const spkM = Mat({ color: 0x404850, emissive: 0x40e0ff, emissiveIntensity: 0 });
  for (let i = 0; i < 4; i++) { const sl = new THREE.Mesh(new THREE.BoxGeometry(.3, .025, .01), spkM); sl.position.set(0, -.75 - i * .045, .245); DB.add(sl); }
  // 180° view fan (horizontal half-disc at lens height)
  const fanM = new THREE.MeshBasicMaterial({ color: 0x60c0ff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
  const fan = new THREE.Mesh(new THREE.CircleGeometry(6.5, 48, 0, Math.PI), fanM); fan.rotation.x = -Math.PI / 2; fan.position.set(0, .48, .3); root.add(fan);
  const fanEdgeM = new THREE.MeshBasicMaterial({ color: 0x90e0ff, transparent: true, opacity: 0 });
  const fanEdge = new THREE.Mesh(new THREE.TorusGeometry(6.5, .03, 6, 64, Math.PI), fanEdgeM); fanEdge.rotation.x = -Math.PI / 2; fanEdge.position.copy(fan.position); root.add(fanEdge);
  // PIR detection zones (thin wedges sweeping down/out)
  const zoneM = new THREE.MeshBasicMaterial({ color: 0xff9040, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
  const zones = [];
  for (let i = 0; i < 5; i++) { const z = new THREE.Mesh(new THREE.ConeGeometry(.5, 5, 3, 1, true).translate(0, -2.5, 0), zoneM); z.position.set(0, -.58, .3); z.rotation.set(Math.PI / 2 + .35, 0, (i - 2) * .35); z.scale.set(1, 1, .15); root.add(z); zones.push(z); }
  // faceless mannequin visitor
  const fig = new THREE.Group(); root.add(fig);
  const figM = Mat({ color: 0x8a96a8, emissive: 0xff6020, emissiveIntensity: 0, shininess: 40 });
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(.45, .38, 1.5, 20), figM); torso.position.y = GY + 2.55; fig.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.34, 20, 16), figM); head.position.y = GY + 3.65; fig.add(head);
  const legs = [-1, 1].map(s => { const g = new THREE.Group(); g.position.set(s * .2, GY + 1.8, 0); const l = new THREE.Mesh(new THREE.CylinderGeometry(.15, .13, 1.75, 12).translate(0, -.88, 0), figM); g.add(l); fig.add(g); return g; });
  const arms = [-1, 1].map(s => { const g = new THREE.Group(); g.position.set(s * .58, GY + 3.2, 0); const a = new THREE.Mesh(new THREE.CylinderGeometry(.11, .1, 1.35, 12).translate(0, -.68, 0), figM); g.add(a); fig.add(g); return g; });
  // heat waves from figure to PIR, sound rings, wifi arcs
  const ringPool = (n, color) => Array.from({ length: n }, () => { const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }); const r = new THREE.Mesh(new THREE.TorusGeometry(.35, .025, 6, 32), m); root.add(r); return r; });
  const heatRings = ringPool(4, 0xff8030), talkRings = ringPool(4, 0x60e0ff), voiceRings = ringPool(4, 0xffe060);
  const wifiArcs = ringPool(4, 0x70e0ff);
  // router + phone
  const router = new THREE.Group(); router.position.set(-3.2, 1.6, .8); root.add(router);
  router.add(new THREE.Mesh(new THREE.BoxGeometry(1.0, .22, .6), Mat({ color: 0xeeeeee })));
  [-.35, .35].forEach(x => { const an = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .6, 8), Mat({ color: 0xdddddd })); an.position.set(x, .4, -.15); router.add(an); });
  const rLedM = Mat({ color: 0x40ff80, emissive: 0x40ff80, emissiveIntensity: .3 });
  const rLed = new THREE.Mesh(new THREE.SphereGeometry(.04, 8, 6), rLedM); rLed.position.set(0, .05, .31); router.add(rLed);
  const phone = new THREE.Group(); phone.position.set(-2.3, -.9, 2.2); phone.rotation.y = .35; root.add(phone);
  phone.add(new THREE.Mesh(new THREE.BoxGeometry(.8, 1.6, .08), Mat({ color: 0x1a1d22, shininess: 160 })));
  const scrM = Mat({ color: 0x203050, emissive: 0x3060c0, emissiveIntensity: .3 });
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(.7, 1.45), scrM); scr.position.z = .045; phone.add(scr);
  const alertM = Mat({ color: 0xffd040, emissive: 0xffc020, emissiveIntensity: 0 });
  const alertBox = new THREE.Mesh(new THREE.PlaneGeometry(.6, .28), alertM); alertBox.position.set(0, .45, .05); phone.add(alertBox);
  const thumb = new THREE.Mesh(new THREE.PlaneGeometry(.6, .5), Mat({ color: 0x8a96a8, emissive: 0x405060, emissiveIntensity: .3 })); thumb.position.set(0, -.15, .05); phone.add(thumb);
  const wifiA = new THREE.CatmullRomCurve3([V(0, .3, .3), V(-1.4, 1.4, .8), V(-3.2, 1.7, .8)]);
  const wifiB = new THREE.CatmullRomCurve3([V(-3.2, 1.7, .8), V(-3.0, .5, 1.8), V(-2.3, -.6, 2.2)]);
  // IR night light cone
  const irConeM = new THREE.MeshBasicMaterial({ color: 0x9040ff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  const irCone = new THREE.Mesh(new THREE.ConeGeometry(2.4, 4.2, 32, 1, true).translate(0, -2.1, 0), irConeM); irCone.position.set(0, .48, .3); irCone.rotation.x = -Math.PI / 2 - .12; root.add(irCone);

  const sc = (p, q, k) => [p.map((x, i) => q[i] + (x - q[i]) * k), q];
  const shots = [
    sc([3.8, 5.8, 10.0], [0, -.6, 2.6], 1.0),       // 0 hook wide, top-ish to see fan
    sc([2.6, -.4, 5.8], [0, -.6, 1.8], 1.05),       // 1 PIR + heat
    sc([1.3, .7, 2.6], [0, .2, 0], 1.0),            // 2 lens recording
    sc([.4, .8, 7.6], [-1.6, .3, 1.0], 1.0),        // 3 wifi -> phone
    sc([3.4, .4, 5.4], [0, 0, 1.6], 1.05),          // 4 talk
    sc([3.0, .8, 7.6], [0, -.3, 2.2], 1.05),        // 5 night
    sc([4.4, 3.0, 10.4], [-.6, -.4, 2.0], 1.0),     // 6 recap
  ];
  const cp = { p: V(), q: V() };
  let lastT = 0;
  const tmpC = new THREE.Color();
  function update(t, si, lt, sd) {
    const dt = Math.min(.05, Math.max(0, t - lastT)); lastT = t;
    const pulse = .5 + .5 * Math.sin(t * 7);
    const f = Math.min(1, lt / Math.max(.1, sd));
    // visitor walking in during steps 0-1, standing after
    let fz = 3.2, walking = false;
    if (si === 0) { fz = lerp(9.5, 6.2, f); walking = true; }
    else if (si === 1) { fz = lerp(6.2, 3.4, ease(f)); walking = f < .9; }
    else if (si === 6) { fz = 3.2; }
    fig.position.set(.3, 0, fz);
    const sw = walking ? Math.sin(t * 6) * .45 : 0;
    legs[0].rotation.x = sw; legs[1].rotation.x = -sw; arms[0].rotation.x = -sw * .8; arms[1].rotation.x = sw * .8;
    arms[1].rotation.z = si === 4 ? .0 : 0;
    // night
    const night = si === 5 ? ease(f / .25) : 0;
    scene.background.copy(bg).lerp(bgNight, night);
    hemi.intensity = lerp(1.6, .35, night); key.intensity = lerp(1.0, .15, night);
    figM.color.setHex(si === 5 ? 0xd0d0d0 : 0x8a96a8);
    irM.emissiveIntensity = si === 5 ? .4 + .2 * pulse : 0;
    irConeM.opacity = si === 5 ? .16 * night : 0;
    figM.emissiveIntensity = si === 1 ? .35 + .3 * pulse : (si === 5 ? .25 * night : 0);
    figM.emissive.setHex(si === 5 ? 0x9090a0 : 0xff6020);
    // fan
    fanM.opacity = si === 0 || si === 6 ? .16 + .05 * pulse : 0; fanEdgeM.opacity = si === 0 || si === 6 ? .7 : 0;
    // PIR
    pirM.emissiveIntensity = si === 1 ? .4 + .3 * pulse : 0;
    zoneM.opacity = si === 1 ? .12 + .08 * pulse : 0;
    zones.forEach((z, i) => z.rotation.z = (i - 2) * .35 + Math.sin(t * 1.5) * .03);
    const pirPos = V(0, -.58, .3), headPos = V(.3, GY + 2.8, fz);
    heatRings.forEach((r, i) => { const k = (t * .7 + i / 4) % 1; r.visible = si === 1; r.position.copy(headPos).lerp(pirPos, k); r.lookAt(pirPos); r.scale.setScalar(1.4 - k); r.material.opacity = .8 * Math.sin(k * Math.PI); });
    // recording
    const recording = si >= 2 && si !== 6 || si === 6;
    lensM.emissiveIntensity = si === 2 ? .35 + .3 * pulse : .05;
    rec.visible = recording && (Math.floor(t * 2) % 2 === 0);
    // wifi + phone
    wifiArcs.forEach((r, i) => { const k = (t * .55 + i / 4) % 1; r.visible = si === 3; const p = k < .5 ? wifiA.getPointAt(k * 2) : wifiB.getPointAt((k - .5) * 2); r.position.copy(p); r.scale.setScalar(.5 + .5 * Math.sin(k * Math.PI)); r.material.opacity = .9; r.lookAt(camera.position); });
    rLedM.emissiveIntensity = si === 3 ? .5 + .5 * pulse : .3;
    phone.visible = si === 3 || si === 4 || si === 6;
    alertM.emissiveIntensity = si === 3 && f > .45 ? .5 + .4 * pulse : 0; alertBox.visible = si !== 3 || f > .45;
    // talk
    const spkPos = V(0, -.8, .35), micPos = V(-.18, .76, .3), mouth = V(.3, GY + 3.6, fz - .3);
    spkM.emissiveIntensity = si === 4 ? .5 + .4 * pulse : 0; micM.emissiveIntensity = si === 4 ? .6 + .4 * pulse : 0;
    talkRings.forEach((r, i) => { const k = (t * .8 + i / 4) % 1; r.visible = si === 4 && f < .55; r.position.copy(spkPos).lerp(mouth, k); r.lookAt(mouth); r.scale.setScalar(.6 + k * 1.2); r.material.opacity = .9 * (1 - k); });
    voiceRings.forEach((r, i) => { const k = (t * .8 + i / 4) % 1; r.visible = si === 4 && f >= .45; r.position.copy(mouth).lerp(micPos, k); r.lookAt(micPos); r.scale.setScalar(1.6 - k); r.material.opacity = .9 * Math.sin(k * Math.PI); });
    btnRingM.emissiveIntensity = .3 + (si === 6 ? .4 * pulse : 0);
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
