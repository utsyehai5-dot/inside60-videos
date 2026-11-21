// Inside 60 — How an Electric Motor Works. Steps: 0 hook, 1 coil+magnets, 2 electromagnet, 3 push/pull, 4 commutator, 5 spin, 6 recap
export async function setup({ THREE, scene, camera }) {
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Phong = (color, o = {}) => new THREE.MeshPhongMaterial({ color, shininess: 60, specular: 0x555555, ...o });
  const letter = (ch, bg) => {
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    g.fillStyle = bg; g.fillRect(0, 0, 128, 128); g.fillStyle = '#fff'; g.font = '900 96px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, 64, 70);
    return new THREE.CanvasTexture(c);
  };

  scene.background = new THREE.Color(0x10182c);
  scene.fog = new THREE.Fog(0x10182c, 20, 44);
  scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x202838, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(5, 9, 7); scene.add(key);
  const rim = new THREE.DirectionalLight(0x88aaff, 1.2); rim.position.set(-6, 4, -5); scene.add(rim);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(16, 64), Phong(0x1c2640, { shininess: 5 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -3.4; scene.add(floor);

  const M = new THREE.Group(); scene.add(M);

  // magnets: N (red) on top, S (blue) below, with a steel yoke behind
  const mkMag = (y, col, ch) => {
    const m = new THREE.Mesh(new RoundedBoxGeometry(2.6, .7, 3.0, 4, .12), Phong(col, { emissive: col, emissiveIntensity: .15 }));
    m.position.y = y; M.add(m);
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(.6, .6), new THREE.MeshBasicMaterial({ map: letter(ch, y > 0 ? '#d8343a' : '#2f6fe0') }));
    lab.position.set(0, y, 1.51); M.add(lab);
    return m;
  };
  const magN = mkMag(2.1, 0xe2453c, 'N'), magS = mkMag(-2.1, 0x3a7bea, 'S');
  const yoke = new THREE.Mesh(new RoundedBoxGeometry(.4, 4.9, 3.0, 4, .12), Phong(0x6f7a8a)); yoke.position.x = -1.5; M.add(yoke);
  yoke.position.set(0, 0, -1.7); yoke.rotation.y = Math.PI / 2; yoke.scale.set(1, 1, .95);

  // field lines (N -> S)
  const fieldMat = new THREE.MeshBasicMaterial({ color: 0x7fd8ff, transparent: true, opacity: 0 });
  const fields = [];
  for (const x of [-1, -.5, 0, .5, 1]) for (const z of [-.9, .9]) {
    const f = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 3.5, 6), fieldMat); f.position.set(x, 0, z); M.add(f); fields.push(f);
  }

  // shaft along z
  const steel = Phong(0xc9ced6, { shininess: 90, specular: 0x999999 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, 5.4, 20), steel); shaft.rotation.x = Math.PI / 2; shaft.position.z = .3; M.add(shaft);

  // rotor group: coil + commutator + pole planes
  const rotor = new THREE.Group(); M.add(rotor);
  const copper = Phong(0xd9813a, { shininess: 90, specular: 0xaa7744, emissive: 0xffb347, emissiveIntensity: 0 });
  const loopPts = [[0, 1, -1.2], [0, 1, 1.2], [0, -1, 1.2], [0, -1, -1.2]].map(p => new THREE.Vector3(...p));
  const loopPath = new THREE.CurvePath();
  for (let i = 0; i < 4; i++) loopPath.add(new THREE.LineCurve3(loopPts[i], loopPts[(i + 1) % 4]));
  for (const dx of [-.12, 0, .12]) {
    const pts = loopPath.getSpacedPoints(160).map(p => new THREE.Vector3(p.x + dx, p.y * (1 - Math.abs(dx) * .3), p.z * (1 - Math.abs(dx) * .2)));
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true, 'catmullrom', .05), 320, .06, 8, true), copper);
    rotor.add(tube);
  }
  const core = new THREE.Mesh(new RoundedBoxGeometry(.25, 1.7, 2.2, 3, .06), Phong(0x7d8796)); rotor.add(core);
  // pole faces: red = side currently north
  const poleA = new THREE.MeshBasicMaterial({ color: 0xff4040, transparent: true, opacity: 0, side: THREE.FrontSide, depthWrite: false });
  const poleB = new THREE.MeshBasicMaterial({ color: 0x4a8bff, transparent: true, opacity: 0, side: THREE.FrontSide, depthWrite: false });
  const pa = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.8), poleA); pa.rotation.y = Math.PI / 2; pa.position.x = .2; rotor.add(pa);
  const pb = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.8), poleB); pb.rotation.y = -Math.PI / 2; pb.position.x = -.2; rotor.add(pb);
  // force arrows
  const arrMat = new THREE.MeshPhongMaterial({ color: 0xffc531, emissive: 0xffa500, emissiveIntensity: .8, transparent: true, opacity: 0 });
  const arrows = [1, -1].map(s => {
    const g = new THREE.Group(); g.position.set(0, s, 1.45); rotor.add(g);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .7, 10), arrMat); body.rotation.z = Math.PI / 2; body.position.x = s * .35; g.add(body);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(.16, .35, 16), arrMat); tip.rotation.z = -s * Math.PI / 2; tip.position.x = s * .85; g.add(tip);
    return g;
  });
  // current dots
  const dotMat = new THREE.MeshBasicMaterial({ color: 0xfff2a0, transparent: true, opacity: 0 });
  const dots = []; for (let i = 0; i < 14; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(.09, 10, 8), dotMat); rotor.add(d); dots.push(d); }
  // commutator: two half rings
  const commMat = [Phong(0xe39a55, { shininess: 100, specular: 0xaa8855 }), Phong(0xe39a55, { shininess: 100, specular: 0xaa8855 })];
  [0, Math.PI].forEach((t0, i) => {
    const h = new THREE.Mesh(new THREE.CylinderGeometry(.38, .38, .6, 32, 1, false, t0 + .12, Math.PI - .24), commMat[i]);
    h.rotation.x = Math.PI / 2; h.position.z = 1.95; rotor.add(h);
  });
  // brushes (fixed) + wires to a battery
  const brushMat = Phong(0x3a3f48, { emissive: 0xffe066, emissiveIntensity: 0 });
  for (const s of [1, -1]) {
    const b = new THREE.Mesh(new RoundedBoxGeometry(.35, .22, .3, 2, .05), brushMat); b.position.set(s * .55, 0, 1.95); M.add(b);
    const w = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(s * .7, 0, 1.95), new THREE.Vector3(s * 1.3, -.4, 2.2), new THREE.Vector3(s * .5, -2.4, 2.8)]), 40, .04, 6),
      Phong(s > 0 ? 0xd8343a : 0x222222)); M.add(w);
  }
  const bat = new THREE.Group(); bat.position.set(0, -2.6, 2.8); M.add(bat);
  const bb = new THREE.Mesh(new THREE.CylinderGeometry(.32, .32, 1.4, 24), Phong(0x2b2f38)); bb.rotation.z = Math.PI / 2; bat.add(bb);
  const bc = new THREE.Mesh(new THREE.CylinderGeometry(.33, .33, .45, 24), Phong(0xffc531, { emissive: 0xffa500, emissiveIntensity: .3 })); bc.rotation.z = Math.PI / 2; bc.position.x = .5; bat.add(bc);
  const flash = new THREE.PointLight(0xffe066, 0, 4); flash.position.set(0, 0, 2.3); M.add(flash);

  const shots = [
    [[8.5, 5.0, 14.0], [0, .3, 0]],
    [[6.4, 3.2, 12.2], [0, .2, 0]],
    [[11.0, 2.2, 5.8], [0, .2, 0]],
    [[1.6, 1.8, 12.8], [0, .2, 0]],
    [[3.6, 2.0, 8.0], [0, .3, 1.6]],
    [[-7.5, 4.0, 12.5], [0, .3, 0]],
    [[8.0, 5.5, 14.0], [0, .3, 0]],
  ];
  const cur = { p: new THREE.Vector3(), q: new THREE.Vector3() };
  let flipT = -10;

  function rotAt(t, si, lt, sd) {
    // returns rotor angle (negative = clockwise)
    if (si === 1) return -.25 * lt;
    if (si === 2) return 0;
    if (si === 3) return -ease((lt - .8) / Math.max(1, sd - 1.6)) * (Math.PI / 2 - .08);
    if (si === 4) return -(Math.PI / 2 - .08) - Math.max(0, lt - .6) * 1.1;
    return -t * 14;
  }

  function update(t, si, lt, sd) {
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const k = si === 0 ? 1 : ease(lt / 1.2);
    cur.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], k)));
    cur.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], k)));
    const orbit = Math.sin(t * .15) * .1;
    camera.position.set(cur.p.x * Math.cos(orbit) - cur.p.z * Math.sin(orbit), cur.p.y, cur.p.z * Math.cos(orbit) + cur.p.x * Math.sin(orbit));
    camera.lookAt(cur.q);

    const a = rotAt(t, si, lt, sd);
    rotor.rotation.z = a;
    const on = si === 0 || si >= 2 ? 1 : 0;
    // which face is north: flips every half turn at alignment
    const ph = (((-a + Math.PI / 2 - .04) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const redN = ph < Math.PI;
    const showPoles = si >= 2 && si <= 4 ? Math.min(1, lt / .6) : 0;
    poleA.color.setHex(redN ? 0xff4040 : 0x4a8bff); poleB.color.setHex(redN ? 0x4a8bff : 0xff4040);
    poleA.opacity = poleB.opacity = .55 * showPoles;
    copper.emissiveIntensity = on * (.35 + .15 * Math.sin(t * 8));
    fieldMat.opacity = si >= 1 && si <= 4 ? (.35 + .2 * Math.sin(t * 3)) * Math.min(1, lt / .6) : 0;
    arrMat.opacity = si === 3 ? Math.min(1, lt / .5) : si === 4 ? Math.max(0, 1 - lt / .6) : 0;

    // current dots running round the loop (direction flips with the commutator)
    const dir = redN ? 1 : -1;
    dotMat.opacity = si >= 2 && si <= 4 ? .95 : 0;
    dots.forEach((d, i) => { const u = (((i / dots.length + dir * t * .25) % 1) + 1) % 1; d.position.copy(loopPath.getPointAt(u)); });

    // commutator flash when the poles swap
    if (redN !== update.lastN) { flipT = t; update.lastN = redN; }
    const fl = si === 4 ? Math.max(0, 1 - (t - flipT) / .5) : 0;
    brushMat.emissiveIntensity = fl * 1.5; flash.intensity = fl * 12;

    M.rotation.y = -0.15 + Math.sin(t * .3) * .04;
  }
  return { update };
}
