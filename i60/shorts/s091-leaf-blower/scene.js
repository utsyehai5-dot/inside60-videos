// Inside 60 — Leaf blower. Steps: 0 hook air speed, 1 motor spins fan, 2 side intake sucks air, 3 fan flings air into tube,
// 4 narrowing nozzle speeds air up, 5 volume pushes leaves, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x1c2632); scene.fog = new THREE.Fog(0x1c2632, 30, 80);
  scene.add(new THREE.HemisphereLight(0xfff6e8, 0x303828, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 1.2); key.position.set(5, 9, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0x80c0ff, .5); rim.position.set(-6, 4, -8); scene.add(rim);
  const root = new THREE.Group(); scene.add(root); 

  // ground with leaves
  const ground = new THREE.Mesh(new THREE.CircleGeometry(20, 48), Mat({ color: 0x3e5a2c, shininess: 5 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -2.4; root.add(ground);
  const leafCols = [0xe07020, 0xd0a020, 0xb04018, 0xe8b030];
  const leafGeo = new THREE.CircleGeometry(.16, 6); leafGeo.scale(1, .6, 1);
  const leaves = []; for (let i = 0; i < 60; i++) { const m = new THREE.Mesh(leafGeo, Mat({ color: leafCols[i % 4], side: THREE.DoubleSide, shininess: 10 })); root.add(m); leaves.push({ m, x: 6.2 + Math.random() * 2.6, z: (Math.random() - .5) * 2.4, r: Math.random() * 6, v: .6 + Math.random() * .8 }); }

  const B = new THREE.Group(); root.add(B);
  // fan housing (scroll), axis z, cut-away transparent
  const housM = Mat({ color: 0xf0a020, transparent: true, opacity: .4, side: THREE.DoubleSide, depthWrite: false, shininess: 90 });
  const hous = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, .8, 40, 1, true).rotateX(Math.PI / 2), housM); B.add(hous);
  const backPlate = new THREE.Mesh(new THREE.CircleGeometry(1.25, 40), Mat({ color: 0xd08018, side: THREE.DoubleSide })); backPlate.position.z = -.4; B.add(backPlate);
  // intake grille on front (+z)
  const grilleM = Mat({ color: 0x303438, emissive: 0x40c0ff, emissiveIntensity: 0 });
  const grille = new THREE.Group(); grille.position.z = .42; B.add(grille);
  grille.add(new THREE.Mesh(new THREE.TorusGeometry(.75, .06, 8, 36), grilleM));
  for (let k = 0; k < 6; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(1.5, .05, .05), grilleM); b.rotation.z = k * Math.PI / 6; grille.add(b); }
  // impeller
  const imp = new THREE.Group(); B.add(imp);
  const impM = Mat({ color: 0xe8ecf0, emissive: 0xffe040, emissiveIntensity: 0, shininess: 160 });
  imp.add(new THREE.Mesh(new THREE.CylinderGeometry(.28, .28, .7, 20).rotateX(Math.PI / 2), Mat({ color: 0x606870 })));
  for (let k = 0; k < 10; k++) { const bl = new THREE.Mesh(new THREE.BoxGeometry(.85, .06, .6), impM); const a = k / 10 * Math.PI * 2; bl.position.set(Math.cos(a) * .68, Math.sin(a) * .68, 0); bl.rotation.z = a + .5; imp.add(bl); }
  const blurM = new THREE.MeshBasicMaterial({ color: 0xf0f6ff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
  const blur = new THREE.Mesh(new THREE.RingGeometry(.3, 1.1, 40), blurM); blur.position.z = .32; B.add(blur);
  // motor behind (-z)
  const motM = Mat({ color: 0x404850, emissive: 0xff7020, emissiveIntensity: 0, shininess: 90 });
  const mot = new THREE.Mesh(new THREE.CylinderGeometry(.7, .7, 1.3, 28).rotateX(Math.PI / 2), motM); mot.position.z = -1.1; B.add(mot);
  for (let k = 0; k < 5; k++) { const f = new THREE.Mesh(new THREE.TorusGeometry(.72, .04, 6, 28), Mat({ color: 0x707a84 })); f.position.z = -.6 - k * .25; B.add(f); }
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 1.0, 10).rotateX(Math.PI / 2), Mat({ color: 0xd0d8e0, emissive: 0x40c0ff, emissiveIntensity: 0 })); axle.position.z = -.45; B.add(axle);
  // handle
  const hM = Mat({ color: 0x282c30 });
  const handle = new THREE.Mesh(new THREE.TorusGeometry(.8, .1, 8, 24, Math.PI), hM); handle.position.set(0, 1.25, -.3); B.add(handle);
  // tube: from housing outlet (x 1.0, y -.75) along +x, tapering
  const TL = 5.4, r0 = .5, r1 = .22, TX = 1.0, TY = -.75;
  const tubeM = Mat({ color: 0xf0a020, transparent: true, opacity: .38, side: THREE.DoubleSide, depthWrite: false, shininess: 90 });
  const tubeA = new THREE.Mesh(new THREE.CylinderGeometry(r0, r0, TL * .6, 28, 1, true).rotateZ(-Math.PI / 2), tubeM); tubeA.position.set(TX + TL * .3, TY, 0); B.add(tubeA);
  const nozM = Mat({ color: 0xf0c040, transparent: true, opacity: .45, emissive: 0xffa000, emissiveIntensity: 0, side: THREE.DoubleSide, depthWrite: false });
  const noz = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, TL * .4, 28, 1, true).rotateZ(-Math.PI / 2), nozM); noz.position.set(TX + TL * .8, TY, 0); B.add(noz);
  const tubeR = x => { const u = (x - TX) / TL; return u < .6 ? r0 : lerp(r0, r1, (u - .6) / .4); };
  B.rotation.z = -.12; // tip the nozzle down toward the leaves

  // air particles
  const airIn = new THREE.MeshBasicMaterial({ color: 0x80e0ff, transparent: true, opacity: .9 });
  const airTube = new THREE.MeshBasicMaterial({ color: 0xc0f4ff, transparent: true, opacity: .9 });
  const pGeo = new THREE.SphereGeometry(.06, 8, 6);
  const intake = []; for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(pGeo, airIn); B.add(m); intake.push({ m, ph: Math.random(), a: Math.random() * Math.PI * 2, r: .2 + Math.random() * .5 }); }
  const swirl = []; for (let i = 0; i < 30; i++) { const m = new THREE.Mesh(pGeo, airIn); B.add(m); swirl.push({ m, ph: Math.random() }); }
  const flow = []; for (let i = 0; i < 70; i++) { const m = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .3, 6).rotateZ(Math.PI / 2), airTube); B.add(m); flow.push({ m, ph: Math.random(), a: Math.random() * Math.PI * 2, r: Math.random() }); }
  // big volume arrow beyond nozzle
  const volM = new THREE.MeshBasicMaterial({ color: 0x80e0ff, transparent: true, opacity: 0, depthWrite: false });
  const vol = new THREE.Mesh(new THREE.ConeGeometry(1.0, 3, 28, 1, true).rotateZ(Math.PI / 2), volM); vol.position.set(TX + TL + 1.6, TY, 0); B.add(vol);

  const shots = [
    [[-8.5, 5.5, 9.0], [2.6, -1.0, 0]],  // 0 whole blower + leaves
    [[-4.0, 1.5, 1.6], [0, 0, -.6]],      // 1 motor + fan
    [[-1.5, 1.2, 5.8], [0, 0, 0]],        // 2 intake grille
    [[-1.0, 4.5, 7.5], [2.0, -.6, 0]],    // 3 fan flings into tube
    [[2.0, 2.0, 7.0], [5.0, -1.3, 0]],    // 4 nozzle
    [[3.5, 2.2, 7.5], [6.8, -2.0, 0]],   // 5 leaves pushed
    [[-8.5, 5.5, 9.0], [2.6, -1.0, 0]],  // 6 recap
  ];
  const cp = { p: V(), q: V() };
  let ang = 0, lastT = 0;
  function update(t, si, lt, sd) {
    const dt = Math.min(.05, Math.max(0, t - lastT)); lastT = t;
    const pulse = .5 + .5 * Math.sin(t * 7);
    const spin = si === 1 ? 2 + 28 * ease(lt / 2.5) : (si === 2 || si === 3 ? 6 : 34);
    ang += spin * dt; imp.rotation.z = -ang; axle.rotation.z = -ang;
    blurM.opacity = spin > 20 ? .3 : 0;
    motM.emissiveIntensity = si === 1 ? .3 + .2 * pulse : 0; axle.material.emissiveIntensity = si === 1 ? .6 * pulse : 0;
    impM.emissiveIntensity = si === 1 || si === 3 ? .35 + .3 * pulse : 0;
    grilleM.emissiveIntensity = si === 2 ? .5 + .4 * pulse : 0;
    nozM.emissiveIntensity = si === 4 ? .4 + .4 * pulse : 0;
    housM.opacity = si >= 1 && si <= 3 ? .25 : .4;
    const flowOn = si !== 1 || lt > 2;
    // intake: air from in front (+z) into grille
    intake.forEach(p => {
      p.m.visible = flowOn && si !== 4 && si !== 5; const ph = (t * .7 + p.ph) % 1;
      p.m.position.set(Math.cos(p.a + ph * 2) * p.r * (1 + (1 - ph) * 1.5), Math.sin(p.a + ph * 2) * p.r * (1 + (1 - ph) * 1.5), .4 + (1 - ph) * 2.6);
    });
    swirl.forEach((p, i) => {
      p.m.visible = flowOn && (si === 3 || si === 2 || si === 0 || si === 6); const ph = (t * .8 + p.ph) % 1;
      const a = ph * Math.PI * 2.5, r = .4 + ph * .75; p.m.position.set(Math.cos(-a) * r, Math.sin(-a) * r, (p.ph - .5) * .5);
    });
    const fast = si === 4 ? .6 : 1.1;
    flow.forEach(p => {
      p.m.visible = flowOn && si !== 2; const ph = (t * fast + p.ph) % 1;
      // accelerate in nozzle: map ph to x with speed rising in last 40%
      const u = ph < .5 ? ph * 1.2 : .6 + (ph - .5) * .8 + (ph - .5) * (ph - .5) * 1.6;
      const x = TX + Math.min(1.25, u) * TL; const rr = Math.min(tubeR(Math.min(x, TX + TL)), r0) * .8 * p.r;
      p.m.position.set(x, TY + Math.cos(p.a) * rr, Math.sin(p.a) * rr);
      p.m.scale.x = x > TX + TL * .6 ? 1 + (x - TX - TL * .6) * 1.2 : 1;
    });
    volM.opacity = si === 5 ? .25 + .15 * pulse : (si === 0 || si === 6 ? .12 : 0);
    // leaves get blown when air reaches them
    const blowK = si === 0 || si === 5 || si === 6 ? 1 : (si === 4 ? .3 : 0);
    leaves.forEach((L, i) => {
      L.off = (L.off || 0) + dt * blowK * L.v * 1.6; const d = L.off % 5;
      const x = L.x + d, lift = Math.max(0, Math.sin(d / 5 * Math.PI)) * (blowK > 0 ? .9 : 0);
      L.m.position.set(x, -2.38 + lift * (.6 + (i % 3) * .3), L.z + Math.sin(d + i) * .2 * blowK);
      L.m.rotation.set(-Math.PI / 2 + lift * Math.sin(t * 5 + i), L.r + d * 2, 0);
    });
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
