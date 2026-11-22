// Inside 60 — How a Lithium-Ion Battery Works. Steps: 0 hook, 1 electrodes, 2 separator, 3 discharge ions, 4 electrons outside -> bulb, 5 charging, 6 recap
export async function setup({ THREE, scene, camera }) {
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 50, specular: 0x333333, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  scene.background = new THREE.Color(0x111a2a);
  scene.fog = new THREE.Fog(0x111a2a, 24, 50);
  scene.add(new THREE.HemisphereLight(0xe8f0ff, 0x283038, 1.4));
  const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(5, 9, 7); scene.add(key);
  const rim = new THREE.DirectionalLight(0x88ccff, 1.0); rim.position.set(-6, 4, -5); scene.add(rim);
  const mk = (c, r) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, depthWrite: false })); scene.add(m); return m; };

  // battery cell (pouch) cut-away: anode left (graphite, dark), cathode right (oxide, red), separator middle
  const caseMat = Mat({ color: 0x9aa6b8, transparent: true, opacity: 1, shininess: 90, specular: 0xaaaaaa, depthWrite: true });
  const cell = new THREE.Mesh(new RoundedBoxGeometry(5.4, 4.2, 1.8, 3, .25), caseMat); scene.add(cell);
  const elyMat = Mat({ color: 0x6ad8ff, transparent: true, opacity: 0, emissive: 0x1a5a8a, emissiveIntensity: .3, depthWrite: false });
  const ely = new THREE.Mesh(new THREE.BoxGeometry(4.9, 3.8, 1.4), elyMat); scene.add(ely);
  // anode: stacked graphite sheets
  const anode = new THREE.Group(); anode.position.set(-1.75, 0, 0); scene.add(anode);
  const gMat = Mat({ color: 0x3a3e46, emissive: 0x000000, emissiveIntensity: 0, shininess: 70 });
  for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(.14, 3.5, 1.2), gMat); s.position.x = -.5 + i * .2; anode.add(s); }
  const cuFoil = new THREE.Mesh(new THREE.BoxGeometry(.06, 3.6, 1.25), Mat({ color: 0xd8823a, shininess: 90 })); cuFoil.position.x = -.72; anode.add(cuFoil);
  // cathode: lattice of red spheres
  const cathode = new THREE.Group(); cathode.position.set(1.75, 0, 0); scene.add(cathode);
  const oMat = Mat({ color: 0xd84a4a, emissive: 0x000000, shininess: 70 });
  const sph = new THREE.SphereGeometry(.13, 10, 8);
  for (let x = 0; x < 5; x++) for (let y = 0; y < 13; y++) for (let z = 0; z < 4; z++) { const m = new THREE.Mesh(sph, oMat); m.position.set(-.45 + x * .24, -1.65 + y * .275, -.45 + z * .3); cathode.add(m); }
  const alFoil = new THREE.Mesh(new THREE.BoxGeometry(.06, 3.6, 1.25), Mat({ color: 0xd6dbe2, shininess: 90 })); alFoil.position.x = .72; cathode.add(alFoil);
  // separator
  const sepMat = Mat({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0, transparent: true, opacity: .7, depthWrite: false, side: THREE.DoubleSide });
  const sep = new THREE.Mesh(new THREE.BoxGeometry(.06, 3.7, 1.3), sepMat); scene.add(sep);
  // terminals
  const tNeg = new THREE.Mesh(new RoundedBoxGeometry(.6, .7, .3, 2, .06), Mat({ color: 0xd8823a })); tNeg.position.set(-1.9, 2.4, 0); scene.add(tNeg);
  const tPos = new THREE.Mesh(new RoundedBoxGeometry(.6, .7, .3, 2, .06), Mat({ color: 0xd6dbe2 })); tPos.position.set(1.9, 2.4, 0); scene.add(tPos);
  // external circuit wire up and over to a bulb
  const wPts = [V(-1.9, 2.7, 0), V(-1.9, 4.2, 0), V(-.9, 4.9, 0), V(0, 4.95, 0), V(.9, 4.9, 0), V(1.9, 4.2, 0), V(1.9, 2.7, 0)];
  const wire = new THREE.CatmullRomCurve3(wPts);
  const wireMat = Mat({ color: 0xc87a3a, emissive: 0xffaa3a, emissiveIntensity: 0, transparent: true, opacity: 0 });
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(wire, 80, .06, 8), wireMat));
  const lampMat = Mat({ color: 0xfff6d8, emissive: 0xffe08a, emissiveIntensity: 0, transparent: true, opacity: 0 });
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(.42, 20, 14), lampMat); lamp.position.set(0, 5.25, 0); scene.add(lamp);
  const lampLight = new THREE.PointLight(0xffe0a0, 0, 7); lampLight.position.set(0, 5.2, 1); scene.add(lampLight);
  // charger plug (step 5) replaces lamp
  const plugMat = Mat({ color: 0x2a3040, transparent: true, opacity: 0 });
  const plug = new THREE.Mesh(new RoundedBoxGeometry(1.1, .7, .5, 2, .1), plugMat); plug.position.set(0, 5.25, 0); scene.add(plug);
  const boltMat = new THREE.MeshBasicMaterial({ color: 0x4aff8a, transparent: true, opacity: 0 });
  const bs = new THREE.Shape(); bs.moveTo(.05, .25); bs.lineTo(-.12, -.02); bs.lineTo(.02, -.02); bs.lineTo(-.05, -.25); bs.lineTo(.13, .04); bs.lineTo(-.01, .04); bs.closePath();
  const bolt = new THREE.Mesh(new THREE.ShapeGeometry(bs), boltMat); bolt.position.set(0, 5.25, .27); scene.add(bolt);

  // lithium ions (yellow glowing, with + rings)
  const ions = []; for (let i = 0; i < 22; i++) ions.push({ m: mk(0xffd84a, .13), y: -1.5 + (i % 11) * .3, z: (i < 11 ? -.3 : .3), o: (i * .37) % 1 });
  const elecs = []; for (let i = 0; i < 16; i++) elecs.push({ m: mk(0x5ad0ff, .09), o: i / 16 });
  const ionLight = new THREE.PointLight(0xffc84a, 0, 6); ionLight.position.set(0, 0, 2.2); scene.add(ionLight);

  // phone silhouette for hook
  const phoneMat = Mat({ color: 0x1a1e26, transparent: true, opacity: 0 });
  const phone = new THREE.Mesh(new RoundedBoxGeometry(3.4, 6.8, .5, 3, .4), phoneMat); phone.position.set(0, .6, -1.4); scene.add(phone);

  const shots = [
    [[0, 2.0, 18.5], [0, 1.4, 0]],
    [[-2.8, 1.0, 9.5], [-.5, .2, 0]],
    [[1.8, .4, 7.0], [0, .2, 0]],
    [[0, .8, 9.8], [0, .3, 0]],
    [[0, 2.6, 16.5], [0, 1.5, 0]],
    [[.8, 2.6, 16.5], [0, 1.5, 0]],
    [[0, 2.0, 18.5], [0, 1.4, 0]],
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
    const f = s => si === s ? 1 : 0;

    // hook: phone fades away revealing the cell; case goes transparent from step 1 on
    const ph = si === 0 ? 1 - ease((lt - 1.0) / 1.0) : 0;
    phoneMat.opacity = ph; phoneMat.depthWrite = ph > .9; phone.visible = ph > .01;
    const xr = si === 0 ? ease((lt - 1.5) / 1) : 1;
    caseMat.opacity = 1 - xr * .82; caseMat.depthWrite = xr < .1;
    elyMat.opacity = xr * (.12 + f(1) * .1);
    gMat.emissive.setHex(0x3a5aff); gMat.emissiveIntensity = f(1) * (.2 + .1 * Math.sin(t * 5));
    oMat.emissive.setHex(0xff3a3a); oMat.emissiveIntensity = f(1) * (.2 + .1 * Math.sin(t * 5 + 1));
    sepMat.emissiveIntensity = f(2) * (.6 + .3 * Math.sin(t * 6));

    // direction: discharge (anode -> cathode) for 0,3,4,6; charge (cathode -> anode) for 5; step 2 = ions pass, electrons bounce
    const moving = si === 0 || si >= 2;
    const dir = si === 5 ? -1 : 1;
    const sp = si === 2 ? .15 : .28;
    ions.forEach(({ m, y, z, o: oo }) => {
      let u = moving ? (t * sp + oo) % 1 : .1;
      if (dir < 0) u = 1 - u;
      const x = lerp(-1.6, 1.6, u);
      m.position.set(x, y + .08 * Math.sin(t * 3 + oo * 9), z + .95);
      m.material.opacity = xr * (si === 1 ? .7 : 1);
    });
    ionLight.intensity = (si >= 2 && si <= 5) || si === 0 ? 1.5 : 0;

    // electrons: in step 2 they hit the separator and bounce; in 4/5/6/0 travel the external wire
    const ext = si === 0 ? xr : (si >= 4 ? 1 : 0);
    wireMat.opacity = Math.max(ext, si === 3 ? .6 : 0); wireMat.emissiveIntensity = ext * .4;
    elecs.forEach(({ m, o: oo }, i) => {
      if (si === 2) { const u = (t * .6 + oo) % 1; const b = u < .5 ? u * 2 : 2 - u * 2; m.position.set(lerp(-1.3, -.12, b), -1.4 + (i % 8) * .4, .95); m.material.opacity = 1; }
      else if (ext > 0) { let u = (t * .25 + oo) % 1; if (si === 5) u = 1 - u; m.position.copy(wire.getPoint(u)); m.position.z += .12; m.material.opacity = ext; }
      else m.material.opacity = 0;
    });
    const lampOn = (si === 4 || si === 6 || si === 0) ? ext : 0;
    lampMat.opacity = si === 5 ? 1 - ease(lt / .5) : Math.max(lampOn, si === 3 ? .6 : 0); lampMat.emissiveIntensity = lampOn * 1.4;
    lampLight.intensity = lampOn * 3;
    const pl = si === 5 ? ease((lt - .4) / .6) : 0;
    plugMat.opacity = pl; boltMat.opacity = pl;
    lamp.visible = lampMat.opacity > .01;
  }
  return { update };
}
