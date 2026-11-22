// Inside 60 — 3D face unlock. Steps: 0 hook (dots on a mannequin head), 1 infrared flood light, 2 dot projector, 3 infrared camera reads dots,
// 4 3D depth map vs flat photo, 5 neural network match -> unlock, 6 recap
export async function setup({ THREE, scene, camera }) {
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const ss = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x555555, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x0e1428); scene.fog = new THREE.Fog(0x0e1428, 30, 80);
  scene.add(new THREE.HemisphereLight(0xf4f6ff, 0x40404c, 1.4));
  const key = new THREE.DirectionalLight(0xffffff, 1.7); key.position.set(5, 8, 9); scene.add(key);
  const rim = new THREE.DirectionalLight(0xa0c8ff, .9); rim.position.set(-6, 3, -6); scene.add(rim);

  // ===== A: mannequin head (origin, faces +z) and phone at z = 6 =====
  const headM = Mat({ color: 0xd8dce6, shininess: 60, emissive: 0x6020a0, emissiveIntensity: 0 });
  const head = new THREE.Group(); head.position.set(0, 2.2, 0); scene.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(1.5, 48, 32), headM); skull.scale.set(1, 1.28, 1.1); head.add(skull);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(.28, .9, 20), headM); nose.rotation.x = Math.PI / 2 + .35; nose.position.set(0, -.05, 1.62); nose.scale.set(1, 1, .8); head.add(nose);
  const brow = new THREE.Mesh(new THREE.CapsuleGeometry(.18, 1.3, 6, 16), headM); brow.rotation.z = Math.PI / 2; brow.position.set(0, .5, 1.42); head.add(brow);
  [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.SphereGeometry(.2, 20, 12), headM); e.position.set(s * .52, .22, 1.36); e.scale.set(1.2, .7, .4); head.add(e);
    const ch = new THREE.Mesh(new THREE.SphereGeometry(.45, 20, 12), headM); ch.position.set(s * .7, -.45, 1.15); ch.scale.z = .6; head.add(ch); });
  const chin = new THREE.Mesh(new THREE.SphereGeometry(.5, 20, 12), headM); chin.position.set(0, -1.45, 1.05); chin.scale.set(1, .7, .7); head.add(chin);
  const lips = new THREE.Mesh(new THREE.CapsuleGeometry(.09, .5, 4, 10), headM); lips.rotation.z = Math.PI / 2; lips.position.set(0, -.85, 1.48); head.add(lips);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.75, .9, 1.8, 24), headM); neck.position.y = -2.2; head.add(neck);
  head.updateMatrixWorld(true);

  const phone = new THREE.Group(); phone.position.set(0, 2.2, 6); phone.rotation.y = Math.PI; scene.add(phone);
  phone.add(new THREE.Mesh(new RoundedBoxGeometry(2.4, 4.8, .3, 4, .3), Mat({ color: 0x20242e })));
  const scrM = Mat({ color: 0x1a2a50, emissive: 0x203070, emissiveIntensity: .6 });
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 4.4), scrM); scr.position.z = .16; phone.add(scr);
  const bar = new THREE.Mesh(new RoundedBoxGeometry(1.3, .3, .1, 2, .1), Mat({ color: 0x0a0c12 })); bar.position.set(0, 2.05, .18); phone.add(bar);
  const emit = (x, c) => { const m = Mat({ color: 0x222222, emissive: c, emissiveIntensity: .2 }); const o = new THREE.Mesh(new THREE.SphereGeometry(.08, 12, 8), m); o.position.set(x, 2.05, .24); phone.add(o); return m; };
  const floodE = emit(-.4, 0xff4060), dotE = emit(.4, 0xff4060), camE = emit(0, 0x60d0ff);
  // emitters in world space (phone is rotated 180deg about y)
  const wp = x => V(-x, 2.2 + 2.05, 6 - .24);
  // flood cone
  const floodM = new THREE.MeshBasicMaterial({ color: 0xff4080, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  const flood = new THREE.Mesh(new THREE.ConeGeometry(2.6, 5.6, 32, 1, true), floodM); scene.add(flood);
  { const a = wp(-.4), b = V(0, 2.2, .5); flood.position.copy(a).add(b).multiplyScalar(.5); flood.lookAt(a); flood.rotateX(-Math.PI / 2); }

  // dots: raycast a jittered grid from the projector onto the head
  const ray = new THREE.Raycaster(); const src = wp(.4); const hits = [];
  let seed = 3; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const targets = []; head.traverse(o => { if (o.isMesh) targets.push(o); });
  for (let j = 0; j < 70; j++) for (let i = 0; i < 56; i++) {
    const tx = (i / 55 - .5) * 3.4 + (rnd() - .5) * .05, ty = 2.2 + (j / 69 - .5) * 4.4 + (rnd() - .5) * .05;
    const dir = V(tx, ty, 1.2).sub(src).normalize(); ray.set(src, dir); const h = ray.intersectObjects(targets, false)[0];
    if (h && h.object !== neck) hits.push(h.point.clone()); }
  const dotG = new THREE.BufferGeometry().setFromPoints(hits);
  const dotM = new THREE.PointsMaterial({ color: 0xff3050, size: .06, transparent: true, opacity: 0, depthWrite: false });
  const dots = new THREE.Points(dotG, dotM); scene.add(dots);
  // projector beam fan
  const fanM = new THREE.MeshBasicMaterial({ color: 0xff3050, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  const fan = new THREE.Mesh(new THREE.ConeGeometry(2.4, 5.4, 4, 1, true), fanM); scene.add(fan);
  { const a = src, b = V(0, 2.2, .8); fan.position.copy(a).add(b).multiplyScalar(.5); fan.lookAt(a); fan.rotateX(-Math.PI / 2); }
  // reflected rays to camera (sample of dots)
  const camW = wp(0); const rayPts = [];
  for (let k = 0; k < 40; k++) { const p = hits[Math.floor(rnd() * hits.length)]; rayPts.push(p, camW); }
  const rayM = new THREE.LineBasicMaterial({ color: 0x80e0ff, transparent: true, opacity: 0 });
  const rays = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(rayPts), rayM); scene.add(rays);

  // ===== B: depth map vs flat photo (x = 22) =====
  const B = new THREE.Group(); B.position.set(22, 2.2, 0); scene.add(B);
  const zs = hits.map(p => p.z); const zmin = Math.min(...zs), zmax = Math.max(...zs);
  const dcol = new Float32Array(hits.length * 3); const dpos = new Float32Array(hits.length * 3); const c = new THREE.Color();
  hits.forEach((p, k) => { const u = (p.z - zmin) / (zmax - zmin); c.setHSL(.66 - .66 * u, 1, .55); dcol.set([c.r, c.g, c.b], k * 3); dpos.set([p.x, p.y - 2.2, p.z], k * 3); });
  const dG = new THREE.BufferGeometry(); dG.setAttribute('position', new THREE.BufferAttribute(dpos, 3)); dG.setAttribute('color', new THREE.BufferAttribute(dcol, 3));
  const dM = new THREE.PointsMaterial({ size: .07, vertexColors: true });
  const depth = new THREE.Points(dG, dM); depth.position.set(0, 1.55, 0); depth.scale.setScalar(.62); B.add(depth);
  const flatPos = new Float32Array(dpos); for (let k = 0; k < hits.length; k++) flatPos[k * 3 + 2] = 0;
  const fG = new THREE.BufferGeometry(); fG.setAttribute('position', new THREE.BufferAttribute(flatPos, 3));
  const flat = new THREE.Points(fG, new THREE.PointsMaterial({ size: .07, color: 0x3060ff }));
  const flatG = new THREE.Group(); flatG.position.set(0, -1.6, 0); flatG.scale.setScalar(.62); B.add(flatG); flatG.add(flat);
  const card = new THREE.Mesh(new RoundedBoxGeometry(3.2, 4.4, .06, 2, .05), Mat({ color: 0xf0f0f4 })); card.position.z = -.06; flatG.add(card);
  const xM = new THREE.MeshBasicMaterial({ color: 0xff3040, transparent: true, opacity: 0 });
  [1, -1].forEach(s => { const x = new THREE.Mesh(new THREE.BoxGeometry(3.6, .28, .1), xM); x.rotation.z = s * .8; x.position.z = .3; flatG.add(x); });

  // ===== C: neural network + unlock (x = -22) =====
  const C = new THREE.Group(); C.position.set(-22.4, 2.2, 0); C.scale.setScalar(.6); scene.add(C);
  const layers = [4, 6, 6, 3], nodes = []; const nM = [];
  layers.forEach((n, li) => { for (let k = 0; k < n; k++) { const m = Mat({ color: 0x404860, emissive: 0x40a0ff, emissiveIntensity: .1 }); const s = new THREE.Mesh(new THREE.SphereGeometry(.22, 16, 10), m);
    s.position.set(-3.2 + li * 1.6, (k - (n - 1) / 2) * .8, 0); C.add(s); nodes.push({ s, li }); nM.push(m); } });
  const lp = []; for (const a of nodes) for (const b of nodes) if (b.li === a.li + 1) lp.push(a.s.position, b.s.position);
  const lM = new THREE.LineBasicMaterial({ color: 0x60b0ff, transparent: true, opacity: .25 });
  C.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(lp), lM));
  const lockM = Mat({ color: 0xffffff, emissive: 0x888888 });
  const lockB = new THREE.Mesh(new RoundedBoxGeometry(1.0, .8, .2, 2, .08), lockM); lockB.position.set(3.4, -.3, 0); C.add(lockB);
  const shackle = new THREE.Mesh(new THREE.TorusGeometry(.33, .08, 10, 24, Math.PI), lockM); shackle.position.set(3.4, .1, 0); C.add(shackle);
  const okM = new THREE.MeshBasicMaterial({ color: 0x40ff90, transparent: true, opacity: 0, depthWrite: false });
  const ok = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.15, 40), okM); ok.position.set(3.4, -.1, 0); C.add(ok);

  const shots = [
    [[9.5, 3.4, 10.5], [0, 2.2, .8]],          // 0 head + phone, dots
    [[10.0, 3.4, 8.5], [0, 2.3, 1.6]],          // 1 flood
    [[5.5, 2.6, 9.5], [0, 2.2, .8]],          // 2 dots on face
    [[-9.0, 3.4, 8.5], [0, 2.5, 2.2]],         // 3 camera rays
    [[23.5, 2.4, 12.5], [22, 2.2, 0]],         // 4 depth vs photo
    [[-22, 2.4, 13.0], [-22, 2.2, 0]],         // 5 network + unlock
    [[9.5, 3.4, 10.5], [0, 2.2, .8]],          // 6 recap
  ];
  const cp = { p: V(), q: V() };
  function update(t, si, lt, sd) {
    const pulse = .5 + .5 * Math.sin(t * 6); const D = sd || 5;
    head.rotation.y = Math.sin(t * .5) * .08; dots.rotation.y = head.rotation.y;
    const fl = si === 1 ? ss(.3, 1.2, lt) : 0;
    floodM.opacity = fl * (.12 + .06 * pulse); floodE.emissiveIntensity = .2 + fl * 1.5; headM.emissiveIntensity = fl * .35;
    const dOn = si === 0 || si === 6 ? 1 : si === 2 ? ss(.5, 1.8, lt) : si === 3 ? 1 : 0;
    dotM.opacity = dOn; dotE.emissiveIntensity = si === 2 ? 1.5 : .2 + dOn * .5;
    dotG.setDrawRange(0, Math.floor(hits.length * (si === 2 ? ss(.5, 2.2, lt) : 1)));
    fanM.opacity = si === 2 ? .08 + .05 * pulse : 0;
    rayM.opacity = si === 3 ? ss(.5, 1.3, lt) * (.4 + .4 * pulse) : 0; camE.emissiveIntensity = si === 3 ? 1.5 : .2;
    // depth map spins slowly; flat photo gets X
    depth.rotation.y = Math.sin(t * .8) * .7; flatG.rotation.y = Math.sin(t * .8) * .7;
    xM.opacity = si === 4 ? ss(2.0, 2.6, lt) : 0;
    // network pulse runs left to right, then unlock
    nodes.forEach(({ li }, k) => { const w = si === 5 ? ss(li * .45 + .3, li * .45 + .7, lt) : 0; nM[k].emissiveIntensity = .1 + w * (.8 + .3 * pulse); });
    lM.opacity = si === 5 ? .25 + .4 * ss(.3, 1.8, lt) : .25;
    const un = si === 5 ? ss(2.0, 2.8, lt) : 0;
    shackle.position.y = .1 + un * .35; shackle.rotation.y = un * .9; lockM.color.set(un > .5 ? 0x60ff9a : 0xffffff); okM.opacity = un * (.7 + .3 * pulse);
    scrM.emissive.set(si === 6 ? 0x208050 : 0x203070);
    // camera
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const far = Math.abs(prev[1][0] - now[1][0]) > 8;
    const kk = si === 0 ? 1 : ease(lt / (far ? 1.1 : 1.4));
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], kk))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], kk)));
    const o = Math.sin(t * .2) * .08, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o));
    camera.lookAt(cp.q);
  }
  return { update };
}
