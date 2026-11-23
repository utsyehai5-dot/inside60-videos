// Inside 60 — Lawn mower (rotary). Steps: 0 hook tip speed, 1 engine turns vertical shaft, 2 blade on shaft over grass,
// 3 impact cut (grass whacked off), 4 lift wings pull air + clippings to bag, 5 wheel height adjust, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x182430); scene.fog = new THREE.Fog(0x182430, 30, 80);
  scene.add(new THREE.HemisphereLight(0xf8fff0, 0x304020, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 1.2); key.position.set(6, 10, 8); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffd080, .5); rim.position.set(-6, 4, -8); scene.add(rim);
  const root = new THREE.Group(); scene.add(root);

  // ground
  const ground = new THREE.Mesh(new THREE.CircleGeometry(14, 48), Mat({ color: 0x3a6a30, shininess: 5 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -1.5; root.add(ground);
  // grass blades (instanced thin boxes)
  const GN = 900; const gGeo = new THREE.BoxGeometry(.04, 1, .02); gGeo.translate(0, .5, 0);
  const grass = new THREE.InstancedMesh(gGeo, Mat({ color: 0x60c040, shininess: 10 }), GN); root.add(grass);
  const gData = []; for (let i = 0; i < GN; i++) { const r = Math.sqrt(Math.random()) * 6, a = Math.random() * Math.PI * 2; gData.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, h: .5 + Math.random() * .2, lean: (Math.random() - .5) * .6, ry: Math.random() * 3 }); }
  const dummy = new THREE.Object3D();

  // mower deck (cut-away: dome made from lathe, front-right quarter removed)
  const mower = new THREE.Group(); root.add(mower);
  const deckM = Mat({ color: 0xe04030, side: THREE.DoubleSide, shininess: 110, transparent: true, opacity: 1 });
  const prof = [new THREE.Vector2(2.4, -1.15), new THREE.Vector2(2.4, -.3)]; for (let k = 1; k <= 12; k++) { const a = k / 12 * Math.PI / 2; prof.push(new THREE.Vector2(.4 + 2.0 * Math.cos(a), -.3 + Math.sin(a) * .55)); }
  const deck = new THREE.Mesh(new THREE.LatheGeometry(prof, 48, Math.PI * .75, Math.PI * 1.5), deckM); mower.add(deck);
  // engine block on top
  const engM = Mat({ color: 0x404850, emissive: 0xff8020, emissiveIntensity: 0, shininess: 90 });
  const eng = new THREE.Mesh(new RoundedBox(THREE, 1.4, 1.0, 1.4, .18), engM); eng.position.y = .85; mower.add(eng);
  const fins = []; for (let k = 0; k < 5; k++) { const f = new THREE.Mesh(new THREE.BoxGeometry(1.5, .05, 1.5), Mat({ color: 0x606a74 })); f.position.y = .5 + k * .17; mower.add(f); fins.push(f); }
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .5, 20), Mat({ color: 0x202020 })); tank.position.set(-.5, 1.5, .3); mower.add(tank);
  // vertical crankshaft
  const shaftM = Mat({ color: 0xd0d8e0, emissive: 0x40c0ff, emissiveIntensity: 0, shininess: 160 });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, 1.6, 14), shaftM); shaft.position.y = -.1; mower.add(shaft);
  const spinMark = new THREE.Mesh(new THREE.BoxGeometry(.05, 1.4, .2), new THREE.MeshBasicMaterial({ color: 0xffe040 })); spinMark.position.set(.09, 0, 0); shaft.add(spinMark);
  // blade group (spins about y), at y = -.75
  const bladeG = new THREE.Group(); bladeG.position.y = -1.1; mower.add(bladeG);
  const bladeM = Mat({ color: 0xc8d0d8, emissive: 0xffe040, emissiveIntensity: 0, shininess: 180 });
  const blade = new THREE.Mesh(new THREE.BoxGeometry(4.2, .06, .4), bladeM); bladeG.add(blade);
  const wingM = Mat({ color: 0xb0b8c0, emissive: 0x40ff80, emissiveIntensity: 0, shininess: 160 });
  for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.BoxGeometry(.8, .06, .25), wingM); w.position.set(s * 1.75, .1, -s * .2); w.rotation.x = s * .7; bladeG.add(w); }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(.25, .25, .14, 16), Mat({ color: 0x505860 })); bladeG.add(hub);
  // blur disc
  const blurM = new THREE.MeshBasicMaterial({ color: 0xe8f0ff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
  const blur = new THREE.Mesh(new THREE.RingGeometry(.3, 2.1, 48), blurM); blur.rotation.x = -Math.PI / 2; blur.position.y = -1.09; mower.add(blur);
  // tip speed trail
  const trailM = new THREE.MeshBasicMaterial({ color: 0xffe040, transparent: true, opacity: 0 });
  const trail = new THREE.Mesh(new THREE.TorusGeometry(2.1, .05, 6, 64, Math.PI * .9), trailM); trail.rotation.x = Math.PI / 2; trail.position.y = -1.06; mower.add(trail);
  // wheels
  const wheels = []; const wheelM = Mat({ color: 0x1c1c20, shininess: 40 }), rimM = Mat({ color: 0xf0c020 });
  for (const [x, z] of [[-2.0, 1.9], [2.0, 1.9], [-2.0, -1.9], [2.0, -1.9]]) {
    const g = new THREE.Group(); g.position.set(x, -1.05, z); mower.add(g);
    const w = new THREE.Mesh(new THREE.CylinderGeometry(.45, .45, .3, 24), wheelM); w.rotation.z = Math.PI / 2; g.add(w);
    const r = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .32, 16), rimM); r.rotation.z = Math.PI / 2; g.add(r);
    wheels.push(g);
  }
  // handle + bag at back (-x)
  const hM = Mat({ color: 0x303438 });
  for (const z of [-.8, .8]) { const h = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 3.2, 8), hM); h.position.set(-3.4, 1.0, z); h.rotation.z = .9; mower.add(h); }
  const bagM = Mat({ color: 0x405070, transparent: true, opacity: .85, emissive: 0x2040a0, emissiveIntensity: 0, shininess: 20 });
  const bag = new THREE.Mesh(new RoundedBox(THREE, 1.6, 1.1, 1.6, .3), bagM); bag.position.set(-3.1, -.3, 0); mower.add(bag);
  const chute = new THREE.Mesh(new THREE.CylinderGeometry(.35, .35, .9, 16), deckM); chute.rotation.z = Math.PI / 2; chute.position.set(-2.4, -.5, 0); mower.add(chute);
  // height lever
  const lever = new THREE.Mesh(new THREE.BoxGeometry(.1, .8, .1), Mat({ color: 0xf0c020, emissive: 0xffa000, emissiveIntensity: 0 })); lever.position.set(2.0, -.5, 2.15); mower.add(lever);

  // clippings particles
  const clipM = new THREE.MeshPhongMaterial({ color: 0x80e050 });
  const clips = []; for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(.12, .03, .04), clipM); root.add(m); clips.push({ m, ph: Math.random(), a: Math.random() * Math.PI * 2 }); }
  // air arrows (up)
  const airM = new THREE.MeshBasicMaterial({ color: 0x80ffd0, transparent: true });
  const airs = []; for (let i = 0; i < 6; i++) { const g = new THREE.Group(); const s = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .6, 6), airM); g.add(s); const h = new THREE.Mesh(new THREE.ConeGeometry(.1, .2, 10), airM); h.position.y = .4; g.add(h); root.add(g); airs.push(g); }

  const shots = [
    [[7.0, 4.5, 9.5], [0, -.6, 0]],      // 0 whole mower, blade blur
    [[4.5, 3.0, 6.0], [0, .3, 0]],       // 1 engine + shaft
    [[5.5, 1.2, 3.0], [.8, -1.2, 0]],    // 2 blade through cut-away
    [[3.8, -.2, 2.4], [1.2, -1.2, .4]],  // 3 cut close
    [[4.5, 1.6, 4.5], [-1.0, -1.0, 0]],  // 4 lift + bag
    [[5.0, .5, 7.0], [2.0, -1.1, 1.9]],  // 5 wheel height
    [[7.0, 4.5, 9.5], [-.5, -.5, 0]],    // 6 recap
  ];
  const cp = { p: V(), q: V() };
  let ang = 0, lastT = 0;
  function update(t, si, lt, sd) {
    const dt = Math.min(.05, Math.max(0, t - lastT)); lastT = t;
    const pulse = .5 + .5 * Math.sin(t * 7);
    // spin speed: slow-mo on step 3 for visible whack, otherwise fast
    const spin = si === 3 ? 2.2 : (si === 1 ? 4 + 30 * ease(lt / 2) : 40);
    ang += spin * dt; bladeG.rotation.y = ang; shaft.rotation.y = ang;
    const fast = spin > 20;
    blurM.opacity = fast ? .28 : 0; blade.visible = true;
    trailM.opacity = si === 0 ? .6 + .4 * pulse : 0; trail.rotation.z = -ang;
    engM.emissiveIntensity = si === 1 ? .25 + .2 * pulse : 0;
    shaftM.emissiveIntensity = si === 1 ? .5 + .4 * pulse : 0;
    bladeM.emissiveIntensity = si === 2 || si === 3 ? .35 + .3 * pulse : 0;
    wingM.emissiveIntensity = si === 4 ? .6 + .4 * pulse : 0;
    deckM.opacity = 1;
    bagM.emissiveIntensity = si === 4 ? .3 + .3 * pulse : 0;
    // height: step 5 deck rises/falls
    const hgt = si === 5 ? .35 * Math.sin(Math.min(1, lt / 3) * Math.PI) * 1 : 0;
    mower.position.y = hgt;
    wheels.forEach(w => { w.position.y = -1.05 - hgt; });
    lever.material.emissiveIntensity = si === 5 ? .6 + .4 * pulse : 0; lever.rotation.z = -hgt * 1.5;
    const cutY = -1.5 + .72 + hgt; // cut height above ground (relative to blade y)
    // grass
    const bladeR = 2.1;
    for (let i = 0; i < GN; i++) {
      const g = gData[i]; let h = g.h, lean = g.lean, ry = g.ry;
      const inDeck = Math.hypot(g.x, g.z) < bladeR;
      if (inDeck) {
        if (si >= 4 || si === 0 || si === 6) h = Math.min(h, .38 + hgt);
        if (si === 3) { const a = Math.atan2(g.z, g.x); if (lt / 3.2 > (a + Math.PI) / (2 * Math.PI)) h = Math.min(h, .38); }
        if (si === 4) lean *= .2; // lift stands grass up
      }
      dummy.position.set(g.x, -1.5, g.z); dummy.rotation.set(lean, ry, 0); dummy.scale.set(1, h, 1); dummy.updateMatrix(); grass.setMatrixAt(i, dummy.matrix);
    }
    grass.instanceMatrix.needsUpdate = true;
    // clippings: step 3 fly off sideways, step 4 swirl up and into bag
    clips.forEach((c, i) => {
      c.m.visible = si === 3 || si === 4;
      if (si === 3) { const ph = (t * .8 + c.ph) % 1; const a = c.a; c.m.position.set(Math.cos(a) * (1.2 + ph * 1.2), -1.1 + ph * .2, Math.sin(a) * (1.2 + ph * 1.2)); c.m.rotation.set(t * 5 + i, t * 3, 0); }
      if (si === 4) { const ph = (t * .6 + c.ph) % 1; const a = c.a + t * 6; const r = 1.8 * (1 - ph); const toBag = ph > .6 ? (ph - .6) / .4 : 0; c.m.position.set(lerp(Math.cos(a) * r, -3.1, toBag), lerp(-1.15 + ph * .6, -.3, toBag), lerp(Math.sin(a) * r, 0, toBag)); c.m.rotation.set(t * 5 + i, t * 3, 0); }
    });
    airs.forEach((g, k) => { g.visible = si === 4; const a = k / 6 * Math.PI * 2 + t * 2; const ph = (t * 1.5 + k / 6) % 1; g.position.set(Math.cos(a) * 1.6, -1.4 + ph * .6, Math.sin(a) * 1.6); airM.opacity = .8; });
    // camera
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const kk = si === 0 ? 1 : ease(lt / 1.4);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], kk))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], kk)));
    const o = Math.sin(t * .25) * .08, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o));
    camera.lookAt(cp.q);
  }
  return { update };
}
function RoundedBox(THREE, w, h, d, r) {
  // simple rounded box via ExtrudeGeometry with bevel
  const s = new THREE.Shape(); const x = w / 2 - r, y = d / 2 - r;
  s.moveTo(-x, -y - 0); s.lineTo(x, -y); s.lineTo(x, y); s.lineTo(-x, y); s.lineTo(-x, -y);
  const g = new THREE.ExtrudeGeometry(s, { depth: h - 2 * r, bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelSegments: 3 });
  g.rotateX(-Math.PI / 2); g.translate(0, -(h - 2 * r) / 2, 0); return g;
}
