// Inside 60 — Sewing machine (lockstitch). Steps: 0 hook (fast), 1 two threads, 2 needle loop, 3 rotary hook + bobbin, 4 take-up lever lock, 5 feed dogs, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const ss = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x555555, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x1c1830); scene.fog = new THREE.Fog(0x1c1830, 30, 80);
  scene.add(new THREE.HemisphereLight(0xf8f4ff, 0x40404c, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.8); key.position.set(5, 10, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0xc0a0ff, .8); rim.position.set(-6, 3, -6); scene.add(rim);
  const table = new THREE.Mesh(new THREE.BoxGeometry(30, .6, 16), Mat({ color: 0x8a6440, shininess: 20 })); table.position.y = -.3; scene.add(table);

  const NX = -3.2; // needle x
  const bodyM = Mat({ color: 0x3aa0a8, shininess: 100, transparent: true, opacity: 1 });
  const bedM = Mat({ color: 0x3aa0a8, shininess: 100, transparent: true, opacity: 1 });
  const m = new THREE.Group(); scene.add(m);
  const bed = new THREE.Mesh(new THREE.BoxGeometry(11, 1.2, 4.2), bedM); bed.position.set(0, .6, 0); m.add(bed);
  const pillar = new THREE.Mesh(new THREE.BoxGeometry(2.2, 4.4, 3.2), bodyM); pillar.position.set(3.8, 3.4, -.2); m.add(pillar);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(8.6, 1.5, 2.8), bodyM); arm.position.set(.6, 5.9, -.2); m.add(arm);
  const head = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.6, 2.8), bodyM); head.position.set(NX - .1, 5.0, -.2); m.add(head);
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, .5, 32), Mat({ color: 0xe8e8f0 })); wheel.rotation.x = Math.PI / 2; wheel.position.set(5.2, 5.4, -.2); wheel.rotation.order = 'ZXY'; m.add(wheel);
  wheel.rotation.set(0, 0, 0); const wheelG = new THREE.Group(); wheelG.position.set(5.2, 5.4, 0); m.add(wheelG);
  const wh = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, .5, 32), Mat({ color: 0xe8e8f0 })); wh.rotation.z = Math.PI / 2; wheelG.add(wh); m.remove(wheel);
  const spoke = new THREE.Mesh(new THREE.BoxGeometry(.55, .25, 2.2), Mat({ color: 0x9090a0 })); wheelG.add(spoke);
  const plate = new THREE.Mesh(new THREE.BoxGeometry(2.4, .06, 2.0), Mat({ color: 0xd8dce4, shininess: 140 })); plate.position.set(NX, 1.23, .3); m.add(plate);
  // spool on top
  const spool = new THREE.Group(); spool.position.set(1.8, 7.1, -.2); m.add(spool);
  spool.add(new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 1.6, 8), Mat({ color: 0xcccccc })));
  const thrSpool = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, 1.0, 24), Mat({ color: 0xe8303a, emissive: 0x400008 })); thrSpool.position.y = .4; spool.add(thrSpool);
  // needle bar + needle
  const nb = new THREE.Group(); m.add(nb);
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, 2.2, 10), Mat({ color: 0xc8ccd4 })); bar.position.y = 1.1; nb.add(bar);
  const needleM = Mat({ color: 0xf0f0f4, shininess: 200, emissive: 0x000000 });
  const needle = new THREE.Mesh(new THREE.CylinderGeometry(.05, .01, 1.6, 8), needleM); needle.position.y = -.8; nb.add(needle);
  const presser = new THREE.Mesh(new THREE.BoxGeometry(.9, .12, .9), Mat({ color: 0xb0b4bc })); presser.position.set(NX + .05, 1.42, .3); m.add(presser);
  // take-up lever (pivot on head front)
  const tul = new THREE.Group(); tul.position.set(NX + .2, 5.4, 1.25); m.add(tul);
  const tulM = Mat({ color: 0xe0e4ec, emissive: 0x000000 });
  const tulArm = new THREE.Mesh(new THREE.BoxGeometry(1.6, .16, .12), tulM); tulArm.position.x = -.8; tul.add(tulArm);
  const tulEye = new THREE.Mesh(new THREE.TorusGeometry(.12, .04, 6, 14), tulM); tulEye.position.x = -1.6; tul.add(tulEye);
  // fabric
  const fab = new THREE.Group(); fab.position.y = 1.29; m.add(fab);
  const fabM = Mat({ color: 0xf2d6a0, shininess: 10, side: THREE.DoubleSide, transparent: true, opacity: 1 });
  const cloth = new THREE.Mesh(new THREE.BoxGeometry(14, .06, 3.2), fabM); cloth.position.set(0, 0, .3); fab.add(cloth);
  const stitches = []; const stTop = Mat({ color: 0xe8303a, emissive: 0x500010 }), stBot = Mat({ color: 0x3080ff, emissive: 0x001850 });
  for (let k = 0; k < 40; k++) { const s = new THREE.Mesh(new THREE.BoxGeometry(.24, .09, .12), stTop); fab.add(s); const b = new THREE.Mesh(new THREE.BoxGeometry(.24, .09, .12), stBot); fab.add(b); stitches.push([s, b]); }
  // under-bed: rotary hook + bobbin (seen when bed goes x-ray)
  const under = new THREE.Group(); under.position.set(NX, .45, .3); m.add(under);
  const hookG = new THREE.Group(); under.add(hookG);
  const hookM = Mat({ color: 0xd0d4dc, shininess: 160, emissive: 0x000000 });
  const hookRing = new THREE.Mesh(new THREE.TorusGeometry(.48, .07, 8, 40, Math.PI * 1.75), hookM); hookRing.rotation.x = Math.PI / 2; hookG.add(hookRing);
  const hookTip = new THREE.Mesh(new THREE.ConeGeometry(.07, .35, 8), hookM); hookTip.position.set(.48, 0, 0); hookTip.rotation.x = Math.PI / 2; hookG.add(hookTip);
  const bob = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .22, 24), Mat({ color: 0x3080ff, emissive: 0x002060 })); under.add(bob);
  const bobCase = new THREE.Mesh(new THREE.CylinderGeometry(.34, .34, .26, 24, 1, true), Mat({ color: 0x9098a8, side: THREE.DoubleSide })); under.add(bobCase);
  // the thread loop that is carried around the bobbin
  const loopM = new THREE.MeshPhongMaterial({ color: 0xff3a48, emissive: 0xff2030, emissiveIntensity: .6 });
  const loop = new THREE.Mesh(new THREE.TorusGeometry(.6, .035, 6, 40, Math.PI * 2), loopM); loop.rotation.x = Math.PI / 2; under.add(loop);
  // feed dogs
  const dogs = new THREE.Group(); dogs.position.set(NX, 1.1, .3); m.add(dogs);
  const dogM = Mat({ color: 0xa0a6b4, emissive: 0x000000 });
  for (const z of [-.45, .45]) { const d = new THREE.Group(); d.position.z = z; dogs.add(d); for (let k = 0; k < 5; k++) { const tooth = new THREE.Mesh(new THREE.BoxGeometry(.18, .2, .26), dogM); tooth.position.x = -.5 + k * .25; tooth.rotation.z = .5; d.add(tooth); } }
  // top thread: spool -> tension -> take-up eye -> needle (rebuilt each frame as a line tube)
  const thM = new THREE.MeshBasicMaterial({ color: 0xff4050 });
  let thMesh = null;
  const bthM = new THREE.MeshBasicMaterial({ color: 0x40a0ff });
  const bthread = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(NX, .45, .3), V(NX + .2, .9, .3), V(NX, 1.32, .3)]), 12, .03, 6), bthM); m.add(bthread);

  const shots = [
    [[-15, 9.5, 25], [.5, 3.6, 0]],    // 0 whole machine (3/4 view)
    [[-11, 8, 19], [0, 3.8, 0]],       // 1 spool + bobbin (x-ray bed)
    [[-1.2, 3.0, 8.5], [NX, 1.9, .3]], // 2 needle close
    [[-1.0, 2.4, 6.2], [NX, .9, .3]],  // 3 hook under bed
    [[.5, 5.6, 11.5], [NX, 4.2, .6]],  // 4 take-up lever
    [[-1.4, 2.4, 6.4], [NX, 1.1, .3]], // 5 feed dogs
    [[-16, 10, 26], [.5, 3.6, 0]],     // 6 recap
  ];
  const cp = { p: V(), q: V() };
  let phase = 0, lastT = 0, fabX = 0;
  function update(t, si, lt, sd) {
    const pulse = .5 + .5 * Math.sin(t * 6);
    // machine speed: fast in hook/recap, slow (1 cycle / 2.2 s) for close-ups
    const spd = si === 0 || si === 6 ? 2.6 : si === 1 ? 1.2 : .45;
    const dt = Math.max(0, Math.min(.1, t - lastT)); lastT = t; phase += dt * spd;
    const c = phase % 1; // 0 = needle top
    const a = c * Math.PI * 2;
    // needle: top at c=0, bottom at c=.5 (tip below plate)
    const ny = 2.0 + 1.25 * Math.cos(a); nb.position.set(NX, ny + 1.6, .3);
    wheelG.rotation.x = -phase * Math.PI * 2;
    // hook rotates 2x per stitch (catches loop just after bottom)
    hookG.rotation.y = -phase * Math.PI * 4;
    // take-up lever: up when needle is up, pulls thread at c ~ .85..1
    const tl = Math.sin(a + .8); tul.rotation.z = .35 * tl;
    // fabric advance: moves during c in [.8, 1] (needle out)
    const adv = .3;
    const sh = ss(.78, .98, c) * adv, nSt = Math.min(24, Math.floor(phase) + 3);
    stitches.forEach(([s, b], k) => { const x = NX - (k + .5) * adv - sh; s.position.set(x, .05, .3); b.position.set(x, -.05, .3); s.visible = b.visible = k < nSt; });
    // dogs move up/back during advance
    const dg = ss(.7, .8, c) * (1 - ss(.98, 1, c)); dogs.position.y = 1.05 + dg * .2; dogs.position.x = NX + .25 - ss(.78, .98, c) * adv;
    // loop: appears after needle bottom (c .5-.55), grows around bobbin c .55-.8, pulled up/shrinks .8-.95
    const lg = ss(.5, .6, c) * (1 - ss(.8, .92, c));
    loop.scale.setScalar(Math.max(.01, lg)); loop.visible = lg > .02; loop.rotation.z = (c - .5) * Math.PI * 4;
    // x-ray: bed transparent in steps 1, 3, 5
    const xr = si === 1 || si === 3 || si === 5;
    bedM.opacity = xr ? .25 : 1; bedM.depthWrite = !xr; fabM.opacity = si === 3 || si === 5 ? .4 : 1;
    // highlights
    needleM.emissive.setHex(0x40c0ff); needleM.emissiveIntensity = si === 2 ? .4 + .5 * pulse : 0;
    hookM.emissive.setHex(0xffd030); hookM.emissiveIntensity = si === 3 ? .3 + .5 * pulse : 0;
    tulM.emissive.setHex(0xffd030); tulM.emissiveIntensity = si === 4 ? .3 + .6 * pulse : 0;
    dogM.emissive.setHex(0xffd030); dogM.emissiveIntensity = si === 5 ? .3 + .6 * pulse : 0;
    thrSpool.material.emissiveIntensity = si === 1 ? .6 + .6 * pulse : .2;
    bob.material.emissiveIntensity = si === 1 || si === 3 ? .6 + .6 * pulse : .2;
    // top thread
    const eye = V(NX + .2 - 1.6 * Math.cos(tul.rotation.z), 5.4 - 1.6 * Math.sin(tul.rotation.z), 1.25);
    const nEye = V(NX, nb.position.y - 1.45, .3);
    const pts = [V(1.8, 7.5, -.2), V(.2, 7.0, 1.0), V(NX + 1.2, 6.4, 1.3), eye, V(NX + .4, 4.0, 1.0), V(NX + .1, nb.position.y - .2, .45), nEye];
    if (thMesh) { m.remove(thMesh); thMesh.geometry.dispose(); }
    thMesh = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, .035, 5), thM); m.add(thMesh);
    // camera
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const kk = si === 0 ? 1 : ease(lt / 1.4);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], kk))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], kk)));
    const o = Math.sin(t * .25) * .12, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o));
    camera.lookAt(cp.q);
  }
  return { update };
}
