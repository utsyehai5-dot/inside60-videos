// Inside 60 — Fingerprint sensor. Steps: 0 hook (finger on pad), 1 grid of capacitor plates, 2 ridges touch / valleys gap (cross-section),
// 3 plates build a charge map, 4 key points matched with saved print, 5 phone unlocks, 6 recap
export async function setup({ THREE, scene, camera }) {
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const ss = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x555555, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x101a2e); scene.fog = new THREE.Fog(0x101a2e, 30, 80);
  scene.add(new THREE.HemisphereLight(0xf4f6ff, 0x40404c, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.9); key.position.set(5, 10, 9); scene.add(key);
  const rim = new THREE.DirectionalLight(0xa0c8ff, .8); rim.position.set(-6, 2, -6); scene.add(rim);

  // fingerprint pattern (loop/whorl): ridge value in [-1,1] for coords in [-1,1]
  const ridge = (x, y) => { const r = Math.sqrt(x * x * 1.0 + (y + .15) * (y + .15) * .7); const a = Math.atan2(y, x); return Math.sin(r * 34 + Math.sin(a * 2) * 1.2); };
  const printCanvas = (fg, bg) => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); const im = g.createImageData(256, 256);
    for (let j = 0; j < 256; j++) for (let i = 0; i < 256; i++) { const x = i / 128 - 1, y = 1 - j / 128; const inside = x * x / .64 + y * y / .92 < 1; const v = inside && ridge(x, y) > 0;
      const col = v ? fg : bg; const o = (j * 256 + i) * 4; im.data[o] = col[0]; im.data[o + 1] = col[1]; im.data[o + 2] = col[2]; im.data[o + 3] = 255; }
    g.putImageData(im, 0, 0); return new THREE.CanvasTexture(c); };

  // ===== A: sensor pad + finger (origin) =====
  const body = new THREE.Mesh(new RoundedBoxGeometry(5.2, .5, 5.2, 3, .2), Mat({ color: 0x2a2f3c })); body.position.y = -.25; scene.add(body);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.85, .12, 12, 48), Mat({ color: 0xc8d0e0, shininess: 140 })); ring.rotation.x = -Math.PI / 2; ring.position.y = .08; scene.add(ring);
  const capM = Mat({ color: 0x5a6478, transparent: true, opacity: 1, shininess: 140 });
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, .12, 48), capM); cap.position.y = .06; scene.add(cap);
  const N = 24, plates = new THREE.InstancedMesh(new THREE.BoxGeometry(.11, .05, .11), Mat({ color: 0xffffff, emissive: 0x111111 }), N * N);
  const pc = []; { const m = new THREE.Matrix4(); let k = 0;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const x = (i - (N - 1) / 2) * .135, z = (j - (N - 1) / 2) * .135; m.makeTranslation(x, .0, z); plates.setMatrixAt(k, m);
      const inPrint = (x / 1.25) ** 2 / .64 + (z / 1.25) ** 2 / .92 < 1; pc.push({ x, z, v: inPrint ? ridge(x / 1.25, -z / 1.25) : -1, inPrint }); plates.setColorAt(k, new THREE.Color(0x707a90)); k++; } }
  scene.add(plates);
  const skin = Mat({ color: 0xe8a888, shininess: 30 });
  const finger = new THREE.Group(); scene.add(finger);
  const fz = new THREE.Mesh(new THREE.CapsuleGeometry(.95, 3.6, 8, 24), skin); fz.rotation.x = Math.PI / 2; fz.position.z = 2.0; finger.add(fz);
  const nail = new THREE.Mesh(new THREE.SphereGeometry(.7, 20, 12), Mat({ color: 0xf6d6cc, shininess: 120 })); nail.scale.set(1, .3, 1.2); nail.position.set(0, .9, .6); finger.add(nail);
  const glowM = new THREE.MeshBasicMaterial({ color: 0x40d0ff, transparent: true, opacity: 0, depthWrite: false });
  const glow = new THREE.Mesh(new THREE.RingGeometry(1.9, 2.3, 48), glowM); glow.rotation.x = -Math.PI / 2; glow.position.y = .1; scene.add(glow);

  // ===== B: cross-section (x = 22) =====
  const B = new THREE.Group(); B.position.set(22, 0, 0); scene.add(B);
  const NP = 14, bp = [], bpM = [];
  for (let i = 0; i < NP; i++) { const m = Mat({ color: 0x8090a8, emissive: 0x000000 }); const p = new THREE.Mesh(new RoundedBoxGeometry(.5, .25, 1.6, 2, .05), m); p.position.set((i - (NP - 1) / 2) * .62, 0, 0); B.add(p); bp.push(p); bpM.push(m); }
  { const bb = new THREE.Mesh(new THREE.BoxGeometry(9.6, .3, 2), Mat({ color: 0x30384a })); bb.position.y = -.3; B.add(bb); }
  // wavy skin: ridge period = 2 plates
  const sh = new THREE.Shape(); const W = 4.6, per = 1.24; sh.moveTo(-W, 1.9);
  for (let k = 0; k <= 200; k++) { const x = -W + 2 * W * k / 200; sh.lineTo(x, .14 + (1 - Math.cos((x + .31) / per * Math.PI * 2)) * .4); }
  sh.lineTo(W, 1.9); sh.lineTo(-W, 1.9);
  const sk = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 1.6, bevelEnabled: false }), Mat({ color: 0xe8a888, shininess: 30 })); sk.position.z = -.8; B.add(sk);
  const ridgeAt = x => (1 - Math.cos((x + .31) / per * Math.PI * 2)) < .5;
  const sparkM = new THREE.MeshBasicMaterial({ color: 0xffe040, transparent: true, opacity: 0 });
  const sparks = bp.map(p => { const s = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .3, 6), sparkM); s.position.set(p.position.x, .3, .85); B.add(s); return s; });

  // ===== C: compare (x = -22) =====
  const C = new THREE.Group(); C.position.set(-22, 2.2, 0); scene.add(C);
  const liveT = printCanvas([255, 210, 60], [30, 40, 70]), saveT = printCanvas([120, 220, 255], [20, 30, 50]);
  const panel = (t, x) => { const g = new THREE.Group(); g.position.x = x; C.add(g); g.add(new THREE.Mesh(new RoundedBoxGeometry(3.2, 3.8, .2, 2, .1), Mat({ color: 0x1a1d24 })));
    const p = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 3.5), new THREE.MeshBasicMaterial({ map: t })); p.position.z = .11; g.add(p); return g; };
  panel(liveT, -1.9); panel(saveT, 1.9);
  const pts = [[.2, .55], [-.45, .2], [.5, -.3], [-.2, -.7], [.05, .05], [-.6, -.35]];
  const mkM = new THREE.MeshBasicMaterial({ color: 0x40ff90, transparent: true, opacity: 0, depthWrite: false });
  const marks = []; pts.forEach(([u, v]) => [-1.9, 1.9].forEach(x0 => { const m = new THREE.Mesh(new THREE.RingGeometry(.13, .19, 20), mkM); m.position.set(x0 + u * 1.45, v * 1.75, .14); C.add(m); marks.push(m); }));
  const lnM = new THREE.MeshBasicMaterial({ color: 0x40ff90, transparent: true, opacity: 0 });
  const lines = pts.map(([u, v]) => { const l = new THREE.Mesh(new THREE.BoxGeometry(1, .04, .02), lnM); C.add(l); return { l, u, v }; });

  // ===== D: phone unlock (x = -44) =====
  const P = new THREE.Group(); P.position.set(-44, 2.3, 0); scene.add(P);
  P.add(new THREE.Mesh(new RoundedBoxGeometry(2.6, 5.0, .3, 4, .3), Mat({ color: 0x20242e })));
  const scrM = Mat({ color: 0x1a2a50, emissive: 0x203070, emissiveIntensity: .6 });
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 4.6), scrM); scr.position.z = .16; P.add(scr);
  const lockM = Mat({ color: 0xffffff, emissive: 0x888888 });
  const lockB = new THREE.Mesh(new RoundedBoxGeometry(.9, .7, .1, 2, .08), lockM); lockB.position.set(0, .2, .2); P.add(lockB);
  const shackle = new THREE.Mesh(new THREE.TorusGeometry(.3, .07, 10, 24, Math.PI), lockM); shackle.position.set(0, .55, .2); P.add(shackle);
  const fpM = new THREE.MeshBasicMaterial({ map: printCanvas([90, 200, 255], [26, 42, 80]), transparent: true, opacity: .9 });
  const fp = new THREE.Mesh(new THREE.CircleGeometry(.4, 32), fpM); fp.position.set(0, -1.5, .18); P.add(fp);
  const okM = new THREE.MeshBasicMaterial({ color: 0x40ff90, transparent: true, opacity: 0, depthWrite: false });
  const ok = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.15, 40), okM); ok.position.set(0, .3, .2); P.add(ok);

  const shots = [
    [[5.5, 7.0, 12.0], [0, .6, .5]],           // 0 finger on pad
    [[0, 6.5, 4.2], [0, 0, 0]],                // 1 grid (cap fades)
    [[22, 1.6, 10.5], [22, .7, 0]],            // 2 cross-section
    [[0, 7.5, 1.6], [0, 0, .1]],               // 3 map (top-down)
    [[-22, 2.2, 13.5], [-22, 2.2, 0]],          // 4 compare
    [[-44, 2.3, 11.0], [-44, 2.3, 0]],          // 5 phone
    [[5.5, 7.0, 12.0], [0, .6, .5]],           // 6 recap
  ];
  const cp = { p: V(), q: V() }; const tmpC = new THREE.Color();
  function update(t, si, lt, sd) {
    const pulse = .5 + .5 * Math.sin(t * 6); const D = sd || 5;
    // finger presses in hook/recap, lifts away for grid/map
    const press = si === 0 ? ss(.3, 1.4, lt) : si === 6 ? .5 + .5 * Math.sin(t * 2) : 0;
    const away = si === 1 || si === 3 ? 1 : 0;
    finger.position.set(0, lerp(2.2, 1.0, press) + away * 6, .6 - away * 2); finger.rotation.x = -.12;
    glowM.opacity = (si === 0 || si === 6) ? press * (.5 + .4 * pulse) : 0;
    capM.opacity = si === 1 ? lerp(1, .12, ss(0, 1.2, lt)) : si === 3 ? .12 : 1; capM.depthWrite = capM.opacity > .9;
    // plates: neutral in step 1 (sweep), charge map in step 3
    for (let k = 0; k < pc.length; k++) { const c = pc[k];
      if (si === 3 || si === 4 || si === 5) { const rev = ss(-1.4, 1.4, (lt * 1.2 - 1.2) * 1.3 - c.z * .6); const on = si === 3 ? rev : 1;
        if (!c.inPrint) tmpC.set(0x404a60); else tmpC.set(c.v > 0 ? 0xffd040 : 0x2050c0); tmpC.lerp(new THREE.Color(0x707a90), 1 - on); }
      else if (si === 1) { const w = Math.sin(t * 4 - (c.x + c.z) * 2) > .8; tmpC.set(w ? 0x60e0ff : 0x8090a8); }
      else tmpC.set(0x707a90);
      plates.setColorAt(k, tmpC); }
    plates.instanceColor.needsUpdate = true;
    // cross-section: ridge plates glow
    bp.forEach((p, i) => { const r = ridgeAt(p.position.x); const on = si === 2 ? ss(.8, 2.0, lt) : 0;
      bpM[i].emissive.set(r ? 0xffc020 : 0x1040a0); bpM[i].emissiveIntensity = on * (r ? .6 + .3 * pulse : .5); });
    sparks.forEach((s, i) => { s.visible = ridgeAt(bp[i].position.x); });
    sparkM.opacity = si === 2 ? ss(.8, 2.0, lt) * (.4 + .6 * pulse) : 0;
    // compare: markers then lines
    mkM.opacity = si === 4 ? ss(.4, 1.4, lt) : 0;
    lines.forEach(({ l, u, v }, k) => { const g = si === 4 ? ss(1.6 + k * .25, 2.2 + k * .25, lt) : 0; const x0 = -1.9 + u * 1.45, x1 = 1.9 + u * 1.45;
      l.scale.x = Math.max(.001, (x1 - x0) * g); l.position.set(x0 + (x1 - x0) * g / 2, v * 1.75, .15); });
    lnM.opacity = si === 4 ? .9 : 0;
    // phone unlock
    const un = si === 5 ? ss(1.0, 1.8, lt) : 0;
    shackle.position.y = .55 + un * .35; shackle.rotation.y = un * .9;
    lockM.color.set(un > .5 ? 0x60ff9a : 0xffffff); okM.opacity = un * (.7 + .3 * pulse); ok.scale.setScalar(1 + un * .15);
    scrM.emissive.set(un > .5 ? 0x208050 : 0x203070); fpM.opacity = si === 5 ? lerp(.95, .3, un) : .9;
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
