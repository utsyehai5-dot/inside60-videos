// Inside 60 — Wi-Fi router. Steps: 0 hook (2.4 GHz), 1 cable from modem, 2 packets with addresses, 3 radio waves from antennas, 4 phone catches + replies, 5 local addresses / routing, 6 recap
export async function setup({ THREE, scene, camera }) {
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const ss = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 90, specular: 0x666666, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x101e34); scene.fog = new THREE.Fog(0x101e34, 30, 80);
  scene.add(new THREE.HemisphereLight(0xf0f4ff, 0x40404c, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(5, 8, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0xa0d0ff, .8); rim.position.set(-6, -3, -6); scene.add(rim);

  // desk
  const desk = new THREE.Mesh(new RoundedBoxGeometry(12, .3, 7, 2, .1), Mat({ color: 0x6a5240, shininess: 30 })); desk.position.set(0, -.15, 0); scene.add(desk);
  // router
  const R = new THREE.Group(); scene.add(R); R.position.set(0, 0, 0);
  const bodyM = Mat({ color: 0xf2f4f8, shininess: 120 });
  const body = new THREE.Mesh(new RoundedBoxGeometry(3.4, .7, 2.2, 3, .2), bodyM); body.position.y = .45; R.add(body);
  const stripe = new THREE.Mesh(new RoundedBoxGeometry(3.42, .12, 2.22, 2, .05), Mat({ color: 0x2f7fd8 })); stripe.position.y = .3; R.add(stripe);
  const ledMs = [];
  for (let i = 0; i < 5; i++) { const m = Mat({ color: 0x103020, emissive: 0x30ff80, emissiveIntensity: .2 }); ledMs.push(m); const l = new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 6), m); l.position.set(-1 + i * .5, .5, 1.11); R.add(l); }
  const antM = Mat({ color: 0x2a2d36, emissive: 0x40c0ff, emissiveIntensity: 0 });
  const antTips = [];
  [-1.3, -.45, .45, 1.3].forEach((x, i) => { const a = new THREE.Mesh(new THREE.CylinderGeometry(.09, .12, 2.4, 12), antM); a.position.set(x, 2.0, -.9); a.rotation.z = (i - 1.5) * .12; R.add(a); antTips.push(V(x - Math.sin(a.rotation.z) * 1.2, 3.2, -.9)); });
  // modem + cable
  const modem = new THREE.Mesh(new RoundedBoxGeometry(1.6, 2.2, 1.2, 3, .15), Mat({ color: 0x3a3e48 })); modem.position.set(-4.6, 1.25, -1.6); scene.add(modem);
  const cable = new THREE.CatmullRomCurve3([V(-4.0, .4, -1.6), V(-3.2, .12, -1.6), V(-2.2, .15, -1.2), V(-1.7, .4, -.6)]);
  const cableM = Mat({ color: 0x2a5ab8, emissive: 0x3080ff, emissiveIntensity: .1 });
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(cable, 40, .08, 8, false), cableM));
  // devices
  const scrM = c => Mat({ color: 0x101820, emissive: c, emissiveIntensity: .25 });
  const devs = [];
  const phone = new THREE.Group(); phone.position.set(3.6, .9, 1.6); phone.rotation.y = -.5; scene.add(phone);
  phone.add(new THREE.Mesh(new RoundedBoxGeometry(.9, 1.8, .12, 3, .1), Mat({ color: 0x30333a })));
  const pS = scrM(0xff60c0); const ps = new THREE.Mesh(new THREE.PlaneGeometry(.78, 1.62), pS); ps.position.z = .065; phone.add(ps);
  devs.push({ g: phone, m: pS, col: 0xff60c0, at: V(3.6, .9, 1.6) });
  const lap = new THREE.Group(); lap.position.set(-3.4, .05, 1.8); lap.rotation.y = .5; scene.add(lap);
  const lb = new THREE.Mesh(new RoundedBoxGeometry(2.2, .1, 1.5, 2, .04), Mat({ color: 0xa0a8b4 })); lb.position.y = .05; lap.add(lb);
  const lid = new THREE.Group(); lid.position.set(0, .1, -.72); lid.rotation.x = -.25; lap.add(lid);
  const lidM = new THREE.Mesh(new RoundedBoxGeometry(2.2, 1.4, .06, 2, .03), Mat({ color: 0xa0a8b4 })); lidM.position.y = .7; lid.add(lidM);
  const lS = scrM(0xffc040); const ls = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.2), lS); ls.position.set(0, .7, .035); lid.add(ls);
  devs.push({ g: lap, m: lS, col: 0xffc040, at: V(-3.4, .9, 1.6) });
  const tab = new THREE.Group(); tab.position.set(3.4, 1.0, -1.6); tab.rotation.y = -.7; scene.add(tab);
  tab.add(new THREE.Mesh(new RoundedBoxGeometry(1.9, 1.3, .1, 2, .08), Mat({ color: 0x30333a })));
  const tS = scrM(0x60ffb0); const ts = new THREE.Mesh(new THREE.PlaneGeometry(1.75, 1.15), tS); ts.position.z = .055; tab.add(ts);
  devs.push({ g: tab, m: tS, col: 0x60ffb0, at: V(3.4, 1.0, -1.6) });

  // packets (cubes) in the cable
  const pk = [];
  const cols = [0xff60c0, 0xffc040, 0x60ffb0];
  for (let i = 0; i < 9; i++) { const m = new THREE.MeshPhongMaterial({ color: cols[i % 3], emissive: cols[i % 3], emissiveIntensity: .6, transparent: true, opacity: 0 }); const c = new THREE.Mesh(new RoundedBoxGeometry(.26, .26, .26, 2, .05), m); scene.add(c); const tag = new THREE.Mesh(new THREE.BoxGeometry(.3, .06, .3), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 })); c.add(tag); tag.position.y = .17; pk.push({ c, m, tag, i }); }
  // radio wave shells from antennas
  const shells = [];
  for (let i = 0; i < 6; i++) { const m = new THREE.MeshBasicMaterial({ color: 0x60d0ff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }); const w = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI * .5), m); w.position.set(0, 1.0, -.6); scene.add(w); shells.push({ w, m, o: i / 6 }); }
  const rings = [];
  for (let i = 0; i < 4; i++) { const m = new THREE.MeshBasicMaterial({ color: 0x90e8ff, transparent: true, opacity: 0, depthWrite: false }); const w = new THREE.Mesh(new THREE.TorusGeometry(1, .035, 6, 64), m); w.rotation.x = Math.PI / 2; w.position.set(0, 1.0, -.6); scene.add(w); rings.push({ w, m, o: i / 4 }); }
  // flying packets router <-> devices
  const fly = [];
  for (let i = 0; i < 12; i++) { const d = i % 3; const m = new THREE.MeshBasicMaterial({ color: cols[d], transparent: true, opacity: 0, depthWrite: false }); const s = new THREE.Mesh(new THREE.SphereGeometry(.14, 10, 8), m); scene.add(s); fly.push({ s, m, d, o: (i / 12) }); }
  const src = V(0, 2.8, -.8);
  const arc = (a, b, u, h) => V(lerp(a.x, b.x, u), lerp(a.y, b.y, u) + h * Math.sin(Math.PI * u), lerp(a.z, b.z, u));

  const shots = [
    [[4, 6, 13], [0, .4, 0]],
    [[-3.5, 5.5, 4.5], [-2.6, -.4, -1.2]],
    [[-.5, 3, 5], [-1.4, -.4, -.6]],
    [[3, 4, 13], [0, 1.2, -.5]],
    [[8, 3.5, 9], [2.4, .2, .6]],
    [[0, 9, 14], [0, 1, .8]],
    [[-4, 6, 13], [0, .4, 0]],
  ];
  const cp = { p: V(), q: V() };
  function update(t, si, lt) {
    const pulse = .5 + .5 * Math.sin(t * 6);
    ledMs.forEach((m, i) => { m.emissiveIntensity = .3 + .7 * ((Math.floor(t * 6 + i * 1.7) % 3) === 0); });
    antM.emissiveIntensity = si === 0 || si === 3 || si === 6 ? .3 + .4 * pulse : .05;
    cableM.emissiveIntensity = si === 1 || si === 2 ? .4 + .3 * pulse : .1;
    // packets travelling through the cable into the router
    const pOn = si === 1 || si === 2;
    pk.forEach(p => { const u = (t * .22 + p.i / 9) % 1; p.c.position.copy(cable.getPoint(u)); p.c.position.y += .05; p.c.rotation.y = t + p.i; const big = si === 2 ? 1.6 : 1; p.c.scale.setScalar(big); p.m.opacity = pOn ? ss(0, .08, u) * (1 - ss(.92, 1, u)) : 0; p.tag.material.opacity = si === 2 ? p.m.opacity : 0; });
    // radio waves
    const wOn = si === 0 || si === 3 || si === 4 || si === 6;
    const spd = si === 0 ? .7 : .45;
    shells.forEach(a => { const u = (t * spd + a.o) % 1; const r = .8 + u * 7; a.w.scale.set(r, r * .8, r); a.m.opacity = wOn ? (si === 3 ? .22 : .12) * (1 - u) : 0; });
    rings.forEach(a => { const u = (t * spd + a.o) % 1; const r = .8 + u * 7; a.w.scale.set(r, r, 1); a.m.opacity = wOn ? .6 * (1 - u) : 0; });
    // device screens + flying packets
    devs.forEach((d, i) => { d.m.emissiveIntensity = (si === 4 && i === 0) || si === 5 ? .5 + .4 * pulse : .2; });
    fly.forEach(f => {
      let on = 0, pos = null; const u = (t * .45 + f.o) % 1;
      if (si === 4) { const dv = devs[0]; const back = f.o > .5; on = 1; pos = back ? arc(dv.at, src, u, 1.2) : arc(src, dv.at, u, 1.6); f.m.color.setHex(back ? 0xffffff : cols[0]); }
      else if (si === 5) { const dv = devs[f.d]; on = 1; pos = arc(src, dv.at, u, 1.8); f.m.color.setHex(cols[f.d]); }
      if (pos) f.s.position.copy(pos);
      f.m.opacity = on ? ss(0, .1, u) * (1 - ss(.9, 1, u)) : 0;
    });
    phone.position.y = .9 + (si === 4 ? .05 * Math.sin(t * 3) : 0);
    // camera
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const k = si === 0 ? 1 : ease(lt / 1.3);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], k))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], k)));
    const o = Math.sin(t * .2) * .08, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o));
    camera.lookAt(cp.q);
  }
  return { update };
}
