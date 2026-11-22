// Inside 60 — How a Solar Panel Works. Steps: 0 hook, 1 cells, 2 n/p layers + field, 3 photon frees electron, 4 DC current, 5 inverter -> home AC, 6 recap
export async function setup({ THREE, scene, camera }) {
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 50, specular: 0x333333, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const fr = x => x - Math.floor(x);

  scene.background = new THREE.Color(0x12223c);
  scene.fog = new THREE.Fog(0x12223c, 40, 80);
  scene.add(new THREE.HemisphereLight(0xeaf2ff, 0x2a3038, 1.4));
  const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(5, 9, 7); scene.add(key);
  const rim = new THREE.DirectionalLight(0x88ccff, .9); rim.position.set(-6, 4, -5); scene.add(rim);
  const mk = (c, r, parent) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, depthWrite: false })); (parent || scene).add(m); return m; };

  // ---- sun ----
  const sun = new THREE.Mesh(new THREE.SphereGeometry(.8, 24, 16), new THREE.MeshBasicMaterial({ color: 0xffe066 }));
  sun.position.set(2.4, 4.3, -1.5); scene.add(sun);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(1.25, 24, 16), new THREE.MeshBasicMaterial({ color: 0xffc040, transparent: true, opacity: .3, depthWrite: false })); halo.position.copy(sun.position); scene.add(halo);

  // ---- panel ----
  const P = new THREE.Group(); P.rotation.x = -.6; scene.add(P);
  P.add(new THREE.Mesh(new RoundedBoxGeometry(4.6, 6.6, .22, 2, .06), Mat({ color: 0xc8d0da, shininess: 100, specular: 0xffffff })));
  const cellMats = [];
  for (let i = 0; i < 4; i++) for (let j = 0; j < 6; j++) {
    const m = Mat({ color: 0x1d3f9a, emissive: 0x3a7aff, emissiveIntensity: 0, shininess: 80, specular: 0x4a5a8a });
    const c = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, .06), m); c.position.set(-1.6 + i * 1.07, -2.68 + j * 1.07, .13); P.add(c);
    cellMats.push({ m, i, j });
    for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.02, .96, .02), new THREE.MeshBasicMaterial({ color: 0xcfd8e6 })); b.position.set(c.position.x - .3 + k * .3, c.position.y, .17); P.add(b); }
  }
  const legMat = Mat({ color: 0x8a96a6 });
  [-1.6, 1.6].forEach(x => { const l = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 2.4, 10), legMat); l.position.set(x, -.2, -1.6); scene.add(l); });
  // photons from sun to panel surface
  const pts = []; for (let i = 0; i < 18; i++) { const p = V(-1.8 + (i * 1.37 % 3.6), -2.8 + (i * 2.31 % 5.6), .2); pts.push(p); }
  const photons = pts.map((p, i) => ({ m: mk(0xfff08a, .1), p, o: i / 18 }));

  // ---- cut-away cell ----
  const C = new THREE.Group(); C.position.set(-.4, 0, 0); C.rotation.y = -.25; scene.add(C);
  const nL = new THREE.Mesh(new THREE.BoxGeometry(3.4, .7, 2.6), Mat({ color: 0x3a7aff, transparent: true, opacity: .85 })); nL.position.y = .55; C.add(nL);
  const pL = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.4, 2.6), Mat({ color: 0xe0644e, transparent: true, opacity: .85 })); pL.position.y = -.5; C.add(pL);
  const jMat = Mat({ color: 0xfff2a0, emissive: 0xffd040, emissiveIntensity: 0, transparent: true, opacity: .9 });
  const jun = new THREE.Mesh(new THREE.BoxGeometry(3.42, .06, 2.62), jMat); jun.position.y = .2; C.add(jun);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(3.4, .12, 2.6), Mat({ color: 0xdff4ff, transparent: true, opacity: .3, depthWrite: false })); glass.position.y = .98; C.add(glass);
  const silver = Mat({ color: 0xdde3ea, shininess: 110, specular: 0xffffff });
  for (let k = 0; k < 5; k++) { const f = new THREE.Mesh(new THREE.BoxGeometry(.1, .1, 2.6), silver); f.position.set(-1.4 + k * .7, .92, 0); C.add(f); }
  const bus = new THREE.Mesh(new THREE.BoxGeometry(3.4, .1, .14), silver); bus.position.set(0, .92, 1.25); C.add(bus);
  const back = new THREE.Mesh(new THREE.BoxGeometry(3.4, .12, 2.6), silver); back.position.y = -1.26; C.add(back);
  const loopPts = [V(1.7, .92, 1.25), V(2.5, .92, 1.25), V(2.5, -1.26, 1.25), V(1.7, -1.26, 1.25)];
  const loopMat = Mat({ color: 0xc87a3a, emissive: 0xffaa3a, emissiveIntensity: 0 });
  for (let i = 0; i < 3; i++) { const a = loopPts[i], b = loopPts[i + 1]; const len = a.distanceTo(b); const w = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, len, 8), loopMat); w.position.copy(a).add(b).multiplyScalar(.5); if (Math.abs(a.y - b.y) < .01) w.rotation.z = Math.PI / 2; C.add(w); }
  const fieldArrows = []; for (let k = 0; k < 4; k++) { const a = new THREE.Mesh(new THREE.ConeGeometry(.12, .35, 10), new THREE.MeshBasicMaterial({ color: 0xffe040, transparent: true, opacity: 0, depthWrite: false })); a.position.set(-1.2 + k * .8, .2, 1.35); C.add(a); fieldArrows.push(a); }
  const pairs = []; for (let i = 0; i < 10; i++) { const h = V(-1.4 + (i * .97 % 2.8), -.7 + (i * .53 % 1.2), .6 - (i % 3) * .5); pairs.push({ ph: mk(0xfff08a, .14, C), e: mk(0x4ad8ff, .15, C), h, o: i / 10 }); }
  const path = h => [h, V(h.x, .92, h.z), V(h.x, .92, 1.25), V(2.5, .92, 1.25), V(2.5, -1.26, 1.25), V(1.7, -1.26, 1.25)];
  const along = (ps, u) => { const L = []; let tot = 0; for (let i = 0; i < ps.length - 1; i++) { const d = ps[i].distanceTo(ps[i + 1]); L.push(d); tot += d; } let s = u * tot; for (let i = 0; i < L.length; i++) { if (s <= L[i]) return ps[i].clone().lerp(ps[i + 1], s / L[i]); s -= L[i]; } return ps[ps.length - 1].clone(); };

  // ---- inverter + house ----
  const H = new THREE.Group(); scene.add(H);
  const inv = new THREE.Mesh(new RoundedBoxGeometry(1.4, 1.2, .6, 2, .1), Mat({ color: 0xe8ecf2 })); inv.position.set(-1.8, -4.3, 1); H.add(inv);
  const ledMat = new THREE.MeshBasicMaterial({ color: 0x4aff8a }); const led = new THREE.Mesh(new THREE.SphereGeometry(.09, 10, 8), ledMat); led.position.set(-1.8, -4.0, 1.32); H.add(led);
  const wave = []; for (let i = 0; i <= 30; i++) wave.push(V(-2.25 + i * .03, -4.5 + Math.sin(i / 30 * Math.PI * 2) * .15, 1.32));
  H.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(wave), 40, .025, 6), new THREE.MeshBasicMaterial({ color: 0x2a7aff })));
  const house = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.4, 1.6), Mat({ color: 0xf0d8b0 })); house.position.set(1.9, -5.0, .6); H.add(house);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.5, .9, 4), Mat({ color: 0xb04a3a })); roof.rotation.y = Math.PI / 4; roof.position.set(1.9, -3.85, .6); H.add(roof);
  const winMat = Mat({ color: 0x334055, emissive: 0xffd070, emissiveIntensity: 0 });
  [-.45, .45].forEach(x => { const w = new THREE.Mesh(new THREE.BoxGeometry(.4, .4, .04), winMat); w.position.set(1.9 + x, -4.9, 1.41); H.add(w); });
  const w1 = new THREE.CatmullRomCurve3([V(0, -2.75, 1.85), V(-.9, -3.2, 1.5), V(-1.8, -3.7, 1)]);
  const w2 = new THREE.CatmullRomCurve3([V(-1.1, -4.4, 1), V(.0, -4.7, 1.1), V(1.0, -4.95, 1.2)]);
  const cab = Mat({ color: 0x30343c });
  H.add(new THREE.Mesh(new THREE.TubeGeometry(w1, 40, .05, 8), cab)); H.add(new THREE.Mesh(new THREE.TubeGeometry(w2, 40, .05, 8), cab));
  const dc = []; for (let i = 0; i < 8; i++) dc.push(mk(0x4ad8ff, .09, H));
  const ac = []; for (let i = 0; i < 8; i++) ac.push(mk(0xffd040, .09, H));

  const shots = [
    [[0, 1.0, 22], [0, -.3, 0]],
    [[-2.5, 2.0, 17], [0, -.6, 0]],
    [[3.2, 2.0, 13.5], [0, -.7, 0]],
    [[1.8, 2.6, 13], [0, -.6, 0]],
    [[.8, 1.0, 14], [.3, -.7, 0]],
    [[0, -1.2, 28], [0, -2.6, 0]],
    [[0, -1.0, 28], [0, -2.4, 0]],
  ];
  const cp = { p: V(), q: V() };

  function update(t, si, lt, sd) {
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const k = si === 0 ? 1 : ease(lt / 1.3);
    cp.p.set(...prev[0].map((v, i) => lerp(v, now[0][i], k)));
    cp.q.set(...prev[1].map((v, i) => lerp(v, now[1][i], k)));
    const o = Math.sin(t * .15) * .1;
    camera.position.set(cp.p.x * Math.cos(o) - cp.p.z * Math.sin(o), cp.p.y, cp.p.z * Math.cos(o) + cp.p.x * Math.sin(o));
    camera.lookAt(cp.q);

    let cs = 0;
    if (si === 2) cs = ease(lt / .8); else if (si === 3 || si === 4) cs = 1; else if (si === 5) cs = 1 - ease(lt / .8);
    const ps = 1 - cs;
    P.scale.setScalar(Math.max(ps, .001)); P.visible = ps > .01;
    C.scale.setScalar(Math.max(cs, .001)); C.visible = cs > .01;
    const hs = si === 5 ? ease((lt - .5) / .8) : si === 6 ? 1 : 0;
    H.scale.setScalar(Math.max(hs, .001)); H.visible = hs > .01;
    halo.scale.setScalar(1 + .08 * Math.sin(t * 3));
    sun.visible = halo.visible = cs < .9;

    // cells sweep glow (step 1), light glow in 0/5/6
    cellMats.forEach(({ m, i, j }) => {
      const sweep = si === 1 ? Math.max(0, 1 - Math.abs(fr(t * .35) * 9 - (i + j)) * .6) : 0;
      m.emissiveIntensity = sweep * .9 + ((si === 0 || si >= 5) ? .12 + .05 * Math.sin(t * 4 + i + j) : 0);
    });
    photons.forEach(({ m, p, o: oo }) => {
      const on = si === 0 || si === 1 || si >= 5;
      const u = fr(t * .5 + oo); const w = p.clone().applyEuler(P.rotation);
      m.position.copy(sun.position).lerp(w, u); m.material.opacity = on && ps > .5 ? Math.sin(u * Math.PI) : 0;
    });

    // cut-away
    jMat.emissiveIntensity = (si === 2 ? .9 + .4 * Math.sin(t * 6) : .25);
    fieldArrows.forEach((a, i) => { a.material.opacity = si === 2 ? ease((lt - .8) / .6) * (.6 + .4 * Math.sin(t * 5 + i)) : 0; });
    loopMat.emissiveIntensity = si === 4 ? .6 + .3 * Math.sin(t * 6) : 0;
    pairs.forEach(({ ph, e, h, o: oo }) => {
      if (si !== 3 && si !== 4) { ph.material.opacity = 0; e.material.opacity = 0; return; }
      const u = fr(t * .35 + oo);
      if (u < .35) { const s = u / .35; ph.position.set(h.x - 1.5 * (1 - s), lerp(4, h.y, s), h.z); ph.material.opacity = 1; e.material.opacity = 0; }
      else {
        ph.material.opacity = 0; const s = (u - .35) / .65;
        if (si === 3) { e.position.set(h.x + .1 * Math.sin(t * 9 + oo * 7), h.y + .1 * Math.cos(t * 8 + oo * 5), h.z); }
        else e.position.copy(along(path(h), s));
        e.material.opacity = 1;
      }
    });

    // DC / AC flow
    const flow = si >= 5 ? 1 : 0;
    dc.forEach((m, i) => { m.position.copy(w1.getPoint(fr(t * .4 + i / 8))); m.material.opacity = flow * hs; });
    ac.forEach((m, i) => { const u = fr(i / 8 + .06 * Math.sin(t * 6)); m.position.copy(w2.getPoint(u)); m.material.opacity = flow * hs * (.5 + .5 * Math.abs(Math.sin(t * 6))); });
    winMat.emissiveIntensity = si >= 5 ? hs * .9 : 0;
    ledMat.color.setHex(Math.sin(t * 8) > 0 ? 0x4aff8a : 0x1a8a3a);
  }
  return { update };
}
