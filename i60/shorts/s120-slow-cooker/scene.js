// Inside 60 — Slow cooker (cutaway). Steps: 0 hook, 1 heating coils in sides, 2 ceramic crock spreads heat,
// 3 low ~200F below boiling, 4 lid traps steam (condensation drips), 5 collagen -> gelatin (meat softens), 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x555555, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const V2 = (x, y) => new THREE.Vector2(x, y);
  const rnd = (() => { let s = 23; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  scene.background = new THREE.Color(0x1d2232);
  scene.add(new THREE.HemisphereLight(0xfff4ea, 0x404050, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, .9); key.position.set(4, 9, 10); scene.add(key);
  const root = new THREE.Group(); scene.add(root);
  const counter = new THREE.Mesh(new THREE.BoxGeometry(18, .4, 8), Mat({ color: 0x4b5563, shininess: 30 })); counter.position.y = -3.0; root.add(counter);

  // oval-ish: scale x 1.25. Metal shell (cutaway half: thetaLength PI, opened toward camera)
  const body = new THREE.Group(); body.scale.set(1.25, 1, 1); root.add(body);
  const shellM = Mat({ color: 0x94a3b8, shininess: 110, side: THREE.DoubleSide });
  const shellPts = [V2(0, -2.8), V2(2.6, -2.8), V2(2.75, -2.6), V2(2.8, .9), V2(2.95, 1.0)];
  const shellBack = new THREE.Mesh(new THREE.LatheGeometry(shellPts, 40, Math.PI / 2, Math.PI), shellM); body.add(shellBack);
  const shellGhost = new THREE.Mesh(new THREE.LatheGeometry(shellPts, 40, -Math.PI / 2, Math.PI), Mat({ color: 0x94a3b8, transparent: true, opacity: .12, side: THREE.DoubleSide, depthWrite: false })); body.add(shellGhost);
  // heating coils: rings around the wall gap + bottom spiral
  const coilM = Mat({ color: 0x7c2d12, emissive: 0xff5a00, emissiveIntensity: 0 });
  const coils = [-2.2, -1.4, -.6, .2].map(y => { const m = new THREE.Mesh(new THREE.TorusGeometry(2.55, .07, 8, 40, Math.PI), coilM); m.rotation.x = -Math.PI / 2; m.position.y = y; body.add(m); return m; });
  const spPts = []; for (let i = 0; i <= 200; i++) { const a = i / 200 * Math.PI * 8, r = .3 + i / 200 * 2.0; spPts.push(V(Math.cos(a) * r, -2.62, Math.sin(a) * r)); }
  body.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(spPts), 300, .05, 6, false), coilM));
  // ceramic crock (thick lathe, cutaway half + ghost)
  const crockM = Mat({ color: 0x7c4a2d, emissive: 0xff6a20, emissiveIntensity: 0, shininess: 60, side: THREE.DoubleSide, transparent: true, opacity: 1 });
  const crockPts = [V2(0, -2.4), V2(2.1, -2.4), V2(2.3, -2.1), V2(2.35, 1.1), V2(2.05, 1.1), V2(2.0, -1.9), V2(0, -1.9)];
  const crockBack = new THREE.Mesh(new THREE.LatheGeometry(crockPts, 48, Math.PI / 2, Math.PI), crockM); body.add(crockBack);
  const crockFrontM = Mat({ color: 0x7c4a2d, transparent: true, opacity: .18, side: THREE.DoubleSide, depthWrite: false });
  body.add(new THREE.Mesh(new THREE.LatheGeometry(crockPts, 48, -Math.PI / 2, Math.PI), crockFrontM));
  // heat waves moving inward from coils through crock
  const heatWM = Mat({ color: 0xffa040, emissive: 0xff7a00, emissiveIntensity: .9, transparent: true, opacity: .5, depthWrite: false });
  const heatW = [0, 1, 2].map(() => { const m = new THREE.Mesh(new THREE.TorusGeometry(2.4, .05, 6, 40, Math.PI), heatWM); m.rotation.x = -Math.PI / 2; body.add(m); return m; });
  // stew liquid + vegetables + meat chunks
  const stewM = Mat({ color: 0xb45309, emissive: 0x7a2e00, emissiveIntensity: .25, transparent: true, opacity: .35, depthWrite: false });
  const stew = new THREE.Mesh(new THREE.CylinderGeometry(1.98, 1.98, 2.0, 48), stewM); stew.position.y = -.9; body.add(stew);
  const veg = Array.from({ length: 18 }, (_, i) => { const c = [0xf97316, 0x22c55e, 0xfde68a][i % 3]; const m = new THREE.Mesh(new THREE.BoxGeometry(.3, .3, .3), Mat({ color: c, emissive: c, emissiveIntensity: .15 })); const a = rnd() * 6.283, r = Math.sqrt(rnd()) * 1.6; m.userData = { a, r, y: -1.7 + rnd() * 1.6, s: rnd() * 6 }; body.add(m); return m; });
  const meatM = Mat({ color: 0x9f1239, emissive: 0xff2060, emissiveIntensity: 0 });
  const meat = Array.from({ length: 6 }, (_, i) => { const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.BoxGeometry(.9, .6, .6), meatM); g.add(m);
    // collagen strands = little tubes across chunk
    const strands = [0, 1, 2].map(j => { const s = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .9, 6), Mat({ color: 0xfff7ed, emissive: 0xffe0a0, emissiveIntensity: .3 })); s.rotation.z = Math.PI / 2; s.position.set(0, -.15 + j * .15, .31); g.add(s); return s; });
    const a = .35 + i / 6 * 2.4, r = 1.1; g.userData = { a, r, y: -1.4 + (i % 2) * .7, strands }; body.add(g); return g; });
  // gelatin glow blobs
  const gelM = Mat({ color: 0xfde047, emissive: 0xffd000, emissiveIntensity: .7, transparent: true, opacity: .6, depthWrite: false });
  const gel = Array.from({ length: 30 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 6), gelM); m.userData = { o: rnd(), a: rnd() * 6.283, r: Math.sqrt(rnd()) * 1.7 }; body.add(m); return m; });
  // glass lid
  const lidM = Mat({ color: 0xdbeafe, transparent: true, opacity: .35, shininess: 140, depthWrite: false, side: THREE.DoubleSide });
  const lid = new THREE.Mesh(new THREE.SphereGeometry(2.45, 48, 14, 0, Math.PI * 2, 0, Math.PI / 2.4), lidM); lid.scale.y = .35; lid.position.y = 1.1; body.add(lid);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(.28, 16, 12), Mat({ color: 0x111827 })); knob.position.y = 1.98; body.add(knob);
  // steam rising & droplets dripping from lid
  const vapM = Mat({ color: 0xffffff, transparent: true, opacity: .4, depthWrite: false });
  const vap = Array.from({ length: 30 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 6), vapM); m.userData = { o: rnd(), a: rnd() * 6.283, r: Math.sqrt(rnd()) * 1.7 }; body.add(m); return m; });
  const dropM = Mat({ color: 0x7dd3fc, emissive: 0x38bdf8, emissiveIntensity: .6 });
  const drops = Array.from({ length: 24 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), dropM); m.scale.y = 1.4; m.userData = { o: rnd(), a: rnd() * 6.283, r: .5 + rnd() * 1.4 }; body.add(m); return m; });
  // front dial + temperature gauge
  const dial = new THREE.Mesh(new THREE.CylinderGeometry(.4, .4, .2, 24), Mat({ color: 0x111827 })); dial.rotation.x = Math.PI / 2; dial.position.set(0, -2.3, 2.95); root.add(dial);
  const ptr = new THREE.Mesh(new THREE.BoxGeometry(.06, .3, .05), Mat({ color: 0xffd000, emissive: 0xffd000, emissiveIntensity: .8 })); ptr.position.set(0, -2.3, 3.07); root.add(ptr);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, 4, 20, 1, true), Mat({ color: 0xffffff, transparent: true, opacity: .3, depthWrite: false })); tube.position.set(4.3, -.6, 0); root.add(tube);
  const merc = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, 1, 16), Mat({ color: 0xef4444, emissive: 0xff2020, emissiveIntensity: .6 })); root.add(merc);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(.32, 16, 12), merc.material); bulb.position.set(4.3, -2.7, 0); root.add(bulb);
  const boilMark = new THREE.Mesh(new THREE.BoxGeometry(.7, .05, .05), Mat({ color: 0x60a5fa, emissive: 0x3b82f6, emissiveIntensity: .8 })); boilMark.position.set(4.3, .9, 0); root.add(boilMark);

  const shots = [
    [[5.0, 5.0, 21.0], [.9, -.5, 0]],    // 0 wide
    [[6.0, 0.0, 11.0], [1.0, -1.0, 0]],  // 1 coils
    [[4.0, 1.5, 10.0], [.6, -1.0, 0]],   // 2 crock
    [[5.0, 1.5, 14.0], [1.8, -.6, 0]],   // 3 thermometer + stew
    [[3.0, 5.0, 10.0], [0, .6, 0]],      // 4 lid
    [[2.0, 2.0, 8.0], [0, -1.0, .8]],    // 5 meat
    [[5.0, 5.0, 21.0], [.9, -.5, 0]],    // 6 recap
  ];
  const cp = { p: V(), q: V() };
  function update(t, si, lt, sd) {
    const pulse = .5 + .5 * Math.sin(t * 5);
    const prog = sd > 0 ? Math.min(1, lt / sd) : 0;
    coilM.emissiveIntensity = si === 1 ? .5 + .4 * pulse : .3;
    crockM.opacity = si === 1 ? .35 : 1; crockM.depthWrite = si !== 1;
    dial.visible = ptr.visible = si === 0 || si === 6;
    crockM.emissiveIntensity = si === 2 ? .15 + .15 * pulse : .03;
    heatW.forEach((m, i) => { const k = (t * .35 + i / 3) % 1; m.position.y = -1.6 + i * .8; m.scale.setScalar(lerp(1.08, .55, k)); m.visible = si === 2 || si === 3; });
    // temperature creeps up under the boil mark (~0.93 of boil)
    let temp = si === 0 ? .9 : si === 3 ? lerp(.45, .9, ease(prog)) : si < 3 ? .45 : .9;
    const mh = 3.3 * temp; merc.scale.y = mh; merc.position.set(4.3, -2.7 + mh / 2, 0);
    ptr.rotation.z = si >= 3 || si === 0 ? -.8 : .8;
    veg.forEach(m => { const u = m.userData; m.position.set(Math.cos(u.a + t * .05) * u.r, u.y + Math.sin(t * 1.2 + u.s) * .05, Math.sin(u.a + t * .05) * u.r); m.rotation.set(t * .2 + u.s, u.s, 0); });
    // meat softens in step 5: collagen strands fade, chunk sags slightly
    const soft = si < 5 ? 0 : si === 5 ? ease(prog) : 1;
    meatM.emissiveIntensity = si === 5 ? .2 + .2 * pulse : 0; meatM.color.setHex(soft > .5 ? 0x7c2d12 : 0x9f1239);
    meat.forEach(g => { const u = g.userData; g.position.set(Math.cos(u.a) * u.r, u.y, Math.sin(u.a) * u.r); g.rotation.y = -u.a; g.scale.set(1 + .12 * soft, 1 - .2 * soft, 1 + .12 * soft); u.strands.forEach(s => s.scale.set(1 - .8 * soft, 1 - .8 * soft, 1 - .8 * soft)); });
    gel.forEach(m => { const u = m.userData, k = (u.o + t * .2) % 1; m.position.set(Math.cos(u.a + k) * u.r, -1.8 + k * 1.6, Math.sin(u.a + k) * u.r); m.visible = si >= 5; });
    // steam up to lid, drips down
    vap.forEach(m => { const u = m.userData, k = (u.o + t * .4) % 1; m.position.set(Math.cos(u.a) * u.r * (1 - k * .2), .1 + k * 1.3, Math.sin(u.a) * u.r); m.visible = si >= 3; });
    drops.forEach(m => { const u = m.userData, k = (u.o + t * .6) % 1; m.position.set(Math.cos(u.a) * u.r, lerp(1.35, .1, k), Math.sin(u.a) * u.r); m.visible = si === 4 || si === 6; });
    lidM.emissive = lidM.emissive || new THREE.Color(); lidM.emissive.setHex(0x60a5fa); lidM.emissiveIntensity = si === 4 ? .3 * pulse : 0;
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
