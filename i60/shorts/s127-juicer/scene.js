// Inside 60 — Centrifugal juicer. Steps: 0 hook apple -> juice, 1 feed chute, 2 blade disc shreds,
// 3 motor spins basket, 4 mesh lets juice out / pulp stays, 5 spout + pulp bin, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 70, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const V2 = (x, y) => new THREE.Vector2(x, y);
  const rnd = (() => { let s = 71; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  scene.background = new THREE.Color(0x1b1f2b);
  scene.add(new THREE.HemisphereLight(0xfff6ea, 0x3c404c, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, .9); key.position.set(5, 9, 10); scene.add(key);
  const root = new THREE.Group(); scene.add(root); root.scale.setScalar(.5);
  const counter = new THREE.Mesh(new THREE.BoxGeometry(16, .3, 9), Mat({ color: 0x57534e, shininess: 20 })); counter.position.y = -3.3; root.add(counter);

  // motor base
  const baseM = Mat({ color: 0xe5e7eb });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.3, 2.0, 40, 1, true), Mat({ color: 0xe5e7eb, transparent: true, opacity: .2, depthWrite: false, side: THREE.DoubleSide })); base.position.y = -2.2; root.add(base);
  const motorM = Mat({ color: 0x475569, emissive: 0x60a5fa, emissiveIntensity: 0 });
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(.9, .9, 1.3, 28), motorM); motor.position.y = -2.4; root.add(motor);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, 1.2, 12), Mat({ color: 0xcbd5e1 })); shaft.position.y = -1.4; root.add(shaft);
  const bottom = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, .12, 40), baseM); bottom.position.y = -1.2; root.add(bottom);

  // juice collector bowl (ghost) + spout front
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 1.9, 48, 1, true), Mat({ color: 0xf1f5f9, transparent: true, opacity: .16, depthWrite: false, side: THREE.DoubleSide })); bowl.position.y = -.25; root.add(bowl);
  const spoutM = Mat({ color: 0xd1d5db, emissive: 0xf59e0b, emissiveIntensity: 0 });
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(.28, .35, 1.3, 16, 1, true), spoutM); spout.rotation.x = Math.PI / 2 + .35; spout.position.set(0, -.8, 2.9); root.add(spout);
  // glass under spout
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(.75, .65, 2.0, 28, 1, true), Mat({ color: 0xffffff, transparent: true, opacity: .25, depthWrite: false, side: THREE.DoubleSide })); glass.position.set(0, -2.15, 3.9); root.add(glass);
  const juiceM = Mat({ color: 0xfbbf24, emissive: 0xf59e0b, emissiveIntensity: .35, transparent: true, opacity: .9 });
  const juiceLvl = new THREE.Mesh(new THREE.CylinderGeometry(.7, .64, 1, 28), juiceM); juiceLvl.position.set(0, -3.1, 3.9); root.add(juiceLvl);
  // pulp bin at back
  const binM = Mat({ color: 0xf1f5f9, transparent: true, opacity: .25, depthWrite: false, side: THREE.DoubleSide });
  const bin = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.2, 1.8), binM); bin.position.set(0, -2.1, -3.4); root.add(bin);
  const chuteBack = new THREE.Mesh(new THREE.BoxGeometry(1.4, .9, 1.2), binM); chuteBack.position.set(0, -.2, -2.7); root.add(chuteBack);
  const pulpM = Mat({ color: 0xe9d8a6, emissive: 0x000000, shininess: 10 });
  const pulpPile = Array.from({ length: 50 }, (_, i) => { const m = new THREE.Mesh(new THREE.DodecahedronGeometry(.22), pulpM); m.position.set((rnd() - .5) * 2.2, -3.0 + Math.floor(i / 12) * .25 + rnd() * .1, -3.4 + (rnd() - .5) * 1.4); m.userData = { i }; root.add(m); return m; });

  // spinning group: basket (mesh) + cutting disc
  const spin = new THREE.Group(); spin.position.y = -1.0; root.add(spin);
  const lathe = [V2(1.0, 0), V2(1.25, .5), V2(1.55, 1.0), V2(1.8, 1.45)];
  const meshM = Mat({ color: 0xcbd5e1, wireframe: true, emissive: 0xfacc15, emissiveIntensity: 0 });
  spin.add(new THREE.Mesh(new THREE.LatheGeometry(lathe, 72), meshM));
  const meshSkin = Mat({ color: 0xe2e8f0, transparent: true, opacity: .18, depthWrite: false, side: THREE.DoubleSide });
  spin.add(new THREE.Mesh(new THREE.LatheGeometry(lathe, 72), meshSkin));
  const discM = Mat({ color: 0x9ca3af, shininess: 140, emissive: 0xffffff, emissiveIntensity: 0 });
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.02, 1.02, .1, 48), discM); disc.position.y = .05; spin.add(disc);
  const bladeM = Mat({ color: 0xf8fafc, emissive: 0xef4444, emissiveIntensity: 0, shininess: 150 });
  for (let i = 0; i < 46; i++) { const a = rnd() * 6.283, r = .2 + rnd() * .75; const b = new THREE.Mesh(new THREE.ConeGeometry(.05, .14, 4), bladeM); b.position.set(Math.cos(a) * r, .16, Math.sin(a) * r); spin.add(b); }
  // stripe so spinning is visible
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(.12, 1.5, .04), Mat({ color: 0xef4444 })); stripe.position.set(1.42, .75, 0); stripe.rotation.z = -.5; spin.add(stripe);

  // lid + feed chute
  const lidM = Mat({ color: 0xf8fafc, transparent: true, opacity: .2, depthWrite: false, side: THREE.DoubleSide });
  const lid = new THREE.Mesh(new THREE.SphereGeometry(2.45, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2), lidM); lid.scale.y = .35; lid.position.y = .7; root.add(lid);
  const chuteM = Mat({ color: 0xf8fafc, transparent: true, opacity: .25, depthWrite: false, side: THREE.DoubleSide, emissive: 0x38bdf8, emissiveIntensity: 0 });
  const chute = new THREE.Mesh(new THREE.CylinderGeometry(.75, .75, 3.0, 32, 1, true), chuteM); chute.position.y = 2.4; root.add(chute);
  const pusher = new THREE.Mesh(new THREE.CylinderGeometry(.68, .68, 1.6, 28), Mat({ color: 0x64748b })); root.add(pusher);
  // apple
  const appleM = Mat({ color: 0xdc2626, shininess: 90 });
  const apple = new THREE.Group(); root.add(apple);
  apple.add(new THREE.Mesh(new THREE.SphereGeometry(.62, 32, 24), appleM));
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .3, 6), Mat({ color: 0x78350f })); stem.position.y = .7; apple.add(stem);

  // particles: pulp bits on disc/wall, juice droplets flying out
  const shred = Array.from({ length: 70 }, () => { const m = new THREE.Mesh(new THREE.DodecahedronGeometry(.06 + rnd() * .04), pulpM); m.userData = { a: rnd() * 6.283, r: .3 + rnd() * .7, h: rnd() }; spin.add(m); return m; });
  const dropM = Mat({ color: 0xfcd34d, emissive: 0xf59e0b, emissiveIntensity: .7 });
  const drops = Array.from({ length: 90 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), dropM); m.userData = { o: rnd(), a: rnd() * 6.283, h: rnd() }; root.add(m); return m; });
  const stream = Array.from({ length: 24 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 6), dropM); m.userData = { o: rnd() }; root.add(m); return m; });
  const fling = Array.from({ length: 30 }, () => { const m = new THREE.Mesh(new THREE.DodecahedronGeometry(.13), pulpM); m.userData = { o: rnd(), x: (rnd() - .5) * 1.2 }; root.add(m); return m; });

  const S = .8;
  const shots = [
    [[7, 3.5, 14], [0, -.8, .3]],         // 0 wide
    [[4.5, 5, 9], [0, 1.6, 0]],         // 1 chute
    [[2.5, 3, 5], [0, -.9, 0]],       // 2 disc close from above
    [[6.5, -1.5, 8.5], [0, -1.6, 0]],       // 3 motor + basket
    [[4.5, 2, 6.5], [0, -.5, 0]],       // 4 mesh
    [[11, 1.5, 2], [0, -1.6, 0]],       // 5 side: spout + bin
    [[7, 3.5, 14], [0, -.8, .3]],          // 6 recap
  ].map(s => [s[0].map((v, i) => s[1][i] * .5 + (v - s[1][i]) * S), s[1].map(v => v * .5)]);
  const cp = { p: V(), q: V() };
  function update(t, si, lt, sd) {
    const pulse = .5 + .5 * Math.sin(t * 6);
    const prog = sd > 0 ? Math.min(1, lt / sd) : 0;
    const running = si !== 1;
    spin.rotation.y = running ? t * 9 : 0;
    motorM.emissiveIntensity = si === 3 ? .5 + .4 * pulse : running ? .15 : 0;
    meshM.emissiveIntensity = si === 4 ? .6 + .4 * pulse : .05;
    bladeM.emissiveIntensity = si === 2 ? .5 + .4 * pulse : 0;
    chuteM.emissiveIntensity = si === 1 ? .35 * pulse : 0;
    spoutM.emissiveIntensity = si === 5 ? .5 + .4 * pulse : 0;
    // apple descends chute (loop in 0 and 1), shrinks while shredded in 2
    let ay, as = 1;
    if (si === 0) { const k = (lt % 3.5) / 3.5; ay = lerp(3.6, -.35, Math.min(1, k * 1.3)); as = k > .75 ? lerp(1, .2, (k - .75) / .25) : 1; }
    else if (si === 1) { ay = lerp(4.2, .3, ease(prog)); }
    else if (si === 2) { ay = lerp(.3, -.35, ease(prog)); as = lerp(1, .35, ease(prog)); }
    else { ay = -.35; as = 0; }
    apple.position.set(0, ay, 0); apple.scale.setScalar(Math.max(.001, as)); apple.visible = as > .01;
    pusher.position.y = Math.max(ay + .62 * as + .8, 1.5); pusher.visible = si >= 1 && si <= 2;
    // shredded pulp: on disc in 2-4, pressed to wall
    shred.forEach(m => { const u = m.userData; const wall = si >= 3 ? 1 : 0; const r = lerp(u.r, 1.05 + u.h * .7, wall), y = lerp(.2, .1 + u.h * 1.3, wall); m.position.set(Math.cos(u.a) * r, y, Math.sin(u.a) * r); m.visible = si >= 2 && si <= 5 || si === 0; });
    // juice droplets: fly from basket wall out to bowl
    drops.forEach(m => { const u = m.userData, k = (u.o + t * 1.1) % 1; const r = lerp(1.2 + u.h * .6, 2.3, k), y = -1 + .2 + u.h * 1.2 - k * .4; m.position.set(Math.cos(u.a + t * .5) * r, y, Math.sin(u.a + t * .5) * r); m.visible = si === 0 || si >= 3 && si <= 6; });
    stream.forEach(m => { const u = m.userData, k = (u.o + t * 1.4) % 1; m.position.set(0, lerp(-.9, -2.7, k), lerp(3.2, 3.9, Math.min(1, k * 2))); m.visible = si === 0 || si >= 4; });
    fling.forEach(m => { const u = m.userData, k = (u.o + t * .7) % 1; m.position.set(u.x, lerp(-.2, -2.5, k * k), lerp(-1.9, -3.4, k)); m.visible = si === 5 || si === 0 || si === 6; });
    const lvl = si < 4 ? .15 : si === 4 ? lerp(.15, .5, prog) : si === 5 ? lerp(.5, 1.4, prog) : 1.4;
    juiceLvl.scale.y = lvl; juiceLvl.position.y = -3.1 + lvl / 2;
    const pl = si < 5 ? 10 : si === 5 ? Math.floor(lerp(10, 50, prog)) : 50;
    pulpPile.forEach(m => m.visible = m.userData.i < pl);
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const kk = si === 0 ? 1 : ease(lt / 1.4);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], kk))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], kk)));
    const ob = Math.sin(t * .25) * .08, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(ob) - dz * Math.sin(ob), cp.p.y, cp.q.z + dz * Math.cos(ob) + dx * Math.sin(ob));
    camera.lookAt(cp.q);
  }
  return { update };
}
