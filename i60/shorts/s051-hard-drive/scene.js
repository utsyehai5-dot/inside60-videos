// Inside 60 — Hard drive. Steps: 0 hook (7200 rpm), 1 platters magnetic coating, 2 head floats nm above, 3 magnetized patches N/S = 1/0, 4 arm swings (voice coil), 5 read signal, 6 recap
export async function setup({ THREE, scene, camera }) {
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const ss = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x555555, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x141c34); scene.fog = new THREE.Fog(0x141c34, 30, 75);
  scene.add(new THREE.HemisphereLight(0xf4f6ff, 0x40404c, 1.4));
  const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(4, 10, 8); scene.add(key);
  const rim = new THREE.DirectionalLight(0xa0c8ff, .8); rim.position.set(-6, 3, -6); scene.add(rim);

  // small canvas cube env for shine on platters
  const ec = document.createElement('canvas'); ec.width = ec.height = 64; const eg = ec.getContext('2d');
  const gr = eg.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, '#e8f0ff'); gr.addColorStop(.5, '#6a7890'); gr.addColorStop(1, '#202838'); eg.fillStyle = gr; eg.fillRect(0, 0, 64, 64);
  const env = new THREE.CubeTexture([ec, ec, ec, ec, ec, ec]); env.needsUpdate = true;

  // ===== Drive (x≈0) =====
  const dr = new THREE.Group(); scene.add(dr);
  const caseM = Mat({ color: 0x5a606c, shininess: 60 });
  const base = new THREE.Mesh(new RoundedBoxGeometry(9, .6, 11.5, 3, .25), caseM); base.position.set(.6, -.4, .6); dr.add(base);
  // platters: 2 stacked, with sector texture
  const pc = document.createElement('canvas'); pc.width = pc.height = 256; const pg = pc.getContext('2d');
  pg.fillStyle = '#9aa4b8'; pg.fillRect(0, 0, 256, 256);
  for (let r = 40; r < 128; r += 6) { pg.strokeStyle = r % 12 ? '#8a94aa' : '#b0b8cc'; pg.lineWidth = 2; pg.beginPath(); pg.arc(128, 128, r, 0, 6.3); pg.stroke(); }
  pg.strokeStyle = '#7a849a'; pg.lineWidth = 3; pg.beginPath(); pg.moveTo(128, 128); pg.lineTo(256, 128); pg.stroke();
  const ptex = new THREE.CanvasTexture(pc);
  const platM = new THREE.MeshPhongMaterial({ map: ptex, shininess: 160, specular: 0xffffff, envMap: env, reflectivity: .35 });
  const coatM = new THREE.MeshPhongMaterial({ color: 0x6040c0, emissive: 0x6030ff, emissiveIntensity: 0, transparent: true, opacity: 0, depthWrite: false });
  const platters = [];
  [0.45, 1.35].forEach(y => {
    const g = new THREE.Group(); g.position.set(0, y, 0); dr.add(g);
    const p = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, .14, 72), [new THREE.MeshPhongMaterial({ color: 0xa0a8bc, shininess: 120 }), platM, platM]); g.add(p);
    const coat = new THREE.Mesh(new THREE.RingGeometry(1.0, 3.58, 64), coatM); coat.rotation.x = -Math.PI / 2; coat.position.y = .075; g.add(coat);
    platters.push(g);
  });
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(.75, .75, 1.6, 32), Mat({ color: 0xd0d4dc, shininess: 160 })); hub.position.y = .9; dr.add(hub);
  const hubTop = new THREE.Mesh(new THREE.CylinderGeometry(.35, .35, .1, 6), Mat({ color: 0x404650 })); hubTop.position.y = 1.72; dr.add(hubTop);
  // actuator arm pivot at (4.6, *, -3.6)
  const PIV = V(4.6, 0, -3.6);
  const armG = new THREE.Group(); armG.position.copy(PIV); dr.add(armG);
  const armM = Mat({ color: 0xc8ccd4, shininess: 140 });
  const pivot = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, 2.0, 24), armM); pivot.position.y = .9; armG.add(pivot);
  const ARM_L = 5.6;
  const arm = new THREE.Mesh(new RoundedBoxGeometry(ARM_L, .12, .55, 2, .05), armM); arm.position.set(-ARM_L / 2, 1.55, 0); armG.add(arm);
  const tipHead = new THREE.Mesh(new RoundedBoxGeometry(.4, .16, .3, 2, .04), Mat({ color: 0x303640, emissive: 0x40c0ff, emissiveIntensity: .2 })); tipHead.position.set(-ARM_L, 1.47, 0); armG.add(tipHead);
  // voice coil behind pivot + magnets
  const coilM = Mat({ color: 0xc07030, emissive: 0xff8020, emissiveIntensity: 0, shininess: 120 });
  const coil = new THREE.Mesh(new THREE.TorusGeometry(.65, .16, 10, 24), coilM); coil.rotation.x = Math.PI / 2; coil.position.set(1.3, 1.0, 0); armG.add(coil);
  const mag = new THREE.Mesh(new RoundedBoxGeometry(2.6, .3, 2.6, 2, .1), Mat({ color: 0x707888, shininess: 100 })); mag.position.set(PIV.x + .9, 1.55, PIV.z - .5); dr.add(mag);
  const mag2 = mag.clone(); mag2.position.y = .35; dr.add(mag2);
  // signal pulses along arm (step 5)
  const sigM = new THREE.MeshBasicMaterial({ color: 0x50e0ff, transparent: true, opacity: 0 });
  const sigs = [0, 1, 2, 3].map(i => { const s = new THREE.Mesh(new THREE.SphereGeometry(.12, 10, 8), sigM); armG.add(s); return { s, o: i / 4 }; });
  // airflow streaks over platter (spin)
  const streakM = new THREE.MeshBasicMaterial({ color: 0xb0e0ff, transparent: true, opacity: 0, depthWrite: false });
  const streaks = [];
  for (let k = 0; k < 6; k++) { const s = new THREE.Mesh(new THREE.TorusGeometry(2.0 + k * .28, .025, 6, 40, 1.2), streakM); s.rotation.x = -Math.PI / 2; s.position.y = 1.55; dr.add(s); streaks.push(s); }

  // ===== Close-up (x = 22): head slider over a moving track of magnetic patches =====
  const cl = new THREE.Group(); cl.position.set(22, 1, 0); scene.add(cl);
  const surf = new THREE.Mesh(new RoundedBoxGeometry(12, .5, 3.2, 2, .08), new THREE.MeshPhongMaterial({ color: 0x8a92a6, shininess: 120 })); surf.position.y = -.4; cl.add(surf);
  const bitsG = new THREE.Group(); cl.add(bitsG);
  const N = 18, W = .62;
  const nM = Mat({ color: 0xff4050, emissive: 0xff2030, emissiveIntensity: .3 }), sM = Mat({ color: 0x4080ff, emissive: 0x2050ff, emissiveIntensity: .3 });
  const bits = [];
  const pat = [1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0, 0, 1, 0, 1, 0, 0];
  for (let k = 0; k < N; k++) {
    const g = new THREE.Group(); bitsG.add(g);
    const v = pat[k];
    const b = new THREE.Mesh(new RoundedBoxGeometry(W - .06, .14, 1.6, 2, .03), v ? nM : sM); g.add(b);
    const ar = new THREE.Mesh(new THREE.ConeGeometry(.12, .34, 10), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 })); ar.rotation.z = v ? -Math.PI / 2 : Math.PI / 2; ar.position.y = .2; g.add(ar);
    bits.push({ g, b, ar, v, k });
  }
  // slider + suspension
  const slider = new THREE.Mesh(new RoundedBoxGeometry(2.0, .5, 1.6, 2, .08), Mat({ color: 0x353a46, shininess: 100 })); slider.position.y = 1.0; cl.add(slider);
  const gapM = Mat({ color: 0x50d0ff, emissive: 0x40c0ff, emissiveIntensity: .8 });
  const gap = new THREE.Mesh(new THREE.BoxGeometry(.12, .1, 1.2), gapM); gap.position.set(.6, .72, 0); cl.add(gap);
  const susp = new THREE.Mesh(new RoundedBoxGeometry(5, .1, .6, 2, .04), armM); susp.position.set(2.2, 1.45, 0); susp.rotation.z = .12; cl.add(susp);
  // air cushion
  const airM = new THREE.MeshBasicMaterial({ color: 0x90e8ff, transparent: true, opacity: 0, depthWrite: false });
  const air = [];
  for (let k = 0; k < 12; k++) { const a = new THREE.Mesh(new THREE.BoxGeometry(.5, .02, .05), airM); cl.add(a); air.push({ a, o: k / 12, z: -.6 + (k % 4) * .4 }); }
  // field lines (read) — rings above bits
  const fieldM = new THREE.MeshBasicMaterial({ color: 0xffe060, transparent: true, opacity: 0, depthWrite: false });
  const field = new THREE.Mesh(new THREE.TorusGeometry(.35, .03, 6, 24, Math.PI), fieldM); field.position.set(.6, .25, 0); cl.add(field);
  // waveform (read signal) — small boxes above slider
  const waveM = new THREE.MeshBasicMaterial({ color: 0x50e0ff, transparent: true, opacity: 0 });
  const wave = []; for (let k = 0; k < 24; k++) { const w = new THREE.Mesh(new THREE.BoxGeometry(.14, 1, .14), waveM); w.position.set(-1.6 + k * .18, 2.6, 0); cl.add(w); wave.push(w); }

  const shots = [
    [[6.5, 8.5, 9.5], [.6, .8, 0]],          // 0 hook: whole drive spinning
    [[-4.5, 3.8, 6.5], [0, 1.0, 0]],         // 1 platters
    [[24.5, 2.2, 6.5], [22, 1.2, 0]],        // 2 head floats (close)
    [[20.5, 4.6, 6.5], [21.5, .6, 0]],       // 3 bits
    [[9.5, 9.5, 2.5], [3.0, 1.0, -1.5]],     // 4 arm swings
    [[22, 3.5, 8.5], [22, 1.6, 0]],          // 5 read signal
    [[5.5, 10, 11], [.8, .6, 0]],            // 6 recap
  ];
  const cp = { p: V(), q: V() };
  function update(t, si, lt, sd) {
    const pulse = .5 + .5 * Math.sin(t * 6);
    platters.forEach(p => p.rotation.y = -t * 6);
    hubTop.rotation.y = -t * 6;
    streakM.opacity = (si === 0 || si === 6) ? .45 : .15;
    streaks.forEach((s, k) => { s.rotation.z = t * 6 + k * 1.1; });
    coatM.opacity = si === 1 ? .55 * ss(0, 1, lt) * (.7 + .3 * pulse) : 0; coatM.emissiveIntensity = .8;
    // arm angle: sweeps tracks; big swings in step 4
    let ang = .25 + Math.sin(t * .7) * .05;
    if (si === 4) ang = .25 + Math.sin(lt * 3.2) * .18;
    armG.rotation.y = ang;
    coilM.emissiveIntensity = si === 4 ? .6 + .6 * pulse : .05;
    sigs.forEach(s => { const k = (t * 1.5 + s.o) % 1; s.s.position.set(-ARM_L + k * (ARM_L + 1.0), 1.65, 0); });
    sigM.opacity = si === 5 || si === 6 ? 1 : 0;
    tipHead.material.emissiveIntensity = si === 5 ? .4 + .8 * pulse : .2;
    // close-up: bits stream past
    const speed = 1.6, span = N * W;
    bits.forEach(b => {
      let x = ((b.k * W - t * speed) % span + span) % span - span / 2;
      b.g.position.set(x, -.08, 0);
      b.ar.material.opacity = si === 3 || si === 5 ? 1 : 0;
      const near = Math.abs(x - .6) < W / 2;
      b.b.material.emissiveIntensity = .3;
      if (near && si === 5) { fieldM.color.set(b.v ? 0xff6070 : 0x60a0ff); }
    });
    const showBits = si >= 2 ? 1 : 0; bitsG.visible = showBits > 0;
    slider.position.y = 1.0 + Math.sin(t * 9) * .02;
    air.forEach(a => { const k = (t * 1.8 + a.o) % 1; a.a.position.set(1.4 - k * 2.8, .66, a.z); });
    airM.opacity = si === 2 ? .9 : si === 3 ? .3 : 0;
    gapM.emissiveIntensity = si === 2 || si === 5 ? .6 + .6 * pulse : .4;
    fieldM.opacity = si === 5 ? .9 : 0; field.rotation.y = 0;
    wave.forEach((w, k) => { const x = k * .4 - t * 4; const v = Math.sign(Math.sin(x)) * .5 + .5; w.scale.y = .2 + v * 1.2; w.position.y = 2.4 + w.scale.y / 2; });
    waveM.opacity = si === 5 ? 1 : 0;
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
