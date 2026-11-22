// Inside 60 — Barcode scanner. Steps: 0 hook (1974), 1 red beam sweeps, 2 black absorbs / white reflects, 3 sensor -> signal, 4 widths -> 12 digits, 5 lookup price + beep, 6 recap
export async function setup({ THREE, scene, camera }) {
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const ss = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x555555, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x14203a); scene.fog = new THREE.Fog(0x14203a, 30, 70);
  scene.add(new THREE.HemisphereLight(0xf4f6ff, 0x40404c, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.9); key.position.set(5, 9, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0xa0c8ff, .7); rim.position.set(-6, -2, -6); scene.add(rim);

  // counter
  const counter = new THREE.Mesh(new RoundedBoxGeometry(16, .5, 8, 2, .15), Mat({ color: 0x5a6070, shininess: 30 })); counter.position.y = -.25; scene.add(counter);
  // product box with barcode label on its front (z+)
  const box = new THREE.Group(); box.position.set(0, 1.6, 0); scene.add(box);
  box.add(new THREE.Mesh(new RoundedBoxGeometry(4.2, 3.2, 1.6, 3, .12), Mat({ color: 0x2fa36b })));
  const stripe = new THREE.Mesh(new RoundedBoxGeometry(4.22, .5, 1.62, 2, .1), Mat({ color: 0xffd040 })); stripe.position.y = 1.1; box.add(stripe);
  const label = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.9), Mat({ color: 0xffffff, shininess: 10 })); label.position.set(0, -.3, .81); box.add(label);
  // bars
  const rnd = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(11);
  const bars = []; let x = -1.4; const barM = new THREE.MeshPhongMaterial({ color: 0x0a0a0e, shininess: 5 });
  const segs = []; // [x0, x1, black]
  while (x < 1.35) { const w = .04 + Math.floor(rnd() * 4) * .035; const gap = .04 + Math.floor(rnd() * 3) * .035; const b = new THREE.Mesh(new THREE.PlaneGeometry(w, 1.35), barM); b.position.set(x + w / 2, -.15, .815); box.add(b); bars.push(b); segs.push([x, x + w, 1]); segs.push([x + w, x + w + gap, 0]); x += w + gap; }
  const BX0 = -1.4, BX1 = x;
  // digit strip under bars (canvas)
  const digits = '036000291452';
  const dcv = document.createElement('canvas'); dcv.width = 512; dcv.height = 64; const dg = dcv.getContext('2d');
  dg.fillStyle = '#fff'; dg.fillRect(0, 0, 512, 64); dg.fillStyle = '#111'; dg.font = 'bold 44px monospace'; dg.textAlign = 'center';
  [...digits].forEach((d, i) => dg.fillText(d, 30 + i * 41, 50));
  const dl = new THREE.Mesh(new THREE.PlaneGeometry(2.9, .36), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(dcv) })); dl.position.set(0, -1.0, .816); box.add(dl);

  // scanner (generic handheld) aimed at the label
  const sc = new THREE.Group(); sc.position.set(2.9, 2.3, 3.1); sc.rotation.y = Math.atan2(2.9, 2.3); scene.add(sc);
  const scM = Mat({ color: 0x2c303a, shininess: 60 });
  const head = new THREE.Mesh(new RoundedBoxGeometry(2.0, 1.1, 1.0, 3, .25), scM); sc.add(head);
  const handle = new THREE.Mesh(new RoundedBoxGeometry(.7, 1.9, .8, 3, .25), scM); handle.position.set(0, -1.2, .5); handle.rotation.x = .45; sc.add(handle);
  const winM = Mat({ color: 0x500810, emissive: 0xff2030, emissiveIntensity: .4 });
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.6, .6), winM); win.position.z = -.51; win.rotation.y = Math.PI; sc.add(win);
  const sensorM = Mat({ color: 0x103018, emissive: 0x40ff80, emissiveIntensity: .1 });
  const sensor = new THREE.Mesh(new THREE.SphereGeometry(.12, 12, 8), sensorM); sensor.position.set(.55, 0, -.5); sc.add(sensor);
  sc.updateMatrixWorld(true); const srcW = sc.localToWorld(V(0, 0, -.55));
  const labelZ = .82;
  // beam: a thin fan (triangle) from scanner window to label line + red line on label
  const beamGeo = new THREE.BufferGeometry(); beamGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Array(9).fill(0), 3));
  const beamM = new THREE.MeshBasicMaterial({ color: 0xff2030, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
  scene.add(new THREE.Mesh(beamGeo, beamM));
  const dot = new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff4050, transparent: true, opacity: 0 })); scene.add(dot);
  const lineM = new THREE.MeshBasicMaterial({ color: 0xff3040, transparent: true, opacity: 0 });
  const laserLine = new THREE.Mesh(new THREE.PlaneGeometry(1, .035), lineM); laserLine.position.set(0, 1.6 - .15, labelZ + .01); scene.add(laserLine);
  // reflected sparks
  const sparks = [];
  for (let i = 0; i < 14; i++) { const m = new THREE.MeshBasicMaterial({ color: 0xffe0e0, transparent: true, opacity: 0, depthWrite: false }); const s = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), m); scene.add(s); sparks.push({ s, m, o: i / 14 }); }
  // signal waveform panel above box
  const sigPts = []; segs.forEach(([a, b, k]) => { sigPts.push(V(a * 1.4, k ? -.35 : .35, 0), V(b * 1.4, k ? -.35 : .35, 0)); });
  const sigGeo = new THREE.BufferGeometry().setFromPoints(sigPts);
  const sigM = new THREE.LineBasicMaterial({ color: 0x40ff90, transparent: true, opacity: 0 });
  const sig = new THREE.Line(sigGeo, sigM); sig.position.set(0, 5.0, 0); scene.add(sig);
  const sigBg = new THREE.Mesh(new RoundedBoxGeometry(4.6, 1.2, .1, 2, .05), new THREE.MeshPhongMaterial({ color: 0x0c1a14, transparent: true, opacity: 0 })); sigBg.position.set(0, 5.0, -.1); scene.add(sigBg);
  // digit cubes
  const dCubes = [...digits].map((d, i) => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#ffd040'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#101010'; g.font = 'bold 96px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(d, 64, 70); const m = new THREE.MeshPhongMaterial({ map: new THREE.CanvasTexture(c), transparent: true, opacity: 0 }); const cube = new THREE.Mesh(new RoundedBoxGeometry(.36, .36, .36, 2, .05), m); cube.position.set(-2.31 + i * .42, 4.0, 1.2); scene.add(cube); return { cube, m }; });
  // register screen
  const scr = new THREE.Group(); scr.position.set(-4.6, 2.4, -.5); scr.rotation.y = .45; scene.add(scr);
  scr.add(new THREE.Mesh(new RoundedBoxGeometry(3.2, 2.2, .3, 2, .1), Mat({ color: 0x30343e })));
  const pc = document.createElement('canvas'); pc.width = 512; pc.height = 320; const pg = pc.getContext('2d');
  pg.fillStyle = '#0a2a1a'; pg.fillRect(0, 0, 512, 320); pg.fillStyle = '#60ffa0'; pg.font = 'bold 54px sans-serif'; pg.textAlign = 'center'; pg.fillText('GUM', 256, 120); pg.font = 'bold 110px sans-serif'; pg.fillText('$0.99', 256, 260);
  const pM = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(pc), transparent: true, opacity: .1 });
  const pScr = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 1.85), pM); pScr.position.z = .16; scr.add(pScr);
  const beepM = new THREE.MeshBasicMaterial({ color: 0x60ffa0, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
  const beeps = [0, 1, 2].map(i => { const r = new THREE.Mesh(new THREE.RingGeometry(.9, 1.0, 48), beepM.clone()); r.position.copy(scr.position); r.position.y += .2; r.position.z += .4; scene.add(r); return { r, o: i / 3 }; });

  const shots = [
    [[-2, 4.5, 13.5], [1.3, 1.9, 1]],
    [[-1, 5, 11.5], [1.4, 2, 1.6]],
    [[1.2, 2.4, 6], [0, 1.4, .8]],
    [[5, 4.8, 11], [1.8, 3.3, 1.6]],
    [[0, 4.6, 12.5], [0, 4.4, 0]],
    [[-1, 4, 10], [-3, 2.4, 0]],
    [[-3.5, 5.5, 14], [1.2, 2.2, 1]],
  ];
  const cp = { p: V(), q: V() };
  const segAt = lx => { for (const s of segs) if (lx >= s[0] && lx < s[1]) return s[2]; return 0; };
  function update(t, si, lt) {
    const pulse = .5 + .5 * Math.sin(t * 6);
    const beamOn = si >= 1 && si <= 3 || si === 6 ? 1 : si === 0 ? .8 : 0;
    // sweep point along the bars
    const u = .5 + .5 * Math.sin(t * (si === 2 ? 1.2 : 2.4));
    const lx = lerp(BX0 - .1, BX1 + .1, u);
    const hit = V(lx, 1.6 - .15, labelZ + .02);
    const p = beamGeo.attributes.position;
    p.setXYZ(0, srcW.x - .2, srcW.y, srcW.z + .25); p.setXYZ(1, srcW.x + .2, srcW.y, srcW.z - .25); p.setXYZ(2, hit.x, hit.y, hit.z); p.needsUpdate = true;
    beamM.opacity = .35 * beamOn;
    dot.position.copy(hit); dot.material.opacity = beamOn;
    laserLine.scale.x = (BX1 - BX0 + .4); laserLine.position.x = (BX0 + BX1) / 2; lineM.opacity = (si === 1 || si === 0 || si === 6) ? .9 * beamOn : .5 * beamOn;
    winM.emissiveIntensity = beamOn ? .7 + .3 * pulse : .15;
    // reflections from white gaps travel back to the sensor (step 2,3)
    const white = segAt(lx) === 0;
    sparks.forEach(s => { const k = (t * 1.6 + s.o) % 1; const from = V(lerp(BX0, BX1, (Math.sin(t * 1.2 - s.o * 3) * .5 + .5)), 1.45, labelZ + .02); const lxs = from.x; const w = segAt(lxs) === 0; s.s.position.copy(from.lerp(sc.localToWorld(sensor.position.clone()), k)); s.m.opacity = (si === 2 || si === 3) && w ? .9 * (1 - k) : 0; });
    sensorM.emissiveIntensity = (si === 2 || si === 3) ? (white ? 1.2 : .1) : .1;
    // signal
    const sOn = si === 3 || si === 4 ? 1 : 0;
    sigM.opacity = sOn * ss(.4, 1.2, si === 3 ? lt : 9); sigBg.material.opacity = .85 * sigM.opacity;
    sig.position.y = si === 4 ? 5.4 : 5.0; sigBg.position.y = sig.position.y;
    // digits
    dCubes.forEach((d, i) => { const k = si === 4 ? ss(.3 + i * .18, .7 + i * .18, lt) : si === 5 ? 1 - ss(0, .8, lt) : 0; d.m.opacity = k; d.cube.rotation.y = (1 - k) * 3; d.cube.position.y = 4.0 - (1 - k) * .8; });
    // price + beep
    pM.opacity = si >= 5 ? .1 + .9 * ss(.8, 1.6, si === 5 ? lt : 9) : .12;
    beeps.forEach(b => { const k = (t * 1.2 + b.o) % 1; b.r.scale.setScalar(.6 + k * 2.2); b.r.material.opacity = si === 5 && lt > 1.6 ? .7 * (1 - k) : 0; b.r.lookAt(camera.position); });
    // camera
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const kk = si === 0 ? 1 : ease(lt / 1.4);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], kk))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], kk)));
    const o = Math.sin(t * .2) * .08, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o));
    camera.lookAt(cp.q);
  }
  return { update };
}
