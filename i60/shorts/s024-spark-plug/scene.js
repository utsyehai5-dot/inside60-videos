// Inside 60 — Spark plug. Steps: 0 hook, 1 battery, 2 coil, 3 gap spark, 4 ignition, 5 piston down, 6 recap
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 60, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x161a30);
  scene.fog = new THREE.Fog(0x161a30, 30, 80);
  scene.add(new THREE.HemisphereLight(0xeaf2ff, 0x30302a, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(6, 10, 9); scene.add(key);
  const rim = new THREE.DirectionalLight(0x88ccff, .9); rim.position.set(-7, 5, -6); scene.add(rim);

  // spark plug (vertical, tip at y=0)
  const plug = new THREE.Group(); scene.add(plug);
  const ins = new THREE.LatheGeometry([[.0, 1.1], [.32, 1.1], [.36, 1.6], [.36, 3.3], [.26, 3.6], [.26, 4.0], [0, 4.0]].map(p => new THREE.Vector2(p[0], p[1])), 40);
  plug.add(new THREE.Mesh(ins, Mat({ color: 0xf4f2ec, shininess: 100 })));
  for (let i = 0; i < 5; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(.36, .035, 8, 30), Mat({ color: 0xdedad0 })); r.rotation.x = Math.PI / 2; r.position.y = 2.1 + i * .25; plug.add(r); }
  const hex = new THREE.Mesh(new THREE.CylinderGeometry(.62, .62, .55, 6), Mat({ color: 0xc0c6ce, shininess: 120 })); hex.position.y = 1.3; plug.add(hex);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, .9, 30), Mat({ color: 0xb0b6be, shininess: 120 })); body.position.y = .55; plug.add(body);
  for (let i = 0; i < 7; i++) { const th = new THREE.Mesh(new THREE.TorusGeometry(.43, .04, 6, 30), Mat({ color: 0x9aa0a8 })); th.rotation.x = Math.PI / 2; th.position.y = .2 + i * .11; plug.add(th); }
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, .4, 16), Mat({ color: 0xc8ccd4 })); cap.position.y = 4.15; plug.add(cap);
  const centerM = Mat({ color: 0xd8b060, emissive: 0x60b0ff, emissiveIntensity: 0, shininess: 120 });
  const center = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 4.2, 12), centerM); center.position.y = 2.0; plug.add(center);
  const tipC = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .35, 12), centerM); tipC.position.y = -.12; plug.add(tipC);
  const gm = Mat({ color: 0xa8aeb6 });
  const g1 = new THREE.Mesh(new THREE.BoxGeometry(.12, .55, .16), gm); g1.position.set(.36, -.1, 0); plug.add(g1);
  const g2 = new THREE.Mesh(new THREE.BoxGeometry(.48, .12, .16), gm); g2.position.set(.16, -.42, 0); plug.add(g2);

  // cylinder + piston below
  const cylM = Mat({ color: 0x7aa0d0, transparent: true, opacity: .2, depthWrite: false, side: THREE.DoubleSide });
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 4.2, 40, 1, true), cylM); cyl.position.y = -2.2; scene.add(cyl);
  const headM = Mat({ color: 0x6a7484, transparent: true, opacity: .55 });
  const head = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.0, .3, 40), headM); head.position.y = .05; scene.add(head);
  const piston = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, .9, 40), Mat({ color: 0xc0c6ce, shininess: 100 })); scene.add(piston);
  const rod = new THREE.Mesh(new THREE.BoxGeometry(.35, 2.4, .35), Mat({ color: 0x8a929e })); scene.add(rod);
  const mixM = new THREE.MeshBasicMaterial({ color: 0x80c8ff, transparent: true, opacity: 0, depthWrite: false });
  const mix = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.75, 1, 40), mixM); scene.add(mix);
  const fireM = new THREE.MeshBasicMaterial({ color: 0xff8020, transparent: true, opacity: 0, depthWrite: false });
  const fire = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), fireM); fire.position.y = -.5; scene.add(fire);

  // battery + coil
  const bat = new THREE.Group(); bat.position.set(-6.2, 1.2, 0); scene.add(bat);
  const batM = Mat({ color: 0x3a4250, emissive: 0x40ff90, emissiveIntensity: 0 });
  bat.add(new THREE.Mesh(new RoundedBoxGeometry(2.0, 1.4, 1.2, 3, .1), batM));
  for (const [x, c] of [[-.5, 0xff4040], [.5, 0x4060ff]]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, .25, 14), Mat({ color: c })); t.position.set(x, .8, 0); bat.add(t); }
  const coilG = new THREE.Group(); coilG.position.set(-2.8, 4.6, 0); scene.add(coilG);
  const coilM = Mat({ color: 0xd08a30, emissive: 0xffa030, emissiveIntensity: 0 });
  coilG.add(new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, 1.6, 24), Mat({ color: 0x2a3040 })));
  for (let i = 0; i < 12; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(.58, .05, 6, 24), coilM); r.rotation.x = Math.PI / 2; r.position.y = -.65 + i * .12; coilG.add(r); }
  const w1 = new THREE.CatmullRomCurve3([V(-5.7, 2.05, 0), V(-5.2, 3.5, 0), V(-3.8, 4.4, 0), V(-3.35, 4.4, 0)]);
  const w2 = new THREE.CatmullRomCurve3([V(-2.8, 5.4, 0), V(-2.3, 6.0, 0), V(-.6, 5.6, 0), V(0, 4.4, 0)]);
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(w1, 40, .06, 8, false), Mat({ color: 0xc04040 })));
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(w2, 40, .11, 8, false), Mat({ color: 0x303844 })));
  const pg = new THREE.SphereGeometry(.09, 8, 6);
  const mk = (n, c) => Array.from({ length: n }, () => { const m = new THREE.Mesh(pg, new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0 })); scene.add(m); return m; });
  const p1 = mk(10, 0x70ff90), p2 = mk(18, 0x80d8ff);
  // spark bolt
  const boltM = new THREE.MeshBasicMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0 });
  const bolt = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .1, 6), boltM); scene.add(bolt);
  const boltGlowM = new THREE.MeshBasicMaterial({ color: 0x60b0ff, transparent: true, opacity: 0, depthWrite: false });
  const boltGlow = new THREE.Mesh(new THREE.SphereGeometry(.22, 12, 8), boltGlowM); boltGlow.position.set(0, -.33, 0); scene.add(boltGlow);

  const shots = [
    [[6, 2.5, 15.5], [-.6, -.2, 0]],
    [[-6, 3.6, 6.2], [-6.2, 1.4, 0]],
    [[-1.5, 6.2, 7], [-2.4, 4.6, 0]],
    [[1.1, -.1, 2.6], [.1, -.3, 0]],
    [[4, .8, 9.5], [0, -.3, 0]],
    [[5, .2, 11], [0, -1.0, 0]],
    [[6, 2.5, 16], [-.6, -.2, 0]],
  ];
  const cp = { p: V(), q: V() }; const tmp = V();
  function update(t, si, lt) {
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const k = si === 0 ? 1 : ease(lt / 1.3);
    cp.p.set(...prev[0].map((v, i) => lerp(v, now[0][i], k))); cp.q.set(...prev[1].map((v, i) => lerp(v, now[1][i], k)));
    const o = Math.sin(t * .2) * .08, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o)); camera.lookAt(cp.q);
    const pulse = .4 + .3 * Math.sin(t * 6);
    // engine cycle: phase 0..1, spark at 0
    const rate = si === 0 || si === 6 ? .9 : si === 4 || si === 5 ? .45 : .6;
    const ph = (t * rate) % 1;
    let py;
    if (si === 5) { py = -1.0 - 2.4 * ease(Math.min(1, lt / 1.6)); }
    else py = -1.0 - 2.4 * (.5 - .5 * Math.cos(ph * Math.PI * 2));
    piston.position.y = py - .45; rod.position.y = py - 2.1;
    mix.scale.y = Math.max(.05, -py - .15); mix.position.y = (py - .15) / 2 - .075 + .0;
    const sparkNow = si === 5 ? false : (ph < .06);
    const sparkOn = si === 3 ? (Math.sin(t * 22) > .2) : (si !== 1 && si !== 2) && sparkNow;
    boltM.opacity = sparkOn ? 1 : 0; boltGlowM.opacity = sparkOn ? .7 : 0;
    bolt.position.set(.04 + .03 * Math.sin(t * 50), -.33, 0); bolt.scale.y = 1.2; bolt.rotation.z = .2 * Math.sin(t * 37);
    batM.emissiveIntensity = si === 1 ? pulse * .7 : .05;
    coilM.emissiveIntensity = si === 2 ? pulse + .2 : .05;
    centerM.emissiveIntensity = si === 3 ? .8 : sparkOn ? .6 : 0;
    p1.forEach((p, i) => { const u = (i / p1.length + t * .4) % 1; w1.getPointAt(u, tmp); p.position.copy(tmp); p.material.opacity = si === 1 || si === 2 ? 1 : 0; });
    p2.forEach((p, i) => { const u = (i / p2.length + t * 1.2) % 1; w2.getPointAt(u, tmp); p.position.copy(tmp); p.material.opacity = si === 2 ? 1 : 0; });
    // fire
    let f = 0;
    if (si === 4) f = Math.max(0, 1 - ((lt * .7) % 1.4));
    else if (si === 5) f = Math.max(0, 1 - lt / 2.2);
    else if (si === 0 || si === 6) f = ph < .25 ? 1 - ph / .25 : 0;
    fireM.opacity = f * .85; const fs = .5 + 1.2 * (1 - f); fire.scale.set(fs, fs * .6, fs); fire.position.y = -.35 - .2 * (1 - f);
    fireM.color.setHex(f > .6 ? 0xffd060 : 0xff6020);
    mixM.opacity = si === 4 && f < .2 ? .25 : si === 4 || si === 5 ? .08 : .15;
    mixM.color.setHex(si === 5 ? 0xff7030 : 0x80c8ff);
  }
  return { update };
}
