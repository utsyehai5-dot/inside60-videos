// Inside 60 — How a Toaster Works. Steps: 0 intro, 1 nichrome, 2 magnet, 3 browning, 4 timer, 5 pop
export async function setup({ THREE, scene, camera }) {
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;

  scene.background = new THREE.Color(0x10182c);
  scene.fog = new THREE.Fog(0x10182c, 18, 40);
  scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x202838, 1.4));
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(5, 9, 6); key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x88aaff, 1.2); rim.position.set(-6, 4, -5); scene.add(rim);

  const floor = new THREE.Mesh(new THREE.CircleGeometry(14, 64), new THREE.MeshStandardMaterial({ color: 0x1c2640, roughness: .9 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

  const T = new THREE.Group(); scene.add(T);
  // body: two side shells so we can open it up
  const metal = new THREE.MeshStandardMaterial({ color: 0xd8dde6, metalness: .85, roughness: .25, transparent: true });
  const bodyGeo = new RoundedBoxGeometry(4.2, 3, .5, 6, .22);
  const front = new THREE.Mesh(bodyGeo, metal); front.position.set(0, 1.6, 1.05); front.castShadow = true; T.add(front);
  const back = new THREE.Mesh(bodyGeo, metal.clone()); back.position.set(0, 1.6, -1.05); back.castShadow = true; T.add(back);
  const top = new THREE.Mesh(new RoundedBoxGeometry(4.2, .3, 2.6, 4, .12), new THREE.MeshStandardMaterial({ color: 0x2a2f3a, metalness: .6, roughness: .4 }));
  top.position.set(0, 3.12, 0); T.add(top);
  const ends = [-2, 2].map(x => { const m = new THREE.Mesh(new RoundedBoxGeometry(.3, 3, 2.6, 4, .12), metal); m.position.set(x, 1.6, 0); T.add(m); return m; });
  const base = new THREE.Mesh(new RoundedBoxGeometry(4.5, .3, 2.9, 4, .12), new THREE.MeshStandardMaterial({ color: 0x222833, roughness: .6 }));
  base.position.set(0, .15, 0); T.add(base);

  // heating wires: zig-zag tubes, 3 panels
  const wireMat = new THREE.MeshStandardMaterial({ color: 0x553322, emissive: 0xff5a00, emissiveIntensity: 0, roughness: .5 });
  const wires = [];
  for (const z of [-.75, 0, .75]) {
    const pts = []; for (let i = 0; i <= 16; i++) pts.push(new THREE.Vector3(-1.6 + i * .2, 1.0 + (i % 2) * 1.6, z));
    const w = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0), 200, .035, 8), wireMat);
    T.add(w); wires.push(w);
  }
  const glow = new THREE.PointLight(0xff6a10, 0, 6); glow.position.set(0, 1.8, 0); T.add(glow);

  // bread slices
  const breadMat = new THREE.MeshStandardMaterial({ color: 0xf2d9a6, roughness: .95 });
  const bread = [-.38, .38].map(z => {
    const b = new THREE.Mesh(new RoundedBoxGeometry(2.6, 2.6, .22, 4, .12), breadMat); b.position.set(0, 2.2, z); b.castShadow = true; T.add(b); return b;
  });

  // lever + electromagnet + spring (right end, outside)
  const lever = new THREE.Mesh(new RoundedBoxGeometry(.7, .25, .5, 3, .08), new THREE.MeshStandardMaterial({ color: 0x1a1d24, roughness: .4 }));
  lever.position.set(2.5, 2.7, 0); T.add(lever);
  const magnet = new THREE.Group(); magnet.position.set(2.5, .9, .6); T.add(magnet);
  const core = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, .7, 24), new THREE.MeshStandardMaterial({ color: 0x9aa3b0, metalness: .9, roughness: .3 }));
  magnet.add(core);
  const coilMat = new THREE.MeshStandardMaterial({ color: 0xc8662a, metalness: .8, roughness: .35, emissive: 0x2299ff, emissiveIntensity: 0 });
  for (let i = 0; i < 7; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(.22, .045, 10, 32), coilMat); r.rotation.x = Math.PI / 2; r.position.y = -.27 + i * .09; magnet.add(r); }
  const springPts = []; for (let i = 0; i <= 240; i++) { const a = i / 240 * Math.PI * 2 * 8; springPts.push(new THREE.Vector3(Math.cos(a) * .18, i / 240, Math.sin(a) * .18)); }
  const springGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(springPts), 400, .03, 8);
  const spring = new THREE.Mesh(springGeo, new THREE.MeshStandardMaterial({ color: 0xe0e4ea, metalness: .9, roughness: .2 }));
  spring.position.set(2.5, .3, -.6); T.add(spring);
  // timer dial
  const dial = new THREE.Mesh(new THREE.CylinderGeometry(.32, .32, .12, 40), new THREE.MeshStandardMaterial({ color: 0x1a1d24, roughness: .4 }));
  dial.rotation.z = Math.PI / 2; dial.position.set(-2.2, 1.2, .5); T.add(dial);
  const needle = new THREE.Mesh(new THREE.BoxGeometry(.05, .26, .05), new THREE.MeshStandardMaterial({ color: 0xff9a1f, emissive: 0xff9a1f, emissiveIntensity: .6 }));
  needle.position.set(-2.28, 1.2, .5); T.add(needle);

  // camera shots per step: [pos, target]
  const shots = [
    [[7, 5.5, 9], [0, 1.8, 0]],
    [[3.2, 3.6, 4.2], [0, 1.9, 0]],
    [[5.6, 2.6, 3.4], [2.5, 1.4, 0]],
    [[0.5, 2.6, 4.6], [0, 2.1, 0]],
    [[-5.8, 2.0, 2.4], [-2.2, 1.2, .5]],
    [[6.5, 6.5, 8.5], [0, 2.6, 0]],
  ];
  const cur = { p: new THREE.Vector3(...shots[0][0]), q: new THREE.Vector3(...shots[0][1]) };
  const tmpT = new THREE.Vector3();

  function update(t, si, lt, sd) {
    // camera: glide from previous shot into this one over 1.2 s, then slow drift
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const k = si === 0 ? 1 : ease(lt / 1.2);
    cur.p.set(...prev[0].map((v, i) => lerp(v, now[0][i], k)));
    cur.q.set(...prev[1].map((v, i) => lerp(v, now[1][i], k)));
    const orbit = t * 0.06;
    camera.position.set(cur.p.x * Math.cos(orbit) - cur.p.z * Math.sin(orbit) * .15, cur.p.y, cur.p.z + cur.p.x * Math.sin(orbit) * .15);
    camera.lookAt(cur.q);

    // lever down from step 1 until pop
    const leverDown = si >= 1 && si <= 4 ? (si === 1 ? ease(lt / .5) : 1) : si === 5 ? 1 - ease(lt / .35) : 0;
    lever.position.y = lerp(2.7, 1.1, leverDown);
    bread.forEach(b => b.position.y = lerp(2.2, 1.75, leverDown) + (si === 5 ? Math.sin(Math.min(1, lt / .6) * Math.PI) * 1.6 : 0));
    spring.scale.y = lerp(1.2, .55, leverDown);

    // heat: on during 1..4
    const heat = si >= 1 && si <= 4 ? Math.min(1, (si === 1 ? lt / 1.5 : 1)) : si === 5 ? Math.max(0, 1 - lt / .8) : 0;
    wireMat.emissiveIntensity = heat * (2.2 + .3 * Math.sin(t * 9));
    glow.intensity = heat * 30;
    // open the front shell from step 1 so we can see inside
    const open = si >= 1 ? ease(si === 1 ? lt / 1 : 1) : 0;
    front.material.opacity = 1 - open * .85; front.position.z = 1.05 + open * .9;

    // magnet glow in step 2..4
    coilMat.emissiveIntensity = si >= 2 && si <= 4 ? 1.2 + .4 * Math.sin(t * 6) : 0;

    // browning: progresses across steps 3..4
    const brown = si < 3 ? 0 : si === 3 ? ease(lt / sd) * .6 : si === 4 ? .6 + ease(lt / sd) * .35 : .95;
    breadMat.color.setRGB(lerp(.95, .55, brown), lerp(.85, .33, brown), lerp(.65, .14, brown));

    // timer needle rotates during step 4
    const tk = si < 4 ? 0 : si === 4 ? lt / sd : 1;
    needle.rotation.x = -tk * Math.PI * 1.6;
    needle.position.x = -1.3 + Math.sin(-needle.rotation.z) * .0;
    T.rotation.y = -0.15 + Math.sin(t * .4) * .03;
  }
  return { update };
}
