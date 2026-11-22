// Inside 60 — CPU. Steps: 0 hook (4 billion ticks), 1 transistors, 2 fetch, 3 decode, 4 execute (ALU -> registers), 5 cache + cores, 6 recap
export async function setup({ THREE, scene, camera }) {
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const ss = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x555555, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x0f1830); scene.fog = new THREE.Fog(0x0f1830, 30, 80);
  scene.add(new THREE.HemisphereLight(0xf4f6ff, 0x40404c, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.9); key.position.set(5, 10, 9); scene.add(key);
  const rim = new THREE.DirectionalLight(0xa0c8ff, .8); rim.position.set(-6, 2, -6); scene.add(rim);

  // ===== Chip (origin) =====
  const ch = new THREE.Group(); scene.add(ch);
  const subs = new THREE.Mesh(new RoundedBoxGeometry(6, .35, 6, 2, .1), Mat({ color: 0x1f6a46, shininess: 60 })); ch.add(subs);
  for (let s = 0; s < 4; s++) for (let k = 0; k < 9; k++) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(.18, .06, .35), Mat({ color: 0xe0b040, shininess: 160, emissive: 0x302000 }));
    const a = -2.4 + k * .6; const pos = [[a, 0, 3.1], [a, 0, -3.1], [3.1, 0, a], [-3.1, 0, a]][s];
    p.position.set(pos[0], -.05, pos[2]); if (s > 1) p.rotation.y = Math.PI / 2; ch.add(p);
  }
  const die = new THREE.Mesh(new RoundedBoxGeometry(4, .3, 4, 2, .06), Mat({ color: 0x2a2e3c, shininess: 120, specular: 0x8899bb })); die.position.y = .3; ch.add(die);
  // 4 cores + cache strip on die
  const coreMs = [], cores = [];
  [[-.95, -.55], [.95, -.55], [-.95, 1.0], [.95, 1.0]].forEach(([x, z]) => {
    const m = Mat({ color: 0x3060c0, emissive: 0x40a0ff, emissiveIntensity: .1, shininess: 100 }); coreMs.push(m);
    const c = new THREE.Mesh(new RoundedBoxGeometry(1.7, .12, 1.3, 1, .04), m); c.position.set(x, .5, z); ch.add(c); cores.push(c);
  });
  const cacheM = Mat({ color: 0x8a50c0, emissive: 0xc070ff, emissiveIntensity: .1 });
  const cache = new THREE.Mesh(new RoundedBoxGeometry(3.6, .12, .9, 1, .04), cacheM); cache.position.set(0, .5, -1.6); ch.add(cache);
  // tiny transistor lights on die
  const dotM = new THREE.MeshBasicMaterial({ color: 0x80f0ff });
  const dots = []; for (let i = 0; i < 12; i++) for (let j = 0; j < 12; j++) { const d = new THREE.Mesh(new THREE.BoxGeometry(.08, .02, .08), dotM); d.position.set(-1.65 + i * .3, .58, -1.65 + j * .3); ch.add(d); dots.push(d); }
  // clock ring
  const ringM = new THREE.MeshBasicMaterial({ color: 0xffe040, transparent: true, opacity: 0, depthWrite: false });
  const rings = [0, 1, 2].map(() => { const r = new THREE.Mesh(new THREE.TorusGeometry(1, .05, 8, 64), ringM.clone()); r.rotation.x = Math.PI / 2; r.position.y = .6; ch.add(r); return r; });

  // ===== Transistors (x = 22) =====
  const tr = new THREE.Group(); tr.position.set(22, 0, 0); scene.add(tr);
  const trs = [];
  for (let k = 0; k < 3; k++) {
    const g = new THREE.Group(); g.position.set((k - 1) * .6, 0, (k - 1) * 3.2); tr.add(g);
    const base = new THREE.Mesh(new RoundedBoxGeometry(2.8, .6, 1.8, 2, .06), Mat({ color: 0x5a6070 })); base.position.y = -.3; g.add(base);
    const sM = Mat({ color: 0xd06030 }); const s1 = new THREE.Mesh(new RoundedBoxGeometry(.7, .35, 1.6, 2, .05), sM); s1.position.set(-.95, .1, 0); g.add(s1);
    const s2 = s1.clone(); s2.position.x = .95; g.add(s2);
    const gM = Mat({ color: 0x3a70e0, emissive: 0x40a0ff, emissiveIntensity: 0 });
    const gate = new THREE.Mesh(new RoundedBoxGeometry(.9, .9, 1.6, 2, .06), gM); gate.position.y = .55; g.add(gate);
    const chM = new THREE.MeshBasicMaterial({ color: 0x80ff90, transparent: true, opacity: 0, depthWrite: false });
    const chan = new THREE.Mesh(new THREE.BoxGeometry(1.3, .12, 1.4), chM); chan.position.y = .02; g.add(chan);
    const ballM = new THREE.MeshBasicMaterial({ color: 0x80ff90, transparent: true, opacity: 0 });
    const balls = []; for (let b = 0; b < 4; b++) { const m = new THREE.Mesh(new THREE.SphereGeometry(.1, 8, 6), ballM); m.position.z = -.5 + b * .33; g.add(m); balls.push(m); }
    trs.push({ gM, chM, ballM, balls });
  }

  // ===== Pipeline (x = -24) =====
  const pl = new THREE.Group(); pl.position.set(-24, 0, 0); scene.add(pl);
  const mem = new THREE.Group(); mem.position.set(-4.2, 0, 0); pl.add(mem);
  for (let k = 0; k < 5; k++) { const r = new THREE.Mesh(new RoundedBoxGeometry(1.8, .42, 1.4, 2, .05), Mat({ color: 0x2a7f6a, emissive: 0x30ffc0, emissiveIntensity: .15 })); r.position.y = -1 + k * .5; mem.add(r); }
  const cuM = Mat({ color: 0x3060c0, emissive: 0x40a0ff, emissiveIntensity: .15 });
  const cu = new THREE.Mesh(new RoundedBoxGeometry(2, 2, 1.6, 3, .15), cuM); pl.add(cu);
  const aluM = Mat({ color: 0xd07020, emissive: 0xff9030, emissiveIntensity: .1 });
  const alu = new THREE.Mesh(new THREE.CylinderGeometry(.9, 1.3, 1.6, 4), aluM); alu.rotation.y = Math.PI / 4; alu.position.set(4.2, .2, 0); pl.add(alu);
  const regMs = []; for (let k = 0; k < 4; k++) { const m = Mat({ color: 0x8a50c0, emissive: 0xc070ff, emissiveIntensity: .1 }); regMs.push(m); const r = new THREE.Mesh(new RoundedBoxGeometry(.9, .3, .9, 1, .04), m); r.position.set(4.2 + (k - 1.5) * 1.0, -1.6, 1.2); pl.add(r); }
  const busM = new THREE.MeshBasicMaterial({ color: 0x80c0ff, transparent: true, opacity: .35 });
  [[-3.2, -1.1], [1.1, 3.2]].forEach(([a, b]) => { const bus = new THREE.Mesh(new THREE.BoxGeometry(b - a, .08, .08), busM); bus.position.set((a + b) / 2, .2, 0); pl.add(bus); });
  const tokM = Mat({ color: 0xffe040, emissive: 0xffc000, emissiveIntensity: .6 });
  const tok = new THREE.Mesh(new RoundedBoxGeometry(.9, .45, .6, 2, .08), tokM); pl.add(tok);
  const parts = [0, 1, 2].map(k => { const m = new THREE.Mesh(new RoundedBoxGeometry(.35, .35, .35, 1, .06), Mat({ color: [0xff6060, 0x60ff90, 0x60a0ff][k], emissive: [0xff2020, 0x20ff60, 0x2070ff][k], emissiveIntensity: .5 })); pl.add(m); return m; });

  const shots = [
    [[6.0, 10.0, 11.0], [0, .3, 0]],        // 0 chip
    [[24.5, 7.5, 12.0], [22, .2, 0]],        // 1 transistors
    [[-27.0, 3.5, 12.5], [-26.1, .2, 0]],     // 2 fetch
    [[-23.0, 3.4, 9.5], [-24, .5, 0]],        // 3 decode
    [[-20.5, 3.8, 12.5], [-20.4, -.3, 0]],    // 4 execute
    [[3.0, 9.0, 7.5], [0, .4, 0]],           // 5 cores
    [[6.5, 11.0, 12.0], [0, .3, 0]],         // 6 recap
  ];
  const cp = { p: V(), q: V() };
  function update(t, si, lt, sd) {
    const pulse = .5 + .5 * Math.sin(t * 6); const D = sd || 5;
    ch.rotation.y = Math.sin(t * .3) * .12;
    dots.forEach((d, k) => { d.visible = ((k * 13 + Math.floor(t * 8)) % 3) !== 0; });
    rings.forEach((r, k) => { const u = (t * 1.2 + k / 3) % 1; r.scale.setScalar(.5 + u * 4); r.material.opacity = (si === 0 || si === 6) ? (1 - u) * .9 : 0; });
    coreMs.forEach((m, k) => { m.emissiveIntensity = si === 5 ? .3 + .7 * (.5 + .5 * Math.sin(t * 7 + k * 1.6)) : si === 6 ? .6 : .1; });
    cacheM.emissiveIntensity = si === 5 ? .4 + .5 * pulse : .1;
    // transistors toggle
    trs.forEach((o, k) => {
      const on = si === 1 ? Math.sin(t * 3 + k * 2.1) > 0 : false;
      o.gM.emissiveIntensity = on ? 1 : 0; o.chM.opacity = on ? .7 : 0; o.ballM.opacity = on ? 1 : 0;
      o.balls.forEach((b, j) => { b.position.x = -1 + ((t * 1.5 + j * .27) % 1) * 2; b.position.y = .1; });
    });
    // pipeline token
    let tp = V(-4.2, 1.2, 0), split = 0;
    if (si === 2) { const u = ss(.6, D - .8, lt); tp = V(lerp(-4.2, 0, u), lerp(1.2, .2, Math.min(1, u * 3)) + Math.sin(u * Math.PI) * .6, 0); }
    else if (si === 3) { tp = V(0, 1.6, 0); split = ss(.8, 2.2, lt); }
    else if (si === 4) { const u = ss(.4, D * .55, lt); tp = V(lerp(0, 4.2, u), 1.2 + Math.sin(u * Math.PI) * .5, 0); split = 1 - ss(.0, .5, u); }
    else if (si >= 5) tp = V(4.2, -1.6, 1.2);
    tok.position.copy(tp); tok.rotation.y = si === 3 ? lt * 2 : 0;
    tok.visible = si >= 2 && si <= 4 && !(si === 3 && split > .9);
    parts.forEach((m, k) => { m.visible = si === 3 || (si === 4 && split > .05); m.position.set(tp.x + (k - 1) * 1.0 * split, tp.y + .2 * split, tp.z); m.rotation.y = t * 2; });
    cuM.emissiveIntensity = si === 3 ? .5 + .6 * pulse : si === 2 ? .3 : .15;
    aluM.emissiveIntensity = si === 4 ? .4 + .8 * pulse : .1;
    regMs.forEach((m, k) => { m.emissiveIntensity = si === 4 && lt > D * .6 && k === 1 ? 1 : .1; });
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
