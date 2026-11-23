// Inside 60 — Welding torch (oxy-acetylene). Steps: 0 hook (flame on steel), 1 tanks+hoses, 2 valves+mixing chamber,
// 3 flame cones, 4 puddle + filler rod, 5 bead cools, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x161a26); scene.fog = new THREE.Fog(0x161a26, 30, 80);
  scene.add(new THREE.HemisphereLight(0xfff8f0, 0x303040, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(5, 9, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0x80c0ff, .5); rim.position.set(-6, 4, -8); scene.add(rim);
  const fire = new THREE.PointLight(0x60a0ff, 0, 8); scene.add(fire);
  const root = new THREE.Group(); scene.add(root);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(18, 48), Mat({ color: 0x2a313c, shininess: 5 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -2.6; root.add(floor);

  // tanks (left, back)
  const tank = (x, col, glowCol) => {
    const grp = new THREE.Group(); grp.position.set(x, -2.6, -2.2); root.add(grp);
    const m = Mat({ color: col, emissive: glowCol, emissiveIntensity: 0, shininess: 120 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, 3.6, 32), m); body.position.y = 1.8; grp.add(body);
    const top = new THREE.Mesh(new THREE.SphereGeometry(.55, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), m); top.position.y = 3.6; grp.add(top);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, .35, 12), Mat({ color: 0xc0a040 })); neck.position.y = 4.25; grp.add(neck);
    const reg = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .16, 24).rotateX(Math.PI / 2), Mat({ color: 0xd8dce0 })); reg.position.set(0, 4.45, .12); grp.add(reg);
    const face = new THREE.Mesh(new THREE.CircleGeometry(.18, 24), new THREE.MeshBasicMaterial({ color: 0xffffff })); face.position.set(0, 4.45, .21); grp.add(face);
    const needle = new THREE.Mesh(new THREE.BoxGeometry(.02, .14, .01), new THREE.MeshBasicMaterial({ color: 0xff3020 })); needle.geometry.translate(0, .07, 0); needle.position.set(0, 4.45, .22); grp.add(needle);
    return { grp, m, needle, outlet: V(x, 4.55 - 2.6, -2.0) };
  };
  const tO = tank(-4.2, 0x2aa050, 0x40ff80);  // oxygen
  const tF = tank(-2.9, 0xc83030, 0xff4020);  // fuel

  // torch: group pivot at tip; handle extends back-left/up
  const torch = new THREE.Group(); torch.position.set(1.7, -.9, 0); torch.rotation.z = -.55; root.add(torch);
  // along -x from tip
  const shellM = Mat({ color: 0xd0a050, transparent: true, opacity: .9, side: THREE.DoubleSide, depthWrite: false, shininess: 150 });
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, 2.4, 24, 1, true).rotateZ(Math.PI / 2), shellM); handle.position.x = -2.9; torch.add(handle);
  const chamberM = Mat({ color: 0xc0c8d0, transparent: true, opacity: .9, side: THREE.DoubleSide, depthWrite: false, emissive: 0xc060ff, emissiveIntensity: 0 });
  const chamber = new THREE.Mesh(new THREE.CylinderGeometry(.17, .2, .9, 24, 1, true).rotateZ(Math.PI / 2), chamberM); chamber.position.x = -1.3; torch.add(chamber);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(.06, .09, 1.0, 16).rotateZ(Math.PI / 2), Mat({ color: 0xc89040, shininess: 160 })); tube.position.x = -.45; torch.add(tube);
  const tip = new THREE.Mesh(new THREE.CylinderGeometry(.03, .06, .2, 16).rotateZ(Math.PI / 2), Mat({ color: 0xb06030 })); tip.position.x = .05; torch.add(tip);
  // valves on handle (oxygen green, fuel red)
  const valveO = new THREE.Group(); valveO.position.set(-3.6, .1, .3); torch.add(valveO);
  const valveF = new THREE.Group(); valveF.position.set(-3.6, .1, -.3); torch.add(valveF);
  const vM = [Mat({ color: 0x30c060, emissive: 0x40ff80, emissiveIntensity: 0 }), Mat({ color: 0xd04040, emissive: 0xff4020, emissiveIntensity: 0 })];
  [valveO, valveF].forEach((v, i) => {
    v.add(new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .3, 10).rotateX(Math.PI / 2), Mat({ color: 0x909aa4 })));
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, .1, 12).rotateX(Math.PI / 2), vM[i]); knob.position.z = i ? -.18 : .18; v.add(knob);
    for (let k = 0; k < 6; k++) { const r = new THREE.Mesh(new THREE.BoxGeometry(.04, .05, .1), vM[i]); const a = k / 6 * Math.PI * 2; r.position.set(Math.cos(a) * .16, Math.sin(a) * .16, knob.position.z); knob.add(r); r.position.z = 0; }
    v.userData.knob = knob;
  });
  torch.updateMatrixWorld(true); root.updateMatrixWorld(true);
  const tw = p => torch.localToWorld(p.clone());
  // hoses
  const hoseEnd = [tw(V(-4.1, 0, .12)), tw(V(-4.1, 0, -.12))];
  const outs = [tO.outlet, tF.outlet];
  const hoseM = [Mat({ color: 0x208a40, emissive: 0x40ff80, emissiveIntensity: 0 }), Mat({ color: 0xb02828, emissive: 0xff4020, emissiveIntensity: 0 })];
  const mkCurve = (o, i, e) => new THREE.CatmullRomCurve3([o, V(o.x + .3, o.y - .8, o.z + .6), V(o.x + .9, -2.3, -.6 + i * .2), V(e.x - 1.0, e.y - .9, e.z), V(e.x - .25, e.y - .1, e.z), e]);
  const curves = outs.map((o, i) => mkCurve(o, i, hoseEnd[i]));
  const hoses = curves.map((c, i) => { const h = new THREE.Mesh(new THREE.TubeGeometry(c, 60, .07, 10), hoseM[i]); root.add(h); return h; });
  let lastKey = '';
  const rebuildHoses = () => {
    const k = torch.position.y.toFixed(2) + ',' + torch.position.z.toFixed(2); if (k === lastKey) return; lastKey = k;
    torch.updateMatrixWorld(true);
    [V(-4.1, 0, .12), V(-4.1, 0, -.12)].forEach((pp, i) => { const e = tw(pp); curves[i] = mkCurve(outs[i], i, e); hoses[i].geometry.dispose(); hoses[i].geometry = new THREE.TubeGeometry(curves[i], 60, .07, 10); });
  };
  // gas particles in hoses and torch
  const gasO = new THREE.MeshBasicMaterial({ color: 0x60ff90 }), gasF = new THREE.MeshBasicMaterial({ color: 0xff6040 }), gasMix = new THREE.MeshBasicMaterial({ color: 0xe0a0ff });
  const hoseDots = []; for (let i = 0; i < 2; i++) for (let k = 0; k < 18; k++) { const d = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), i ? gasF : gasO); root.add(d); hoseDots.push({ d, i, s: k / 18 }); }
  const inDots = []; for (let k = 0; k < 30; k++) { const i = k % 3; const d = new THREE.Mesh(new THREE.SphereGeometry(.045, 8, 6), i === 0 ? gasO : i === 1 ? gasF : gasMix); torch.add(d); inDots.push({ d, i, s: Math.random() }); }

  // flame: outer envelope + inner cone (point along +x from tip in torch space)
  const outerM = new THREE.MeshBasicMaterial({ color: 0x4070ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const outer = new THREE.Mesh(new THREE.ConeGeometry(.3, 1.5, 24, 1, true).rotateZ(-Math.PI / 2).translate(.75, 0, 0), outerM); outer.position.x = .15; torch.add(outer);
  const innerM = new THREE.MeshBasicMaterial({ color: 0xd8f0ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const inner = new THREE.Mesh(new THREE.ConeGeometry(.09, .4, 20).rotateZ(-Math.PI / 2).translate(.2, 0, 0), innerM); inner.position.x = .15; torch.add(inner);
  const hotM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
  const hot = new THREE.Mesh(new THREE.SphereGeometry(.07, 12, 8), hotM); hot.position.x = .65; torch.add(hot);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.2, .02, 6, 30), new THREE.MeshBasicMaterial({ color: 0xffe040, transparent: true, opacity: 0 })); ring.rotation.y = Math.PI / 2; ring.position.x = .65; torch.add(ring);
  torch.updateMatrixWorld(true);
  const flameEnd = tw(V(1.6, 0, 0));

  // steel plates under the flame; seam along z at flame end x
  const sx = flameEnd.x, py = flameEnd.y - .15;
  const plM = Mat({ color: 0x8890a0, shininess: 150, emissive: 0xff5010, emissiveIntensity: 0 });
  const pl1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, .3, 3.2), plM); pl1.position.set(sx - .86, py, 0); root.add(pl1);
  const pl2 = new THREE.Mesh(new THREE.BoxGeometry(1.6, .3, 3.2), plM); pl2.position.set(sx + .86, py, 0); root.add(pl2);
  const stand = new THREE.Mesh(new THREE.BoxGeometry(4, py + 2.6 - .15, 2.6), Mat({ color: 0x485566 })); stand.position.set(sx, (py - .15 - 2.6) / 2, 0); root.add(stand);
  // bead: segments along z, filled progressively
  const beadSegs = [];
  for (let k = 0; k < 24; k++) {
    const m = Mat({ color: 0x9aa0a8, emissive: 0xff7020, emissiveIntensity: 0, shininess: 120 });
    const b = new THREE.Mesh(new THREE.SphereGeometry(.16, 14, 10), m); b.scale.set(1, .55, 1); b.position.set(sx, py + .14, 1.4 - k * .12); b.visible = false; root.add(b); beadSegs.push({ b, m, hotT: -1 });
  }
  const pudM = new THREE.MeshBasicMaterial({ color: 0xffb040, transparent: true, opacity: 0 });
  const puddle = new THREE.Mesh(new THREE.SphereGeometry(.22, 16, 10), pudM); puddle.scale.set(1, .4, 1); root.add(puddle);
  // filler rod
  const rodM = Mat({ color: 0xc8b070, emissive: 0xffa030, emissiveIntensity: 0, shininess: 140 });
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, 3, 10).translate(0, 1.5, 0), rodM); root.add(rod); rod.visible = false;
  // sparks
  const sparkM = new THREE.MeshBasicMaterial({ color: 0xffc050 });
  const sparks = []; for (let i = 0; i < 40; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(.03, .03, .12), sparkM); root.add(s); sparks.push({ m: s, s: Math.random(), v: V((Math.random() - .5) * 2, .8 + Math.random() * 1.2, (Math.random() - .5) * 2) }); }

  const shots = [
    [[3.4, .3, 5.2], [2.3, -1.2, 0]],      // 0 hook flame
    [[-6.2, 2.6, 6.2], [-3.4, .2, -1.6]],   // 1 tanks
    [[.3, 2.4, 8.2], [-.5, .3, 0]],        // 2 handle + chamber
    [[3.0, -.5, 4.2], [2.3, -1.25, 0]],    // 3 flame close
    [[4.2, 1.6, 4.2], [sx, py, .2]],         // 4 weld
    [[4.6, 2.6, -2.8], [sx, py, .2]],        // 5 cool
    [[.3, 3.8, 15.5], [.3, -.3, -.6]],   // 6 recap wide
  ];
  const cp = { p: V(), q: V() };
  let lastT = 0, beadPos = 0;
  function update(t, si, lt, sd) {
    const dt = Math.min(.05, Math.max(0, t - lastT)); lastT = t;
    const pulse = .5 + .5 * Math.sin(t * 8), flick = .85 + .15 * Math.sin(t * 37) * Math.sin(t * 23);
    // gas
    const gasOn = si >= 1; const showHoseGas = si === 1 || si === 2;
    hoseDots.forEach(h => { h.d.visible = showHoseGas; h.s = (h.s + dt * .35) % 1; h.d.position.copy(curves[h.i].getPointAt(h.s)); });
    tO.m.emissiveIntensity = si === 1 ? .2 + .2 * pulse : 0; tF.m.emissiveIntensity = si === 1 ? .2 + .2 * pulse : 0;
    hoseM.forEach(m => m.emissiveIntensity = si === 1 ? .25 + .2 * pulse : 0);
    tO.needle.rotation.z = si >= 1 ? -.8 + .05 * Math.sin(t * 3) : 1.2; tF.needle.rotation.z = si >= 1 ? -.4 + .05 * Math.sin(t * 2.6) : 1.2;
    shellM.opacity = si === 2 ? .18 : .9; chamberM.opacity = si === 2 ? .2 : .9;
    chamberM.emissiveIntensity = si === 2 ? .4 + .3 * pulse : 0;
    vM.forEach(m => m.emissiveIntensity = si === 2 ? .4 + .3 * pulse : 0);
    valveO.userData.knob.rotation.z = si === 2 ? ease(lt / 1.5) * 2.5 : 2.5; valveF.userData.knob.rotation.z = si === 2 ? -ease((lt - .6) / 1.5) * 2.5 : -2.5;
    inDots.forEach(d => {
      d.d.visible = si === 2 || si === 3; d.s = (d.s + dt * .5) % 1; const k = d.s;
      const z = d.i === 2 ? 0 : (d.i === 0 ? .1 : -.1);
      if (d.i === 2) { d.d.position.set(-1.6 + k * 1.75, 0, (Math.sin(k * 30 + t) * .04)); }
      else d.d.position.set(-4.0 + k * 2.4, 0, z * (1 - Math.max(0, k - .7) / .3));
    });
    // flame
    const flameOn = si !== 1 && si !== 2 ? 1 : 0;
    const f = si === 3 ? ease(lt / .6) : flameOn;
    outerM.opacity = .7 * f * flick; innerM.opacity = .95 * f; outer.scale.set(flick, 1, 1);
    fire.intensity = 2.5 * f * flick; fire.position.copy(flameEnd);
    hotM.opacity = si === 3 ? ease((lt - 1.8) / .6) * (.6 + .4 * pulse) : 0;
    ring.material.opacity = hotM.opacity; ring.scale.setScalar(1 + .3 * pulse);
    // weld
    const welding = si === 0 || si === 4 || si === 6 || (si === 3);
    plM.emissiveIntensity = welding ? .08 + .04 * pulse : si === 5 ? .04 * (1 - lt / sd) : 0;
    if (si === 4) beadPos = Math.min(23, Math.floor(ease(lt / sd) * 20) + 2);
    if (si === 6 || si === 0) beadPos = Math.max(beadPos, 0);
    beadSegs.forEach((s, k) => {
      s.b.visible = si >= 4 && k <= beadPos;
      if (s.b.visible && s.hotT < 0) s.hotT = t;
      const age = s.hotT < 0 ? 0 : t - s.hotT;
      s.m.emissiveIntensity = si === 5 ? Math.max(0, .9 - lt / (sd * .7)) * Math.max(0, 1 - k / 30) : Math.max(.15, 1 - age / 4);
      s.m.color.setHex(si >= 5 ? 0x8a8f98 : 0xa0a0a0);
    });
    const pz = beadSegs[Math.min(23, beadPos)].b.position.z;
    puddle.position.set(sx, py + .16, si === 4 ? pz : 0);
    pudM.opacity = welding ? .85 + .15 * pulse : 0; if (si === 3) pudM.opacity *= ease((lt - .5) / 1);
    // torch follows the puddle along z during weld
    torch.position.z = si === 4 || si === 5 ? pz : 0;
    torch.position.y = si === 5 ? -.9 + ease(lt / 1.2) * 1.2 : -.9;
    rebuildHoses();
    rod.visible = si === 4; rod.position.set(sx + .25, py + .18, pz - .25); rod.rotation.set(-.6, 0, -.7);
    rodM.emissiveIntensity = si === 4 ? .5 + .3 * pulse : 0;
    sparks.forEach(s => {
      s.m.visible = welding && f > .5;
      s.s = (s.s + dt * 1.4) % 1; const k = s.s;
      s.m.position.set(puddle.position.x + s.v.x * k, puddle.position.y + s.v.y * k - 2.5 * k * k, puddle.position.z + s.v.z * k);
      s.m.scale.setScalar(1 - k * .7);
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
