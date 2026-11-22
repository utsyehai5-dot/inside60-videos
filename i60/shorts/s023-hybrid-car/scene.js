// Inside 60 — Hybrid car. Steps: 0 hook, 1 engine+motor, 2 battery, 3 EV mode, 4 both, 5 regen braking, 6 recap
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 60, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x142034);
  scene.fog = new THREE.Fog(0x142034, 30, 80);
  scene.add(new THREE.HemisphereLight(0xeaf2ff, 0x303028, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(6, 10, 9); scene.add(key);
  const rim = new THREE.DirectionalLight(0x88ccff, .9); rim.position.set(-7, 5, -6); scene.add(rim);

  // road
  const road = new THREE.Mesh(new THREE.BoxGeometry(60, .1, 7), Mat({ color: 0x2a2f3a })); road.position.y = -.05; scene.add(road);
  const dashes = []; for (let i = 0; i < 20; i++) { const d = new THREE.Mesh(new THREE.BoxGeometry(1.2, .02, .15), Mat({ color: 0xffe070, emissive: 0x806020, emissiveIntensity: .5 })); d.position.set(-30 + i * 3, .02, 3.2); scene.add(d); dashes.push(d); }

  const car = new THREE.Group(); scene.add(car);
  // transparent shell
  const shellM = Mat({ color: 0x5ab0ff, transparent: true, opacity: .22, depthWrite: false, shininess: 120 });
  const body = new THREE.Mesh(new RoundedBoxGeometry(7.2, 1.3, 3.0, 4, .45), shellM); body.position.y = 1.15; car.add(body);
  const cab = new THREE.Mesh(new RoundedBoxGeometry(3.8, 1.1, 2.7, 4, .45), shellM); cab.position.set(-.3, 2.2, 0); car.add(cab);
  // wheels
  const wheels = [];
  for (const x of [-2.4, 2.4]) for (const z of [-1.45, 1.45]) {
    const w = new THREE.Group(); w.position.set(x, .62, z); car.add(w);
    const tire = new THREE.Mesh(new THREE.TorusGeometry(.48, .18, 12, 30), Mat({ color: 0x1a1a1e })); w.add(tire);
    const rimM = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, .2, 6), Mat({ color: 0xc8d0da, shininess: 120 })); rimM.rotation.x = Math.PI / 2; w.add(rimM);
    wheels.push(w);
  }
  // front axle
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 2.9, 10), Mat({ color: 0xa0a8b4 })); axle.rotation.x = Math.PI / 2; axle.position.set(2.4, .62, 0); car.add(axle);
  // engine (front, orange)
  const engM = Mat({ color: 0xd06a30, emissive: 0xff6020, emissiveIntensity: 0 });
  const eng = new THREE.Mesh(new RoundedBoxGeometry(1.3, 1.0, 1.4, 3, .12), engM); eng.position.set(2.5, 1.4, -.25); car.add(eng);
  const pist = []; for (let i = 0; i < 3; i++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, .3, 14), Mat({ color: 0xffb070 })); p.position.set(2.5, 2.0, -.7 + i * .45); car.add(p); pist.push(p); }
  // electric motor (blue cylinder) next to engine
  const motM = Mat({ color: 0x3a8cff, emissive: 0x2080ff, emissiveIntensity: 0 });
  const mot = new THREE.Mesh(new THREE.CylinderGeometry(.45, .45, .9, 24), motM); mot.rotation.x = Math.PI / 2; mot.position.set(2.5, 1.2, .85); car.add(mot);
  const coil = new THREE.Mesh(new THREE.TorusGeometry(.47, .06, 8, 30), Mat({ color: 0xd08a30 })); coil.position.copy(mot.position); car.add(coil);
  // battery (rear, under seat)
  const batM = Mat({ color: 0x40c070, emissive: 0x30ff80, emissiveIntensity: 0 });
  const bat = new THREE.Group(); bat.position.set(-1.8, .95, 0); car.add(bat);
  const cells = []; for (let i = 0; i < 5; i++) { const c = new THREE.Mesh(new RoundedBoxGeometry(.4, .5, 2.0, 2, .06), batM.clone()); c.position.x = -.9 + i * .45; bat.add(c); cells.push(c); }
  // cable battery<->motor
  const cable = new THREE.CatmullRomCurve3([V(-.9, .95, .6), V(.5, .7, .8), V(1.8, .9, .85), V(2.1, 1.2, .85)]);
  car.add(new THREE.Mesh(new THREE.TubeGeometry(cable, 50, .05, 8, false), Mat({ color: 0xff9040 })));
  // power paths
  const engPath = new THREE.CatmullRomCurve3([V(2.5, 1.4, -.25), V(2.5, .9, -.6), V(2.4, .62, -1.3)]);
  const motPath = new THREE.CatmullRomCurve3([V(2.5, 1.2, .85), V(2.5, .8, 1.0), V(2.4, .62, 1.3)]);
  function flow(n, col) { const g = new THREE.SphereGeometry(.09, 8, 6); return Array.from({ length: n }, () => { const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0 })); car.add(m); return m; }); }
  const eP = flow(16, 0xff8030), mP = flow(16, 0x60c0ff), cP = flow(26, 0x70ffb0);
  // brake glow
  const brakeM = new THREE.MeshBasicMaterial({ color: 0xff3030, transparent: true, opacity: 0 });
  for (const z of [-1.4, 1.4]) { const b = new THREE.Mesh(new THREE.BoxGeometry(.08, .25, .5), brakeM); b.position.set(-3.62, 1.3, z * .8); car.add(b); }

  const shots = [
    [[7, 6.5, 14], [0, 1.3, 0]],
    [[7.5, 4.5, 6.5], [2.5, 1.3, .2]],
    [[-3.5, 5.5, 6.5], [-1.8, 1.0, 0]],
    [[3, 4, 9], [.3, 1.0, .4]],
    [[8.5, 3.5, 5.5], [2.4, 1.1, 0]],
    [[-8, 4.5, 9], [0, 1.0, 0]],
    [[7, 6.5, 14.5], [0, 1.3, 0]],
  ];
  const cp = { p: V(), q: V() }; let A = 0, lastT = 0, spd = 0, D = 0; const tmp = V();
  function update(t, si, lt) {
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const k = si === 0 ? 1 : ease(lt / 1.3);
    cp.p.set(...prev[0].map((v, i) => lerp(v, now[0][i], k))); cp.q.set(...prev[1].map((v, i) => lerp(v, now[1][i], k)));
    const o = Math.sin(t * .2) * .08, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o)); camera.lookAt(cp.q);
    const dt = Math.min(.1, Math.max(0, t - lastT)); lastT = t;
    const target = si === 5 ? 2 : si === 4 ? 9 : si === 3 ? 4 : si === 2 ? 0 : 5;
    spd = lerp(spd, target, Math.min(1, dt * 1.5)); A -= dt * spd * 1.6; D += dt * spd;
    wheels.forEach(w => w.rotation.z = A);
    dashes.forEach((d, i) => d.position.x = (((i * 3 - D * 2) % 60) + 60) % 60 - 30);
    const pulse = .35 + .25 * Math.sin(t * 6);
    const engOn = si === 0 || si === 1 || si === 4 || si === 6;
    const motOn = si === 0 || si === 1 || si === 3 || si === 4 || si === 5 || si === 6;
    engM.emissiveIntensity = engOn ? (si === 1 || si === 4 ? pulse : .2) : 0;
    pist.forEach((p, i) => p.position.y = 2.0 + (engOn ? .12 * Math.sin(t * 18 + i * 2.1) : 0));
    motM.emissiveIntensity = motOn ? (si === 1 || si === 3 || si === 5 ? pulse + .2 : .3) : 0;
    mot.rotation.y = 0; coil.rotation.z = A;
    const charge = si === 5 ? .5 + .5 * Math.sin(t * 4) : si === 2 ? pulse : .1;
    cells.forEach((c, i) => c.material.emissiveIntensity = si === 2 ? Math.max(0, Math.sin(t * 4 - i * .7)) * .8 : si === 5 ? (i < 1 + ((lt * 1.5) | 0) % 6 ? .7 : .1) : charge * .4);
    brakeM.opacity = si === 5 ? .9 : 0;
    eP.forEach((p, i) => { const u = (i / eP.length + t * .9) % 1; engPath.getPointAt(u, tmp); p.position.copy(tmp); p.material.opacity = engOn && si !== 0 && si !== 6 ? 1 : 0; });
    mP.forEach((p, i) => { let u = (i / mP.length + t * .9) % 1; if (si === 5) u = 1 - u; motPath.getPointAt(u, tmp); p.position.copy(tmp); p.material.opacity = motOn && si !== 0 && si !== 6 ? 1 : 0; });
    cP.forEach((p, i) => { let u = (i / cP.length + t * .45) % 1; if (si === 5) u = 1 - u; cable.getPointAt(u, tmp); p.position.copy(tmp); p.material.opacity = (si === 2 || si === 3 || si === 4 || si === 5) ? 1 : 0; p.material.color.setHex(si === 5 ? 0x70ff90 : 0x70d0ff); });
    car.position.y = .02 * Math.sin(t * 7) * (spd > 1 ? 1 : 0);
  }
  return { update };
}
