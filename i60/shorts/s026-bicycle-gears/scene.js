// Inside 60 — Bicycle gears. Steps: 0 hook, 1 chain, 2 low gear, 3 high gear, 4 derailleur shift, 5 ratio, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 70, specular: 0x555555, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x16202e);
  scene.fog = new THREE.Fog(0x16202e, 30, 80);
  scene.add(new THREE.HemisphereLight(0xeaf2ff, 0x2a3030, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(5, 9, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0x88ccff, .9); rim.position.set(-7, 4, -8); scene.add(rim);

  const PITCH = 0.08; // radius per tooth
  function gear(T, color, emissive) {
    const r = T * PITCH / (2 * Math.PI) * 2.0, s = new THREE.Shape();
    const ro = r + .09, ri = r - .06;
    for (let i = 0; i < T; i++) {
      const a0 = i / T * Math.PI * 2, a1 = (i + .3) / T * Math.PI * 2, a2 = (i + .5) / T * Math.PI * 2, a3 = (i + .8) / T * Math.PI * 2;
      const P = (rr, a) => [Math.cos(a) * rr, Math.sin(a) * rr];
      if (i === 0) s.moveTo(...P(ri, a0)); else s.lineTo(...P(ri, a0));
      s.lineTo(...P(ro, a1)); s.lineTo(...P(ro, a2)); s.lineTo(...P(ri, a3));
    }
    s.closePath();
    const h = new THREE.Path(); h.absarc(0, 0, Math.max(.12, r * .35), 0, Math.PI * 2, true); s.holes.push(h);
    const m = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: .1, bevelEnabled: false, curveSegments: 6 }), Mat({ color, emissive: emissive || 0x000000, emissiveIntensity: 0 }));
    m.geometry.translate(0, 0, -.05);
    return { m, r };
  }
  const FX = -2.5, RX = 1.8; // front & rear axle x
  const front = gear(50, 0xd0d6de); const ring = new THREE.Group(); ring.position.set(FX, 0, 0); ring.add(front.m); scene.add(ring);
  const R1 = front.r;
  // spider arms + crank + pedal
  for (let i = 0; i < 5; i++) { const a = new THREE.Mesh(new THREE.BoxGeometry(.14, R1 * .7, .08), Mat({ color: 0x9aa2ae })); const g = new THREE.Group(); g.rotation.z = i / 5 * Math.PI * 2; a.position.y = R1 * .38; g.add(a); ring.add(g); }
  const crankArm = new THREE.Mesh(new THREE.BoxGeometry(.32, 2.4, .16), Mat({ color: 0x404650 })); crankArm.position.set(0, -1.1, .22); ring.add(crankArm);
  const pedal = new THREE.Mesh(new THREE.BoxGeometry(.5, .2, .9), Mat({ color: 0x2a2e34 })); pedal.position.set(0, -2.2, .7); ring.add(pedal);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(.25, .25, .6, 20), Mat({ color: 0x707884 })); hub.rotation.x = Math.PI / 2; ring.add(hub);

  const TEETH = [32, 28, 25, 22, 19, 17, 15, 13, 11];
  const ZS = .17; // cog spacing
  const cass = new THREE.Group(); cass.position.set(RX, 0, 0); scene.add(cass);
  const cogs = TEETH.map((T, i) => { const g = gear(T, 0xc8b070, 0xffd040); g.m.position.z = -(8 - i) * ZS; cass.add(g.m); return g; });
  // wheel (hub, spokes, rim, tire)
  const wheel = new THREE.Group(); wheel.position.set(RX, 0, -1.5); scene.add(wheel);
  const WR = 3.0;
  const tire = new THREE.Mesh(new THREE.TorusGeometry(WR, .16, 10, 80), Mat({ color: 0x24282e, shininess: 10 })); wheel.add(tire);
  const rimM = new THREE.Mesh(new THREE.TorusGeometry(WR - .22, .07, 6, 80), Mat({ color: 0x9aa4b2 })); wheel.add(rimM);
  for (let i = 0; i < 16; i++) { const s = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, WR - .3, 4), Mat({ color: 0xb0b8c2 })); const g = new THREE.Group(); g.rotation.z = i / 16 * Math.PI * 2; s.position.y = (WR - .3) / 2; g.add(s); wheel.add(g); }
  const valveMark = new THREE.Mesh(new THREE.SphereGeometry(.22, 12, 8), Mat({ color: 0xff5040, emissive: 0xff3020, emissiveIntensity: .5 })); valveMark.position.y = WR - .25; wheel.add(valveMark);
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, 2.2, 10), Mat({ color: 0x707884 })); axle.rotation.x = Math.PI / 2; axle.position.set(RX, 0, -.8); scene.add(axle);

  // derailleur: cage with two jockey wheels hanging below rear cogs
  const der = new THREE.Group(); scene.add(der);
  const derM = Mat({ color: 0x505866, emissive: 0x40c0ff, emissiveIntensity: 0 });
  const cage = new THREE.Mesh(new THREE.BoxGeometry(.18, 1.5, .05), derM); cage.position.set(0, -.75, .12); der.add(cage);
  const jw1 = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .1, 14), Mat({ color: 0x30343a })); jw1.rotation.x = Math.PI / 2; der.add(jw1);
  const jw2 = jw1.clone(); jw2.position.y = -1.4; der.add(jw2);
  const body = new THREE.Mesh(new THREE.BoxGeometry(.5, .5, .5), derM); body.position.set(.35, .25, -.35); der.add(body);

  // chain links
  const N = 110, links = [];
  const lg = new THREE.BoxGeometry(.15, .09, .1), lmA = Mat({ color: 0x8a909a }), lmB = Mat({ color: 0x5a606a });
  for (let i = 0; i < N; i++) { const m = new THREE.Mesh(lg, i % 2 ? lmA : lmB); scene.add(m); links.push(m); }
  // chain path: top line ring->cog, around cog (right), lower run via derailleur jockeys, back to ring (left wrap)
  function chainPath(r2, zc, out) {
    const pts = [];
    const arc = (cx, cy, r, a0, a1, z0, z1, n) => { for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); pts.push(V(cx + Math.cos(a) * r, cy + Math.sin(a) * r, lerp(z0, z1, i / n))); } };
    arc(FX, 0, R1, Math.PI, Math.PI / 2, 0, 0, 24);            // ring left->top
    arc(RX, 0, r2, Math.PI / 2, -Math.PI / 2 + .3, zc, zc, 18);  // over the cog
    const j1 = V(RX + .05, -r2 - .55, zc), j2 = V(RX - .25, -r2 - 1.9, zc);
    pts.push(j1, V(RX - .35, -r2 - 1.4, zc), j2);
    arc(FX, 0, R1, -Math.PI / 2, -Math.PI, 0, 0, 24);         // ring bottom->left
    out.pts = pts; out.j1 = j1; out.j2 = j2;
    return new THREE.CatmullRomCurve3(pts, true, 'centripetal');
  }
  const shots = [
    [[7.5, 3.5, 21], [-.2, 0, -.4]],
    [[-6, 2.5, 13], [-1.6, .1, 0]],
    [[8, 2.5, 8], [1.6, 0, -.6]],
    [[5, 4, 9], [1.6, 0, -.6]],
    [[7, -.5, 8.5], [1.7, -.8, -.6]],
    [[1.5, 1.5, 18], [-.3, 0, -.3]],
    [[-6.5, 3.5, 20], [-.2, 0, -.4]],
  ];
  const cp = { p: V(), q: V() };
  let pedalA = 0, wheelA = 0, chainU = 0, lastT = 0, curCog = 8;
  const tmp = V(), tmp2 = V();
  function update(t, si, lt) {
    const dt = Math.min(.1, Math.max(0, t - lastT)); lastT = t;
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const k = si === 0 ? 1 : ease(lt / 1.3);
    cp.p.set(...prev[0].map((v, i) => lerp(v, now[0][i], k))); cp.q.set(...prev[1].map((v, i) => lerp(v, now[1][i], k)));
    const o = Math.sin(t * .2) * .1, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o)); camera.lookAt(cp.q);
    // which cog (continuous for shifting)
    let c;
    if (si === 0) c = 8; else if (si === 1) c = 4; else if (si === 2) c = 0; else if (si === 3) c = 8;
    else if (si === 4) c = lt < 1 ? 8 : 8 - Math.min(8, Math.floor((lt - 1) / .45)) ; else c = 8;
    if (si === 6) c = 4 + 4 * Math.round(.5 + .5 * Math.sin(t * .8));
    curCog += (c - curCog) * Math.min(1, dt * 7);
    const ci = Math.max(0, Math.min(8, curCog)), i0 = Math.floor(ci), i1 = Math.min(8, i0 + 1), f = ci - i0;
    const r2 = lerp(cogs[i0].r, cogs[i1].r, f), zc = -(8 - ci) * ZS;
    const info = {}; const curve = chainPath(r2, zc, info);
    // speeds
    const cad = si === 3 ? 1.6 : si === 2 ? 1.8 : 1.4; // pedal rad/s
    pedalA += cad * dt; ring.rotation.z = -pedalA;
    const ratio = R1 / r2; wheelA += cad * ratio * dt; cass.rotation.z = -wheelA; wheel.rotation.z = -wheelA;
    chainU += cad * R1 * dt;
    const L = curve.getLength();
    for (let i = 0; i < N; i++) {
      const u = (((i / N) * L - chainU) % L + L) % L / L;
      curve.getPointAt(u, tmp); curve.getTangentAt(u, tmp2);
      links[i].position.copy(tmp); links[i].rotation.z = Math.atan2(tmp2.y, tmp2.x);
    }
    der.position.set(info.j1.x, info.j1.y, zc); jw2.position.set(info.j2.x - info.j1.x, info.j2.y - info.j1.y, 0);
    cage.position.set((info.j2.x - info.j1.x) / 2, (info.j2.y - info.j1.y) / 2, .1); cage.rotation.z = Math.atan2(info.j2.x - info.j1.x, -(info.j2.y - info.j1.y));
    derM.emissiveIntensity = si === 4 ? .6 + .3 * Math.sin(t * 8) : 0;
    cogs.forEach((g, i) => { g.m.material.emissiveIntensity = Math.abs(i - ci) < .5 ? (si === 5 || si === 2 || si === 3 ? .55 : .25) : 0; });
    front.m.material.emissive = new THREE.Color(0xffd040); front.m.material.emissiveIntensity = si === 5 || si === 1 ? .35 : 0;
  }
  return { update };
}
