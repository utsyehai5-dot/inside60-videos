// Inside 60 — Piano (grand action, side cut-away). Steps: 0 hook strings + iron frame tension, 1 key lever,
// 2 hammer thrown at string, 3 escapement (hammer bounces off), 4 soundboard spreads vibration, 5 damper stops string, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x1a1a2c); scene.fog = new THREE.Fog(0x1a1a2c, 30, 80);
  scene.add(new THREE.HemisphereLight(0xf8f4ff, 0x403830, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.3); key.position.set(5, 10, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffc080, .5); rim.position.set(-6, 4, -8); scene.add(rim);

  // Layout: side view in x-y plane. Player at -x. Keys run along x, strings run along x above action, z = across keyboard.
  const root = new THREE.Group(); scene.add(root);
  const caseM = Mat({ color: 0x1a1a1e, shininess: 140, specular: 0x666666 });
  const KZ = 13; // number of keys shown (one octave-ish slice)
  const kw = .26;
  // case sides (low walls) behind keys
  const back = new THREE.Mesh(new THREE.BoxGeometry(7.4, .3, KZ * kw - .2), caseM); back.position.set(1.4, -1.25, 0); back.position.z = -.2; root.add(back);
  // soundboard (wood, under strings)
  const sbM = Mat({ color: 0xd8a868, emissive: 0xffc060, emissiveIntensity: 0, shininess: 30 });
  const sb = new THREE.Mesh(new THREE.BoxGeometry(4.4, .08, KZ * kw - .2), sbM); sb.position.set(3.1, -.9, 0); sb.position.z = -.2; root.add(sb);
  const ribs = []; for (let k = 0; k < 5; k++) { const r = new THREE.Mesh(new THREE.BoxGeometry(.08, .1, KZ * kw - .2), Mat({ color: 0xb08048 })); r.position.set(1.3 + k * .9, -.96, -.2); root.add(r); ribs.push(r); }
  const bridgeW = new THREE.Mesh(new THREE.BoxGeometry(.12, .18, KZ * kw - .2), Mat({ color: 0x8a5a30 })); bridgeW.position.set(3.6, -.77, 0); bridgeW.position.z = -.2; root.add(bridgeW);
  // iron frame (gold) plates at ends of strings
  const ironM = Mat({ color: 0xd4a840, emissive: 0xffb020, emissiveIntensity: 0, shininess: 120 });
  const plateA = new THREE.Mesh(new THREE.BoxGeometry(.5, .5, KZ * kw - .2), ironM); plateA.position.set(.2, .25, 0); plateA.position.z = -.2; root.add(plateA);
  const plateB = new THREE.Mesh(new THREE.BoxGeometry(.5, .5, KZ * kw - .2), ironM); plateB.position.set(5.2, -.45, 0); plateB.position.z = -.2; root.add(plateB);
  const strut = new THREE.Mesh(new THREE.BoxGeometry(5.0, .12, .18), ironM); strut.position.set(2.7, .4, -.4); strut.rotation.z = -.14; root.add(strut);
  // strings: from x=.3 (y=.05) to x=5.1 (y=-.62), slight slope; one per key slot
  const SA = V(.3, .02, 0), SB = V(5.1, -.62, 0);
  const sM = Mat({ color: 0xdde4ee, emissive: 0x000000, shininess: 160 });
  const NS = 40; const strings = [];
  for (let i = 0; i < KZ; i++) {
    const z = (i - (KZ - 1) / 2) * kw; const pts = []; for (let k = 0; k <= NS; k++) pts.push(V(lerp(SA.x, SB.x, k / NS), lerp(SA.y, SB.y, k / NS), z));
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const ln = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xe8eef6 })); root.add(ln);
    const len = SA.distanceTo(SB);
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, len, 6), sM); tube.position.set((SA.x + SB.x) / 2, (SA.y + SB.y) / 2, z); tube.rotation.z = Math.PI / 2 + Math.atan2(SB.y - SA.y, SB.x - SA.x); root.add(tube);
    strings.push({ ln, tube, geo, z });
  }
  const MAIN = KZ - 1;
  { const s = strings[MAIN]; s.tube.geometry = new THREE.CylinderGeometry(.04, .04, SA.distanceTo(SB), 10); s.tube.material = Mat({ color: 0xf0f6ff, emissive: 0x80c0ff, emissiveIntensity: .35, shininess: 160 }); s.ln.material = new THREE.LineBasicMaterial({ color: 0xffffff }); } // highlighted key/string in the middle
  const mainZ = strings[MAIN].z;
  // tension arrows (step 0) pulling the plates inward
  function arrow(color, len, rad) {
    const g = new THREE.Group(); const m = new THREE.MeshBasicMaterial({ color });
    const sh = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, len, 12), m); sh.position.y = len / 2; g.add(sh);
    const hd = new THREE.Mesh(new THREE.ConeGeometry(rad * 2.4, rad * 4, 16), m); hd.position.y = len + rad * 2; g.add(hd);
    root.add(g); return g;
  }
  const tA = arrow(0xff6050, 1.0, .07); tA.rotation.z = -Math.PI / 2; tA.position.set(-.4, .3, KZ * kw / 2 + .5);
  const tB = arrow(0xff6050, 1.0, .07); tB.rotation.z = Math.PI / 2; tB.position.set(5.8, -.45, KZ * kw / 2 + .5);

  // keys: white keys along z, pivot at x = -1.2 (balance rail). Key spans x -3.2..-0.2
  const whiteM = Mat({ color: 0xf8f6f0, shininess: 100 });
  const mainKeyM = Mat({ color: 0xf8f6f0, emissive: 0xffd040, emissiveIntensity: 0, shininess: 100 });
  const blackM = Mat({ color: 0x121214, shininess: 140 });
  const PIV = V(-1.6, -1.15, 0);
  const keys = [];
  for (let i = 0; i < KZ; i++) {
    const z = (i - (KZ - 1) / 2) * kw;
    const g = new THREE.Group(); g.position.set(PIV.x, PIV.y, z); root.add(g);
    const k = new THREE.Mesh(new THREE.BoxGeometry(3.0, .22, kw - .02), i === MAIN ? mainKeyM : whiteM); k.position.set(.1, 0, 0); g.add(k);
    if ([1, 2, 4, 5, 6, 8, 9, 11, 12].includes(i % 7 === 0 ? -1 : i) && i % 7 !== 3 && i < KZ - 1 && i !== MAIN) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(1.6, .22, kw * .55), blackM); b.position.set(-.6, .2, kw / 2); g.add(b);
    }
    keys.push(g);
  }
  const rail = new THREE.Mesh(new THREE.BoxGeometry(.12, .12, KZ * kw - .2), Mat({ color: 0x705030 })); rail.position.set(PIV.x, PIV.y - .17, 0); rail.position.z = -.2; root.add(rail);
  const pivDot = new THREE.Mesh(new THREE.SphereGeometry(.1, 14, 10), new THREE.MeshBasicMaterial({ color: 0xffe040 })); pivDot.position.set(PIV.x, PIV.y - .05, mainZ + kw * .6); root.add(pivDot);

  // action for MAIN key: wippen/jack lifts hammer. Hammer pivots at H0, head under string near x = .8
  const act = new THREE.Group(); act.position.z = mainZ; root.add(act);
  const H0 = V(-.3, -.75, 0);
  const shank = new THREE.Group(); shank.position.copy(H0); act.add(shank);
  const shM = Mat({ color: 0xc8a070 });
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(1.2, .06, .08), shM); shaft.position.x = .6; shank.add(shaft);
  const headM = Mat({ color: 0xf2efe4, emissive: 0xffd040, emissiveIntensity: 0, shininess: 10 });
  const head = new THREE.Mesh(new THREE.CapsuleGeometry(.1, .14, 6, 12), headM); head.position.set(1.15, .14, 0); head.scale.setScalar(1.3); shank.add(head);
  const headCore = new THREE.Mesh(new THREE.BoxGeometry(.2, .1, .12), Mat({ color: 0xa07040 })); headCore.position.set(1.15, .02, 0); shank.add(headCore);
  // jack (rides on key back end) — vertical post under shank
  const jackM = Mat({ color: 0x40d0ff, emissive: 0x20a0ff, emissiveIntensity: 0 });
  const jack = new THREE.Mesh(new THREE.BoxGeometry(.08, .32, .08), jackM); act.add(jack);
  const letoff = new THREE.Mesh(new THREE.BoxGeometry(.25, .08, .1), Mat({ color: 0xff6050 })); letoff.position.set(-.3, -.5, 0); act.add(letoff);
  // damper above string (falls onto it), near x = 1.4
  const damperG = new THREE.Group(); act.add(damperG);
  const dmM = Mat({ color: 0x302830, emissive: 0xff4060, emissiveIntensity: 0 });
  const dFelt = new THREE.Mesh(new THREE.BoxGeometry(.4, .14, .2), dmM); damperG.add(dFelt);
  const dWire = new THREE.Mesh(new THREE.CylinderGeometry(.02, .02, .9, 6), Mat({ color: 0xb0b8c4 })); dWire.position.y = .52; damperG.add(dWire);
  const DX = 1.55, dRestY = lerp(SA.y, SB.y, (DX - SA.x) / (SB.x - SA.x)) + .1;
  // sound rings from soundboard
  const rings = []; for (let k = 0; k < 4; k++) { const r = new THREE.Mesh(new THREE.TorusGeometry(1, .03, 6, 40), new THREE.MeshBasicMaterial({ color: 0xffc060, transparent: true })); r.rotation.x = Math.PI / 2; r.position.set(3.1, -.7, 0); root.add(r); rings.push(r); }
  const finger = new THREE.Mesh(new THREE.CapsuleGeometry(.12, .4, 6, 12), Mat({ color: 0xffd040, emissive: 0xffb020, emissiveIntensity: .3 })); root.add(finger);

  const strikeX = 0.85; const strikeY = lerp(SA.y, SB.y, (strikeX - SA.x) / (SB.x - SA.x));
  const shots = [
    [[-4.5, 4.5, 6.5], [2.0, -.6, 0]],      // 0 strings + frame from above-front
    [[-1.4, .6, 8.8], [-1.3, -1.0, 1.5]],    // 1 key lever side
    [[.5, .7, 5.6], [.55, -.3, 1.5]],       // 2 hammer close
    [[.9, .6, 5.0], [.55, -.25, 1.5]],       // 3 escapement close
    [[-2.5, 5.0, 6.0], [2.8, -.8, 0]],    // 4 soundboard
    [[1.8, .3, 5.6], [1.4, -.2, 1.5]],     // 5 damper close
    [[-5.0, 4.0, 7.5], [1.6, -.6, 0]],    // 6 recap
  ];
  const cp = { p: V(), q: V() };
  let lastT = 0, ringAmp = 0;
  function update(t, si, lt, sd) {
    const pulse = .5 + .5 * Math.sin(t * 7);
    // key press cycle: depressed amount kd 0..1
    let kd = 0, hitT = -1;
    const press = (a, b) => ease((lt - a) / .35) * (1 - ease((lt - b) / .4));
    if (si === 1) kd = press(.8, 99);
    else if (si === 2) kd = press(.6, 99);
    else if (si === 3) kd = press(.6, 99);
    else if (si === 4) kd = press(.3, 99);
    else if (si === 5) kd = 1 - ease((lt - 1.0) / .4);
    else if (si === 6) { const c = (lt % 2.2); kd = ease(c / .3) * (1 - ease((c - 1.2) / .3)); }
    const keyA = -.12 * kd; // back end lifts when front pressed (front at -x)
    keys[MAIN].rotation.z = keyA;
    // finger
    finger.visible = si >= 1; finger.position.set(-2.9, PIV.y + .5 - Math.sin(-keyA) * 1.4 + 0, mainZ); finger.rotation.z = .2;
    // hammer angle: rises with key, near string escapes and falls back to check
    const backLift = Math.sin(-keyA) * 1.3; // back end of key at x ~ -.3 relative pivot
    let hA = backLift * 1.3; // rad-ish
    const hitA = Math.atan2(strikeY - .14 - H0.y, strikeX - H0.x) - .0;
    let struck = false;
    if (kd > .85 && (si >= 2)) { // escape: thrown to string then rebound to rest-ish
      const since = si === 6 ? ((lt % 2.2) - .3) : lt - (si === 4 ? .65 : .95);
      const up = since < .12 ? since / .12 : 1 - ease((since - .12) / .35) * .55;
      hA = lerp(backLift * 1.3, hitA, Math.max(0, Math.min(1, up)));
      struck = since > 0;
    }
    hA = Math.min(hA, hitA);
    shank.rotation.z = hA;
    jack.position.set(-.45, -1.05 + backLift * .9, 0); jack.rotation.z = kd > .85 && si >= 3 ? -.35 : 0;
    // string vibration (MAIN rings after strike until damper)
    let vib = 0;
    if (si === 0) vib = .5;
    else if (struck) vib = 1;
    if (si === 5) vib = 1 - ease((lt - 1.1) / .3);
    if (si === 1) vib = 0;
    damperG.position.set(DX, dRestY + (kd > .3 || si === 0 ? .35 * Math.min(1, kd + (si === 0 ? 1 : 0)) : 0), 0);
    dmM.emissiveIntensity = si === 5 ? .5 + .3 * pulse : 0;
    strings.forEach((s, i) => {
      const a = s.geo.attributes.position; const amp = i === MAIN ? vib : (si === 0 ? .5 : 0);
      for (let k = 0; k <= NS; k++) { const u = k / NS; a.setY(k, lerp(SA.y, SB.y, u) + Math.sin(Math.PI * u) * Math.sin(t * (40 + i * 3)) * .035 * amp); }
      a.needsUpdate = true; s.tube.visible = i === MAIN || amp < .05; if (i === MAIN) { const bl = 1 + 1.5 * amp * Math.abs(Math.sin(t * 40)); s.tube.scale.set(bl, 1, bl); }
    });
    sM.emissive.setHex(0x80c0ff); sM.emissiveIntensity = si === 0 ? .3 + .2 * pulse : 0;
    ironM.emissiveIntensity = si === 0 ? .25 + .2 * pulse : 0;
    tA.visible = tB.visible = si === 0; tA.position.x = -.6 + .15 * pulse; tB.position.x = 6.0 - .15 * pulse;
    mainKeyM.emissiveIntensity = si === 1 ? .4 + .3 * pulse : 0;
    pivDot.visible = si === 1;
    headM.emissiveIntensity = si === 2 || si === 3 ? .4 + .3 * pulse : 0;
    jackM.emissiveIntensity = si === 3 ? .6 + .3 * pulse : 0;
    // soundboard
    const sbOn = si === 4 || si === 6 ? vib : 0;
    sbM.emissiveIntensity = sbOn * (.3 + .3 * pulse); sb.position.y = -.9 + Math.sin(t * 40) * .01 * sbOn;
    rings.forEach((r, k) => { const ph = (t * .7 + k / 4) % 1; r.visible = sbOn > .1; r.scale.set(.5 + ph * 3.5, .5 + ph * 3.5, 1); r.material.opacity = (1 - ph) * sbOn; });
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
