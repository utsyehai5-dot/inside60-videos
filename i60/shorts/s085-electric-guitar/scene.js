// Inside 60 — Electric guitar. Steps: 0 hook (silent body, magnets), 1 steel strings, 2 pickup magnets + coil,
// 3 vibrating string induces voltage, 4 waveform copies the note, 5 cable to amplifier, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x1c1830); scene.fog = new THREE.Fog(0x1c1830, 30, 80);
  scene.add(new THREE.HemisphereLight(0xf4f8ff, 0x404050, 1.4));
  const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(4, 10, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0xff90c0, .5); rim.position.set(-6, 4, -8); scene.add(rim);

  // guitar lies along x, face toward +z (slightly tilted toward camera)
  const gtr = new THREE.Group(); scene.add(gtr); gtr.rotation.x = -.15;
  const bodyM = Mat({ color: 0xd8302a, shininess: 120, specular: 0x888888 });
  const bs = new THREE.Shape();
  bs.moveTo(-2.6, 0); bs.bezierCurveTo(-2.6, 1.9, -1.2, 2.0, -.6, 1.3); bs.bezierCurveTo(-.2, .9, .3, 1.1, .7, 1.5);
  bs.bezierCurveTo(1.4, 2.1, 1.9, 1.4, 1.5, .7); bs.bezierCurveTo(1.3, .3, 1.3, -.3, 1.5, -.7);
  bs.bezierCurveTo(1.9, -1.6, 1.0, -2.0, .4, -1.5); bs.bezierCurveTo(-.2, -1.0, -.8, -1.3, -1.2, -1.8);
  bs.bezierCurveTo(-2.0, -2.2, -2.6, -1.6, -2.6, 0);
  const body = new THREE.Mesh(new THREE.ExtrudeGeometry(bs, { depth: .5, bevelEnabled: true, bevelSize: .08, bevelThickness: .08, bevelSegments: 3 }), bodyM); body.position.z = -.5; gtr.add(body);
  const guard = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.5, .03), Mat({ color: 0xf4f0e8 })); guard.position.set(-.5, -.25, .1); gtr.add(guard);
  const neckM = Mat({ color: 0xc89058, shininess: 30 });
  const neck = new THREE.Mesh(new THREE.BoxGeometry(6.0, .55, .25), neckM); neck.position.set(4.2, 0, .0); gtr.add(neck);
  const board = new THREE.Mesh(new THREE.BoxGeometry(6.0, .55, .06), Mat({ color: 0x3a2418, shininess: 20 })); board.position.set(4.2, 0, .15); gtr.add(board);
  for (let k = 0; k < 14; k++) { const f = new THREE.Mesh(new THREE.BoxGeometry(.03, .56, .04), Mat({ color: 0xd0d6de, shininess: 140 })); f.position.set(1.6 + k * .4 * Math.pow(.96, k), 0, .19); gtr.add(f); }
  const head = new THREE.Mesh(new THREE.BoxGeometry(1.3, .8, .2), neckM); head.position.set(7.8, .1, 0); gtr.add(head);
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(.3, .9, .15), Mat({ color: 0xb0b8c4, shininess: 140 })); bridge.position.set(-1.6, 0, .18); gtr.add(bridge);
  // knobs
  [[-1.9, -1.0], [-1.4, -1.25]].forEach(([x, y]) => { const k = new THREE.Mesh(new THREE.CylinderGeometry(.15, .15, .15, 18), Mat({ color: 0x202020 })); k.rotation.x = Math.PI / 2; k.position.set(x, y, .12); gtr.add(k); });
  const jack = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, .2, 14), Mat({ color: 0xb0b8c4, shininess: 140 })); jack.position.set(-2.62, -.6, 0); jack.rotation.z = Math.PI / 2; gtr.add(jack);

  // strings: 6 along x from bridge (-1.6) to nut (7.1)
  const SX0 = -1.6, SX1 = 7.15, SZ = .28;
  const sM = Mat({ color: 0xdde4ee, emissive: 0x000000, shininess: 160 });
  const strings = []; const NS = 40;
  for (let i = 0; i < 6; i++) {
    const yy = (i - 2.5) * .085; const pts = []; for (let k = 0; k <= NS; k++) pts.push(V(lerp(SX0, SX1, k / NS), yy, SZ));
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const ln = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xe8eef6 })); gtr.add(ln);
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(.012 + i * .003, .012 + i * .003, SX1 - SX0, 6), sM); tube.rotation.z = Math.PI / 2; tube.position.set((SX0 + SX1) / 2, yy, SZ); gtr.add(tube);
    strings.push({ ln, tube, yy, geo });
  }
  // pickups at x = 0.4 (neck) and -.9 (bridge)
  const pickM = Mat({ color: 0x23242a, emissive: 0x000000 });
  const pickups = [.45, -.9].map(x => { const p = new THREE.Mesh(new THREE.BoxGeometry(.32, .85, .12), pickM); p.position.set(x, 0, .16); gtr.add(p); return p; });
  const poleM = Mat({ color: 0x8090a0, emissive: 0x000000, shininess: 160 });
  pickups.forEach(p => { for (let i = 0; i < 6; i++) { const pl = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .03, 10), poleM); pl.rotation.x = Math.PI / 2; pl.position.set(p.position.x, (i - 2.5) * .085 * 1.4, .23); gtr.add(pl); } });

  // exploded pickup (big, beside guitar) — shown in steps 2-4
  const ex = new THREE.Group(); ex.position.set(.45, 3.1, .5); scene.add(ex);
  const magM = [Mat({ color: 0xff4050, emissive: 0xff2030, emissiveIntensity: .2 }), Mat({ color: 0x4070ff, emissive: 0x2040ff, emissiveIntensity: .2 })];
  const mags = []; for (let i = 0; i < 6; i++) { const g = new THREE.Group(); g.position.x = (i - 2.5) * .38; ex.add(g);
    const n = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, .5, 14), magM[0]); n.position.y = .25; g.add(n);
    const s = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, .5, 14), magM[1]); s.position.y = -.25; g.add(s); mags.push(g); }
  const coilM = Mat({ color: 0xd07030, emissive: 0xffa040, emissiveIntensity: 0, shininess: 140 });
  const coil = new THREE.Group(); ex.add(coil);
  for (let k = 0; k < 9; k++) { const c = new THREE.Mesh(new THREE.TorusGeometry(1, .035, 6, 40), coilM); c.scale.set(1.25, .28, 1); c.rotation.x = Math.PI / 2; c.position.y = -.35 + k * .085; coil.add(c); }
  // field lines (arcs above magnets) + big string above
  const fieldM = new THREE.MeshBasicMaterial({ color: 0x80e0ff, transparent: true, opacity: .6 });
  const fields = mags.map(g => { const f = new THREE.Mesh(new THREE.TorusGeometry(.32, .015, 6, 24, Math.PI), fieldM); f.position.set(g.position.x, .5, 0); f.rotation.y = Math.PI / 2; ex.add(f); return f; });
  const bigStrM = Mat({ color: 0xe8eef6, emissive: 0xffe040, emissiveIntensity: 0, shininess: 160 });
  const bigStr = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 3.2, 10), bigStrM); bigStr.rotation.z = Math.PI / 2; bigStr.position.y = 1.0; ex.add(bigStr);
  // electrons/current dots around coil
  const dots = []; for (let k = 0; k < 14; k++) { const d = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffe040 })); ex.add(d); dots.push(d); }

  // waveform (step 4), world space above guitar
  const WN = 120; const wPts = new Float32Array(WN * 3);
  const wGeo = new THREE.BufferGeometry(); wGeo.setAttribute('position', new THREE.BufferAttribute(wPts, 3));
  const wave = new THREE.Line(wGeo, new THREE.LineBasicMaterial({ color: 0xffe040 })); scene.add(wave);
  const waveTube = []; for (let k = 0; k < WN; k++) { const b = new THREE.Mesh(new THREE.SphereGeometry(.045, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffe040 })); scene.add(b); waveTube.push(b); }

  // cable + amp
  const ampG = new THREE.Group(); ampG.position.set(-1.0, -4.2, -.3); scene.add(ampG);
  const amp = new THREE.Mesh(new THREE.BoxGeometry(3, 2.6, 1.6), Mat({ color: 0x24262c, shininess: 30 })); ampG.add(amp);
  const grill = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.7, .05), Mat({ color: 0x5a4a3a, shininess: 5 })); grill.position.set(0, -.3, .81); ampG.add(grill);
  const coneM = Mat({ color: 0x15161a, emissive: 0xff8030, emissiveIntensity: 0 });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(.7, .4, 28, 1, true), coneM); cone.rotation.x = -Math.PI / 2; cone.position.set(0, -.3, .75); ampG.add(cone);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(2.6, .45, .05), Mat({ color: 0xd8c070 })); panel.position.set(0, .95, .81); ampG.add(panel);
  const led = new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 8), new THREE.MeshBasicMaterial({ color: 0x401010 })); led.position.set(1.0, .95, .86); ampG.add(led);
  const cableCurve = new THREE.CatmullRomCurve3([V(-2.75, -.65, 0), V(-3.3, -1.2, .4), V(-3.2, -2.4, .8), V(-2.8, -3.2, .8), V(-2.4, -3.6, .6)]);
  const cable = new THREE.Mesh(new THREE.TubeGeometry(cableCurve, 40, .06, 8), Mat({ color: 0x202228 })); scene.add(cable);
  const sig = []; for (let k = 0; k < 5; k++) { const d = new THREE.Mesh(new THREE.SphereGeometry(.12, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffe040 })); scene.add(d); sig.push(d); }
  const rings = []; for (let k = 0; k < 3; k++) { const r = new THREE.Mesh(new THREE.TorusGeometry(1, .04, 6, 40), new THREE.MeshBasicMaterial({ color: 0xff9040, transparent: true })); r.position.set(-1.0, -4.5, .7); scene.add(r); rings.push(r); }

  const shots = [
    [[-6.5, 2.6, 8], [1.5, -.2, 0]],    // 0 along the guitar
    [[4.5, 1.0, 4.5], [3.5, 0, 0]],     // 1 strings close on neck
    [[.4, 3.4, 8.5], [.4, 3.3, 0]],     // 2 exploded pickup
    [[1.6, 3.6, 8], [.4, 3.4, 0]],    // 3 induction
    [[.4, 3.9, 10], [.3, 3.9, 0]],     // 4 waveform
    [[-.5, -1.6, 13], [-1.2, -2.8, 0]],  // 5 cable to amp
    [[1.8, -.4, 16], [-.4, -2.4, 0]],   // 6 recap wide
  ];
  const cp = { p: V(), q: V() };
  function update(t, si, lt, sd) {
    const pulse = .5 + .5 * Math.sin(t * 7);
    // pluck: strings vibrate when si >= 1 except 0's start (silent) — vibrate in 1,3,4,5,6
    const vib = si === 0 ? ease((lt - 1.5) / .5) * .6 : (si === 2 ? .3 : 1);
    strings.forEach((s, i) => {
      const a = s.geo.attributes.position; const f = 9 + i * 3.5;
      for (let k = 0; k <= NS; k++) { const u = k / NS; a.setY(k, s.yy + Math.sin(Math.PI * u) * Math.sin(t * f) * .05 * vib * (si === 1 ? 1.4 : 1)); }
      a.needsUpdate = true; s.tube.visible = true; s.ln.material.color.setHex(si === 1 ? 0xffffff : 0xe8eef6);
      const bl = 1 + .8 * vib * Math.abs(Math.sin(t * f)); s.tube.scale.set(bl, 1, bl);
      s.ln.visible = true;
    });
    sM.emissive.setHex(0x80c0ff); sM.emissiveIntensity = si === 1 ? .4 + .3 * pulse : 0;
    pickM.emissive.setHex(0xffd040); pickM.emissiveIntensity = si === 2 ? .3 + .2 * pulse : 0;
    poleM.emissive.setHex(0x40e0ff); poleM.emissiveIntensity = si === 0 ? .2 + .3 * pulse : si === 2 ? .5 : 0;
    // exploded pickup
    const exOn = si >= 2 && si <= 4;
    const ek = si === 2 ? ease(lt / 1.2) : si === 5 ? 1 - ease(lt / .8) : exOn ? 1 : 0;
    ex.visible = ek > .02; ex.scale.setScalar(.2 + .8 * ek);
    ex.position.set(.45, lerp(.3, 3.1, ek), .5);
    coil.scale.y = si === 2 ? .4 + .6 * ease((lt - .8) / 1.5) : 1;
    coil.rotation.y = si === 2 ? (1 - ease((lt - .8) / 1.5)) * 3 : 0;
    coilM.emissiveIntensity = si === 3 || si === 4 ? .3 + .4 * pulse : 0;
    const bsv = si >= 3 ? Math.sin(t * 9) * .18 : 0;
    bigStr.position.y = 1.0 + bsv; bigStr.visible = si >= 2;
    bigStrM.emissiveIntensity = si === 3 ? .4 : 0;
    fields.forEach((f, i) => { f.scale.set(1, 1 + (si >= 3 ? bsv * 2.2 : 0), 1); f.rotation.z = si >= 3 ? bsv * .8 : 0; });
    fieldM.opacity = si >= 3 ? .5 + .4 * Math.abs(Math.sin(t * 9)) : .45;
    dots.forEach((d, k) => { d.visible = si === 3 || si === 4; const a = k / dots.length * Math.PI * 2 + t * 4 * Math.sign(Math.sin(t * 9)); d.position.set(Math.cos(a) * 1.25, .05, Math.sin(a) * 1.0 * .28 / .28 * .28); });
    // waveform
    const wOn = si === 4;
    const wk = wOn ? ease(lt / Math.max(1.5, sd * .7)) : 0;
    for (let k = 0; k < WN; k++) {
      const u = k / (WN - 1); const x = -1.5 + 3.6 * u; const yv = 3.1 + 1.45 + Math.sin(u * 28 - t * 6) * .35 * Math.exp(-u * .6);
      wPts[k * 3] = x; wPts[k * 3 + 1] = yv; wPts[k * 3 + 2] = .5;
      waveTube[k].visible = wOn && u <= wk; waveTube[k].position.set(x, yv, .5);
    }
    wGeo.attributes.position.needsUpdate = true; wave.visible = wOn;
    // cable + amp
    sig.forEach((d, k) => { d.visible = si === 5 || si === 6; d.position.copy(cableCurve.getPointAt(((t * .6 + k / sig.length) % 1))); });
    const loud = si === 5 ? ease((lt - 1.2) / 1) : si === 6 ? 1 : 0;
    coneM.emissiveIntensity = loud * (.4 + .4 * pulse); cone.position.z = .75 + Math.sin(t * 30) * .04 * loud;
    led.material.color.setHex(loud > .1 ? 0xff3030 : 0x401010);
    rings.forEach((r, k) => { const ph = (t * .8 + k / 3) % 1; r.visible = loud > .1; r.scale.setScalar(.6 + ph * 3); r.material.opacity = (1 - ph) * loud; });
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
