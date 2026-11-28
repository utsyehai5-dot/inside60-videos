// Inside 60 — Ice maker. Steps: 0 hook (cubes drop), 1 valve fills tray, 2 freeze + thermostat,
// 3 heater loosens, 4 ejector arms sweep cubes to bin, 5 wire arm / bin full stops, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 70, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const rnd = (() => { let s = 37; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  scene.background = new THREE.Color(0x14202e);
  scene.add(new THREE.HemisphereLight(0xeaf6ff, 0x34404f, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, .9); key.position.set(5, 9, 10); scene.add(key);
  const root = new THREE.Group(); scene.add(root); root.scale.setScalar(.6);

  // freezer compartment back + floor
  const wallM = Mat({ color: 0xdbeafe, shininess: 20 });
  const backW = new THREE.Mesh(new THREE.BoxGeometry(12, 10, .2), wallM); backW.position.set(0, 0, -2.6); root.add(backW);
  const floor = new THREE.Mesh(new THREE.BoxGeometry(12, .2, 6), wallM); floor.position.set(0, -4.4, 0); root.add(floor);

  // tray: half-pipe along x, 8 cavities
  const N = 8, TL = 6.4, TR = .75, ty = 1.4;
  const trayM = Mat({ color: 0x94a3b8, shininess: 110, side: THREE.DoubleSide, emissive: 0xff4d00, emissiveIntensity: 0 });
  const tray = new THREE.Mesh(new THREE.CylinderGeometry(TR, TR, TL, 40, 1, true, Math.PI, Math.PI), trayM);
  tray.rotation.z = Math.PI / 2; tray.position.set(0, ty, 0); root.add(tray);
  for (let i = 0; i <= N; i++) {
    const d = new THREE.Mesh(new THREE.CircleGeometry(TR, 24, Math.PI, Math.PI), trayM);
    d.rotation.y = Math.PI / 2; d.position.set(-TL / 2 + i * TL / N, ty, 0); root.add(d);
  }
  // heater: glowing tube under tray
  const heatM = Mat({ color: 0x57534e, emissive: 0xff3a00, emissiveIntensity: 0 });
  const hp = [V(-3.3, ty - .82, .25), V(3.3, ty - .82, .25), V(3.4, ty - .82, -.25), V(-3.3, ty - .82, -.25)];
  root.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(hp, false), 80, .07, 8, false), heatM));
  // motor housing at right end
  const motorM = Mat({ color: 0x334155, emissive: 0x60a5fa, emissiveIntensity: 0 });
  const motor = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.9, 1.8), motorM); motor.position.set(TL / 2 + .75, ty, 0); root.add(motor);
  // thermostat: small disc on tray end, glows when sensing
  const thM = Mat({ color: 0x1e293b, emissive: 0x38bdf8, emissiveIntensity: 0 });
  const thermo = new THREE.Mesh(new THREE.CylinderGeometry(.28, .28, .14, 20), thM); thermo.rotation.z = Math.PI / 2; thermo.position.set(-TL / 2 - .08, ty - .35, 0); root.add(thermo);

  // ejector shaft + fingers (one per cavity)
  const ej = new THREE.Group(); ej.position.set(0, ty + .1, 0); root.add(ej);
  const ejM = Mat({ color: 0x1f2937, emissive: 0xfacc15, emissiveIntensity: 0 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, TL + .6, 12), ejM); shaft.rotation.z = Math.PI / 2; ej.add(shaft);
  for (let i = 0; i < N; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(.16, .7, .12), ejM); f.position.set(-TL / 2 + (i + .5) * TL / N, .35, 0); ej.add(f); }

  // water valve + fill tube from back-left
  const valveM = Mat({ color: 0xe5e7eb, emissive: 0x22c55e, emissiveIntensity: 0 });
  const valve = new THREE.Mesh(new THREE.BoxGeometry(.8, .8, .8), valveM); valve.position.set(-4.6, 3.6, -1.8); root.add(valve);
  const pipe = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(-4.6, 3.6, -1.8), V(-4.2, 3.3, -.6), V(-3.6, 2.6, 0)]), 30, .1, 8), Mat({ color: 0xcbd5e1 })); root.add(pipe);
  const dropM = Mat({ color: 0x7dd3fc, emissive: 0x38bdf8, emissiveIntensity: .6, transparent: true, opacity: .85 });
  const drops = Array.from({ length: 50 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(.08, 8, 6), dropM); m.userData = { o: rnd() }; root.add(m); return m; });
  // water level (box clipped in half-pipe look) -> becomes cubes
  const waterM = Mat({ color: 0x60a5fa, emissive: 0x2563eb, emissiveIntensity: .3, transparent: true, opacity: .7 });
  const iceGeo = new THREE.CylinderGeometry(TR * .93, TR * .93, TL / N - .1, 24, 1, false, Math.PI, Math.PI);
  const cubes = Array.from({ length: N }, (_, i) => { const m = new THREE.Mesh(iceGeo, waterM.clone()); m.rotation.z = Math.PI / 2; m.userData = { x: -TL / 2 + (i + .5) * TL / N, r: rnd() }; root.add(m); return m; });
  // cold air particles
  const airM = Mat({ color: 0xe0f2fe, emissive: 0x93c5fd, emissiveIntensity: .8, transparent: true, opacity: .7, depthWrite: false });
  const air = Array.from({ length: 60 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(.07, 6, 4), airM); m.userData = { o: rnd(), y: ty - 1.4 + rnd() * 3, z: (rnd() - .5) * 2.4 }; root.add(m); return m; });

  // bin below with pile of cubes
  const binM = Mat({ color: 0xf8fafc, transparent: true, opacity: .28, depthWrite: false, side: THREE.DoubleSide });
  const bin = new THREE.Mesh(new THREE.BoxGeometry(7.6, 2.6, 3.4), binM); bin.position.set(0, -3.0, .2); root.add(bin);
  const pileM = Mat({ color: 0xe0f2fe, emissive: 0x7dd3fc, emissiveIntensity: .25, transparent: true, opacity: .9 });
  const pileGeo = new THREE.CylinderGeometry(.55, .55, .7, 16, 1, false, 0, Math.PI);
  const pile = Array.from({ length: 70 }, (_, i) => { const m = new THREE.Mesh(pileGeo, pileM); m.position.set((rnd() - .5) * 6.8, -4.1 + Math.floor(i / 14) * .42 + rnd() * .1, .2 + (rnd() - .5) * 2.6); m.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3); m.userData = { i }; root.add(m); return m; });
  // wire shut-off arm, pivot at motor
  const bail = new THREE.Group(); bail.position.set(TL / 2 + .2, ty - .7, 1.1); root.add(bail);
  const bailM = Mat({ color: 0xcbd5e1, emissive: 0xef4444, emissiveIntensity: 0, shininess: 120 });
  const bw = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(0, 0, 0), V(-.6, -1.4, 0), V(-3.2, -1.8, 0)]), 40, .06, 8), bailM); bail.add(bw);

  const shots = [
    [[5, 3.2, 13], [0, -.4, 0]],        // 0 wide
    [[-1.5, 3.8, 7.5], [-3.2, 2.2, -.4]], // 1 valve + fill
    [[2.5, 3.6, 6.5], [0, 1.3, 0]],      // 2 tray freeze
    [[1.8, -.4, 6.5], [-.5, .9, 0]],     // 3 heater from below
    [[7.5, 2.8, 6], [0, .9, 0]],         // 4 ejector side view
    [[6.5, -1.2, 8], [1.5, -2.2, .5]],   // 5 bin + wire arm
    [[5, 3.2, 13], [0, -.4, 0]],         // 6 recap
  ];
  shots.forEach(sh => { sh[0] = sh[0].map(v => v * .85); sh[1] = sh[1].map(v => v * .6); });
  const cp = { p: V(), q: V() };
  function update(t, si, lt, sd) {
    const pulse = .5 + .5 * Math.sin(t * 6);
    const prog = sd > 0 ? Math.min(1, lt / sd) : 0;
    valveM.emissiveIntensity = si === 1 ? .5 + .4 * pulse : 0;
    drops.forEach(m => { const k = (m.userData.o + t * 1.2) % 1; const p = new THREE.CatmullRomCurve3([V(-3.6, 2.6, 0), V(-2.8, ty + .3, 0)]).getPoint(k); m.position.copy(p); m.position.x += k * (m.userData.o - .5) * 5; m.visible = si === 1; });
    // fill level & freezing: 0 empty, rises in 1, frozen color in 2+
    const fill = si === 0 ? 1 : si === 1 ? ease(prog * 1.2) : si <= 3 ? 1 : 0;
    const frozen = si < 2 ? (si === 0 ? 1 : 0) : si === 2 ? ease(prog) : 1;
    thM.emissiveIntensity = si === 2 ? .5 + .5 * pulse : .05;
    heatM.emissiveIntensity = si === 3 ? .7 + .3 * pulse : 0;
    trayM.emissiveIntensity = si === 3 ? .18 * pulse : 0;
    motorM.emissiveIntensity = si === 4 ? .4 + .3 * pulse : 0;
    ejM.emissiveIntensity = si === 4 ? .3 + .3 * pulse : 0;
    // ejector angle: rests up, sweeps one turn in step 4 (and hook)
    const sweep = si === 4 ? ease(Math.min(1, lt / 3.2)) : si === 0 ? ease((lt % 4) / 3) : 0;
    ej.rotation.x = -sweep * Math.PI * 2;
    cubes.forEach((m, i) => {
      const u = m.userData, M = m.material;
      M.color.setRGB(lerp(.38, .88, frozen), lerp(.65, .95, frozen), lerp(.98, 1, frozen)); M.opacity = lerp(.7, .92, frozen); M.emissive.setHex(frozen > .5 ? 0x7dd3fc : 0x2563eb);
      M.emissiveIntensity = si === 3 ? .5 * pulse : .25;
      m.scale.set(1, 1, Math.max(.02, fill)); m.visible = fill > .01 || si === 4 || si === 0;
      let x = u.x, y = ty, z = 0, rx = 0;
      if (si === 4 || si === 0) {
        const a = sweep * Math.PI * 2; // finger lifts cube over front lip then drops
        if (a > 1.2) { const k = Math.min(1, (a - 1.2) / 1.8); z = lerp(0, 1.4, k); y = ty + Math.sin(k * Math.PI) * .9 - (a > 3 ? (a - 3) / 3.2 * 4.4 : 0); rx = k * 2; }
        m.scale.set(1, 1, 1);
      }
      m.position.set(x, Math.max(-3.6, y), z); m.rotation.x = rx;
    });
    air.forEach(m => { const u = m.userData, k = (u.o + t * .25) % 1; m.position.set(lerp(-5, 5, k), u.y, u.z); m.visible = si === 2; });
    // pile grows; full in step 5
    const lvl = si < 5 ? (si === 0 ? 50 : 28) : Math.floor(lerp(28, 70, ease(prog * 1.5)));
    pile.forEach(m => m.visible = m.userData.i < lvl);
    const full = si === 5 ? ease(prog * 1.5) : si === 6 ? 1 : 0;
    bail.rotation.z = lerp(0, .5, full);
    bailM.emissiveIntensity = si === 5 && prog > .5 ? .6 + .4 * pulse : 0;
    // camera
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const kk = si === 0 ? 1 : ease(lt / 1.4);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], kk))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], kk)));
    const ob = Math.sin(t * .25) * .08, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(ob) - dz * Math.sin(ob), cp.p.y, cp.q.z + dz * Math.cos(ob) + dx * Math.sin(ob));
    camera.lookAt(cp.q);
  }
  return { update };
}
