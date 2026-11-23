// Inside 60 — X-ray machine. Steps: 0 hook tube glows hot (99% heat), 1 filament boils electrons, 2 voltage accelerates
// electrons to tungsten target, 3 X-rays fan out + anode spins, 4 X-rays pass tissue / blocked by bone, 5 detector image, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x161828); scene.fog = new THREE.Fog(0x161828, 30, 80);
  scene.add(new THREE.HemisphereLight(0xf4f6ff, 0x383040, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.2); key.position.set(6, 10, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0xa0c0ff, .5); rim.position.set(-6, 3, -8); scene.add(rim);
  const root = new THREE.Group(); scene.add(root);

  // TUBE at top (y = 3): glass envelope along x. Cathode at x=-1.6, anode at x=+1.4
  const tube = new THREE.Group(); tube.position.set(0, 3, 0); root.add(tube);
  const glassM = new THREE.MeshPhongMaterial({ color: 0xa0d8ff, transparent: true, opacity: .22, shininess: 200, specular: 0xffffff, depthWrite: false, side: THREE.DoubleSide });
  const glass = new THREE.Mesh(new THREE.CapsuleGeometry(.9, 3.4, 10, 32), glassM); glass.rotation.z = Math.PI / 2; tube.add(glass);
  // cathode cup + filament
  const metal = Mat({ color: 0xb8c0cc, shininess: 140 });
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(.35, .25, .4, 24, 1, true), metal); cup.rotation.z = Math.PI / 2; cup.position.x = -1.5; tube.add(cup);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 1.4, 10), metal); stem.rotation.z = Math.PI / 2; stem.position.x = -2.3; tube.add(stem);
  const filM = Mat({ color: 0xffa040, emissive: 0xff8020, emissiveIntensity: 0 });
  const filPts = []; for (let k = 0; k <= 60; k++) { const a = k / 60 * Math.PI * 10; filPts.push(V(-1.4, Math.cos(a) * .1, -.25 + k / 60 * .5 + Math.sin(a) * 0)); }
  const fil = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(filPts.map((p, k) => V(-1.38 + Math.sin(k / 60 * Math.PI * 10) * .06, Math.cos(k / 60 * Math.PI * 10) * .1, p.z))), 120, .045, 6), filM); tube.add(fil);
  // anode: tilted tungsten disc on rotor shaft
  const anode = new THREE.Group(); anode.position.x = 1.4; tube.add(anode);
  const discM = Mat({ color: 0x9aa0a8, emissive: 0xff5010, emissiveIntensity: 0, shininess: 160 });
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(.75, .55, .22, 40), discM); disc.rotation.z = Math.PI / 2 - .35; anode.add(disc);
  const marks = []; for (let k = 0; k < 6; k++) { const m = new THREE.Mesh(new THREE.BoxGeometry(.05, .2, .06), Mat({ color: 0x40e0ff, emissive: 0x20c0ff, emissiveIntensity: .5 })); disc.add(m); marks.push(m); m.position.set(Math.cos(k) * .6, .12, Math.sin(k) * .6); }
  const rotor = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, 1.3, 14), metal); rotor.rotation.z = Math.PI / 2; rotor.position.x = .75; anode.add(rotor);
  const focal = new THREE.Mesh(new THREE.SphereGeometry(.12, 14, 10), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true })); focal.position.set(1.08, 0, 0); tube.add(focal);
  // heat glow sphere
  const heatM = new THREE.MeshBasicMaterial({ color: 0xff6020, transparent: true, opacity: 0, depthWrite: false });
  const heat = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), heatM); heat.position.set(1.4, 3, 0); root.add(heat);
  // voltage label bars (+ / -)
  const plusM = new THREE.MeshBasicMaterial({ color: 0xff4040 }), minusM = new THREE.MeshBasicMaterial({ color: 0x4080ff });
  const plus = new THREE.Group(); plus.add(new THREE.Mesh(new THREE.BoxGeometry(.5, .12, .12), plusM)); plus.add(new THREE.Mesh(new THREE.BoxGeometry(.12, .5, .12), plusM)); plus.position.set(2.2, 4.4, 0); root.add(plus);
  const minus = new THREE.Mesh(new THREE.BoxGeometry(.5, .12, .12), minusM); minus.position.set(-2.2, 4.4, 0); root.add(minus);
  const bolt = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 3.6, 8), new THREE.MeshBasicMaterial({ color: 0xffe040, transparent: true })); bolt.rotation.z = Math.PI / 2; bolt.position.set(0, 4.4, 0); root.add(bolt);
  // housing (opaque lead shield, back half only)

  // electrons
  const eM = new THREE.MeshBasicMaterial({ color: 0x60c0ff });
  const els = []; for (let i = 0; i < 24; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 6), eM); root.add(m); els.push({ m, ph: Math.random(), o: V((Math.random() - .5) * .3, (Math.random() - .5) * .25, (Math.random() - .5) * .3) }); }

  // X-ray beam: cone pointing down from focal spot
  const beamM = new THREE.MeshBasicMaterial({ color: 0xc080ff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  const beam = new THREE.Mesh(new THREE.ConeGeometry(1.9, 5.0, 40, 1, true), beamM); beam.position.set(1.08, .5, 0); root.add(beam);
  const rays = []; for (let i = 0; i < 16; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(.04, .5, .04), new THREE.MeshBasicMaterial({ color: 0xe0b0ff, transparent: true })); root.add(m); rays.push({ m, ph: Math.random(), a: Math.random() * Math.PI * 2, r: Math.random() }); }

  // hand/arm (abstract, no face): soft tissue translucent + bones
  const arm = new THREE.Group(); arm.position.set(1.08, -1.2, 0); root.add(arm);
  const tissueM = Mat({ color: 0xf0b8a0, transparent: true, opacity: .55, shininess: 20, depthWrite: false });
  const fore = new THREE.Mesh(new THREE.CapsuleGeometry(.45, 2.6, 8, 16), tissueM); fore.rotation.z = Math.PI / 2; fore.position.x = -1.0; arm.add(fore);
  const palm = new THREE.Mesh(new THREE.BoxGeometry(1.1, .35, 1.0), tissueM); palm.position.x = 1.0; arm.add(palm);
  const boneM = Mat({ color: 0xfff8e8, emissive: 0xffffff, emissiveIntensity: 0, shininess: 40 });
  for (const z of [-.18, .18]) { const b = new THREE.Mesh(new THREE.CapsuleGeometry(.09, 2.6, 6, 10), boneM); b.rotation.z = Math.PI / 2; b.position.set(-1.0, 0, z); arm.add(b); }
  for (let k = 0; k < 4; k++) { const z = -.36 + k * .24; const mc = new THREE.Mesh(new THREE.CapsuleGeometry(.05, .8, 6, 8), boneM); mc.rotation.z = Math.PI / 2; mc.position.set(1.0, 0, z); arm.add(mc); const f = new THREE.Mesh(new THREE.CapsuleGeometry(.07, .7, 6, 8), tissueM); f.rotation.z = Math.PI / 2; f.position.set(1.95, 0, z); arm.add(f); const fb = new THREE.Mesh(new THREE.CapsuleGeometry(.035, .6, 6, 8), boneM); fb.rotation.z = Math.PI / 2; fb.position.set(1.95, 0, z); arm.add(fb); }

  // detector plate below with canvas image that develops
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 256; const cx = cv.getContext('2d');
  cx.fillStyle = '#0a0c14'; cx.fillRect(0, 0, 256, 256);
  cx.fillStyle = '#3a3e4a'; cx.fillRect(0, 98, 150, 60); cx.fillRect(150, 90, 50, 76); for (let k = 0; k < 4; k++) cx.fillRect(195, 92 + k * 19, 55, 14);
  cx.fillStyle = '#f4f4f4'; cx.fillRect(0, 108, 150, 10); cx.fillRect(0, 138, 150, 10); for (let k = 0; k < 4; k++) { cx.fillRect(150, 96 + k * 19, 50, 6); cx.fillRect(200, 96 + k * 19, 48, 5); }
  const tex = new THREE.CanvasTexture(cv);
  const detM = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 1 });
  const det = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 4.4), detM); det.rotation.x = -Math.PI / 2; det.position.set(1.08, -2.0, 0); root.add(det);
  const detBase = new THREE.Mesh(new THREE.BoxGeometry(4.7, .2, 4.7), Mat({ color: 0x30384a })); detBase.position.set(1.08, -2.13, 0); root.add(detBase);
  const detCover = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 4.4), new THREE.MeshBasicMaterial({ color: 0x0a0c14, transparent: true })); detCover.rotation.x = -Math.PI / 2; detCover.position.set(1.08, -1.99, 0); root.add(detCover);

  const shots = [
    [[4.5, 5.0, 10.0], [.6, 2.6, 0]],     // 0 tube hot
    [[-3.0, 3.7, 4.8], [-1.4, 3, 0]],     // 1 filament close
    [[0, 4.4, 8.0], [0, 3, 0]],           // 2 electrons across
    [[3.6, 3.8, 5.6], [1.2, 2.3, 0]],     // 3 anode + x-rays
    [[6.5, 1.2, 9.0], [1.0, -.6, 0]],     // 4 arm in beam
    [[1.1, 7.5, 4.5], [1.1, -2, 0]],      // 5 detector top-down
    [[7.0, 3.0, 12.0], [1.0, .5, 0]],     // 6 recap
  ];
  const cp = { p: V(), q: V() };
  function update(t, si, lt, sd) {
    const pulse = .5 + .5 * Math.sin(t * 7);
    const on = si >= 1; const fire = si >= 2 || si === 0;
    filM.emissiveIntensity = si === 0 ? .6 : (si === 1 ? .4 + 1.2 * ease(lt / 1.2) : .9);
    // electrons
    els.forEach((e, i) => {
      e.m.visible = on || si === 0;
      if (si === 1) { const a = t * 2 + i; e.m.position.set(-1.25 + .2 + Math.abs(Math.sin(a * 1.3)) * .25, 3 + Math.sin(a) * .3, Math.cos(a * .7) * .3); return; }
      const ph = (t * .9 + e.ph) % 1; const k = ph * ph;
      e.m.position.set(lerp(-1.25, 1.08, k), 3 + e.o.y * (1 - k), e.o.z * (1 - k));
    });
    eM.color.setHex(si === 2 ? 0x80e0ff : 0x60c0ff);
    plus.visible = minus.visible = bolt.visible = si === 2; bolt.material.opacity = .4 + .6 * (Math.sin(t * 30) > 0 ? 1 : .3);
    // anode spin + heat
    anode.rotation.x = t * (si >= 3 || si === 0 ? 14 : 3);
    discM.emissiveIntensity = si === 0 ? .7 + .3 * pulse : (fire ? .35 : 0);
    heatM.opacity = si === 0 ? .25 + .15 * pulse : (si === 3 ? .12 : 0); heat.scale.setScalar(si === 0 ? 1.3 + .15 * pulse : 1);
    focal.material.opacity = fire ? .6 + .4 * pulse : 0;
    // beam
    const bOn = si >= 3 ? (si === 3 ? ease((lt - .4) / .8) : 1) : (si === 0 ? .3 : 0);
    beamM.opacity = (si === 5 ? .05 : .16) * bOn;
    rays.forEach(r => {
      r.m.visible = bOn > .05 && si !== 5; const ph = (t * 1.2 + r.ph) % 1; const d = ph * 5.0;
      const rad = r.r * 1.8 * (d / 5);
      r.m.position.set(1.08 + Math.cos(r.a) * rad, 3 - d, Math.sin(r.a) * rad);
      const overBone = si >= 4 && Math.abs(3 - d - -1.2) < .2;
      r.m.material.opacity = (1 - ph) * bOn;
    });
    boneM.emissiveIntensity = si === 4 ? .3 + .3 * pulse : 0;
    arm.visible = si >= 3 && !(si === 5 && lt > .5);
    arm.position.x = si === 3 ? 1.08 + (1 - ease(lt / 2)) * -6 : 1.08;
    detCover.material.opacity = si === 5 ? 1 - ease((lt - .6) / 1.6) : (si === 6 ? 0 : 1);
    // camera
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const kk = si === 0 ? 1 : ease(lt / 1.4);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], kk))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], kk)));
    const o = Math.sin(t * .25) * .08, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o));
    camera.lookAt(cp.q);
  }
  return { update };
}
