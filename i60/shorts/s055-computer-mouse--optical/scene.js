// Inside 60 — Optical mouse. Steps: 0 hook (1,500 pictures/s), 1 LED at low angle, 2 camera sensor sees texture, 3 processor compares frames, 4 shift -> direction + distance, 5 cursor moves, 6 recap
export async function setup({ THREE, scene, camera }) {
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const ss = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x555555, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x121a30); scene.fog = new THREE.Fog(0x121a30, 30, 80);
  scene.add(new THREE.HemisphereLight(0xf4f6ff, 0x40404c, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.9); key.position.set(5, 10, 9); scene.add(key);
  const rim = new THREE.DirectionalLight(0xa0c8ff, .8); rim.position.set(-6, 2, -6); scene.add(rim);

  // speckle texture (desk surface as the sensor sees it)
  const cv = document.createElement('canvas'); cv.width = cv.height = 256; const g = cv.getContext('2d');
  g.fillStyle = '#7a5a3a'; g.fillRect(0, 0, 256, 256);
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < 900; k++) { const v = Math.floor(60 + rnd() * 140); g.fillStyle = `rgb(${v + 40},${v + 10},${v - 30})`; g.beginPath(); g.arc(rnd() * 256, rnd() * 256, 1 + rnd() * 5, 0, 7); g.fill(); }
  const mkTex = () => { const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.NearestFilter; return t; };

  // ===== Desk + mouse (origin) =====
  const deskTex = mkTex(); deskTex.repeat.set(4, 4);
  const desk = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), Mat({ map: deskTex, color: 0x8c8c8c, shininess: 10 })); desk.rotation.x = -Math.PI / 2; scene.add(desk);
  const ms = new THREE.Group(); scene.add(ms);
  const shellM = Mat({ color: 0xe8ecf4, shininess: 120, transparent: true, opacity: 1 });
  const shell = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 24), shellM); shell.scale.set(1.25, .75, 2.0); shell.position.y = .15; ms.add(shell);
  const baseM = Mat({ color: 0x303440 });
  const base = new THREE.Mesh(new RoundedBoxGeometry(2.4, .2, 3.8, 3, .1), baseM); base.position.y = .12; ms.add(base);
  const btn = new THREE.Mesh(new THREE.BoxGeometry(.04, .2, 1.4), Mat({ color: 0x9098a8 })); btn.position.set(0, .85, -1.0); ms.add(btn);
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, .14, 20), Mat({ color: 0x404450 })); wheel.rotation.z = Math.PI / 2; wheel.position.set(0, .88, -.9); ms.add(wheel);
  // LED + beam + sensor + lens under the mouse
  const ledM = Mat({ color: 0xff3030, emissive: 0xff2020, emissiveIntensity: 0 });
  const led = new THREE.Mesh(new THREE.SphereGeometry(.16, 16, 12), ledM); led.position.set(0, .45, .9); ms.add(led);
  const beamM = new THREE.MeshBasicMaterial({ color: 0xff4040, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  const beam = new THREE.Mesh(new THREE.ConeGeometry(.35, 1.2, 20, 1, true), beamM); ms.add(beam);
  { const a = V(0, .45, .9), b = V(0, .02, 0); beam.position.copy(a).add(b).multiplyScalar(.5); beam.lookAt(b); beam.rotateX(-Math.PI / 2); }
  const spotM = new THREE.MeshBasicMaterial({ color: 0xff5050, transparent: true, opacity: 0, depthWrite: false });
  const spot = new THREE.Mesh(new THREE.CircleGeometry(.45, 24), spotM); spot.rotation.x = -Math.PI / 2; spot.position.y = .02; ms.add(spot);
  const senM = Mat({ color: 0x22252e, emissive: 0x30c0ff, emissiveIntensity: 0 });
  const sen = new THREE.Mesh(new RoundedBoxGeometry(.6, .15, .6, 1, .04), senM); sen.position.set(0, .55, 0); ms.add(sen);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(.18, .22, .3, 16), Mat({ color: 0xb0e0ff, transparent: true, opacity: .7 })); lens.position.set(0, .33, 0); ms.add(lens);
  // flash rings (pictures)
  const flM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false });
  const fl = new THREE.Mesh(new THREE.RingGeometry(.5, .7, 32), flM); fl.rotation.x = -Math.PI / 2; fl.position.y = .03; ms.add(fl);

  // ===== Frames (x = 22): last frame vs new frame, processor =====
  const fr = new THREE.Group(); fr.position.set(22, 2, 0); fr.scale.setScalar(.62); scene.add(fr);
  const tA = mkTex(), tB = mkTex(); [tA, tB].forEach(t => t.repeat.set(.18, .18));
  const frameMk = (t, x) => { const gg = new THREE.Group(); gg.position.x = x; fr.add(gg);
    gg.add(new THREE.Mesh(new RoundedBoxGeometry(3.0, 3.0, .2, 2, .08), Mat({ color: 0x1a1d24 })));
    const p = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 2.7), new THREE.MeshBasicMaterial({ map: t })); p.position.z = .11; gg.add(p); return gg; };
  const fA = frameMk(tA, 0), fB = frameMk(tB, 0);
  fA.position.set(0, 1.9, 0); fB.position.set(0, -1.9, 0);
  const cpuM = Mat({ color: 0x22252e, emissive: 0x30ff90, emissiveIntensity: .1 });
  const cpu = new THREE.Mesh(new RoundedBoxGeometry(1.2, 1.2, .4, 2, .08), cpuM); cpu.position.set(2.6, 0, 0); fr.add(cpu);
  const arrM = new THREE.MeshBasicMaterial({ color: 0xffe040, transparent: true, opacity: 0 });
  const arr = new THREE.Group(); fr.add(arr); arr.position.set(0, -1.9, .3);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, 1, 8), arrM); arr.add(shaft);
  const head = new THREE.Mesh(new THREE.ConeGeometry(.32, .6, 12), arrM); arr.add(head);
  const matchM = new THREE.MeshBasicMaterial({ color: 0x40ff90, transparent: true, opacity: 0, depthWrite: false });
  const match = new THREE.Mesh(new THREE.RingGeometry(.35, .45, 4), matchM); fr.add(match);
  const match2 = new THREE.Mesh(new THREE.RingGeometry(.35, .45, 4), matchM); fr.add(match2);

  // ===== Monitor (x = -22) =====
  const mon = new THREE.Group(); mon.position.set(-22, 2.5, 0); scene.add(mon);
  mon.add(new THREE.Mesh(new RoundedBoxGeometry(4.6, 3.0, .3, 2, .1), Mat({ color: 0x1a1d24 })));
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.6), Mat({ color: 0x2a4a80, emissive: 0x2050a0, emissiveIntensity: .5 })); scr.position.z = .16; mon.add(scr);
  const curS = new THREE.Shape(); curS.moveTo(0, 0); curS.lineTo(0, -.5); curS.lineTo(.13, -.38); curS.lineTo(.24, -.6); curS.lineTo(.32, -.55); curS.lineTo(.2, -.34); curS.lineTo(.36, -.34); curS.lineTo(0, 0);
  const cur = new THREE.Mesh(new THREE.ShapeGeometry(curS), new THREE.MeshBasicMaterial({ color: 0xffffff })); cur.position.z = .18; mon.add(cur);
  const trailM = new THREE.MeshBasicMaterial({ color: 0xffe040, transparent: true, opacity: .8 });
  const trail = []; for (let k = 0; k < 8; k++) { const d = new THREE.Mesh(new THREE.CircleGeometry(.05, 10), trailM); d.position.z = .17; mon.add(d); trail.push(d); }
  const st = new THREE.Mesh(new THREE.CylinderGeometry(.15, .15, 1.8, 8), Mat({ color: 0x1a1d24 })); st.position.y = -2.4; mon.add(st);
  const ms2 = ms.clone(); ms2.position.set(-22, 0, 4.5); ms2.scale.setScalar(.8); scene.add(ms2);
  const desk2 = new THREE.Mesh(new THREE.PlaneGeometry(10, 12), Mat({ color: 0x6a5038, shininess: 10 })); desk2.rotation.x = -Math.PI / 2; desk2.position.set(-22, -.01, 2); scene.add(desk2);

  const shots = [
    [[4.0, 6.5, 10.5], [0, .4, 0]],           // 0 mouse
    [[6.5, 1.3, 6.0], [0, .3, .2]],            // 1 LED (low side view, shell fades)
    [[4.0, 1.9, 4.6], [0, .35, 0]],           // 2 sensor
    [[25.5, 2.5, 11.5], [22.6, 2, 0]],        // 3 compare
    [[24.5, 1.8, 10.5], [22.4, 1.6, 0]],      // 4 shift
    [[-19.5, 4.5, 13.0], [-22, 2.0, 1.5]],    // 5 cursor
    [[4.5, 7.0, 11.5], [0, .4, 0]],           // 6 recap
  ];
  const cp = { p: V(), q: V() };
  function update(t, si, lt, sd) {
    const pulse = .5 + .5 * Math.sin(t * 6); const D = sd || 5;
    // mouse glides on the desk
    const mx = Math.sin(t * .7) * .8, mz = Math.sin(t * .5) * .5;
    ms.position.set(mx, 0, mz); ms.rotation.y = Math.sin(t * .4) * .1;
    const xray = si >= 1 && si <= 2;
    shellM.opacity = xray ? lerp(1, .18, ss(0, 1, lt)) : si === 3 && lt < 1 ? lerp(.18, 1, lt) : 1;
    shellM.depthWrite = shellM.opacity > .9; baseM.transparent = true; baseM.opacity = xray ? .35 : 1;
    ledM.emissiveIntensity = si >= 1 ? 1 : .3 + .5 * pulse;
    beamM.opacity = xray ? .35 + .15 * pulse : 0; spotM.opacity = xray ? .45 : si === 0 || si === 6 ? .2 : 0;
    const snap = (t * 5) % 1; flM.opacity = (si === 0 || si === 2 || si === 6) ? (1 - snap) * .8 : 0; fl.scale.setScalar(1 + snap * 1.5);
    senM.emissiveIntensity = si === 2 ? .5 + .5 * pulse : .1;
    // frames: B is A shifted by a vector that grows during step 4
    const sv = si === 4 ? ss(.5, 2.0, lt) : si === 3 ? .35 : 0;
    const ox = .055 * Math.cos(.6), oy = .055 * Math.sin(.6);
    tA.offset.set(.4, .4); tB.offset.set(.4 + ox * (si === 4 ? 1 : .35), .4 + oy * (si === 4 ? 1 : .35));
    cpuM.emissiveIntensity = si === 3 || si === 4 ? .5 + .6 * pulse : .1;
    matchM.opacity = (si === 3 || si === 4) ? .9 : 0;
    match.position.set(-.3, 1.9 + .3, .2);
    // same feature in frame B appears moved opposite to the mouse motion (shown as scaled offset)
    const fx = -.3 - (ox * (si === 4 ? 1 : .35)) / .18 * 2.7, fy = .3 - (oy * (si === 4 ? 1 : .35)) / .18 * 2.7;
    match2.position.set(fx, -1.9 + fy, .2);
    arrM.opacity = si === 4 ? sv : 0;
    { const a = V(-.3, .3, 0), b = V(fx, fy, 0); const L = Math.max(.01, a.distanceTo(b)); shaft.scale.y = L; shaft.position.copy(a).add(b).multiplyScalar(.5);
      const ang = Math.atan2(b.y - a.y, b.x - a.x) - Math.PI / 2; shaft.rotation.z = ang; head.rotation.z = ang; head.position.copy(b); }
    // monitor cursor follows the small mouse
    const u = t * .9; const cx = Math.sin(u) * 1.4, cy = Math.sin(u * 1.3) * .8;
    cur.position.set(cx, cy + .3, .18);
    trail.forEach((d, k) => { const uu = u - (k + 1) * .12; d.position.set(Math.sin(uu) * 1.4, Math.sin(uu * 1.3) * .8 + .3, .17); d.visible = si >= 5; });
    ms2.position.set(-22 + Math.sin(u) * .8, 0, 4.5 - Math.sin(u * 1.3) * .5);
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
