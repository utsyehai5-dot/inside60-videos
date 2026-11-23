// Inside 60 — Motion sensor light. Steps: 0 hook (walker, lamp on), 1 body heat rings, 2 Fresnel lens zones,
// 3 two-half pyroelectric sensor (cutaway), 4 crossing zones -> lamp on, 5 daylight sensor + timer, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const night = new THREE.Color(0x0e1424), dayC = new THREE.Color(0x6a9ad0);
  scene.background = night.clone();
  const hemi = new THREE.HemisphereLight(0xc8d8ff, 0x202030, .9); scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff, .5); key.position.set(5, 8, 10); scene.add(key);
  const lampLight = new THREE.PointLight(0xfff0c0, 0, 22, 1.2); lampLight.position.set(0, 2.2, 1.2); scene.add(lampLight);
  const root = new THREE.Group(); scene.add(root);
  const GY = -3.0;

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), Mat({ color: 0x4a6a40, shininess: 5 })); ground.rotation.x = -Math.PI / 2; ground.position.set(0, GY, 6); root.add(ground);
  const path = new THREE.Mesh(new THREE.PlaneGeometry(16, 2.4), Mat({ color: 0xa09888, shininess: 5 })); path.rotation.x = -Math.PI / 2; path.position.set(0, GY + .01, 4.5); root.add(path);
  const wall = new THREE.Mesh(new THREE.BoxGeometry(16, 10, .4), Mat({ color: 0xb88a68, shininess: 10 })); wall.position.set(0, GY + 5, -.2); root.add(wall);
  const door = new THREE.Mesh(new THREE.BoxGeometry(2.2, 4.6, .1), Mat({ color: 0x6a3a28 })); door.position.set(-3.5, GY + 2.3, .05); root.add(door);
  // fixture: plate, two lamp heads, PIR dome below
  const FX = new THREE.Group(); FX.position.set(0, 2.2, 0); root.add(FX);
  const plate = new THREE.Mesh(new THREE.BoxGeometry(1.0, .6, .2), Mat({ color: 0x2a2c30 })); plate.position.z = .1; FX.add(plate);
  const bulbM = Mat({ color: 0xdddddd, emissive: 0xffe8a0, emissiveIntensity: 0 });
  [-1, 1].forEach(s => { const h = new THREE.Group(); h.position.set(s * .55, .1, .45); h.rotation.set(-.6, s * .5, 0); FX.add(h);
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(.42, .26, .6, 24, 1, true).rotateX(Math.PI / 2), Mat({ color: 0x2a2c30, side: THREE.DoubleSide })); h.add(cup);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(.4, 24), bulbM); lens.position.z = .3; h.add(lens); });
  const beamM = new THREE.MeshBasicMaterial({ color: 0xfff0b0, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  const beam = new THREE.Mesh(new THREE.ConeGeometry(4.2, 6.5, 32, 1, true).translate(0, -3.25, 0), beamM); beam.position.set(0, 2.3, .6); beam.rotation.x = -.55; root.add(beam);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, .45, 10), Mat({ color: 0x2a2c30 })); neck.position.set(0, -.45, .2); FX.add(neck);
  const domeM = Mat({ color: 0xf4f4f0, transparent: true, opacity: 1, shininess: 200, emissive: 0xff8020, emissiveIntensity: 0 });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(.32, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2), domeM); dome.position.set(0, -.75, .25); FX.add(dome);
  // facets on dome (Fresnel bumps)
  const facetM = Mat({ color: 0xffffff, emissive: 0x80c0ff, emissiveIntensity: 0, transparent: true, opacity: .9 });
  for (let r = 0; r < 3; r++) for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, rr = .1 + r * .08; const fct = new THREE.Mesh(new THREE.CircleGeometry(.035, 6), facetM); fct.position.set(Math.cos(a) * rr, -.75 + Math.sin(a) * rr, .25 + Math.sqrt(Math.max(0, .1 - rr * rr)) + .02); FX.add(fct); }
  // inner pyro sensor (two halves)
  const inner = new THREE.Group(); inner.position.set(0, -.75, .3); FX.add(inner);
  const can = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, .12, 24).rotateX(Math.PI / 2), Mat({ color: 0xb0b4bc, shininess: 200 })); inner.add(can);
  const hA = Mat({ color: 0x402010, emissive: 0xff6020, emissiveIntensity: 0 }), hB = Mat({ color: 0x102040, emissive: 0x20a0ff, emissiveIntensity: 0 });
  const halfA = new THREE.Mesh(new THREE.BoxGeometry(.07, .12, .02), hA); halfA.position.set(-.045, 0, .07); inner.add(halfA);
  const halfB = new THREE.Mesh(new THREE.BoxGeometry(.07, .12, .02), hB); halfB.position.set(.045, 0, .07); inner.add(halfB);
  inner.visible = false;
  // detection zones: alternating wedges on ground
  const zones = [];
  for (let i = 0; i < 9; i++) { const a0 = -Math.PI / 2 - .85 + i * (1.7 / 9); const m = new THREE.MeshBasicMaterial({ color: i % 2 ? 0x40a0ff : 0xff9040, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
    const z = new THREE.Mesh(new THREE.RingGeometry(1.2, 9, 3, 1, a0, 1.7 / 9 * .8), m); z.rotation.x = -Math.PI / 2; z.position.set(0, GY + .03, .4); root.add(z); zones.push(z); }
  // faceless walker
  const fig = new THREE.Group(); root.add(fig);
  const figM = Mat({ color: 0x8a96a8, emissive: 0xff5010, emissiveIntensity: 0, shininess: 40 });
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(.45, .38, 1.5, 20), figM); torso.position.y = GY + 2.55; fig.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.34, 20, 16), figM); head.position.y = GY + 3.65; fig.add(head);
  const legs = [-1, 1].map(s => { const g = new THREE.Group(); g.position.set(0, GY + 1.8, s * .2); g.add(new THREE.Mesh(new THREE.CylinderGeometry(.15, .13, 1.75, 12).translate(0, -.88, 0), figM)); fig.add(g); return g; });
  const arms = [-1, 1].map(s => { const g = new THREE.Group(); g.position.set(0, GY + 3.2, s * .58); g.add(new THREE.Mesh(new THREE.CylinderGeometry(.11, .1, 1.35, 12).translate(0, -.68, 0), figM)); fig.add(g); return g; });
  const heatRings = Array.from({ length: 5 }, () => { const m = new THREE.MeshBasicMaterial({ color: 0xff7030, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }); const r = new THREE.Mesh(new THREE.TorusGeometry(.6, .03, 6, 32), m); r.rotation.x = Math.PI / 2; root.add(r); return r; });
  // sun + timer ring
  const sunM = new THREE.MeshBasicMaterial({ color: 0xffd040, transparent: true, opacity: 0 });
  const sun = new THREE.Mesh(new THREE.SphereGeometry(.7, 24, 16), sunM); sun.position.set(3.5, 4.6, .5); root.add(sun);
  const timerBg = new THREE.Mesh(new THREE.TorusGeometry(.6, .06, 8, 48), new THREE.MeshBasicMaterial({ color: 0x404858 })); timerBg.position.set(2.4, 2.4, .6); root.add(timerBg);
  const timerM = new THREE.MeshBasicMaterial({ color: 0x40ffa0 });
  let timerArc = new THREE.Mesh(new THREE.TorusGeometry(.6, .08, 8, 48, Math.PI * 2), timerM); timerArc.position.copy(timerBg.position); root.add(timerArc);
  const hand = new THREE.Mesh(new THREE.BoxGeometry(.05, .5, .05).translate(0, .25, 0), new THREE.MeshBasicMaterial({ color: 0xffffff })); hand.position.copy(timerBg.position); root.add(hand);

  const shots = [
    [[3.5, 1.0, 17.0], [0, -.3, 2.0]],     // 0 wide
    [[4.0, .4, 13.0], [.8, -.6, 4.0]],     // 1 walker heat
    [[.8, 1.2, 3.6], [0, 1.3, .3]],        // 2 dome close
    [[.25, 1.5, 1.6], [0, 1.45, .3]],      // 3 sensor cutaway
    [[0, 7.0, 15.5], [0, -1.0, 2.5]],      // 4 high: zones + walker
    [[2.4, 1.8, 9.0], [1.2, 1.4, .5]],     // 5 sun + timer
    [[3.8, 1.4, 17.5], [0, -.3, 2.0]],     // 6 recap
  ];
  const cp = { p: V(), q: V() };
  let lastArcK = -1;
  function setArc(k) { if (Math.abs(k - lastArcK) < .01) return; lastArcK = k; timerArc.geometry.dispose(); timerArc.geometry = new THREE.TorusGeometry(.6, .08, 8, 48, Math.max(.01, Math.PI * 2 * k)); timerArc.rotation.z = Math.PI / 2; }
  function update(t, si, lt, sd) {
    const pulse = .5 + .5 * Math.sin(t * 7);
    const f = Math.min(1, lt / Math.max(.1, sd));
    // walker x path along the path strip
    let fx = 0, walking = true;
    if (si === 0) fx = lerp(-6, 1, f);
    else if (si === 1) fx = lerp(-2, 2.5, f);
    else if (si === 4) fx = lerp(-6.5, 4, f);
    else if (si === 6) fx = lerp(-3, 3, f);
    else walking = false;
    fig.visible = si !== 5 && si !== 2 && si !== 3;
    fig.position.set(fx, 0, 4.5);
    const sw = walking ? Math.sin(t * 6) * .45 : 0;
    legs[0].rotation.z = sw; legs[1].rotation.z = -sw; arms[0].rotation.z = -sw * .8; arms[1].rotation.z = sw * .8;
    figM.emissiveIntensity = si === 1 || si === 4 ? .35 + .3 * pulse : 0;
    heatRings.forEach((r, i) => { const k = (t * .6 + i / 5) % 1; r.visible = si === 1; r.position.set(fx, GY + .2 + k * 4.2, 4.5); r.scale.setScalar(.8 + k * .8); r.material.opacity = .8 * Math.sin(k * Math.PI); });
    // zones
    const zoneShow = si === 2 ? ease((f - .2) / .3) : (si === 4 ? 1 : 0);
    const zIdx = Math.floor((Math.atan2(-4.1, fx) + Math.PI / 2 + .85) / (1.7 / 9));
    zones.forEach((z, i) => { const hit = si === 4 && i === zIdx; z.material.opacity = zoneShow * (hit ? .6 : .22); });
    facetM.emissiveIntensity = si === 2 ? .4 + .3 * pulse : 0;
    // cutaway
    const cut = si === 3 ? ease(f / .2) : 0;
    domeM.opacity = 1 - .8 * cut; domeM.transparent = true; inner.visible = si === 3;
    const flick = Math.sin(t * 4);
    hA.emissiveIntensity = si === 3 ? (f > .45 ? .3 + .6 * Math.max(0, flick) : .3) : 0;
    hB.emissiveIntensity = si === 3 ? (f > .45 ? .3 + .6 * Math.max(0, -flick) : .3) : 0;
    domeM.emissiveIntensity = si === 4 && fx > -4 ? .3 * pulse : 0;
    // lamp state
    let on = 0;
    if (si === 0) on = f > .45 ? 1 : 0;
    else if (si === 1 || si === 2 || si === 3) on = 0;
    else if (si === 4) on = fx > -4 ? 1 : 0;
    else if (si === 5) on = f > .35 && f < .75 ? 1 : 0;
    else if (si === 6) on = 1;
    bulbM.emissiveIntensity = on * 1.2; beamM.opacity = on * .13; lampLight.intensity = on * 3.5;
    // day/sun + timer
    const dayK = si === 5 ? (f < .3 ? 1 : 0) : 0;
    scene.background.copy(night).lerp(dayC, dayK); hemi.intensity = lerp(.9, 1.7, dayK);
    sunM.opacity = si === 5 && f < .3 ? 1 : 0;
    const tShow = si === 5 && f >= .35;
    timerBg.visible = tShow; timerArc.visible = tShow; hand.visible = tShow;
    if (tShow) { const k = 1 - Math.min(1, (f - .35) / .4); setArc(k); hand.rotation.z = -(1 - k) * Math.PI * 2; timerM.color.setHex(k > 0 ? 0x40ffa0 : 0xff4040); }
    // camera
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const kk = si === 0 ? 1 : ease(lt / 1.4);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], kk))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], kk)));
    const ob = Math.sin(t * .25) * .05, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(ob) - dz * Math.sin(ob), cp.p.y, cp.q.z + dz * Math.cos(ob) + dx * Math.sin(ob));
    camera.lookAt(cp.q);
  }
  return { update };
}
