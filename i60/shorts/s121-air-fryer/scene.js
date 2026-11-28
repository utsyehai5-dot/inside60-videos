// Inside 60 — Air fryer (cutaway). Steps: 0 hook (tiny fast oven), 1 heating element glows, 2 fan blasts air down,
// 3 perforated basket lets air swirl under, 4 surface moisture whipped away, 5 Maillard browning / crispy, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x555555, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const V2 = (x, y) => new THREE.Vector2(x, y);
  const rnd = (() => { let s = 41; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  scene.background = new THREE.Color(0x1a2130);
  scene.add(new THREE.HemisphereLight(0xfff4ea, 0x404050, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, .9); key.position.set(4, 9, 10); scene.add(key);
  const root = new THREE.Group(); scene.add(root);
  const counter = new THREE.Mesh(new THREE.BoxGeometry(18, .4, 8), Mat({ color: 0x57534e, shininess: 20 })); counter.position.y = -3.2; root.add(counter);

  // body: dark rounded cylinder, cutaway (back half solid, front ghost) y -3..3
  const bodyPts = [V2(0, -3.0), V2(2.7, -3.0), V2(2.9, -2.7), V2(2.95, 2.6), V2(2.6, 3.1), V2(0, 3.2)];
  const bodyM = Mat({ color: 0x1f2937, shininess: 60, side: THREE.DoubleSide });
  root.add(new THREE.Mesh(new THREE.LatheGeometry(bodyPts, 48, Math.PI / 2, Math.PI), bodyM));
  root.add(new THREE.Mesh(new THREE.LatheGeometry(bodyPts, 48, -Math.PI / 2, Math.PI), Mat({ color: 0x334155, transparent: true, opacity: .12, side: THREE.DoubleSide, depthWrite: false })));
  // fan at y 2.4
  const fan = new THREE.Group(); fan.position.y = 2.45; root.add(fan);
  const fanM = Mat({ color: 0xcbd5e1, emissive: 0x60a5fa, emissiveIntensity: 0 });
  fan.add(new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .2, 20), fanM));
  for (let i = 0; i < 8; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(1.5, .06, .4), fanM); const g = new THREE.Group(); g.rotation.y = i * Math.PI / 4; b.position.x = .9; b.rotation.x = .5; g.add(b); fan.add(g); }
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, .5, 24), Mat({ color: 0x475569 })); motor.position.y = 2.85; root.add(motor);
  // heating element: flat spiral at y 1.8
  const elM = Mat({ color: 0x7c2d12, emissive: 0xff3a00, emissiveIntensity: 0 });
  const elPts = []; for (let i = 0; i <= 260; i++) { const a = i / 260 * Math.PI * 7, r = .35 + i / 260 * 1.9; elPts.push(V(Math.cos(a) * r, 1.8, Math.sin(a) * r)); }
  root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(elPts), 400, .07, 8, false), elM));
  // basket: open cylinder of bars + perforated bottom y -1.6..0.8
  const basketM = Mat({ color: 0x9ca3af, emissive: 0x22d3ee, emissiveIntensity: 0, shininess: 110 });
  const basket = new THREE.Group(); root.add(basket);
  for (let i = 0; i < 36; i++) { const a = i / 36 * Math.PI * 2; const bar = new THREE.Mesh(new THREE.BoxGeometry(.06, 2.4, .06), basketM); bar.position.set(Math.cos(a) * 2.2, -.4, Math.sin(a) * 2.2); basket.add(bar); }
  [-1.6, -.4, .8].forEach(y => { const r = new THREE.Mesh(new THREE.TorusGeometry(2.2, .05, 6, 60), basketM); r.rotation.x = Math.PI / 2; r.position.y = y; basket.add(r); });
  for (let i = -5; i <= 5; i++) { const w = Math.sqrt(Math.max(0, 2.2 * 2.2 - (i * .4) ** 2)) * 2; const a = new THREE.Mesh(new THREE.BoxGeometry(w, .05, .05), basketM); a.position.set(0, -1.6, i * .4); basket.add(a); const b = new THREE.Mesh(new THREE.BoxGeometry(.05, .05, w), basketM); b.position.set(i * .4, -1.6, 0); basket.add(b); }
  const handle = new THREE.Mesh(new THREE.BoxGeometry(.6, .5, 1.8), Mat({ color: 0x111827 })); handle.position.set(0, -2.2, 3.4); root.add(handle);
  // fries
  const fryM = Mat({ color: 0xfde68a, emissive: 0xffb000, emissiveIntensity: 0 });
  const fries = Array.from({ length: 34 }, () => { const m = new THREE.Mesh(new THREE.BoxGeometry(.22, .22, 1.4), fryM); m.position.set((rnd() - .5) * 3, -1.4 + rnd() * .7, (rnd() - .5) * 2.6); m.rotation.set((rnd() - .5) * .6, rnd() * 3.14, (rnd() - .5) * .6); m.userData = { s: rnd() * 6 }; root.add(m); return m; });
  // hot air particles: loop path: down centre from fan, out along bottom, up sides, back to fan
  const airM = Mat({ color: 0xffa94d, emissive: 0xff6a00, emissiveIntensity: .9, transparent: true, opacity: .85, depthWrite: false });
  const air = Array.from({ length: 140 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(.07, 6, 4), airM); m.userData = { o: rnd(), a: rnd() * 6.283 }; root.add(m); return m; });
  const airPos = (k, a, swirl) => { // k 0..1 around loop
    let r, y;
    if (k < .3) { const q = k / .3; r = lerp(1.6, 2.5, q); y = lerp(2.2, 1.0, q); }          // pushed out & down along wall
    else if (k < .55) { const q = (k - .3) / .25; r = 2.55; y = lerp(1.0, -2.4, q); }      // down the wall gap
    else if (k < .8) { const q = (k - .55) / .25; r = lerp(2.5, .3, q); y = lerp(-2.4, -1.9, q); } // under basket to centre
    else { const q = (k - .8) / .2; r = lerp(.3, 1.2, q); y = lerp(-1.6, 2.2, q); }         // up through food to fan
    const aa = a + k * swirl; return [Math.cos(aa) * r, y, Math.sin(aa) * r];
  };
  // moisture: blue droplets leaving fries
  const wetM = Mat({ color: 0x7dd3fc, emissive: 0x38bdf8, emissiveIntensity: .7, transparent: true, opacity: .85 });
  const wet = Array.from({ length: 60 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 6), wetM); m.userData = { o: rnd(), f: Math.floor(rnd() * 34), dx: rnd() - .5, dz: rnd() - .5 }; root.add(m); return m; });
  // crumbs sparkle (crispy)
  const sparkM = Mat({ color: 0xfff1a8, emissive: 0xffd000, emissiveIntensity: 1 });
  const sparks = Array.from({ length: 30 }, () => { const m = new THREE.Mesh(new THREE.OctahedronGeometry(.06), sparkM); m.userData = { o: rnd(), f: Math.floor(rnd() * 34) }; root.add(m); return m; });

  const shots = [
    [[3.6, 3.0, 13.0], [0, 0, 0]],       // 0 wide
    [[2.6, 3.6, 5.4], [0, 1.8, 0]],      // 1 element
    [[3.0, 4.0, 6.5], [0, 2.2, 0]],      // 2 fan
    [[3.6, -2.4, 7.0], [0, -1.6, 0]],    // 3 basket underneath
    [[2.6, 2.6, 7.8], [0, -1.0, 0]],     // 4 fries
    [[1.8, 3.4, 6.4], [0, -1.1, 0]],     // 5 crispy from above
    [[3.6, 3.0, 13.0], [0, 0, 0]],       // 6 recap
  ];
  const cp = { p: V(), q: V() };
  function update(t, si, lt, sd) {
    const pulse = .5 + .5 * Math.sin(t * 6);
    const prog = sd > 0 ? Math.min(1, lt / sd) : 0;
    elM.emissiveIntensity = si === 1 ? .6 + .4 * pulse : .55;
    fan.rotation.y = -t * (si === 1 ? 2 : 14);
    fanM.emissiveIntensity = si === 2 ? .3 + .3 * pulse : 0;
    basketM.emissiveIntensity = si === 3 ? .3 + .3 * pulse : 0;
    const airOn = si !== 1;
    air.forEach(m => { const u = m.userData, k = (u.o + t * (si === 2 || si === 3 ? .45 : .3)) % 1; m.position.set(...airPos(k, u.a, 2.5)); m.visible = airOn; });
    // browning: 0 raw -> 1 golden
    const brown = si < 4 ? .1 : si === 4 ? lerp(.1, .4, prog) : si === 5 ? lerp(.4, 1, ease(prog)) : 1;
    fryM.color.setRGB(lerp(.99, .85, brown), lerp(.9, .55, brown), lerp(.55, .12, brown));
    fryM.emissiveIntensity = si === 5 ? .25 * pulse : 0;
    fries.forEach(m => { m.position.y += Math.sin(t * 8 + m.userData.s) * .0008; });
    wet.forEach(m => { const u = m.userData, k = (u.o + t * .7) % 1, f = fries[u.f].position; m.position.set(f.x + u.dx * k * 2, f.y + .15 + k * 2.2, f.z + u.dz * k * 2); m.visible = si === 4; });
    sparks.forEach(m => { const u = m.userData, f = fries[u.f].position, k = (u.o + t * .8) % 1; m.position.set(f.x, f.y + .2, f.z); m.scale.setScalar(Math.sin(k * Math.PI) * 1.5); m.visible = si >= 5; });
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
