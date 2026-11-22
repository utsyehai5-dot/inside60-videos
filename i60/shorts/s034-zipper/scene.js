// Inside 60 — Zipper. Steps: 0 hook, 1 tooth bump/hollow, 2 slider Y channel, 3 closing, 4 interlock, 5 opening (wedge), 6 recap
export async function setup({ THREE, scene, camera }) {
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const ss = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x555555, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x1d2a44); scene.fog = new THREE.Fog(0x1d2a44, 25, 70);
  scene.add(new THREE.HemisphereLight(0xf0f4ff, 0x40404c, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 1.9); key.position.set(4, 8, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0xa0c0ff, .8); rim.position.set(-6, -3, -6); scene.add(rim);

  const Y0 = -5.5, Y1 = 5.5, P = .3, TW = 2.4;
  // tapes (fabric) — plane meshes whose inner edge follows the opening
  const tapeMats = [0x2e7de0, 0xe0453a].map(c => Mat({ color: c, shininess: 20, specular: 0x111111, side: THREE.DoubleSide }));
  const tapes = [-1, 1].map((s, i) => { const g = new THREE.PlaneGeometry(TW, Y1 - Y0, 1, 80); const m = new THREE.Mesh(g, tapeMats[i]); scene.add(m); const base = g.attributes.position.array.slice(); return { s, g, m, base }; });
  // teeth
  const toothM = Mat({ color: 0xd8dde6, shininess: 130, specular: 0x888888 });
  const toothG = new RoundedBoxGeometry(.42, P * .52, .2, 3, .05);
  const bumpM = Mat({ color: 0xffd23a, emissive: 0xffa000, emissiveIntensity: 0 });
  const holeM = Mat({ color: 0x20242c, emissive: 0x00c8ff, emissiveIntensity: 0 });
  const teeth = [];
  [-1, 1].forEach(s => { for (let y = Y0 + .2 + (s > 0 ? P / 2 : 0); y < Y1 - .2; y += P) {
    const g = new THREE.Group(); scene.add(g);
    g.add(new THREE.Mesh(toothG, toothM));
    const b = new THREE.Mesh(new THREE.SphereGeometry(.055, 12, 8), bumpM); b.position.set(-s * .1, 0, .1); g.add(b);
    const h = new THREE.Mesh(new THREE.CircleGeometry(.05, 12), holeM); h.position.set(-s * .1, 0, -.101); h.rotation.y = Math.PI; g.add(h);
    teeth.push({ g, s, y }); } });
  // slider: two plates (trapezoid, wider at top), side flanges, center wedge, pull tab
  const slider = new THREE.Group(); scene.add(slider);
  const sh = new THREE.Shape(); sh.moveTo(-.42, 0); sh.lineTo(.42, 0); sh.lineTo(.72, 1.2); sh.lineTo(-.72, 1.2); sh.closePath();
  const plateM = Mat({ color: 0xb8c0cc, shininess: 140, specular: 0xaaaaaa, transparent: true, opacity: 1 });
  [.16, -.24].forEach(z => { const m = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: .08, bevelEnabled: true, bevelSize: .03, bevelThickness: .02, bevelSegments: 2 }), plateM); m.position.z = z; slider.add(m); });
  [-1, 1].forEach(s => { const f = new THREE.Mesh(new THREE.BoxGeometry(.08, 1.24, .42), plateM); f.position.set(s * .57, .6, 0); f.rotation.z = -s * Math.atan(.3 / 1.2); slider.add(f); });
  const ws = new THREE.Shape(); ws.moveTo(0, .55); ws.lineTo(.13, 1.2); ws.lineTo(-.13, 1.2); ws.closePath();
  const wedgeM = Mat({ color: 0x8c95a4, emissive: 0xff3020, emissiveIntensity: 0 });
  const wedge = new THREE.Mesh(new THREE.ExtrudeGeometry(ws, { depth: .38, bevelEnabled: false }), wedgeM); wedge.position.z = -.19; slider.add(wedge);
  const chanM = new THREE.MeshPhongMaterial({ color: 0x40e0ff, emissive: 0x00a0ff, emissiveIntensity: .8, transparent: true, opacity: 0, depthWrite: false });
  const chan = new THREE.Group(); slider.add(chan);
  [[-.4, .6, -.2], [.4, .6, .2]].forEach(([x, y, r]) => { const c = new THREE.Mesh(new THREE.BoxGeometry(.06, 1.25, .05), chanM); c.position.set(x * .65, y, .3); c.rotation.z = r * 1.4; chan.add(c); });
  const cb = new THREE.Mesh(new THREE.BoxGeometry(.06, .5, .05), chanM); cb.position.set(0, .05, .3); chan.add(cb);
  const tabPivot = new THREE.Group(); tabPivot.position.set(0, .75, .32); slider.add(tabPivot);
  const tab = new THREE.Mesh(new RoundedBoxGeometry(.42, 1.1, .07, 3, .03), Mat({ color: 0xc7ced8, shininess: 140 })); tab.position.y = -.5; tabPivot.add(tab);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.1, .03, 8, 16), plateM); ring.position.set(0, .75, .3); slider.add(ring);

  // opening profile: inner offset of each side at height y given slider bottom ys
  const sep = (y, ys) => .26 * ss(ys + .05, ys + 1.15, y) + Math.max(0, y - ys - 1.15) * .22;
  const shots = [
    [[3.5, 1, 22], [0, 0, 0]],
    [[2.2, 2.2, 4.0], [-.6, 1.6, 0]],
    [[1.2, 1.5, 5.2], [0, .6, 0]],
    [[2.8, 1.5, 7.5], [0, .5, 0]],
    [[-2.5, -1.3, 6.5], [0, -1.6, 0]],
    [[-2.8, 1.2, 7.5], [0, .5, 0]],
    [[-3.5, 1.5, 22], [0, 0, 0]],
  ];
  const cp = { p: V(), q: V() };
  let ys = -3, tug = 0;
  function update(t, si, lt, sd) {
    sd = sd || 6;
    if (si === 0) ys = lerp(-3.5, 1.5, (Math.sin(t * .5 - 1.57) + 1) / 2);
    if (si === 1) ys = lerp(ys, -1.6, .1);
    if (si === 2) ys = lerp(-1.6, 0, ease(lt / 1.3));
    if (si === 3) ys = lerp(0, 2.4, ease((lt - .8) / (sd - 1)));
    if (si === 4) ys = 2.4;
    if (si === 5) ys = lerp(2.4, -1.5, ease((lt - .6) / (sd - .8)));
    if (si === 6) ys = lerp(-1.5, 3.8, ease(lt / sd));
    tug = si === 4 ? Math.max(0, Math.sin(lt * 3.2)) * .12 : 0;
    const followY = si === 3 || si === 5 ? ys : 0;
    slider.position.y = ys; tabPivot.rotation.x = .25 + Math.sin(t * 1.3) * .08;
    // tapes
    tapes.forEach(tp => { const a = tp.g.attributes.position.array; for (let i = 0; i < a.length; i += 3) { const bx = tp.base[i], y = tp.base[i + 1]; const inner = bx < 0 ? 1 : 0; const yy = y + (Y0 + Y1) / 2;
      const o = sep(yy, ys) + tug; a[i] = tp.s * (o + .28 + (bx + TW / 2)); a[i + 1] = yy; a[i + 2] = 0; } tp.g.attributes.position.needsUpdate = true; tp.g.computeVertexNormals(); });
    teeth.forEach(th => { const o = sep(th.y, ys) + tug; th.g.position.set(th.s * (.11 + o), th.y, 0); th.g.rotation.z = th.s * Math.min(.5, sep(th.y, ys) * .9) * (th.y > ys ? 1 : 0); });
    const pulse = .5 + .5 * Math.sin(t * 5);
    bumpM.emissiveIntensity = si === 1 ? .5 + .5 * pulse : (si === 3 || si === 4 ? .25 : 0);
    holeM.emissiveIntensity = si === 1 ? .5 + .5 * pulse : 0;
    plateM.opacity = si === 2 || si === 5 ? lerp(1, .35, ease(lt / 1.5)) : 1; plateM.transparent = plateM.opacity < 1; plateM.depthWrite = plateM.opacity >= 1;
    chanM.opacity = si === 2 ? Math.min(1, lt) * (.6 + .4 * pulse) : 0;
    wedgeM.emissiveIntensity = si === 5 ? .5 + .4 * pulse : (si === 2 ? .25 : 0);
    toothM.emissive = toothM.emissive || new THREE.Color(); toothM.emissive.setHex(si === 4 ? 0x30405a : 0x000000);
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const k = si === 0 ? 1 : ease(lt / 1.3);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], k))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], k)));
    const o = Math.sin(t * .2) * .08, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    const fy = (si === 3 || si === 5) ? (followY - 0) * .8 : 0;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y + fy, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o));
    camera.lookAt(cp.q.x, cp.q.y + fy, cp.q.z);
  }
  return { update };
}
