// Inside 60 — Parking sensors (ultrasonic). Steps: 0 hook (dots on bumper), 1 ping, 2 echo, 3 timing/distance, 4 teamwork (several sensors), 5 beeps faster -> solid, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 90, specular: 0x555555, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x151a2a); scene.fog = new THREE.Fog(0x151a2a, 40, 100);
  scene.add(new THREE.HemisphereLight(0xf4f8ff, 0x404050, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(8, 12, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0x90d0ff, .7); rim.position.set(-6, 5, -8); scene.add(rim);
  const ground = new THREE.Mesh(new THREE.BoxGeometry(30, .2, 40), Mat({ color: 0x343c4a, shininess: 15 })); ground.position.set(0, -.1, 0); scene.add(ground);
  const lineM = Mat({ color: 0xf0e070, emissive: 0x403810 });
  for (const x of [-2.6, 2.6]) { const l = new THREE.Mesh(new THREE.BoxGeometry(.15, .03, 10), lineM); l.position.set(x, .01, 1); scene.add(l); }
  const wall = new THREE.Mesh(new THREE.BoxGeometry(10, 3, .6), Mat({ color: 0x6a5a50, shininess: 10 })); wall.position.set(0, 1.5, 7.6);
  // obstacle pole
  const POLE = V(1.0, 0, 6.2);
  const poleM = Mat({ color: 0xffa030, emissive: 0x000000 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, 2.2, 20), poleM); pole.position.set(POLE.x, 1.1, POLE.z); scene.add(pole);
  for (const y of [.6, 1.5]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(.31, .31, .25, 20), Mat({ color: 0xf0f0f0 })); b.position.set(POLE.x, y, POLE.z); scene.add(b); }
  // car (rear faces +z)
  const car = new THREE.Group(); scene.add(car);
  const bodyM = Mat({ color: 0xd8dce4, shininess: 150 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.3, 7), bodyM); body.position.set(0, 1.15, -3.6); car.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.0, 3.6), Mat({ color: 0x506a88, shininess: 200 })); cabin.position.set(0, 2.3, -3.8); car.add(cabin);
  const bumper = new THREE.Mesh(new THREE.BoxGeometry(3.5, .55, .5), Mat({ color: 0x2a2f38, shininess: 60 })); bumper.position.set(0, .75, -.05); car.add(bumper);
  for (const x of [-1.35, 1.35]) { const tl = new THREE.Mesh(new THREE.BoxGeometry(.6, .3, .1), Mat({ color: 0xc02020, emissive: 0x601010 })); tl.position.set(x, 1.45, -.05); car.add(tl); }
  for (const x of [-1.6, 1.6]) for (const z of [-1.4, -5.6]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, .4, 20), Mat({ color: 0x18181c })); w.rotation.z = Math.PI / 2; w.position.set(x, .55, z); car.add(w); }
  const SX = [-1.25, -.42, .42, 1.25];
  const sensM = SX.map(() => Mat({ color: 0x9aa4b4, emissive: 0x000000, shininess: 160 }));
  SX.forEach((x, k) => { const d = new THREE.Mesh(new THREE.CylinderGeometry(.11, .11, .08, 18), sensM[k]); d.rotation.x = Math.PI / 2; d.position.set(x, .78, .23); car.add(d); });
  // waves: per sensor one outgoing ring + one echo ring
  const outM = new THREE.MeshBasicMaterial({ color: 0x40d0ff, transparent: true, opacity: .8 });
  const echM = new THREE.MeshBasicMaterial({ color: 0xff50c0, transparent: true, opacity: .8 });
  const ringG = new THREE.TorusGeometry(1, .035, 6, 40);
  const outs = SX.map(() => { const r = new THREE.Mesh(ringG, outM.clone()); scene.add(r); return r; });
  const echs = SX.map(() => { const r = new THREE.Mesh(ringG, echM.clone()); scene.add(r); return r; });
  // distance lines (teamwork) + ground ruler
  const lines = SX.map(() => { const g = new THREE.BufferGeometry().setFromPoints([V(), V()]); const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0x40ff90 })); scene.add(l); return l; });
  const rulerM = Mat({ color: 0x40ff90, emissive: 0x20a050 });
  const ruler = new THREE.Mesh(new THREE.BoxGeometry(.12, .05, 1), rulerM); scene.add(ruler);
  // beeper (floating speaker above the roof)
  const beepM = Mat({ color: 0x303844, emissive: 0x000000 });
  const beeper = new THREE.Group(); scene.add(beeper);
  const bx = new THREE.Mesh(new THREE.CylinderGeometry(.45, .3, .5, 20), beepM); bx.rotation.x = Math.PI / 2; beeper.add(bx);
  const bRingM = new THREE.MeshBasicMaterial({ color: 0xffd030, transparent: true, opacity: .8 });
  const bRings = []; for (let k = 0; k < 3; k++) { const r = new THREE.Mesh(new THREE.TorusGeometry(.6 + k * .3, .04, 6, 32, Math.PI * .6), bRingM); r.rotation.z = -Math.PI * .3; r.rotation.y = -Math.PI / 2; beeper.add(r); bRings.push(r); }

  const shots = [
    [[6, 4, 7], [0, .9, .2]],          // 0 hook
    [[3, 3.4, 12.5], [.3, .9, 3]],     // 1 ping
    [[-3, 3.8, 12], [.2, .9, 3]],      // 2 echo
    [[-4, 6.5, 13], [.3, .6, 3]],      // 3 timing
    [[0, 13, 1.8], [0, .5, 3.3]],      // 4 teamwork (top view)
    [[8, 6, 8], [0, 1.8, 3.5]],        // 5 beeps
    [[10, 8, 12], [0, 1.5, 1]],        // 6 recap
  ];
  shots.forEach(sh => { for (let i = 0; i < 3; i++) sh[0][i] = sh[1][i] + (sh[0][i] - sh[1][i]) * 1.3; });
  const cp = { p: V(), q: V() };
  const tmp = V();
  function update(t, si, lt, sd) {
    const pulse = .5 + .5 * Math.sin(t * 6);
    // car drives back in step 5
    const cz = si === 5 ? lerp(0, 5.0, ease(lt / (sd * .85))) : si === 6 ? 5.0 : 0;
    car.position.z = cz;
    const dist = POLE.z - .3 - (cz + .25);
    sensM.forEach((m, k) => { m.emissive.setHex(0x40d0ff); m.emissiveIntensity = si === 0 ? .4 + .5 * pulse : (si >= 1 && si <= 4 && (si === 4 || k === 2)) ? .5 : 0; });
    // waves
    const active = k => (si >= 1 && si <= 3 && k === 2) || si === 4 || si === 5;
    SX.forEach((x, k) => {
      const o = outs[k], e = echs[k];
      const sp = V(x, .78, cz + .27);
      const d = Math.hypot(POLE.x - x, dist) || 1;
      const per = 1.6; const ph = ((t + k * .37) % per) / per; // 0..1
      const showEcho = si !== 1;
      o.visible = active(k) && ph < .5; e.visible = active(k) && showEcho && ph >= .5;
      // outgoing ring grows from sensor towards obstacle
      const a = ph / .5;
      o.position.set(sp.x, sp.y, sp.z + a * dist); o.scale.setScalar(.15 + a * 1.2); o.material.opacity = .9 * (1 - a * .6);
      const b = (ph - .5) / .5;
      e.position.set(lerp(POLE.x, sp.x, b), .9, lerp(POLE.z - .3, sp.z, b)); e.scale.setScalar(.15 + b * .8); e.material.opacity = .9 * (1 - b * .4);
      const l = lines[k]; const pa = l.geometry.attributes.position;
      pa.setXYZ(0, sp.x, sp.y + .02, sp.z); pa.setXYZ(1, POLE.x, .9, POLE.z - .3); pa.needsUpdate = true; l.visible = si === 4;
    });
    poleM.emissive.setHex(0xff8020); poleM.emissiveIntensity = (si === 2 || si === 4) ? .2 + .3 * pulse : 0;
    // ruler on the ground grows with "time of flight"
    ruler.visible = si === 3;
    const rk = si === 3 ? ease((lt - .3) / 2.2) : 0;
    const rl = Math.max(.01, dist * rk); ruler.scale.z = rl; ruler.position.set(.42, .04, cz + .27 + rl / 2);
    // beeper
    beeper.position.set(0, 3.9, cz - 2.5); beeper.visible = si >= 5;
    const closeK = Math.max(0, Math.min(1, (dist - .5) / 5));
    const rate = lerp(9, 1.6, closeK);
    const solid = dist < .9;
    const on = solid || Math.sin(t * rate * Math.PI * 2) > .2;
    beepM.emissive.setHex(dist < .9 ? 0xff3030 : 0xffd030); beepM.emissiveIntensity = si === 5 && on ? .9 : 0;
    bRings.forEach(r => { r.visible = si === 5 && on; });
    bRingM.color.setHex(dist < .9 ? 0xff3030 : 0xffd030);
    // camera
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const kk = si === 0 ? 1 : ease(lt / 1.4);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], kk))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], kk)));
    const o = Math.sin(t * .25) * .15, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o));
    camera.lookAt(cp.q);
  }
  return { update };
}
