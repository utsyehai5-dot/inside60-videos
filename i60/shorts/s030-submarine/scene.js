// Inside 60 — Submarine. Steps: 0 hook, 1 ballast air, 2 dive/flood, 3 trim, 4 hydroplanes, 5 blow/surface, 6 recap
export async function setup({ THREE, scene, camera, renderer }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x555555, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  if (renderer) renderer.localClippingEnabled = true;
  const bg = new THREE.Color(0x0b3a5c);
  scene.background = bg; scene.fog = new THREE.Fog(0x0b3a5c, 18, 60);
  scene.add(new THREE.HemisphereLight(0xd8f0ff, 0x203040, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 1.9); key.position.set(5, 12, 8); scene.add(key);
  const rim = new THREE.DirectionalLight(0x80d0ff, .8); rim.position.set(-6, 3, -6); scene.add(rim);
  // water surface
  const surfM = new THREE.MeshPhongMaterial({ color: 0x5ab8e8, transparent: true, opacity: .45, side: THREE.DoubleSide, shininess: 120, depthWrite: false });
  const surf = new THREE.Mesh(new THREE.PlaneGeometry(120, 120, 1, 1), surfM); surf.rotation.x = -Math.PI / 2; surf.position.y = .35; scene.add(surf);
  // seabed
  const bed = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), Mat({ color: 0x2a4a50 })); bed.rotation.x = -Math.PI / 2; bed.position.y = -9; scene.add(bed);

  const sub = new THREE.Group(); scene.add(sub);
  const L = 6.4, R = .62;
  const hullM = Mat({ color: 0x6a7a8c, shininess: 70, transparent: true, opacity: 1 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(R, R, L * .62, 32, 1, true), hullM); body.rotation.z = Math.PI / 2; sub.add(body);
  const bow = new THREE.Mesh(new THREE.SphereGeometry(R, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), hullM); bow.rotation.z = -Math.PI / 2; bow.scale.y = 1.5; bow.position.x = L * .31; sub.add(bow);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(R, L * .26, 32, 1, true), hullM); tail.rotation.z = Math.PI / 2; tail.position.x = -L * .31 - L * .13; sub.add(tail);
  const sail = new THREE.Mesh(new THREE.BoxGeometry(1.0, .75, .28), Mat({ color: 0x3c4652 })); sail.position.set(1.0, R + .3, 0); sub.add(sail);
  const planeM = Mat({ color: 0xffc040, emissive: 0xff9000, emissiveIntensity: 0 });
  const bowP = new THREE.Group(); bowP.position.set(1.0, R + .35, 0); sub.add(bowP);
  bowP.add(new THREE.Mesh(new THREE.BoxGeometry(.4, .04, 1.4), planeM));
  const sternP = new THREE.Group(); sternP.position.set(-L * .5, 0, 0); sub.add(sternP);
  sternP.add(new THREE.Mesh(new THREE.BoxGeometry(.45, .04, 1.5), planeM));
  const rud = new THREE.Mesh(new THREE.BoxGeometry(.45, 1.1, .04), Mat({ color: 0x3c4652 })); rud.position.set(-L * .5, 0, 0); sub.add(rud);
  const prop = new THREE.Group(); prop.position.set(-L * .5 - .55, 0, 0); sub.add(prop);
  for (let i = 0; i < 7; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.05, .42, .14), Mat({ color: 0xb89050 })); b.rotation.x = i / 7 * Math.PI * 2; b.position.set(0, Math.cos(i / 7 * Math.PI * 2) * .2, Math.sin(i / 7 * Math.PI * 2) * .2); prop.add(b); }

  // ballast tanks: glass sections at bow and stern, water fill with clipping plane
  const tankGlass = new THREE.MeshPhongMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  const tanks = [];
  [[1.95, 1.1], [-1.75, 1.1]].forEach(([x, w]) => {
    const g = new THREE.Mesh(new THREE.CylinderGeometry(R + .05, R + .05, w, 32), tankGlass); g.rotation.z = Math.PI / 2; g.position.x = x; sub.add(g);
    const plane = new THREE.Plane(V(0, -1, 0), 0);
    const wm = new THREE.MeshPhongMaterial({ color: 0x1e90ff, emissive: 0x0050c0, emissiveIntensity: .4, transparent: true, opacity: 0, clippingPlanes: [plane] });
    const air = new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: .2, transparent: true, opacity: 0, clippingPlanes: [new THREE.Plane(V(0, 1, 0), 0)] });
    const wat = new THREE.Mesh(new THREE.CylinderGeometry(R, R, w - .04, 32), wm); wat.rotation.z = Math.PI / 2; wat.position.x = x; sub.add(wat);
    const ai = new THREE.Mesh(new THREE.CylinderGeometry(R - .01, R - .01, w - .06, 32), air); ai.rotation.z = Math.PI / 2; ai.position.x = x; sub.add(ai);
    tanks.push({ x, plane, plane2: air.clippingPlanes[0], wm, air });
  });
  // trim tanks (small boxes on the keel)
  const trims = [0.7, -0.5].map(x => { const box = new THREE.Mesh(new THREE.BoxGeometry(.5, .32, .5), new THREE.MeshPhongMaterial({ color: 0xdff4ff, transparent: true, opacity: 0, depthWrite: false })); box.position.set(x, -R - .2, 0); sub.add(box);
    const w = new THREE.Mesh(new THREE.BoxGeometry(.46, .3, .46), new THREE.MeshPhongMaterial({ color: 0x30a0ff, emissive: 0x1060ff, emissiveIntensity: .5, transparent: true, opacity: 0 })); w.position.copy(box.position); sub.add(w); return { box, w }; });
  const trimPipe = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, 1.2, 8), new THREE.MeshPhongMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0 })); trimPipe.rotation.z = Math.PI / 2; trimPipe.position.set(.1, -R - .2, 0); sub.add(trimPipe);
  // bubbles
  const bubs = [];
  for (let i = 0; i < 90; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(.06 + Math.random() * .06, 8, 6), new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0xaaddff, emissiveIntensity: .4, transparent: true, opacity: 0 })); scene.add(m);
    bubs.push({ m, ph: Math.random(), tx: [1.95, -1.75][i % 2] + (Math.random() - .5) * .9, z: (Math.random() - .5) * .8 }); }
  // ambient particles (marine snow) for depth sense
  const snow = []; for (let i = 0; i < 80; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(.03, 4, 3), new THREE.MeshBasicMaterial({ color: 0xcfefff, transparent: true, opacity: .5 })); m.position.set((Math.random() - .5) * 20, -8 + Math.random() * 8, (Math.random() - .5) * 12); scene.add(m); snow.push(m); }
  // depth gauge arrow (hook): line down from surface
  const shots = [
    [[9, 4, 14], [0, -.3, 0]],
    [[8, 2.5, 14], [0, .2, 0]],
    [[10, 1.5, 13.5], [0, 0, 0]],
    [[8, -2.5, 12.5], [0, -.4, 0]],
    [[-10, 2, 10.5], [-.8, 0, 0]],
    [[9, -1, 13.5], [0, .5, 0]],
    [[-9, 3, 13.5], [0, 0, 0]],
  ];
  const cp = { p: V(), q: V() };
  let lastT = 0, fill = 0, subY = 0, pitch = 0, trimS = 0;
  function update(t, si, lt, sd) {
    const dt = Math.min(.1, Math.max(0, t - lastT)); lastT = t;
    sd = sd || 6;
    // fill level & depth targets
    let fT = 0, yT = 0, pT = 0, plT = 0;
    if (si === 0) { fT = 1; yT = -3.2; }
    if (si === 1) { fT = 0; yT = 0; }
    if (si === 2) { fT = ease((lt - .8) / 2.5); yT = -3.2 * ease((lt - 1.8) / 3); pT = -.08 * Math.sin(Math.min(1, lt / sd) * Math.PI); }
    if (si === 3) { fT = 1; yT = -3.2; trimS = Math.sin(lt * 1.4); pT = -trimS * .05; }
    if (si === 4) { fT = 1; plT = Math.sin(lt * 1.2) * .45; pT = plT * .25; yT = -3.2 + Math.sin(lt * 1.2 - 1.2) * .4; }
    if (si === 5) { fT = 1 - ease((lt - .6) / 2); yT = -3.2 * (1 - ease((lt - 1.4) / 3)); pT = .1 * Math.sin(Math.min(1, lt / sd) * Math.PI); }
    if (si === 6) { fT = 0; yT = 0; }
    if (si === 1 || si === 6) { fill = fT; }
    fill += (fT - fill) * Math.min(1, dt * 3); subY += (yT - subY) * Math.min(1, dt * (si === 0 ? 20 : 1.6)); pitch += (pT - pitch) * Math.min(1, dt * 2);
    if (t < .05) { fill = fT; subY = yT; }
    sub.position.y = subY; sub.rotation.z = pitch; sub.position.x = Math.sin(t * .15) * .2;
    prop.rotation.x = t * 6;
    bowP.rotation.z = plT * .8; sternP.rotation.z = -plT * .8; planeM.emissiveIntensity = si === 4 ? .6 : 0;
    // tank visuals: water level in local sub space (world plane uses world y)
    const showT = si >= 1 && si <= 5 ? 1 : .35;
    tankGlass.opacity = .3 * showT; hullM.opacity = 1;
    tanks.forEach(tk => { const lvl = subY - R + fill * 2 * R; tk.plane.constant = lvl; tk.plane2.constant = -lvl;
      tk.wm.opacity = .85 * showT; tk.air.opacity = .35 * showT; tk.wm.emissiveIntensity = si === 2 ? .7 : .4; });
    // trim tanks
    const tOn = si === 3 ? Math.min(1, lt) : 0;
    trims.forEach((tr, i) => { tr.box.material.opacity = tOn * .35; tr.w.material.opacity = tOn * .9; const f = .5 + (i === 0 ? .4 : -.4) * trimS; tr.w.scale.y = Math.max(.05, f); tr.w.position.y = -R - .2 - .15 + .15 * Math.max(.05, f); });
    trimPipe.material.opacity = tOn * .8;
    // bubbles: venting (step 2) out the top, blowing (step 5) out the bottom
    const vent = si === 2 && lt > .8 && lt < 4.5, blow = si === 5 && lt > .5 && lt < 3.5;
    bubs.forEach(b => { const u = (b.ph + t * .6) % 1;
      if (vent || blow) { const y0 = subY + (vent ? R : -R); b.m.position.set(b.tx + Math.sin(u * 9 + b.ph * 6) * .15, y0 + u * (vent ? 3.5 : 2.5) + (blow ? 0 : 0), b.z); if (blow) b.m.position.x += (b.ph - .5) * u * 2; b.m.material.opacity = (1 - u) * .9; }
      else b.m.material.opacity *= .9; });
    snow.forEach((m, i) => { m.position.y += Math.sin(t + i) * .001; });
    // camera follows the sub
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const k = si === 0 ? 1 : ease(lt / 1.3);
    cp.p.set(...prev[0].map((v, i) => lerp(v, now[0][i], k))); cp.q.set(...prev[1].map((v, i) => lerp(v, now[1][i], k)));
    const o = Math.sin(t * .2) * .12, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y + subY, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o));
    camera.lookAt(cp.q.x, cp.q.y + subY, cp.q.z);
    const under = camera.position.y < surf.position.y;
    scene.fog.color.setHex(under ? 0x0b3a5c : 0x6aa8d0); scene.background.setHex(under ? 0x0b3a5c : 0x6aa8d0);
  }
  return { update };
}
