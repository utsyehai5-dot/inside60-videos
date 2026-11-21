// Inside 60 — How a Smartphone Touchscreen Works. Steps: 0 intro, 1 grid, 2 field, 3 finger, 4 scan, 5 gloves, 6 recap
export async function setup({ THREE, scene, camera }) {
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 60, specular: 0x333333, ...o });

  scene.background = new THREE.Color(0x10182c);
  scene.fog = new THREE.Fog(0x10182c, 20, 45);
  scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x202838, 1.4));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(4, 9, 7); scene.add(key);
  const rim = new THREE.DirectionalLight(0x88aaff, 1.0); rim.position.set(-6, 4, -5); scene.add(rim);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(16, 64), Mat({ color: 0x1c2640, shininess: 5 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -2.2; scene.add(floor);

  // phone, standing tilted back, facing camera (+z)
  const P = new THREE.Group(); P.position.set(0, 1.6, 0); P.rotation.x = -0.35; P.scale.setScalar(.85); scene.add(P);
  const W = 3.2, H = 6.4;
  const body = new THREE.Mesh(new RoundedBoxGeometry(W + .3, H + .3, .4, 6, .3), Mat({ color: 0x2a3040, specular: 0x888888, shininess: 80 }));
  body.position.z = -.25; P.add(body);
  const lcdMat = Mat({ color: 0x0b1020, emissive: 0x2a4a9a, emissiveIntensity: .9 });
  const lcd = new THREE.Mesh(new THREE.PlaneGeometry(W, H), lcdMat); lcd.position.z = -.04; P.add(lcd);
  // app icons on screen
  const iconCols = [0xff8a3d, 0x3dd6ff, 0x7cff6b, 0xff5ea8, 0xffd23d, 0xa47bff];
  const icons = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
    const m = new THREE.Mesh(new RoundedBoxGeometry(.6, .6, .04, 3, .14), Mat({ color: iconCols[(r * 3 + c) % 6], emissive: iconCols[(r * 3 + c) % 6], emissiveIntensity: .5 }));
    m.position.set(-1 + c * 1, 2.1 - r * 1.1, -.01); P.add(m); icons.push(m);
  }
  // electrode grid layer (rows + columns), lifts off for the exploded view
  const G = new THREE.Group(); P.add(G);
  const rowMat = Mat({ color: 0x55e0ff, emissive: 0x22c8ff, emissiveIntensity: 0, transparent: true, opacity: 0 });
  const colMat = Mat({ color: 0xffd23d, emissive: 0xffb000, emissiveIntensity: 0, transparent: true, opacity: 0 });
  const NR = 12, NC = 6, rows = [], cols = [];
  for (let i = 0; i < NR; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(W - .1, .07, .03), rowMat.clone()); m.position.set(0, -H / 2 + .27 + i * (H - .54) / (NR - 1), 0); G.add(m); rows.push(m); }
  for (let j = 0; j < NC; j++) { const m = new THREE.Mesh(new THREE.BoxGeometry(.07, H - .1, .03), colMat.clone()); m.position.set(-W / 2 + .27 + j * (W - .54) / (NC - 1), 0, .08); G.add(m); cols.push(m); }
  // field dots at crossings
  const dotGeo = new THREE.SphereGeometry(.07, 10, 8), dots = [];
  for (let i = 0; i < NR; i++) for (let j = 0; j < NC; j++) {
    const d = new THREE.Mesh(dotGeo, new THREE.MeshBasicMaterial({ color: 0x9ff0ff, transparent: true, opacity: 0 }));
    d.position.set(cols[j].position.x, rows[i].position.y, .14); G.add(d); dots.push({ d, i, j });
  }
  // glass on top
  const glass = new THREE.Mesh(new RoundedBoxGeometry(W + .1, H + .1, .12, 4, .25), Mat({ color: 0xaad8ff, transparent: true, opacity: .18, shininess: 100, specular: 0xffffff }));
  glass.position.z = .3; P.add(glass);

  // finger: capsule-ish, comes from the front
  const skin = Mat({ color: 0xf0b48c, shininess: 20 });
  const F = new THREE.Group(); scene.add(F);
  const arm = new THREE.Group(); arm.rotation.set(-.15, .75, 0); F.add(arm);
  const fing = new THREE.Mesh(new THREE.CapsuleGeometry(.36, 2.2, 8, 20), skin); fing.rotation.x = Math.PI / 2; fing.position.z = 1.46; arm.add(fing);
  const glove = new THREE.Mesh(new THREE.CapsuleGeometry(.44, 2.2, 8, 20), Mat({ color: 0x5a4a8a, shininess: 5 })); glove.rotation.x = Math.PI / 2; glove.position.z = 1.54; glove.visible = false; arm.add(glove);
  const touchRing = new THREE.Mesh(new THREE.RingGeometry(.25, .4, 40), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 }));
  touchRing.position.set(.36, .2, .38); P.add(touchRing);
  // target touch point in phone coords
  const TP = new THREE.Vector3(.36, .2, .4);
  const scanBar = new THREE.Mesh(new THREE.PlaneGeometry(W, .22), new THREE.MeshBasicMaterial({ color: 0x7cff6b, transparent: true, opacity: 0 }));
  scanBar.position.z = .2; P.add(scanBar);
  const cross = new THREE.Group(); P.add(cross);
  const cm = new THREE.MeshBasicMaterial({ color: 0x7cff6b, transparent: true, opacity: 0 });
  cross.add(new THREE.Mesh(new THREE.BoxGeometry(W, .06, .02), cm)); cross.add(new THREE.Mesh(new THREE.BoxGeometry(.06, H, .02), cm));
  cross.position.set(TP.x, TP.y, .22);

  const shots = [
    [[5.0, 4.4, 14.5], [0, 1.6, 0]],
    [[8.0, 4.0, 11.5], [0, 1.6, 0]],
    [[4.6, 3.8, 10.5], [.2, 1.6, 0]],
    [[6.0, 3.6, 11.0], [.3, 1.6, 0]],
    [[0.8, 3.8, 13.5], [0, 1.6, 0]],
    [[-6.0, 3.6, 11.5], [.2, 1.6, 0]],
    [[5.0, 4.8, 14.5], [0, 1.6, 0]],
  ];
  const cur = { p: new THREE.Vector3(), q: new THREE.Vector3() };
  const wp = new THREE.Vector3();

  function update(t, si, lt, sd) {
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const k = si === 0 ? 1 : ease(lt / 1.2);
    cur.p.set(...prev[0].map((v, i) => lerp(v, now[0][i], k)));
    cur.q.set(...prev[1].map((v, i) => lerp(v, now[1][i], k)));
    const o = Math.sin(t * .15) * .08;
    camera.position.set(cur.p.x * Math.cos(o) - cur.p.z * Math.sin(o), cur.p.y, cur.p.z * Math.cos(o) + cur.p.x * Math.sin(o));
    camera.lookAt(cur.q);

    // exploded view: glass lifts, grid appears (steps 1..5)
    const ex = si === 0 ? 0 : si === 1 ? ease(lt / 1.4) : si === 6 ? 1 - ease(lt / 1.2) : 1;
    glass.position.z = .3 + ex * 1.4; G.position.z = .1 + ex * .7;
    rows.forEach((m, i) => { m.material.opacity = ex; m.material.emissiveIntensity = ex * .9; });
    cols.forEach(m => { m.material.opacity = ex; m.material.emissiveIntensity = ex * .9; });
    lcdMat.emissiveIntensity = .9 - ex * .5;

    // field dots pulse (step 2+)
    const fOn = si < 2 ? 0 : si === 2 ? ease(lt / 1) : si === 6 ? 1 - ex * 0 - ease(lt / 1.2) : 1;
    const touchK = si === 3 ? ease((lt - .6) / .8) : (si === 4 ? 1 : 0);
    const gloveK = si === 5 ? ease((lt - .5) / .8) : 0;
    const fingerIn = si === 0 ? ease((lt - .6) / 1) * (1 - ease((lt - 2.2) / .8)) : Math.max(touchK, gloveK);
    dots.forEach(({ d, i, j }) => {
      const dx = d.position.x - TP.x, dy = d.position.y - TP.y, r = Math.hypot(dx, dy);
      const dip = touchK * Math.max(0, 1 - r / 1.2);
      d.material.opacity = fOn * (.55 + .35 * Math.sin(t * 5 + i + j)) * (1 - dip);
      d.scale.setScalar(1 + fOn * .4 * Math.sin(t * 4 + i * .7) - dip * .8);
    });

    // finger position: hover over TP above glass, pushes to touch
    F.visible = si === 0 || si === 3 || si === 4 || si === 5;
    glove.visible = si === 5; fing.visible = si !== 5;
    wp.set(TP.x, TP.y, lerp(glass.position.z + 3, glass.position.z + .07, fingerIn)); P.localToWorld(wp);
    F.position.copy(wp); F.rotation.set(P.rotation.x, P.rotation.y, 0);
    // touch ring (bare finger only)
    const tr = si === 0 ? fingerIn : touchK;
    touchRing.position.z = glass.position.z + .08;
    touchRing.material.opacity = tr * (.6 + .4 * Math.sin(t * 8));
    touchRing.scale.setScalar(1 + .4 * Math.sin(t * 6));
    if (si === 0) icons.forEach((m, n) => m.scale.setScalar(n === 4 ? 1 + fingerIn * .25 : 1));

    // scan (step 4): bar sweeps rows fast, crosshair locks on
    if (si === 4) {
      const y = -H / 2 + ((lt * 2.2) % 1) * H; scanBar.position.y = y; scanBar.material.opacity = .45;
      rows.forEach(m => { m.material.emissiveIntensity = Math.abs(m.position.y - y) < .3 ? 3 : .6; });
      cm.opacity = ease((lt - 1.2) / .6);
    } else { scanBar.material.opacity = 0; cm.opacity = si === 6 ? 0 : 0; }
    // gloves: grid stays calm, red flash
    if (si === 5) cols.forEach(m => m.material.emissive.setHex(0xff5a3d)); else cols.forEach(m => m.material.emissive.setHex(0xffb000));
    P.rotation.y = Math.sin(t * .35) * .05;
  }
  return { update };
}
