// Inside 60 — How a Hydroelectric Dam Works. Steps: 0 hook, 1 reservoir, 2 gate + penstock, 3 turbine, 4 generator, 5 transformer + lines + river, 6 recap
export async function setup({ THREE, scene, camera }) {
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 50, specular: 0x333333, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const fr = x => x - Math.floor(x);

  scene.background = new THREE.Color(0x142238);
  scene.fog = new THREE.Fog(0x142238, 34, 75);
  scene.add(new THREE.HemisphereLight(0xeaf2ff, 0x30302a, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(6, 10, 9); scene.add(key);
  const rim = new THREE.DirectionalLight(0x88ccff, .9); rim.position.set(-7, 5, -6); scene.add(rim);
  const mk = (c, r) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, depthWrite: false })); scene.add(m); return m; };

  // valley floor + rock sides
  const rock = Mat({ color: 0x6a6258 });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(40, 1, 12), rock); floor.position.set(2, -3.5, -2); scene.add(floor);
  const bank = new THREE.Mesh(new THREE.BoxGeometry(40, 9, 3), Mat({ color: 0x4f6a48 })); bank.position.set(2, 0.5, -4.5); scene.add(bank);

  // dam (cross-section extruded along z)
  const ds = new THREE.Shape(); ds.moveTo(-1.5, -3); ds.lineTo(2.0, -3); ds.lineTo(.2, 3.8); ds.lineTo(-1.1, 3.8); ds.closePath();
  const dam = new THREE.Mesh(new THREE.ExtrudeGeometry(ds, { depth: 2.55, bevelEnabled: false }), Mat({ color: 0xc9c4ba, shininess: 20 })); dam.position.z = -3; scene.add(dam);
  const capM = new THREE.Mesh(new THREE.BoxGeometry(1.5, .2, 2.6), Mat({ color: 0xe8e4dc })); capM.position.set(-.45, 3.9, -1.72); scene.add(capM);

  // reservoir
  const waterMat = Mat({ color: 0x2a7ad8, emissive: 0x0a3a7a, emissiveIntensity: .2, transparent: true, opacity: .72, shininess: 120, specular: 0xbfe4ff, depthWrite: false });
  const res = new THREE.Mesh(new THREE.BoxGeometry(12, 6.2, 3.3), waterMat); res.position.set(-7.4, -.1, -1.35); scene.add(res);
  const surfMat = Mat({ color: 0x5aa8ff, emissive: 0x2a6ab8, emissiveIntensity: 0, transparent: true, opacity: .8, depthWrite: false });
  const surf = new THREE.Mesh(new THREE.PlaneGeometry(12, 3.3, 24, 8), surfMat); surf.rotation.x = -Math.PI / 2; surf.position.set(-7.4, 3.0, -1.35); scene.add(surf);
  const sp = surf.geometry.attributes.position; const base = sp.array.slice();
  const levelArrow = new THREE.Mesh(new THREE.ConeGeometry(.35, .9, 12), new THREE.MeshBasicMaterial({ color: 0xffe040, transparent: true, opacity: 0, depthWrite: false })); levelArrow.position.set(-4.5, 4.3, 0); levelArrow.rotation.z = Math.PI; scene.add(levelArrow);

  // gate + penstock
  const gateMat = Mat({ color: 0x5a6270, emissive: 0xffa040, emissiveIntensity: 0 });
  const gate = new THREE.Mesh(new THREE.BoxGeometry(.25, 1.3, 1.3), gateMat); gate.position.set(-1.3, .4, 0); scene.add(gate);
  const pen = new THREE.CatmullRomCurve3([V(-1.4, .4, 0), V(-.2, -.6, 0), V(1.2, -2.0, 0), V(1.9, -2.55, 0), V(2.6, -2.6, .9), V(3.3, -2.6, 0)]);
  const penMat = Mat({ color: 0x9aa6b6, transparent: true, opacity: .45, depthWrite: false, side: THREE.DoubleSide, emissive: 0x2a6aff, emissiveIntensity: 0 });
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(pen, 80, .32, 16, false), penMat));
  const drops = []; for (let i = 0; i < 26; i++) drops.push({ m: mk(0x8ad8ff, .12), o: i / 26 });

  // powerhouse (open cut-away)
  const ph = new THREE.Group(); scene.add(ph);
  const wallM = Mat({ color: 0xd8d2c6 });
  const back = new THREE.Mesh(new THREE.BoxGeometry(2.8, 3.2, .2), wallM); back.position.set(3.0, -1.4, -1.4); ph.add(back);
  const roofM = new THREE.Mesh(new THREE.BoxGeometry(3.0, .2, 3.0), wallM); roofM.position.set(3.0, .25, 0); ph.add(roofM);
  const sideW = new THREE.Mesh(new THREE.BoxGeometry(.2, 3.2, 3.0), wallM); sideW.position.set(4.4, -1.4, 0); ph.add(sideW);
  // turbine (vertical axis) at (2.6,-2.6)
  const T = new THREE.Group(); T.position.set(2.6, -2.6, 0); scene.add(T);
  const runMat = Mat({ color: 0xe0a030, emissive: 0xffa040, emissiveIntensity: 0, shininess: 100 });
  T.add(new THREE.Mesh(new THREE.CylinderGeometry(.25, .4, .4, 24), runMat));
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const b = new THREE.Mesh(new THREE.BoxGeometry(.5, .32, .05), runMat); b.position.set(Math.cos(a) * .55, 0, Math.sin(a) * .55); b.rotation.y = -a + .6; T.add(b); }
  const casing = new THREE.Mesh(new THREE.TorusGeometry(.95, .14, 10, 36), Mat({ color: 0x8a96a6, transparent: true, opacity: .5, depthWrite: false })); casing.rotation.x = Math.PI / 2; casing.position.set(2.6, -2.6, 0); scene.add(casing);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, 1.3, 12), Mat({ color: 0xa8b2c0, shininess: 100 })); shaft.position.set(2.6, -1.95, 0); scene.add(shaft);
  // generator above
  const G = new THREE.Group(); G.position.set(2.6, -1.05, 0); scene.add(G);
  const statorMat = Mat({ color: 0x5a6a80, transparent: true, opacity: .4, depthWrite: false, side: THREE.DoubleSide });
  G.add(new THREE.Mesh(new THREE.CylinderGeometry(.8, .8, .7, 32, 1, true), statorMat));
  const gr = new THREE.Group(); G.add(gr);
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const m = new THREE.Mesh(new THREE.BoxGeometry(.16, .55, .26), Mat({ color: i % 2 ? 0xe04a4a : 0x3a6aff })); m.position.set(Math.cos(a) * .5, 0, Math.sin(a) * .5); m.rotation.y = -a; gr.add(m); }
  const coilMat = Mat({ color: 0xd8823a, emissive: 0xffa040, emissiveIntensity: 0, shininess: 100 });
  for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.TorusGeometry(.8, .045, 8, 36), coilMat); c.rotation.x = Math.PI / 2; c.position.y = -.25 + i * .25; G.add(c); }

  // tailrace river
  const riverMat = Mat({ color: 0x2a7ad8, emissive: 0x0a3a7a, emissiveIntensity: .2, transparent: true, opacity: .8, depthWrite: false });
  const river = new THREE.Mesh(new THREE.BoxGeometry(14, .4, 4), riverMat); river.position.set(10.4, -2.85, 0); scene.add(river);
  const flows = []; for (let i = 0; i < 16; i++) flows.push({ m: mk(0xbfe8ff, .1), z: -1.5 + (i * 1.17 % 3), o: i / 16 });

  // transformer + pylons
  const tr = new THREE.Group(); tr.position.set(3.0, .75, .4); scene.add(tr);
  const trMat = Mat({ color: 0x7a8696, emissive: 0xffd040, emissiveIntensity: 0 });
  tr.add(new THREE.Mesh(new RoundedBoxGeometry(1.2, .8, .8, 2, .06), trMat));
  for (let i = 0; i < 5; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(.03, .7, .9), trMat); f.position.set(-.5 + i * .25, 0, 0); tr.add(f); }
  for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(.05, .07, .45, 10), Mat({ color: 0xa04a2a })); b.position.set(-.35 + i * .35, .6, 0); tr.add(b); }
  const pyl = Mat({ color: 0x9aa2ae });
  const pylonTop = [];
  [[7, 6.0], [11.5, 6.0]].forEach(([x, h]) => {
    const g = new THREE.Group(); g.position.set(x, -3, -.5); scene.add(g);
    [[-.5, -.5], [.5, -.5], [-.5, .5], [.5, .5]].forEach(([a, b]) => { const l = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, h, 6), pyl); l.position.set(a * .5, h / 2, b * .5); l.rotation.z = -a * .12; l.rotation.x = b * .12; g.add(l); });
    const arm = new THREE.Mesh(new THREE.BoxGeometry(2.2, .12, .12), pyl); arm.position.y = h - .3; g.add(arm);
    pylonTop.push(V(x, -3 + h - .3, -.5));
  });
  const line1 = new THREE.CatmullRomCurve3([V(3.35, 1.6, .4), V(5.2, 2.2, 0), pylonTop[0]]);
  const line2 = new THREE.CatmullRomCurve3([pylonTop[0], V(9.25, 2.0, -.5), pylonTop[1]]);
  const lineM = Mat({ color: 0x30343c });
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(line1, 30, .03, 6), lineM)); scene.add(new THREE.Mesh(new THREE.TubeGeometry(line2, 30, .03, 6), lineM));
  const genUp = new THREE.CatmullRomCurve3([V(3.4, -1.05, .4), V(3.6, -.4, .4), V(3.4, .4, .4)]);
  const sparks = []; for (let i = 0; i < 18; i++) sparks.push(mk(0xffd040, .1));

  const shots = [
    [[1.2, 2.6, 25], [.8, -.2, 0]],
    [[-8, 7.0, 13], [-5.5, 1.0, 0]],
    [[-.5, 1.0, 11.5], [.4, -1.6, 0]],
    [[3.6, -.9, 6.0], [2.6, -2.9, 0]],
    [[4.0, -.2, 5.6], [2.6, -1.5, 0]],
    [[10, 3.0, 17], [7, -.6, 0]],
    [[1.6, 3.0, 26], [1.2, -.2, 0]],
  ];
  const cp = { p: V(), q: V() };
  let rot = 0, lastT = 0;

  function update(t, si, lt, sd) {
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const k = si === 0 ? 1 : ease(lt / 1.3);
    cp.p.set(...prev[0].map((v, i) => lerp(v, now[0][i], k)));
    cp.q.set(...prev[1].map((v, i) => lerp(v, now[1][i], k)));
    const o = Math.sin(t * .15) * .08;
    camera.position.set(cp.p.x * Math.cos(o) - cp.p.z * Math.sin(o), cp.p.y, cp.p.z * Math.cos(o) + cp.p.x * Math.sin(o));
    camera.lookAt(cp.q);

    // waves
    for (let i = 0; i < sp.count; i++) { const x = base[i * 3], y = base[i * 3 + 1]; sp.array[i * 3 + 2] = .06 * Math.sin(x * 1.3 + t * 2) + .05 * Math.cos(y * 1.7 + t * 1.6); }
    sp.needsUpdate = true;
    surfMat.emissiveIntensity = si === 1 ? .5 + .2 * Math.sin(t * 4) : .1;
    levelArrow.material.opacity = si === 1 ? ease((lt - .8) / .6) : 0;
    levelArrow.position.y = 4.3 + .15 * Math.sin(t * 5);

    // gate opens in step 2 (closed only during step 1 and start of 2)
    const open = si === 1 ? 0 : si === 2 ? ease((lt - .6) / 1.0) : 1;
    gate.position.y = .4 + open * 1.4; gateMat.emissiveIntensity = si === 2 ? .5 : 0;
    penMat.emissiveIntensity = si === 2 ? .35 + .15 * Math.sin(t * 6) : 0;
    drops.forEach(({ m, o: oo }) => { const u = fr(t * .45 + oo); m.position.copy(pen.getPoint(u)); m.material.opacity = open > .5 ? 1 : 0; });

    const dt = Math.min(.1, Math.max(0, t - lastT)); lastT = t;
    rot += dt * 3 * open; T.rotation.y = rot; gr.rotation.y = rot; shaft.rotation.y = rot;
    runMat.emissiveIntensity = si === 3 ? .4 + .2 * Math.sin(t * 6) : 0;
    coilMat.emissiveIntensity = si === 4 ? .7 + .4 * Math.sin(t * 12) : si === 5 || si === 0 || si === 6 ? .25 : 0;
    trMat.emissiveIntensity = si === 5 ? .35 + .2 * Math.sin(t * 6) : 0;

    const el = (si >= 4 || si === 0) ? 1 : 0;
    sparks.forEach((m, i) => {
      const u = fr(t * .3 + i / 18); let p;
      if (u < .25) p = genUp.getPoint(u / .25); else if (u < .6) p = line1.getPoint((u - .25) / .35); else p = line2.getPoint((u - .6) / .4);
      m.position.copy(p); m.material.opacity = el * (si === 4 && u > .25 ? .3 : 1);
    });
    flows.forEach(({ m, z, o: oo }) => { const u = fr(t * .2 + oo); m.position.set(lerp(3.6, 16, u), -2.6, z); m.material.opacity = open * Math.sin(u * Math.PI) * (si >= 5 || si === 0 ? 1 : .5); });
  }
  return { update };
}
