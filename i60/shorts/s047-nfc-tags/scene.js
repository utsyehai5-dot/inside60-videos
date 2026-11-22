// Inside 60 — NFC tags. Steps: 0 hook (no battery), 1 phone field 13.56 MHz, 2 tag loop catches power, 3 chip wakes, 4 load modulation reply, 5 range ~4 cm, 6 recap
export async function setup({ THREE, scene, camera }) {
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const ss = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x555555, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x101c34); scene.fog = new THREE.Fog(0x101c34, 30, 70);
  scene.add(new THREE.HemisphereLight(0xf4f6ff, 0x40404c, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.9); key.position.set(5, 9, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0xa0c8ff, .7); rim.position.set(-6, -2, -6); scene.add(rim);

  // table
  const table = new THREE.Mesh(new RoundedBoxGeometry(16, .4, 10, 2, .15), Mat({ color: 0x4a5266, shininess: 30 })); table.position.y = -.2; scene.add(table);

  // TAG: white sticker lying flat on the table, with square spiral antenna + chip
  const tag = new THREE.Group(); tag.position.set(0, .06, 0); scene.add(tag);
  tag.add(new THREE.Mesh(new RoundedBoxGeometry(3.4, .08, 3.4, 2, .03), Mat({ color: 0xf2f2f4, shininess: 20 })));
  const antM = Mat({ color: 0xb87333, emissive: 0xffa040, emissiveIntensity: 0, shininess: 120 });
  const loops = [];
  for (let i = 0; i < 5; i++) {
    const h = 1.45 - i * .17; const pts = [V(-h, 0, -h), V(h, 0, -h), V(h, 0, h), V(-h, 0, h), V(-h, 0, -h + .17)];
    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.02);
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, .035, 6, false), antM); m.position.y = .06; tag.add(m); loops.push(m);
  }
  const chipM = Mat({ color: 0x1a1a22, emissive: 0x40c0ff, emissiveIntensity: 0 });
  const chip = new THREE.Mesh(new RoundedBoxGeometry(.6, .14, .6, 2, .04), chipM); chip.position.set(0, .1, 0); tag.add(chip);
  // icons above chip: link / code / card (three small glowing tiles)
  const icoM = [0x40c0ff, 0xffd040, 0x60ffa0].map(c => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0 }));
  const icons = icoM.map((m, i) => { const g = new THREE.Mesh(new RoundedBoxGeometry(.8, .5, .08, 2, .05), m); g.position.set(-1.1 + i * 1.1, 1.2, 0); scene.add(g); return g; });

  // PHONE hovering above, screen down-ish facing the tag
  const phone = new THREE.Group(); scene.add(phone);
  const body = new THREE.Mesh(new RoundedBoxGeometry(3.0, .3, 6.0, 4, .25), Mat({ color: 0x2a2e3a, shininess: 90 })); phone.add(body);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 5.6), Mat({ color: 0x5068a0, shininess: 120 })); back.rotation.x = Math.PI / 2; back.position.y = -.16; phone.add(back);
  const pcoilM = Mat({ color: 0xb87333, emissive: 0x40a0ff, emissiveIntensity: .2 });
  for (let i = 0; i < 4; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(1.0 - i * .14, .03, 6, 48), pcoilM); r.rotation.x = Math.PI / 2; r.position.set(0, -.18, .6); phone.add(r); }
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 5.6), new THREE.MeshBasicMaterial({ color: 0x203050 })); screen.rotation.x = -Math.PI / 2; screen.position.y = .16; phone.add(screen);

  // field rings expanding downward from phone coil
  const fieldM = new THREE.MeshBasicMaterial({ color: 0x50b0ff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
  const fields = [0, 1, 2, 3, 4].map(i => { const r = new THREE.Mesh(new THREE.TorusGeometry(1, .04, 6, 64), fieldM.clone()); r.rotation.x = Math.PI / 2; scene.add(r); return { r, o: i / 5 }; });
  // energy sparks running round the tag loops
  const sparkM = new THREE.MeshBasicMaterial({ color: 0xffd060, transparent: true, opacity: 0 });
  const sparks = [0, 1, 2, 3, 4, 5].map(i => { const s = new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 6), sparkM); scene.add(s); return { s, o: i / 6 }; });
  // reply data bits travelling up to phone
  const bitM = [0x60ffa0, 0x60ffa0].map(c => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0 }));
  const bits = [];
  for (let i = 0; i < 10; i++) { const m = new THREE.MeshBasicMaterial({ color: i % 2 ? 0x60ffa0 : 0x2080ff, transparent: true, opacity: 0 }); const b = new THREE.Mesh(new RoundedBoxGeometry(.22, .22, .22, 1, .04), m); scene.add(b); bits.push({ b, m, o: i / 10 }); }
  // range ruler (step 5)
  const rulerM = new THREE.MeshBasicMaterial({ color: 0xffd040, transparent: true, opacity: 0 });
  const ruler = new THREE.Mesh(new THREE.BoxGeometry(.08, 1, .08), rulerM); ruler.position.set(2.2, 0, .6); scene.add(ruler);
  const capT = new THREE.Mesh(new THREE.BoxGeometry(.5, .06, .06), rulerM); scene.add(capT);
  const capB = new THREE.Mesh(new THREE.BoxGeometry(.5, .06, .06), rulerM); capB.position.set(2.2, .14, .6); scene.add(capB);
  // "no battery" crossed-out battery for the hook
  const batt = new THREE.Group(); batt.position.set(-2.4, 1.8, .4); scene.add(batt);
  const battM = Mat({ color: 0x40d070, transparent: true, opacity: 0 });
  batt.add(new THREE.Mesh(new RoundedBoxGeometry(.8, 1.5, .8, 2, .1), battM));
  const nub = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, .2, 12), battM); nub.position.y = .85; batt.add(nub);
  const xM = new THREE.MeshBasicMaterial({ color: 0xff3040, transparent: true, opacity: 0 });
  const x1 = new THREE.Mesh(new THREE.BoxGeometry(2.0, .16, .16), xM); x1.rotation.z = .8; x1.position.z = .5; batt.add(x1);
  const x2 = x1.clone(); x2.rotation.z = -.8; batt.add(x2);

  const shots = [
    [[-1.5, 7, 11], [-.8, 1.8, 0]],
    [[3, 6.5, 10], [0, 3.2, 0]],
    [[4.5, 3.4, 6.5], [0, .6, 0]],
    [[1.5, 3.4, 4.4], [0, .6, .2]],
    [[-3.5, 4.5, 9], [0, 1.4, 0]],
    [[7.5, 2.8, 6], [1, 1.4, .3]],
    [[-2, 7, 11.5], [0, 2, 0]],
  ];
  const cp = { p: V(), q: V() };
  function update(t, si, lt) {
    const pulse = .5 + .5 * Math.sin(t * 8);
    // phone height: high until step 2, then close; step 5 bobs in and out
    let ph = si <= 1 ? 4.6 : si === 6 ? 2.0 : 1.6;
    if (si === 2) ph = lerp(4.6, 1.6, ease(lt / 2));
    if (si === 5) ph = 1.4 + 2.2 * (.5 + .5 * Math.sin(lt * 1.6 - 1.57));
    phone.position.set(-.3, ph, -2.0); phone.scale.setScalar(.75);
    const near = ph < 2.6 ? 1 : 0;
    // field rings: expand downward from coil
    const fOn = si >= 1 ? 1 : .35;
    fields.forEach(f => { const k = (t * .9 + f.o) % 1; f.r.position.set(0, ph - .2 - k * Math.max(.5, ph - .3) * 1.0, 0); f.r.scale.setScalar(1 + k * 1.6); f.r.material.opacity = fOn * .6 * (1 - k); });
    pcoilM.emissiveIntensity = si >= 1 ? .6 + .6 * pulse : .2;
    // tag powered
    const pow = (si === 2 ? ss(1.4, 2.4, lt) : si >= 3 ? 1 : 0) * (si === 5 ? near : 1);
    antM.emissiveIntensity = pow * (.5 + .5 * pulse);
    sparks.forEach((s, i) => { const k = (t * .5 + s.o) % 1; const h = 1.45 - (i % 5) * .17; const per = k * 4; const seg = Math.floor(per), f = per - seg; const c = [[-h, -h], [h, -h], [h, h], [-h, h], [-h, -h]]; const a = c[seg], b = c[seg + 1]; s.s.position.set(lerp(a[0], b[0], f), .18, lerp(a[1], b[1], f)); s.s.material.opacity = pow; });
    // chip wakes
    const awake = si >= 3 ? (si === 5 ? near : 1) : 0;
    chipM.emissiveIntensity = awake * (si === 4 ? .3 + .9 * (Math.sin(t * 18) > 0 ? 1 : 0) : .8);
    icons.forEach((g, i) => { const k = si === 3 ? ss(.6 + i * .5, 1.2 + i * .5, lt) : 0; g.material.opacity = k; g.position.y = 1.0 + k * .6; g.lookAt(camera.position); });
    // reply bits travel up to phone
    bits.forEach(b => { const k = (t * .8 + b.o) % 1; b.b.position.set(lerp(Math.sin(b.o * 6.28) * .35, -.3, k), lerp(.3, ph - .3, k), lerp(Math.cos(b.o * 6.28) * .35, -1.55, k)); b.m.opacity = (si === 4 || (si === 6)) ? (1 - k * .6) : 0; b.b.rotation.set(t, t * 1.3, 0); });
    screen.material.color.setHex(si === 4 && lt > 1.5 ? 0x2a7050 : 0x203050);
    // ruler
    rulerM.opacity = si === 5 ? ss(.3, .9, lt) : 0;
    ruler.scale.y = Math.max(.01, ph - .3); ruler.position.y = .14 + (ph - .3) / 2; capT.position.set(2.2, ph - .16, .6);
    rulerM.color.setHex(near ? 0x60ffa0 : 0xff6050);
    // hook battery
    const bk = si === 0 ? ss(.3, 1.0, lt) : 0; battM.opacity = bk; xM.opacity = si === 0 ? ss(1.2, 1.7, lt) : 0; batt.rotation.y = t * .6;
    // camera
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const kk = si === 0 ? 1 : ease(lt / 1.4);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], kk))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], kk)));
    const o = Math.sin(t * .2) * .08, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o));
    camera.lookAt(cp.q);
  }
  return { update };
}
