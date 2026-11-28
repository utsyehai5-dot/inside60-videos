// Inside 60 — Gas stove burner (cutaway). Steps: 0 hook hot flame, 1 knob valve + jet, 2 air drawn in (venturi),
// 3 mix exits ring of ports, 4 igniter spark, flame runs round ring, 5 clean blue flame (vs yellow), 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 70, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const V2 = (x, y) => new THREE.Vector2(x, y);
  const rnd = (() => { let s = 23; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  scene.background = new THREE.Color(0x161d2b);
  scene.add(new THREE.HemisphereLight(0xfff4ea, 0x404050, 1.4));
  const key = new THREE.DirectionalLight(0xffffff, .9); key.position.set(5, 10, 8); scene.add(key);
  const root = new THREE.Group(); scene.add(root);

  // stovetop plate (cut away front half so we see below)
  const top = new THREE.Mesh(new THREE.BoxGeometry(12, .2, 4), Mat({ color: 0x374151, shininess: 90 })); top.position.set(0, 0, -2.6); root.add(top);
  // burner head: lathe cup, y 0..0.7, radius 1.6
  const headM = Mat({ color: 0x9ca3af, emissive: 0x22d3ee, emissiveIntensity: 0, shininess: 100, side: THREE.DoubleSide });
  root.add(new THREE.Mesh(new THREE.LatheGeometry([V2(.4, -.4), V2(1.6, -.1), V2(1.7, .5), V2(1.6, .7), V2(0, .75)], 48), headM));
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.75, .18, 48), Mat({ color: 0x1f2937, shininess: 60 })); cap.position.y = .86; root.add(cap);
  // ports: 24 small dark holes around rim at y .55
  const NP = 24, portM = Mat({ color: 0x0b0f17 });
  for (let i = 0; i < NP; i++) { const a = i / NP * Math.PI * 2; const p = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, .12, 8), portM); p.rotation.z = Math.PI / 2; p.rotation.y = -a; p.position.set(Math.cos(a) * 1.69, .55, Math.sin(a) * 1.69); root.add(p); }
  // grate over burner
  const grateM = Mat({ color: 0x111827, shininess: 40 });
  for (let i = 0; i < 4; i++) { const g = new THREE.Mesh(new THREE.BoxGeometry(5.5, .2, .2), grateM); g.rotation.y = i * Math.PI / 4; g.position.y = 2.1; root.add(g); }
  // pan above
  const pan = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.3, .8, 48, 1, true), Mat({ color: 0x475569, side: THREE.DoubleSide, shininess: 110 })); pan.position.y = 2.65; root.add(pan);
  const panBot = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, .1, 48), Mat({ color: 0x1f2937, emissive: 0xff5500, emissiveIntensity: 0 })); panBot.position.y = 2.25; root.add(panBot);

  // mixing tube (venturi) below: horizontal from x=-6 to burner centre at y -1.2 then bend up
  const tubeM = Mat({ color: 0x94a3b8, transparent: true, opacity: .35, side: THREE.DoubleSide, depthWrite: false });
  const path = new THREE.CatmullRomCurve3([V(-5.2, -1.4, 0), V(-3, -1.4, 0), V(-1, -1.4, 0), V(0, -1.1, 0), V(0, -.4, 0)]);
  root.add(new THREE.Mesh(new THREE.TubeGeometry(path, 80, .55, 20, false), tubeM));
  // air inlet opening ring at mouth
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(.6, .08, 8, 30), Mat({ color: 0x64748b })); mouth.rotation.y = Math.PI / 2; mouth.position.set(-5.2, -1.4, 0); root.add(mouth);
  // gas pipe + valve + jet nozzle
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, 3, 16), Mat({ color: 0xb45309, shininess: 100 })); pipe.rotation.z = Math.PI / 2; pipe.position.set(-7.9, -1.4, 0); root.add(pipe);
  const valveM = Mat({ color: 0xd97706, emissive: 0xfacc15, emissiveIntensity: 0 });
  const valve = new THREE.Mesh(new THREE.BoxGeometry(.9, .9, .9), valveM); valve.position.set(-7.6, -1.4, 0); root.add(valve);
  const knob = new THREE.Group(); knob.position.set(-7.6, -1.4, 1.3); root.add(knob);
  const kb = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, .5, 28), Mat({ color: 0xe5e7eb })); kb.rotation.x = Math.PI / 2; knob.add(kb);
  const kbar = new THREE.Mesh(new THREE.BoxGeometry(.9, .2, .3), Mat({ color: 0x111827 })); kbar.position.z = .3; knob.add(kbar);
  const jet = new THREE.Mesh(new THREE.ConeGeometry(.22, .5, 16), Mat({ color: 0xfbbf24, shininess: 120 })); jet.rotation.z = -Math.PI / 2; jet.position.set(-6.1, -1.4, 0); root.add(jet);

  // particles along the path: gas (yellow-green) and air (light blue)
  const gasM = Mat({ color: 0xbef264, emissive: 0x84cc16, emissiveIntensity: .9 });
  const airM = Mat({ color: 0xe0f2fe, emissive: 0x7dd3fc, emissiveIntensity: .7 });
  const mk = (m, n, r) => Array.from({ length: n }, () => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), m); s.userData = { o: rnd(), a: rnd() * 6.283, r: rnd() * .4, p: Math.floor(rnd() * NP) }; root.add(s); return s; });
  const gas = mk(gasM, 70, .07), air = mk(airM, 70, .08);
  const along = (k, u) => { const p = path.getPointAt(Math.min(1, k)); return [p.x + (p.x < -.5 ? 0 : Math.cos(u.a) * u.r * .6), p.y + (p.x < -.5 ? Math.sin(u.a) * u.r : 0), p.z + Math.cos(u.a) * u.r]; };
  // flames: one cone per port, pointing outward-up
  const flameM = Mat({ color: 0x60a5fa, emissive: 0x2563eb, emissiveIntensity: 1, transparent: true, opacity: .85, depthWrite: false });
  const innerM = Mat({ color: 0xbfdbfe, emissive: 0x93c5fd, emissiveIntensity: 1, transparent: true, opacity: .9, depthWrite: false });
  const flames = [];
  for (let i = 0; i < NP; i++) {
    const a = i / NP * Math.PI * 2, g = new THREE.Group();
    g.position.set(Math.cos(a) * 1.75, .55, Math.sin(a) * 1.75); g.rotation.y = -a;
    const f = new THREE.Mesh(new THREE.ConeGeometry(.16, .9, 12), flameM); f.rotation.z = -Math.PI / 2 + .9; f.position.set(.3, .3, 0); g.add(f);
    const fi = new THREE.Mesh(new THREE.ConeGeometry(.08, .4, 10), innerM); fi.rotation.z = -Math.PI / 2 + .9; fi.position.set(.15, .15, 0); g.add(fi);
    g.userData = { a, f }; root.add(g); flames.push(g);
  }
  // escaping mix particles at ports (step 3)
  const mix = mk(Mat({ color: 0xd9f99d, emissive: 0xa3e635, emissiveIntensity: .7 }), 60, .05);
  // igniter: white ceramic rod with spark
  const ign = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, 1, 12), Mat({ color: 0xf8fafc })); ign.position.set(1.95, .4, 1.0); root.add(ign);
  const sparkM = Mat({ color: 0xffffff, emissive: 0xc4b5fd, emissiveIntensity: 1 });
  const spark = new THREE.Mesh(new THREE.OctahedronGeometry(.22), sparkM); spark.position.set(1.85, .95, .95); root.add(spark);

  const shots = [
    [[3.0, 1.5, 10.5], [0, .9, 0]],      // 0 flame wide
    [[-6.2, .5, 5.2], [-7.0, -1.4, 0]],   // 1 knob valve jet
    [[-3.5, .4, 5.5], [-4.6, -1.4, 0]],   // 2 air drawn in
    [[2.2, 1.4, 5.5], [0, .4, 0]],        // 3 ports
    [[3.4, 2.0, 4.8], [1.2, .6, .6]],     // 4 igniter
    [[2.6, 1.3, 6.5], [0, .7, 0]],        // 5 blue flame
    [[3.0, 1.5, 10.5], [0, .9, 0]],      // 6 recap
  ];
  const cp = { p: V(), q: V() };
  function update(t, si, lt, sd) {
    const pulse = .5 + .5 * Math.sin(t * 7);
    const prog = sd > 0 ? Math.min(1, lt / sd) : 0;
    knob.rotation.z = si === 1 ? -ease(lt / 1.5) * 1.5 : -1.5;
    valveM.emissiveIntensity = si === 1 ? .3 + .4 * pulse : 0;
    headM.emissiveIntensity = si === 3 ? .25 + .25 * pulse : 0;
    const flowOn = si >= 1, airOn = si >= 2 || si === 0;
    gas.forEach(m => { const u = m.userData, k = (u.o + t * .5) % 1; const kk = si === 1 ? Math.min(k, .18) : k; m.position.set(...along(kk * 1.0, u)); if (si === 1) m.position.x = lerp(-6.0, -5.2, k); m.visible = flowOn || si === 0; });
    air.forEach(m => { const u = m.userData, k = (u.o + t * .45) % 1; if (k < .3) { const q = k / .3; m.position.set(-5.4 - (1 - q) * 1.2, -1.4 + Math.sin(u.a) * (1.6 - q * 1.1), Math.cos(u.a) * (1.6 - q * 1.1)); } else m.position.set(...along((k - .3) / .7, u)); m.visible = airOn && si !== 1; });
    // escaping mix at ports
    const lit = si === 0 || si >= 5 ? 1 : si === 4 ? Math.min(1, Math.max(0, (lt - .8) / 1.5)) : 0;
    mix.forEach(m => { const u = m.userData, k = (u.o + t * .9) % 1, a = u.p / NP * Math.PI * 2, r = 1.75 + k * .8; m.position.set(Math.cos(a) * r, .55 + k * .3, Math.sin(a) * r); m.visible = si === 3; });
    // flames: during step 4 they light around the ring from the igniter (angle ~0.48)
    flames.forEach(g => {
      let d = ((g.userData.a - .48) + Math.PI * 4) % (Math.PI * 2); d = Math.min(d, Math.PI * 2 - d) / Math.PI; // 0..1
      const on = si === 4 ? (lit > d ? 1 : 0) : lit;
      const fl = 1 + .15 * Math.sin(t * 20 + g.userData.a * 5);
      g.visible = on > 0; g.scale.set(fl, fl, fl);
    });
    // step 5: flame goes from yellowish (low air) to blue
    const blue = si === 5 ? ease(prog * 1.6) : 1;
    flameM.color.setRGB(lerp(1, .2, blue), lerp(.75, .45, blue), lerp(.2, 1, blue));
    flameM.emissive.setRGB(lerp(.95, .05, blue), lerp(.5, .2, blue), lerp(.05, .8, blue));
    panBot.material.emissiveIntensity = lit * .12;
    spark.visible = si === 4 && lt < 2.6 && pulse > .5; spark.scale.setScalar(.6 + pulse);
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
