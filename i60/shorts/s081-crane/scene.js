// Inside 60 — Crane. Steps: 0 hook big lift, 1 boom lever + tip pulley, 2 pulleys 4 lines = 1/4 force, 3 trade-off winch reels 4x rope, 4 counterweight balance, 5 slew + tracks, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x152034); scene.fog = new THREE.Fog(0x152034, 40, 110);
  scene.add(new THREE.HemisphereLight(0xf4f8ff, 0x404050, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(8, 14, 12); scene.add(key);
  const rim = new THREE.DirectionalLight(0x90c0ff, .6); rim.position.set(-8, 6, -10); scene.add(rim);

  const GY = -3.2;
  const ground = new THREE.Mesh(new THREE.BoxGeometry(30, .2, 14), Mat({ color: 0x3a3f46, shininess: 5 })); ground.position.y = GY - .1; scene.add(ground);
  const yellow = Mat({ color: 0xffc21a, emissive: 0x000000 });
  const dark = Mat({ color: 0x2b2f36, shininess: 20 });
  const steel = Mat({ color: 0x9aa4b2, shininess: 120 });
  const cableM = new THREE.MeshBasicMaterial({ color: 0xdde6f0 });

  // undercarriage: two crawler tracks
  const under = new THREE.Group(); under.position.set(-1.5, GY, 0); scene.add(under);
  const trackM = Mat({ color: 0x30343a, emissive: 0x000000, shininess: 10 });
  [-1, 1].forEach(s => {
    const tr = new THREE.Mesh(new THREE.BoxGeometry(4.6, .9, .9), trackM); tr.position.set(0, .45, s * 1.25); under.add(tr);
    [-2.1, 2.1].forEach(x => { const w = new THREE.Mesh(new THREE.CylinderGeometry(.45, .45, .92, 20), dark); w.rotation.x = Math.PI / 2; w.position.set(x, .45, s * 1.25); under.add(w); });
  });
  const carbody = new THREE.Mesh(new THREE.BoxGeometry(2.2, .5, 2.0), dark); carbody.position.y = .9; under.add(carbody);
  // slew ring
  const ringM = Mat({ color: 0x8090a0, emissive: 0x000000 });
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, .25, 40), ringM); ring.position.y = 1.27; under.add(ring);

  // superstructure (rotates)
  const top = new THREE.Group(); top.position.set(-1.5, GY + 1.4, 0); scene.add(top);
  const house = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.3, 2.2), yellow); house.position.set(-.5, .65, 0); top.add(house);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.2, .9), Mat({ color: 0x9fd0ff, transparent: true, opacity: .75, shininess: 200 })); cab.position.set(.9, 1.0, 1.25); top.add(cab);
  // counterweight stack
  const cwM = Mat({ color: 0x5a6270, emissive: 0x000000 });
  const cws = []; for (let k = 0; k < 3; k++) { const c = new THREE.Mesh(new THREE.BoxGeometry(1.3, .55, 2.3), cwM); c.position.set(-2.75, .3 + k * .58, 0); top.add(c); cws.push(c); }
  // winch drum
  const drumM = Mat({ color: 0xff6a3d, emissive: 0x000000 });
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, 1.1, 24), drumM); drum.rotation.x = Math.PI / 2; drum.position.set(-.6, 1.65, 0); top.add(drum);
  const drumStripe = new THREE.Mesh(new THREE.BoxGeometry(.86, .1, 1.12), Mat({ color: 0x222222 })); drum.add(drumStripe); drumStripe.rotation.x = -Math.PI / 2;

  // boom: lattice-ish (two chords + rungs) from pivot
  const PIV = V(1.0, 1.0, 0), ANG = THREE.MathUtils.degToRad(68), BL = 8.6;
  const boom = new THREE.Group(); boom.position.copy(PIV); boom.rotation.z = ANG - Math.PI / 2; top.add(boom); // local +y along boom
  const boomM = Mat({ color: 0xffc21a, emissive: 0x000000 });
  [-.32, .32].forEach(z => [-.25, .25].forEach(x => { const c = new THREE.Mesh(new THREE.BoxGeometry(.09, BL, .09), boomM); c.position.set(x, BL / 2, z); boom.add(c); }));
  for (let k = 0; k < 14; k++) { const y = .4 + k * (BL - .6) / 13; const r = new THREE.Mesh(new THREE.BoxGeometry(.55, .06, .06), boomM); r.position.set(0, y, .32); r.rotation.z = (k % 2 ? 1 : -1) * .9; boom.add(r); const r2 = r.clone(); r2.position.z = -.32; boom.add(r2); }
  const tipSheaveM = Mat({ color: 0x40e0ff, emissive: 0x000000 });
  const tipSheave = new THREE.Mesh(new THREE.CylinderGeometry(.38, .38, .25, 24), tipSheaveM); tipSheave.rotation.x = Math.PI / 2; tipSheave.position.set(0, BL, 0); boom.add(tipSheave);
  // boom tip in top-local coords
  const TIP = V(PIV.x + Math.cos(ANG) * BL, PIV.y + Math.sin(ANG) * BL, 0);
  // pendant cables from house to boom tip
  const pend = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 1, 6), cableM); top.add(pend);
  const A = V(-1.8, 1.5, 0); { const d = TIP.clone().sub(A); pend.scale.y = d.length(); pend.position.copy(A).addScaledVector(d, .5); pend.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); }
  // hoist line from drum to tip
  const hoist = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, 1, 6), cableM); top.add(hoist);
  { const B = V(-.6, 2.05, 0); const d = TIP.clone().sub(B); hoist.scale.y = d.length(); hoist.position.copy(B).addScaledVector(d, .5); hoist.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); }

  // hook block with 4 falls of rope
  const linesM = new THREE.MeshBasicMaterial({ color: 0xdde6f0 });
  const lines = []; [-.27, -.09, .09, .27].forEach(z => { const l = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 1, 6), linesM.clone()); l.userData.z = z; top.add(l); lines.push(l); });
  const blockM = Mat({ color: 0xff4a3a, emissive: 0x000000 });
  const block = new THREE.Mesh(new THREE.BoxGeometry(.5, .6, .8), blockM); top.add(block);
  const blockSheaves = []; [-.18, .18].forEach(z => { const s = new THREE.Mesh(new THREE.CylinderGeometry(.24, .24, .08, 18), tipSheaveM); s.rotation.x = Math.PI / 2; s.userData.z = z; top.add(s); blockSheaves.push(s); });
  const hook = new THREE.Mesh(new THREE.TorusGeometry(.18, .06, 8, 18, Math.PI * 1.5), steel); top.add(hook);
  // load: steel beam bundle / crate
  const loadM = Mat({ color: 0x3fd07a, emissive: 0x000000 });
  const load = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 1.2), loadM); top.add(load);
  const slings = []; for (let k = 0; k < 4; k++) { const s = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, 1, 5), cableM); top.add(s); slings.push(s); }
  // outriggers-ish track glow handled via trackM

  // arrows
  function arrow(color, len, rad) {
    const g = new THREE.Group(); const m = new THREE.MeshBasicMaterial({ color });
    const sh = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, len, 12), m); sh.position.y = len / 2; g.add(sh);
    const hd = new THREE.Mesh(new THREE.ConeGeometry(rad * 2.4, rad * 4, 16), m); hd.position.y = len + rad * 2; g.add(hd);
    scene.add(g); return g;
  }
  const downLoad = arrow(0xff7050, 1.4, .07); downLoad.rotation.z = Math.PI;
  const downCW = arrow(0x50e0ff, 1.4, .07); downCW.rotation.z = Math.PI;
  const smallPull = arrow(0x50e0ff, .5, .06);
  const upLift = arrow(0x50ff90, 1.2, .07);
  const pivotM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .9 });
  const pivotMark = new THREE.Mesh(new THREE.ConeGeometry(.35, .6, 3), pivotM); scene.add(pivotMark);
  // rope "dashes" streaming onto drum (trade-off)
  const dashes = []; for (let k = 0; k < 10; k++) { const d = new THREE.Mesh(new THREE.SphereGeometry(.08, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffe040 })); d.userData.o = k / 10; top.add(d); dashes.push(d); }

  const C = V(-.5, 2.2, 0);
  const shots = [
    [[7, 3.5, 27], [0, 1.4, 0]],          // 0 overview
    [[10, 6, 16], [1.4, 3.6, 0]],         // 1 boom
    [[6.5, 2.6, 8.5], [2.7, 1.0, 0]],     // 2 hook block close
    [[-8, 3.5, 13], [-.8, .8, 0]],       // 3 winch drum
    [[-2, 3, 21], [0, 1.6, 0]],            // 4 balance side view
    [[-14, 12, 20], [-1, .5, 0]],         // 5 slew from above
    [[9, 4, 27], [0, 1.4, 0]],            // 6 recap
  ];
  const cp = { p: V(), q: V() };
  let lastT = 0, yaw = 0, drumA = 0;
  const tipW = V(), tmp = V();
  function update(t, si, lt, sd) {
    const dt = Math.min(.1, Math.max(0, t - lastT)); lastT = t;
    const pulse = .5 + .5 * Math.sin(t * 7);
    // load height (top-local, relative to top.y = GY+1.4): ground at -1.4
    const groundL = -1.4;
    let lift; // 0 = on ground, 1 = high
    if (si === 0) lift = ease(lt / 3) * .55;
    else if (si === 1) lift = .55;
    else if (si === 2 || si === 3) lift = .55 + .25 * ease(lt / (sd || 4));
    else lift = .8;
    const loadBot = groundL + lift * 4.2;
    // slew
    const targetYaw = si === 5 ? -Math.PI * .5 * ease(lt / 3.2) : si === 6 ? -Math.PI * .5 * (1 - ease(lt / 2.5)) : 0;
    yaw = targetYaw; top.rotation.y = yaw;
    // hook geometry under the tip
    const blockY = loadBot + 1.0 + 1.1 + .3;
    block.position.set(TIP.x, blockY, 0);
    blockSheaves.forEach(s => s.position.set(TIP.x, blockY + .05, s.userData.z));
    hook.position.set(TIP.x, blockY - .5, 0); hook.rotation.z = Math.PI * .75;
    load.position.set(TIP.x, loadBot + .5, 0);
    slings.forEach((s, k) => { const a = V(TIP.x, blockY - .65, 0), b = V(TIP.x + (k < 2 ? -.7 : .7), loadBot + 1.0, k % 2 ? .5 : -.5); const d = b.clone().sub(a); s.scale.y = d.length(); s.position.copy(a).addScaledVector(d, .5); s.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); });
    lines.forEach(l => { const a = V(TIP.x + l.userData.z, TIP.y, 0), b = V(TIP.x + l.userData.z, blockY + .1, 0); const d = b.clone().sub(a); l.scale.y = d.length(); l.position.copy(a).addScaledVector(d, .5); l.material.color.setHex(si === 2 ? (Math.floor(t * 2.5) % 4 === lines.indexOf(l) ? 0xffe040 : 0x7fe8ff) : 0xdde6f0); });
    // drum spin
    const lifting = (si === 0 && lt < 3) || si === 2 || si === 3;
    drumA += (lifting ? (si === 3 ? 6 : 2.5) : 0) * dt; drum.rotation.y = drumA;
    // glows
    boomM.emissive.setHex(0xffa000); boomM.emissiveIntensity = si === 1 ? .25 + .2 * pulse : 0;
    tipSheaveM.emissive.setHex(0x20c0ff); tipSheaveM.emissiveIntensity = si === 1 || si === 2 ? .4 + .3 * pulse : .05;
    blockM.emissive.setHex(0xff3020); blockM.emissiveIntensity = si === 2 ? .35 + .25 * pulse : 0;
    drumM.emissive.setHex(0xff4010); drumM.emissiveIntensity = si === 3 ? .4 + .3 * pulse : 0;
    cwM.emissive.setHex(0x3080ff); cwM.emissiveIntensity = si === 4 ? .35 + .3 * pulse : 0;
    ringM.emissive.setHex(0x40e0ff); ringM.emissiveIntensity = si === 5 ? .5 + .3 * pulse : 0;
    trackM.emissive.setHex(0x40ff90); trackM.emissiveIntensity = si === 5 ? .12 + .1 * pulse : 0;
    loadM.emissive.setHex(0x30ff80); loadM.emissiveIntensity = si === 0 ? .2 + .15 * pulse : .05;
    // dashes along hoist line into the drum (step 3)
    const B = V(-.6, 2.05, 0);
    dashes.forEach(d => { const a = (t * 1.6 + d.userData.o) % 1; d.visible = si === 3; d.position.copy(TIP).lerp(B, a); });
    // world-space arrows (top not rotated during steps 2-4)
    top.localToWorld(tipW.copy(TIP));
    downLoad.visible = si === 4; downLoad.position.set(tipW.x + 1.3, top.position.y + loadBot + 2.6, .6); downLoad.scale.setScalar(1.3);
    downCW.visible = si === 4; top.localToWorld(tmp.set(-2.75, 2.2, 0)); downCW.position.set(tmp.x, tmp.y + 2.0, tmp.z); downCW.scale.setScalar(1.3);
    pivotMark.visible = si === 4; top.localToWorld(tmp.set(.7, -1.4 + .3, 1.6)); pivotMark.position.copy(tmp); pivotMark.rotation.x = Math.PI; pivotM.opacity = .6 + .4 * pulse;
    smallPull.visible = si === 2; smallPull.position.set(tipW.x - 1.2, tipW.y - 3.0, .6); smallPull.scale.setScalar(.9 + .2 * pulse); smallPull.rotation.z = Math.PI;
    upLift.visible = si === 0 && lt < 3.2; upLift.position.set(tipW.x + 1.4, top.position.y + loadBot, .8);
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
