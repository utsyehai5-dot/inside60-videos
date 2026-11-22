// Inside 60 — Lock and key (pin tumbler). Steps: 0 hook, 1 plug+housing, 2 pins/springs jam, 3 key lifts pins, 4 shear line, 5 turn, 6 recap
export async function setup({ THREE, scene, camera }) {
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x555555, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x1c2740); scene.fog = new THREE.Fog(0x1c2740, 30, 80);
  scene.add(new THREE.HemisphereLight(0xf0f4ff, 0x40404c, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 1.9); key.position.set(4, 8, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0xa0c0ff, .8); rim.position.set(-6, -3, -6); scene.add(rim);

  const R = 1, L = 6, XS = [-2, -1, 0, 1, 2], KP = [.9, .5, 1.2, .7, 1.0], DP = .75, TOP = 3.1, REST = -.3;
  const H = KP.map(k => R - k); // key cut heights = bottom of key pin when correct
  const root = new THREE.Group(); scene.add(root);

  // housing (transparent shell) + pin chamber tower
  const housM = Mat({ color: 0x9aa6b8, transparent: true, opacity: .28, depthWrite: false, side: THREE.DoubleSide });
  const housM2 = Mat({ color: 0x9aa6b8, emissive: 0x4080ff, emissiveIntensity: 0, transparent: true, opacity: .22, depthWrite: false });
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(R + .35, R + .35, L, 40, 1, true), housM); shell.rotation.z = Math.PI / 2; root.add(shell);
  const tower = new THREE.Mesh(new RoundedBoxGeometry(L - .4, TOP - R + .2, 1.0, 3, .1), housM2); tower.position.y = (TOP + R) / 2 + .1; root.add(tower);
  const face = new THREE.Mesh(new THREE.TorusGeometry(R + .35, .12, 10, 40), Mat({ color: 0xc8a24a, shininess: 120 })); face.rotation.y = Math.PI / 2; face.position.x = L / 2; root.add(face);

  // plug group (rotates about x)
  const plug = new THREE.Group(); root.add(plug);
  const plugM = Mat({ color: 0xd9b04a, emissive: 0xffa000, emissiveIntensity: 0, transparent: true, opacity: .45, depthWrite: false });
  const plugMesh = new THREE.Mesh(new THREE.CylinderGeometry(R, R, L, 40), plugM); plugMesh.rotation.z = Math.PI / 2; plug.add(plugMesh);
  const cam = new THREE.Mesh(new RoundedBoxGeometry(.3, 1.6, .5, 2, .08), Mat({ color: 0xc8ced8 })); cam.position.set(-L / 2 - .25, -.6, 0); plug.add(cam);

  // pins: key pins (brass, in plug group so they turn), drivers (silver), springs
  const kpM = Mat({ color: 0xf0b030, emissive: 0xff8000, emissiveIntensity: 0, shininess: 120 });
  const dpM = Mat({ color: 0xd8dde6, emissive: 0xff2020, emissiveIntensity: 0, shininess: 140 });
  const spM = Mat({ color: 0x9fb4c8, emissive: 0x40c0ff, emissiveIntensity: 0 });
  class Helix extends THREE.Curve { getPoint(t) { return new THREE.Vector3(.2 * Math.cos(t * 7 * Math.PI * 2), t, .2 * Math.sin(t * 7 * Math.PI * 2)); } }
  const spG = new THREE.TubeGeometry(new Helix(), 200, .035, 6, false);
  const pins = XS.map((x, i) => {
    const k = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, KP[i], 20), kpM); plug.add(k);
    const d = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, DP, 20), dpM); root.add(d);
    const s = new THREE.Mesh(spG, spM); root.add(s);
    return { x, k, d, s, b: REST };
  });

  // shear line glow
  const shearM = new THREE.MeshBasicMaterial({ color: 0x40ffd0, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  const shear = new THREE.Mesh(new THREE.PlaneGeometry(L + .6, 1.4), shearM); shear.rotation.x = -Math.PI / 2; shear.position.y = R; root.add(shear);
  const shearEdge = new THREE.Mesh(new THREE.BoxGeometry(L + .6, .04, .04), shearM); shearEdge.position.set(0, R, .72); root.add(shearEdge);

  // key: blade profile = min over V-cuts
  const MAXH = .6, KB = -.62, TIPU = -2.75;
  const keyTop = u => { if (u < TIPU) return -9; let h = MAXH; H.forEach((c, i) => { h = Math.min(h, c + 1.1 * Math.abs(u - XS[i])); }); return Math.min(h, KB + .25 + (u - TIPU) * 2.2); };
  const ks = new THREE.Shape(); ks.moveTo(TIPU, KB);
  for (let u = TIPU; u <= 3.6; u += .02) ks.lineTo(u, Math.max(KB + .05, keyTop(u)));
  ks.lineTo(3.6, KB); ks.closePath();
  const keyG = new THREE.Group(); plug.add(keyG);
  const keyM = Mat({ color: 0xcfd6e0, emissive: 0x2060ff, emissiveIntensity: 0, shininess: 150, specular: 0x999999 });
  const blade = new THREE.Mesh(new THREE.ExtrudeGeometry(ks, { depth: .22, bevelEnabled: false }), keyM); blade.position.z = -.11; keyG.add(blade);
  const bow = new THREE.Mesh(new RoundedBoxGeometry(1.6, 1.8, .3, 3, .3), keyM); bow.position.set(4.3, -.1, 0); keyG.add(bow);
  const hole = new THREE.Mesh(new THREE.TorusGeometry(.28, .08, 8, 20), Mat({ color: 0x8090a0 })); hole.position.set(4.7, -.1, 0); keyG.add(hole);

  // bolt
  const bolt = new THREE.Mesh(new RoundedBoxGeometry(3, .7, .7, 3, .12), Mat({ color: 0xb8c0cc, emissive: 0xff6000, emissiveIntensity: 0, shininess: 140 }));
  root.add(bolt);

  const shots = [
    [[6, 3, 24], [1.6, .9, 0]],
    [[-4, 2.5, 11], [0, 0, 0]],
    [[2.5, 3.2, 8.5], [0, 1.4, 0]],
    [[4, .8, 10.5], [.5, .6, 0]],
    [[1.5, 2.2, 7.2], [0, 1, 0]],
    [[-6, 4.5, 12], [-1.5, .3, 0]],
    [[6.5, 3, 24], [1.4, .9, 0]],
  ];
  const cp = { p: V(), q: V() };
  let kx = 9, rot = 0;
  function update(t, si, lt, sd) {
    sd = sd || 6;
    if (si === 0) kx = lerp(9, 0, ease((lt - .5) / (sd - 1)));
    if (si === 1) kx = lerp(kx, 9, .06);
    if (si === 2) kx = 9;
    if (si === 3) kx = lerp(9, 0, ease((lt - .6) / (sd - 1)));
    if (si === 4) kx = 0;
    rot = 0;
    if (si === 2) rot = Math.max(0, Math.sin(lt * 4)) * .05; // jammed wiggle
    if (si === 5) rot = lerp(0, Math.PI / 2, ease((lt - .6) / 1.8));
    if (si === 6) rot = (1 - Math.cos(lt * 1.6)) / 2 * Math.PI / 2;
    if (si >= 5) kx = 0;
    plug.rotation.x = rot; keyG.position.x = kx;
    const turned = rot > .06;
    pins.forEach((p, i) => {
      const kt = keyTop(p.x - kx);
      const target = Math.max(REST, kt);
      if (!turned) p.b = lerp(p.b, target, .5);
      // key pin rides inside plug (local coords)
      p.k.position.set(p.x, p.b + KP[i] / 2, 0);
      const dBot = turned ? R : p.b + KP[i];
      p.d.position.set(p.x, dBot + DP / 2, 0);
      const sb = dBot + DP, len = TOP - sb;
      p.s.position.set(p.x, sb, 0); p.s.scale.set(1, Math.max(.05, len), 1);
    });
    bolt.position.set(-L / 2 - 1.9 + (si >= 5 ? rot / (Math.PI / 2) * 1.2 : 0), -1.6, 0);
    const pulse = .5 + .5 * Math.sin(t * 5);
    plugM.emissiveIntensity = si === 1 ? .3 + .3 * pulse : (si === 5 ? .2 : 0);
    housM2.emissiveIntensity = si === 1 ? .4 * pulse : 0;
    dpM.emissiveIntensity = si === 2 ? .3 + .5 * pulse : 0;
    spM.emissiveIntensity = si === 2 ? .5 + .5 * pulse : 0;
    kpM.emissiveIntensity = si === 3 ? .35 + .35 * pulse : (si === 4 ? .2 : 0);
    keyM.emissiveIntensity = si === 3 ? .25 * pulse : 0;
    shearM.opacity = si === 4 ? Math.min(1, lt) * (.35 + .3 * pulse) : (si === 2 ? .15 : 0);
    bolt.material.emissiveIntensity = si === 5 ? .5 * pulse : 0;
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const k = si === 0 ? 1 : ease(lt / 1.3);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], k))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], k)));
    const o = Math.sin(t * .2) * .08, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o));
    camera.lookAt(cp.q);
  }
  return { update };
}
