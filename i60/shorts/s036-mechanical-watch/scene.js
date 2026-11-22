// Inside 60 — Mechanical watch. Steps: 0 hook, 1 mainspring, 2 gear train + hands, 3 balance + hairspring, 4 escapement tick, 5 push/impulse, 6 recap
export async function setup({ THREE, scene, camera }) {
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const ss = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 90, specular: 0x666666, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x1a2440); scene.fog = new THREE.Fog(0x1a2440, 30, 80);
  scene.add(new THREE.HemisphereLight(0xf0f4ff, 0x40404c, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(4, 6, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0xa0c0ff, .8); rim.position.set(-6, -3, -6); scene.add(rim);

  const gearShape = (r, n, th, saw) => {
    const s = new THREE.Shape();
    for (let i = 0; i < n; i++) {
      const a0 = i / n * Math.PI * 2, da = Math.PI * 2 / n;
      const pts = saw ? [[r - th, a0], [r, a0 + da * .15], [r - th * .3, a0 + da * .35], [r - th, a0 + da * .4]]
        : [[r - th, a0], [r - th, a0 + da * .15], [r, a0 + da * .3], [r, a0 + da * .6], [r - th, a0 + da * .75]];
      pts.forEach(([rr, a], j) => { const x = rr * Math.cos(a), y = rr * Math.sin(a); (i === 0 && j === 0) ? s.moveTo(x, y) : s.lineTo(x, y); });
    }
    s.closePath();
    const h = new THREE.Path(); h.absarc(0, 0, r * .62, 0, Math.PI * 2, true); s.holes.push(h);
    return new THREE.ExtrudeGeometry(s, { depth: .14, bevelEnabled: true, bevelSize: .015, bevelThickness: .015, bevelSegments: 1, curveSegments: 4 });
  };
  const makeWheel = (r, n, m, pos, z, spokes = 4, saw = false) => {
    const g = new THREE.Group(); g.position.set(pos[0], pos[1], z); scene.add(g);
    g.add(new THREE.Mesh(gearShape(r, n, Math.min(.14, r * .14), saw), m));
    for (let i = 0; i < spokes; i++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(r * 1.3, .09, .1), m); sp.rotation.z = i * Math.PI / spokes; sp.position.z = .07; g.add(sp); }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, .4, 16), m); hub.rotation.x = Math.PI / 2; g.add(hub);
    return g;
  };

  const plateM = Mat({ color: 0x3a4660, shininess: 30, specular: 0x222222 });
  const plate = new THREE.Mesh(new RoundedBoxGeometry(4.8, 11.2, .3, 3, .3), plateM); plate.position.set(.2, -.4, -.45); scene.add(plate);
  const brass = Mat({ color: 0xe8b040, emissive: 0xff9000, emissiveIntensity: 0, shininess: 120 });
  const steel = Mat({ color: 0xd8dde6, emissive: 0x30a0ff, emissiveIntensity: 0, shininess: 150 });
  const ruby = Mat({ color: 0xff2a50, emissive: 0xff0030, emissiveIntensity: .3, shininess: 160 });
  // jewels in plate (decor)
  [[0, 3.2], [.9, 1.2], [-.5, .45], [.4, -.5], [-.4, -1.3], [-.4, -2.25], [-.4, -4.35]].forEach(([x, y]) => { const j = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, .06, 20), ruby); j.rotation.x = Math.PI / 2; j.position.set(x, y, -.28); scene.add(j); });

  // mainspring barrel (r 1.3) with spring spiral inside
  const barrelM = Mat({ color: 0xd9a838, emissive: 0xff8000, emissiveIntensity: 0, shininess: 110, transparent: true, opacity: 1 });
  const barrel = makeWheel(1.3, 40, barrelM, [0, 3.2], 0, 0);
  const springM = Mat({ color: 0x9fc8ff, emissive: 0x2080ff, emissiveIntensity: .2, shininess: 160 });
  class Spiral extends THREE.Curve { getPoint(t) { const a = t * Math.PI * 2 * 7, r = .18 + t * .55; return new THREE.Vector3(r * Math.cos(a), r * Math.sin(a), 0); } }
  const spring = new THREE.Mesh(new THREE.TubeGeometry(new Spiral(), 400, .025, 5, false), springM); spring.position.set(0, 3.2, .2); scene.add(spring);
  const arbor = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, .6, 16), steel); arbor.rotation.x = Math.PI / 2; arbor.position.set(0, 3.2, .1); scene.add(arbor);

  // gear train
  const center = makeWheel(.9, 30, brass, [.9, 1.2], .2);
  const third = makeWheel(.7, 24, brass, [-.5, .45], 0);
  const fourth = makeWheel(.6, 20, brass, [.4, -.5], .2);
  const esc = makeWheel(.55, 15, steel, [-.4, -1.3], 0, 3, true);
  // hands on center wheel
  const handM = Mat({ color: 0xffffff, emissive: 0xffd040, emissiveIntensity: 0 });
  const minute = new THREE.Group(); minute.position.set(.9, 1.2, .75); scene.add(minute);
  const mh = new THREE.Mesh(new RoundedBoxGeometry(.12, 1.9, .05, 2, .03), handM); mh.position.y = .85; minute.add(mh);
  const hour = new THREE.Group(); hour.position.set(.9, 1.2, .68); scene.add(hour);
  const hh = new THREE.Mesh(new RoundedBoxGeometry(.18, 1.2, .05, 2, .04), handM); hh.position.y = .5; hour.add(hh);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, .2, 16), handM); cap.rotation.x = Math.PI / 2; cap.position.set(.9, 1.2, .8); scene.add(cap);

  // pallet fork (pivot -0.4,-2.25): two arms with ruby pallets, lever down to fork end
  const pallet = new THREE.Group(); pallet.position.set(-.4, -2.25, .1); scene.add(pallet);
  const palM = Mat({ color: 0xc8d0dc, emissive: 0x30a0ff, emissiveIntensity: 0, shininess: 140 });
  [-1, 1].forEach(s => {
    const arm = new THREE.Mesh(new RoundedBoxGeometry(.9, .14, .12, 2, .04), palM); arm.position.set(s * .38, .25, 0); arm.rotation.z = s * .55; pallet.add(arm);
    const pj = new THREE.Mesh(new THREE.BoxGeometry(.1, .32, .14), ruby); pj.position.set(s * .7, .52, 0); pallet.add(pj);
  });
  const lever = new THREE.Mesh(new RoundedBoxGeometry(.14, 1.55, .12, 2, .04), palM); lever.position.y = -.75; pallet.add(lever);
  [-1, 1].forEach(s => { const h = new THREE.Mesh(new THREE.BoxGeometry(.08, .3, .12), palM); h.position.set(s * .12, -1.55, 0); pallet.add(h); });
  const pivot = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, .3, 12), steel); pivot.rotation.x = Math.PI / 2; pallet.add(pivot);

  // balance wheel + hairspring (center -0.4,-4.35)
  const bal = new THREE.Group(); bal.position.set(-.4, -4.35, .35); scene.add(bal);
  const balM = Mat({ color: 0xf0c050, emissive: 0xff9000, emissiveIntensity: 0, shininess: 130 });
  bal.add(new THREE.Mesh(new THREE.TorusGeometry(1.1, .1, 10, 60), balM));
  for (let i = 0; i < 3; i++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(2.2, .08, .08), balM); sp.rotation.z = i * Math.PI / 3; bal.add(sp); }
  for (let i = 0; i < 8; i++) { const sc = new THREE.Mesh(new THREE.SphereGeometry(.08, 10, 8), balM); const a = i / 8 * Math.PI * 2; sc.position.set(1.22 * Math.cos(a), 1.22 * Math.sin(a), 0); bal.add(sc); }
  const rollerPin = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .3, 10), ruby); rollerPin.rotation.x = Math.PI / 2; rollerPin.position.set(0, .45, -.15); bal.add(rollerPin);
  const hairM = Mat({ color: 0x5aa0ff, emissive: 0x2070ff, emissiveIntensity: .2, shininess: 160 });
  class Hair extends THREE.Curve { getPoint(t) { const a = t * Math.PI * 2 * 9, r = .12 + t * .7; return new THREE.Vector3(r * Math.cos(a), r * Math.sin(a), 0); } }
  const hair = new THREE.Mesh(new THREE.TubeGeometry(new Hair(), 500, .018, 4, false), hairM); hair.position.set(-.4, -4.35, .55); scene.add(hair);

  // impulse spark at the escape wheel / pallet contact
  const sparkM = new THREE.MeshBasicMaterial({ color: 0xffe060, transparent: true, opacity: 0, depthWrite: false });
  const spark = new THREE.Mesh(new THREE.SphereGeometry(.16, 14, 10), sparkM); scene.add(spark);
  const sparkB = new THREE.Mesh(new THREE.SphereGeometry(.14, 14, 10), sparkM); sparkB.position.set(-.4, -3.9, .5); scene.add(sparkB);

  const shots = [
    [[4, -1.2, 30], [.3, -1.65, 0]],
    [[1.6, 4.6, 6.8], [0, 3.2, 0]],
    [[2.8, 1.8, 8.5], [.3, .8, 0]],
    [[-2.2, -5.6, 7.5], [-.4, -4.2, 0]],
    [[1.6, -1.2, 5.6], [-.4, -1.9, 0]],
    [[-2, -2.6, 6.4], [-.4, -3.1, 0]],
    [[-4, -.6, 30], [.3, -1.65, 0]],
  ];
  const cp = { p: V(), q: V() };
  const PITCH = Math.PI * 2 / 30, W = Math.PI * 2 * .7;
  let lastT = 0, freeOff = 0, wind = 0, amp = 2.4;
  function update(t, si, lt, sd) {
    sd = sd || 6;
    const dt = Math.max(0, Math.min(.1, t - lastT)); lastT = t;
    const phi = W * t;
    // amplitude: balance stopped at start of step 3 (gears run away), then swings
    const runaway = si === 3 && lt < 1.8;
    amp = runaway ? 0 : (si === 3 ? lerp(0, 2.4, ss(1.8, 2.6, lt)) : 2.4);
    if (runaway) freeOff += dt * 9;
    const b = Math.floor(phi / Math.PI + .5), fr = phi / Math.PI + .5 - b, jump = ss(.42, .58, fr);
    const ea = -((b + jump) * PITCH + freeOff);
    esc.rotation.z = ea;
    const rE = .55; fourth.rotation.z = -ea * rE / .6; third.rotation.z = ea * rE / .7 * .5; center.rotation.z = -ea * rE / .9 * .25;
    barrel.rotation.z = ea * rE / 1.3 * .05;
    minute.rotation.z = -t * .35 - freeOff * .2; hour.rotation.z = minute.rotation.z / 12 - 1.6;
    bal.rotation.z = amp * Math.sin(phi);
    hair.rotation.z = bal.rotation.z * .35; const hs = 1 + .06 * Math.sin(phi); hair.scale.set(hs, hs, 1);
    pallet.rotation.z = runaway ? .0 : .16 * Math.cos(Math.PI * (b + jump));
    // winding (step 1): arbor turns, spring coils tighten toward the center
    if (si === 1) wind = ease((lt - .6) / (sd - 1.2)); else if (si < 1) wind = 0; else wind = Math.max(0, 1 - (si - 1) * .1 - (si === 2 ? lt * .01 : 0));
    const sc = lerp(1, .55, wind); spring.scale.set(sc, sc, 1); spring.rotation.z = -wind * 9 + ea * .02; arbor.rotation.z = -wind * 9;
    barrelM.opacity = si === 1 ? lerp(1, .35, ease(lt / 1)) : 1; barrelM.transparent = barrelM.opacity < 1; barrelM.depthWrite = barrelM.opacity >= 1;
    const pulse = .5 + .5 * Math.sin(t * 5), kick = Math.sin(Math.PI * Math.min(1, Math.max(0, (fr - .4) / .2)));
    springM.emissiveIntensity = si === 1 ? .4 + .6 * pulse : .15;
    brass.emissiveIntensity = si === 2 ? .2 + .3 * pulse : (runaway ? .5 : 0);
    handM.emissiveIntensity = si === 2 ? .6 * pulse : 0;
    balM.emissiveIntensity = si === 3 && !runaway ? .2 + .35 * pulse : 0;
    hairM.emissiveIntensity = si === 3 && !runaway ? .5 + .5 * pulse : .2;
    steel.emissiveIntensity = si === 4 ? .5 * kick : 0;
    palM.emissiveIntensity = si === 4 || si === 5 ? .6 * kick : 0;
    const side = (b % 2 === 0) ? 1 : -1;
    spark.position.set(-.4 + side * .55, -1.75, .3);
    sparkM.opacity = (si === 4 || si === 5) ? kick * .9 : 0;
    sparkB.visible = si === 5;
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const k = si === 0 ? 1 : ease(lt / 1.3);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], k))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], k)));
    const o = Math.sin(t * .2) * .08, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o));
    camera.lookAt(cp.q);
  }
  return { update };
}
