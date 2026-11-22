// Inside 60 — Smoke detector. Steps: 0 hook (85 dB alarm on ceiling), 1 dark chamber with slots, 2 LED beam aimed away from sensor,
// 3 smoke scatters light onto sensor, 4 ionization chamber (americium, current disrupted), 5 chip sounds horn, 6 recap
export async function setup({ THREE, scene, camera }) {
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const ss = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x555555, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x141a2e); scene.fog = new THREE.Fog(0x141a2e, 30, 80);
  scene.add(new THREE.HemisphereLight(0xf4f6ff, 0x40404c, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.8); key.position.set(5, -6, 9); scene.add(key);
  const top = new THREE.DirectionalLight(0xffffff, .9); top.position.set(-3, 8, 5); scene.add(top);
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  // ===== A: ceiling + detector (origin, hanging from y = 4) =====
  const ceil = new THREE.Mesh(new THREE.BoxGeometry(18, .3, 18), Mat({ color: 0x9aa0b4, shininess: 10 })); ceil.position.y = 4.15; scene.add(ceil);
  const det = new THREE.Group(); det.position.y = 4; scene.add(det);
  const shellM = Mat({ color: 0xf4f4f8, shininess: 100, transparent: true, opacity: 1 });
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.4, .9, 48), shellM); shell.position.y = -.45; det.add(shell);
  const slotM = Mat({ color: 0x404450, transparent: true, opacity: 1 });
  for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2; const s = new THREE.Mesh(new THREE.BoxGeometry(.12, .45, .05), slotM); s.position.set(Math.cos(a) * 2.32, -.45, Math.sin(a) * 2.32); s.rotation.y = -a + Math.PI / 2; det.add(s); }
  const ledRM = Mat({ color: 0x400000, emissive: 0xff2020, emissiveIntensity: .2 });
  const ledR = new THREE.Mesh(new THREE.SphereGeometry(.12, 12, 8), ledRM); ledR.position.set(.9, -.92, .6); det.add(ledR);
  const ringM = new THREE.MeshBasicMaterial({ color: 0xffd040, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  const rings = []; for (let k = 0; k < 4; k++) { const r = new THREE.Mesh(new THREE.TorusGeometry(1, .05, 8, 48), ringM.clone()); r.rotation.x = Math.PI / 2; r.position.y = -1.2; det.add(r); rings.push(r); }
  // inner chamber (revealed): dark cylinder with labyrinth vanes
  const ch = new THREE.Group(); ch.position.y = -.5; det.add(ch);
  const chM = Mat({ color: 0x4a5068, emissive: 0x101830, transparent: true, opacity: 0 });
  ch.add(new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, .1, 40), chM));
  for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; const v = new THREE.Mesh(new THREE.BoxGeometry(.3, .3, .05), chM); v.position.set(Math.cos(a) * 1.4, -.1, Math.sin(a) * 1.4); v.rotation.y = -a + .7; ch.add(v); }
  const ledM = Mat({ color: 0x202020, emissive: 0xff60ff, emissiveIntensity: 0, transparent: true, opacity: 0 });
  const led = new THREE.Mesh(new RoundedBoxGeometry(.3, .3, .3, 2, .05), ledM); led.position.set(-1.0, 0, 0); ch.add(led);
  const senM = Mat({ color: 0x202020, emissive: 0x40e0ff, emissiveIntensity: 0, transparent: true, opacity: 0 });
  const sen = new THREE.Mesh(new RoundedBoxGeometry(.3, .3, .3, 2, .05), senM); sen.position.set(0, 0, 1.0); ch.add(sen);
  const beamM = new THREE.MeshBasicMaterial({ color: 0xff70ff, transparent: true, opacity: 0, depthWrite: false });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 2.0, 12), beamM); beam.rotation.z = Math.PI / 2; beam.position.set(0, 0, 0); ch.add(beam);
  const scatM = new THREE.LineBasicMaterial({ color: 0xff90ff, transparent: true, opacity: 0 });
  const sp = []; for (let k = 0; k < 10; k++) { const x = -.6 + k * .14; sp.push(V(x, 0, 0), V(0 + (rnd() - .5) * .2, (rnd() - .5) * .1, 1.0)); }
  const scat = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(sp), scatM); ch.add(scat);
  // smoke particles
  const NS = 220, sPos = new Float32Array(NS * 3), sSeed = [];
  for (let k = 0; k < NS; k++) sSeed.push([rnd() * Math.PI * 2, rnd(), rnd()]);
  const sG = new THREE.BufferGeometry(); sG.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
  const dotC = document.createElement('canvas'); dotC.width = dotC.height = 64; { const g = dotC.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }
  const smM = new THREE.PointsMaterial({ map: new THREE.CanvasTexture(dotC), color: 0x9098a8, size: .3, transparent: true, opacity: 0, depthWrite: false });
  const smoke = new THREE.Points(sG, smM); scene.add(smoke);
  // chip
  const chipM = Mat({ color: 0x202430, emissive: 0x40ff90, emissiveIntensity: 0, transparent: true, opacity: 0 });
  const chip = new THREE.Mesh(new RoundedBoxGeometry(.6, .12, .6, 2, .04), chipM); chip.position.set(.8, -.25, -.7); det.add(chip);

  // ===== B: ionization chamber (x = 22) =====
  const B = new THREE.Group(); B.position.set(22, 1.8, 0); scene.add(B);
  const plA = new THREE.Mesh(new RoundedBoxGeometry(3.2, .2, 2.2, 2, .05), Mat({ color: 0xff7060 })); plA.position.y = 1.4; B.add(plA);
  const plB = new THREE.Mesh(new RoundedBoxGeometry(3.2, .2, 2.2, 2, .05), Mat({ color: 0x6090ff })); plB.position.y = -1.4; B.add(plB);
  const amM = Mat({ color: 0x404040, emissive: 0x80ff60, emissiveIntensity: .8 });
  const am = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .12, 20), amM); am.position.set(0, -1.24, 0); B.add(am);
  const NI = 40, ions = [];
  for (let k = 0; k < NI; k++) { const pos = k % 2 === 0; const m = new THREE.Mesh(new THREE.SphereGeometry(.08, 8, 6), new THREE.MeshBasicMaterial({ color: pos ? 0xff8070 : 0x70a0ff })); B.add(m); ions.push({ m, pos, ph: rnd(), x: (rnd() - .5) * 2.6, z: (rnd() - .5) * 1.6 }); }
  const blobM = Mat({ color: 0x8a8e98, transparent: true, opacity: 0 });
  const blobs = []; for (let k = 0; k < 7; k++) { const b = new THREE.Mesh(new THREE.SphereGeometry(.22, 12, 8), blobM); B.add(b); blobs.push({ b, x: (rnd() - .5) * 2.4, y: (rnd() - .5) * 1.8, z: (rnd() - .5) * 1.2 }); }
  // current meter
  const meter = new THREE.Group(); meter.position.set(2.2, 0, 0); B.add(meter);
  meter.add(new THREE.Mesh(new RoundedBoxGeometry(.6, 2.6, .3, 2, .08), Mat({ color: 0x1a1d24 })));
  const fillM = Mat({ color: 0x40ff90, emissive: 0x40ff90, emissiveIntensity: .5 });
  const fill = new THREE.Mesh(new THREE.BoxGeometry(.4, 2.3, .1), fillM); fill.position.z = .18; meter.add(fill);

  const shots = [
    [[6.0, -.5, 13.5], [0, 2.6, 0]],            // 0 detector from below
    [[3.5, .2, 8.0], [0, 3.2, 0]],              // 1 chamber
    [[1.6, .6, 6.5], [0, 3.3, 0]],              // 2 LED beam
    [[1.6, .6, 6.5], [0, 3.3, .2]],             // 3 scatter
    [[24.5, 2.4, 12.0], [22.6, 1.8, 0]],        // 4 ionization
    [[5.0, -.3, 12.0], [0, 2.6, 0]],            // 5 alarm
    [[6.0, -.5, 13.5], [0, 2.6, 0]],            // 6 recap
  ];
  const cp = { p: V(), q: V() };
  function update(t, si, lt, sd) {
    const pulse = .5 + .5 * Math.sin(t * 6); const D = sd || 5;
    const open = si >= 1 && si <= 3 ? ss(0, 1.2, si === 1 ? lt : 9) : si === 5 && lt < 1 ? 1 - ss(0, 1, lt) : 0;
    shellM.opacity = lerp(1, .12, open); shellM.depthWrite = shellM.opacity > .9; slotM.opacity = lerp(1, .3, open);
    chM.opacity = open; ledM.opacity = open; senM.opacity = open; chipM.opacity = Math.max(open, si === 5 ? .9 : 0);
    ledM.emissiveIntensity = si >= 2 && si <= 3 ? 1.2 : 0;
    beamM.opacity = si >= 2 && si <= 3 ? .55 + .2 * pulse : 0;
    const sc = si === 3 ? ss(1.0, 2.0, lt) : 0;
    scatM.opacity = sc * (.5 + .5 * pulse); senM.emissiveIntensity = si === 3 ? sc * (1 + .5 * pulse) : 0;
    chipM.emissiveIntensity = si === 3 ? sc * .6 : si === 5 ? .6 + .4 * pulse : 0;
    // alarm rings + red LED
    const alarm = si === 0 || si === 5 || si === 6;
    ledRM.emissiveIntensity = alarm ? (Math.sin(t * 12) > 0 ? 2 : .2) : .2;
    rings.forEach((r, k) => { const u = (t * .9 + k / 4) % 1; r.scale.setScalar(1 + u * 5); r.material.opacity = alarm ? (1 - u) * .8 : 0; r.position.y = -1.2 - u * 1.2; });
    // smoke: rises from below into chamber in steps 1, 3, 5
    const smokeOn = si === 1 || si === 3 || si === 5 || si === 0 || si === 6;
    smM.opacity = smokeOn ? (si === 3 ? .8 : .55) : 0;
    for (let k = 0; k < NS; k++) { const [a, r0, h0] = sSeed[k]; const u = (h0 + t * .12) % 1;
      const into = si === 3 ? 1 : 0;
      const rad = lerp(3.2 + r0 * 2, r0 * 1.2, into ? Math.min(1, u * 1.5) : 0) ;
      const y = into ? lerp(0, 3.5, Math.min(1, u * 1.4)) : lerp(-1.5, 3.7, u);
      sPos[k * 3] = Math.cos(a + t * .2) * rad; sPos[k * 3 + 1] = y; sPos[k * 3 + 2] = Math.sin(a + t * .2) * rad; }
    sG.attributes.position.needsUpdate = true;
    // ionization: ions drift between plates; smoke blobs slow them, meter drops
    const sm = si === 4 ? ss(2.0, 3.0, lt) : 0;
    ions.forEach(o => { const sp2 = lerp(.6, .12, sm); const u = (o.ph + t * sp2) % 1; const y = o.pos ? lerp(-1.2, 1.25, u) : lerp(1.25, -1.2, u); o.m.position.set(o.x, y, o.z); });
    blobM.opacity = sm; blobs.forEach((b, k) => b.b.position.set(b.x + Math.sin(t + k) * .15, b.y + Math.cos(t * .8 + k) * .1, b.z));
    const lvl = lerp(1, .3, sm); fill.scale.y = lvl; fill.position.y = -1.15 * (1 - lvl); fillM.color.set(sm > .5 ? 0xff5040 : 0x40ff90); fillM.emissive.copy(fillM.color);
    amM.emissiveIntensity = .5 + .4 * pulse;
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
