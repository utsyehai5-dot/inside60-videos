// Inside 60 — Rice cooker (cutaway). Steps: 0 hook, 1 heating plate, 2 boiling at 100C, 3 water absorbed,
// 4 thermostat magnet lets go, 5 spring clicks switch to warm, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x555555, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const rnd = (() => { let s = 17; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  scene.background = new THREE.Color(0x1c2333);
  scene.add(new THREE.HemisphereLight(0xfff4ea, 0x404050, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, .9); key.position.set(4, 9, 10); scene.add(key);
  const root = new THREE.Group(); scene.add(root);
  const counter = new THREE.Mesh(new THREE.BoxGeometry(16, .4, 8), Mat({ color: 0x5b4636, shininess: 20 })); counter.position.y = -3.0; root.add(counter);

  // outer shell (transparent cutaway) y -2.8..1.6
  const shellM = Mat({ color: 0xf1f5f9, transparent: true, opacity: .12, side: THREE.DoubleSide, depthWrite: false });
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.4, 4.4, 48, 1, true), shellM); shell.position.y = -.6; root.add(shell);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, .2, 48), Mat({ color: 0xe2e8f0 })); base.position.y = -2.75; root.add(base);
  // lid (dome) slightly transparent
  const lidM = Mat({ color: 0xf8fafc, transparent: true, opacity: .2, depthWrite: false });
  const lid = new THREE.Mesh(new THREE.SphereGeometry(2.6, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2.6), lidM); lid.scale.y = .45; lid.position.y = 1.6; root.add(lid);
  // heating plate y -1.9
  const heatM = Mat({ color: 0x7c2d12, emissive: 0xff4a00, emissiveIntensity: 0 });
  const heater = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, .25, 40), heatM); heater.position.y = -1.95; root.add(heater);
  const coil = new THREE.Mesh(new THREE.TorusGeometry(1.1, .1, 10, 48), heatM); coil.rotation.x = Math.PI / 2; coil.position.y = -2.15; root.add(coil);
  // inner pot (lathe) y -1.8..1.2
  const potM = Mat({ color: 0xa8b3c2, shininess: 120, side: THREE.DoubleSide, transparent: true, opacity: .55, depthWrite: false });
  const potPts = [V(0, 0, 0), V(1.9, 0, 0), V(2.05, .2, 0), V(2.1, 3.0, 0), V(2.2, 3.05, 0)].map(p => new THREE.Vector2(p.x, p.y));
  const pot = new THREE.Mesh(new THREE.LatheGeometry(potPts, 48), potM); pot.position.y = -1.8; root.add(pot);
  // water column and rice grains
  const waterM = Mat({ color: 0x4fb3ff, emissive: 0x1d6fd8, emissiveIntensity: .3, transparent: true, opacity: .55, depthWrite: false });
  const water = new THREE.Mesh(new THREE.CylinderGeometry(1.98, 1.98, 1, 40), waterM); root.add(water);
  const riceM = Mat({ color: 0xfdfcf5, emissive: 0xfff3d0, emissiveIntensity: .15 });
  const riceG = new THREE.CapsuleGeometry(.05, .12, 3, 6);
  const rice = Array.from({ length: 260 }, () => { const m = new THREE.Mesh(riceG, riceM); const a = rnd() * 6.283, r = Math.sqrt(rnd()) * 1.85; m.userData = { a, r, h: rnd(), rx: rnd() * 6, rz: rnd() * 6 }; root.add(m); return m; });
  const bubbles = Array.from({ length: 60 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(.08, 8, 6), Mat({ color: 0xdff3ff, transparent: true, opacity: .8 })); m.userData = { o: rnd(), a: rnd() * 6.283, r: Math.sqrt(rnd()) * 1.8 }; root.add(m); return m; });
  const steamM = Mat({ color: 0xffffff, transparent: true, opacity: .35, depthWrite: false });
  const steam = Array.from({ length: 24 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(.25, 10, 8), steamM); m.userData = { o: rnd(), x: (rnd() - .5) * 2, z: (rnd() - .5) * 2 }; root.add(m); return m; });

  // thermostat under pot center: spring-loaded magnet touching pot bottom (y -1.8) + ferrite disc
  const thermo = new THREE.Group(); thermo.position.set(0, 0, 0); root.add(thermo);
  const ferM = Mat({ color: 0x334155, emissive: 0xff3b3b, emissiveIntensity: 0 });
  const ferrite = new THREE.Mesh(new THREE.CylinderGeometry(.35, .35, .15, 24), ferM); ferrite.position.y = -1.88; thermo.add(ferrite);
  const magM = Mat({ color: 0xdc2626, emissive: 0xff2020, emissiveIntensity: 0 });
  const magnet = new THREE.Group(); thermo.add(magnet);
  const magN = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .3, 24), magM); magN.position.y = -2.12; magnet.add(magN);
  const magS = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .3, 24), Mat({ color: 0x2563eb })); magS.position.y = -2.42; magnet.add(magS);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .6, 10), Mat({ color: 0xcbd5e1 })); rod.position.y = -2.85; magnet.add(rod);
  const springPts = []; for (let i = 0; i <= 120; i++) { const a = i / 120 * Math.PI * 12; springPts.push(V(Math.cos(a) * .2, -2.6 - i / 120 * .5, Math.sin(a) * .2)); }
  const springM = Mat({ color: 0xfacc15, emissive: 0xffc000, emissiveIntensity: 0 });
  const spring = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(springPts), 200, .03, 6, false), springM); thermo.add(spring);
  // field lines ring between magnet and ferrite
  const fieldM = Mat({ color: 0x60a5fa, emissive: 0x3b82f6, emissiveIntensity: .8, transparent: true, opacity: .7 });
  const field = [0, 1, 2].map(i => { const m = new THREE.Mesh(new THREE.TorusGeometry(.45 + i * .15, .02, 6, 40), fieldM); m.rotation.x = Math.PI / 2; m.position.y = -2.0; thermo.add(m); return m; });
  // front switch lever + lights
  const lever = new THREE.Group(); lever.position.set(0, -1.6, 2.55); root.add(lever);
  const lv = new THREE.Mesh(new THREE.BoxGeometry(.4, .5, .2), Mat({ color: 0x334155 })); lv.position.y = -.4; lever.add(lv);
  const cookL = new THREE.Mesh(new THREE.SphereGeometry(.12, 14, 10), Mat({ color: 0xef4444, emissive: 0xff2222, emissiveIntensity: 0 })); cookL.position.set(-.7, -.9, 2.5); root.add(cookL);
  const warmL = new THREE.Mesh(new THREE.SphereGeometry(.12, 14, 10), Mat({ color: 0xf59e0b, emissive: 0xffaa00, emissiveIntensity: 0 })); warmL.position.set(.7, -.9, 2.5); root.add(warmL);
  // thermometer bar beside cooker
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, 4, 20, 1, true), Mat({ color: 0xffffff, transparent: true, opacity: .3, depthWrite: false })); tube.position.set(3.6, -.5, 0); root.add(tube);
  const merc = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, 1, 16), Mat({ color: 0xef4444, emissive: 0xff2020, emissiveIntensity: .6 })); root.add(merc);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(.32, 16, 12), merc.material); bulb.position.set(3.6, -2.6, 0); root.add(bulb);
  const mark = new THREE.Mesh(new THREE.BoxGeometry(.7, .05, .05), Mat({ color: 0xffd000, emissive: 0xffd000, emissiveIntensity: .8 })); mark.position.set(3.6, .6, 0); root.add(mark);

  const shots = [
    [[5.0, 5.0, 19.0], [.8, -.6, 0]],    // 0 wide
    [[4.5, -1.0, 10.0], [0, -1.6, 0]],   // 1 heater
    [[3.5, 5.0, 10.5], [0, -.6, 0]],     // 2 boiling
    [[4.5, 2.5, 12.5], [1.6, -.6, 0]],   // 3 absorbed + thermometer
    [[3.0, -2.6, 6.0], [0, -2.1, 0]],    // 4 magnet
    [[3.0, -.6, 10.5], [0, -1.2, 1.0]],  // 5 click
    [[5.0, 5.0, 19.0], [.8, -.6, 0]],    // 6 recap
  ];
  const cp = { p: V(), q: V() };
  function update(t, si, lt, sd) {
    const pulse = .5 + .5 * Math.sin(t * 6);
    const prog = sd > 0 ? Math.min(1, lt / sd) : 0;
    const cooking = si <= 4 || (si === 5 && lt < .6);
    heatM.emissiveIntensity = cooking ? (si === 1 ? .6 + .4 * pulse : .55) : .12;
    cookL.material.emissiveIntensity = cooking ? .9 : 0; warmL.material.emissiveIntensity = cooking ? 0 : .9;
    // water level: full until step 3, falls during step 3
    let wl = si < 3 ? 1 : si === 3 ? 1 - ease(prog) : 0;
    if (si === 6) wl = 0;
    const wh = .1 + 1.6 * wl; water.scale.y = wh; water.position.y = -1.78 + wh / 2; water.visible = wl > .02;
    // rice: settled layer, swells a bit as it absorbs
    const sw = si >= 3 ? 1 + .35 * (si === 3 ? ease(prog) : 1) : 1;
    rice.forEach(m => { const u = m.userData, jig = (si === 2 || si === 3) ? Math.sin(t * 9 + u.a * 5) * .03 : 0; m.position.set(Math.cos(u.a) * u.r, -1.72 + u.h * .7 * sw + jig, Math.sin(u.a) * u.r); m.rotation.set(u.rx, 0, u.rz); m.scale.setScalar(sw); });
    bubbles.forEach(m => { const u = m.userData, k = (u.o + t * .8) % 1; m.position.set(Math.cos(u.a) * u.r, -1.7 + k * wh, Math.sin(u.a) * u.r); m.visible = (si === 2 || si === 3) && wl > .05; });
    steam.forEach(m => { const u = m.userData, k = (u.o + t * .3) % 1; m.position.set(u.x * (1 + k), 1.7 + k * 3, u.z); m.scale.setScalar(.6 + k); m.visible = si === 0 || si === 2 || si === 3 || si === 6; });
    // temperature: 100C plateau, rises after water gone
    let temp = si === 0 ? .9 : si === 1 ? lerp(.2, .9, ease(prog)) : si === 2 ? 1 : si === 3 ? 1 + .15 * Math.max(0, prog - .7) / .3 : si === 4 ? 1.15 : .7;
    if (si === 6) temp = .7;
    const mh = 3.1 * temp * .95; merc.scale.y = mh; merc.position.set(3.6, -2.6 + mh / 2, 0);
    // thermostat: magnet attached until step 4 mid, then drops
    const drop = si < 4 ? 0 : si === 4 ? ease((prog - .45) / .3) : 1;
    magnet.position.y = -.5 * drop; spring.scale.y = 1; spring.position.y = 0;
    ferM.emissiveIntensity = si === 4 ? .3 + .5 * pulse : 0; magM.emissiveIntensity = si === 4 ? .4 * pulse : 0;
    field.forEach((f, i) => { f.visible = drop < .5 && si >= 4; f.scale.setScalar(1 + .1 * Math.sin(t * 5 + i)); });
    springM.emissiveIntensity = si === 5 ? .4 + .4 * pulse : 0;
    lever.position.y = -1.6 - (cooking ? 0 : .45);
    // camera
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const kk = si === 0 ? 1 : ease(lt / 1.4);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], kk))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], kk)));
    const ob = Math.sin(t * .25) * .1, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(ob) - dz * Math.sin(ob), cp.p.y, cp.q.z + dz * Math.cos(ob) + dx * Math.sin(ob));
    camera.lookAt(cp.q);
  }
  return { update };
}
