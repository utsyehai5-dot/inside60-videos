// Inside 60 — Inkjet printer (thermal). Steps: 0 hook (billion deg/s), 1 head zips across page, 2 resistor flashes hot, 3 vapor bubble shoots droplet, 4 bubble collapses + refill, 5 CMYK dots make picture, 6 recap
export async function setup({ THREE, scene, camera }) {
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const ss = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x555555, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x12203a); scene.fog = new THREE.Fog(0x12203a, 30, 70);
  scene.add(new THREE.HemisphereLight(0xf4f6ff, 0x40404c, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.9); key.position.set(5, 9, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0xa0c8ff, .7); rim.position.set(-6, -2, -6); scene.add(rim);
  const CMYK = [0x00b4f0, 0xf0208c, 0xffe020, 0x1a1a1a];

  // ===== Printer (left world, x around 0) =====
  const pr = new THREE.Group(); scene.add(pr);
  const frameM = Mat({ color: 0x3a3f4c, shininess: 60 });
  const bodyB = new THREE.Mesh(new RoundedBoxGeometry(9, 1.0, 4, 3, .2), frameM); bodyB.position.set(0, .5, -1.2); pr.add(bodyB);
  const rail = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, 8.4, 10), Mat({ color: 0xc0c6d0, shininess: 140 })); rail.rotation.z = Math.PI / 2; rail.position.set(0, 2.1, -1.0); pr.add(rail);
  // paper on the platen with a canvas texture we paint dots onto
  const pc = document.createElement('canvas'); pc.width = 512; pc.height = 640; const pg = pc.getContext('2d');
  pg.fillStyle = '#ffffff'; pg.fillRect(0, 0, 512, 640);
  const ptex = new THREE.CanvasTexture(pc);
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 5.25), new THREE.MeshPhongMaterial({ map: ptex, shininess: 5 }));
  paper.rotation.x = -Math.PI / 2; paper.position.set(0, 1.04, .9); pr.add(paper);
  // carriage with 4 cartridges
  const car = new THREE.Group(); car.position.set(0, 2.1, -1.0); pr.add(car);
  car.add(new THREE.Mesh(new RoundedBoxGeometry(2.2, .9, 1.4, 2, .1), Mat({ color: 0x2a2e3a })));
  CMYK.forEach((c, i) => { const k = new THREE.Mesh(new RoundedBoxGeometry(.42, .9, 1.1, 2, .06), Mat({ color: c })); k.position.set(-.72 + i * .48, .75, 0); car.add(k); });
  const headStrip = new THREE.Mesh(new THREE.BoxGeometry(2.0, .06, .5), Mat({ color: 0xc0a040, emissive: 0xff5010, emissiveIntensity: 0 })); headStrip.position.set(0, -.48, .55); car.add(headStrip);
  const stripM = headStrip.material;
  // tiny droplets falling from carriage to paper
  const drops = [];
  for (let i = 0; i < 16; i++) { const m = new THREE.MeshBasicMaterial({ color: CMYK[i % 4], transparent: true, opacity: 0 }); const d = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 6), m); pr.add(d); drops.push({ d, m, o: (i * .37) % 1, c: i % 4 }); }

  // ===== Nozzle close-up cutaway (right world, x = 14) =====
  const cl = new THREE.Group(); cl.position.set(14, 3.2, 0); scene.add(cl);
  const wallM = Mat({ color: 0x8890a0, shininess: 60 });
  // chamber: two side walls + roof (heater on roof), opening at bottom (nozzle)
  const L = new THREE.Mesh(new RoundedBoxGeometry(.5, 3.0, 1.6, 2, .08), wallM); L.position.set(-1.3, 0, 0); cl.add(L);
  const R = L.clone(); R.position.x = 1.3; cl.add(R);
  const roof = new THREE.Mesh(new RoundedBoxGeometry(3.1, .5, 1.6, 2, .08), wallM); roof.position.y = 1.5; cl.add(roof);
  const plateL = new THREE.Mesh(new RoundedBoxGeometry(1.0, .4, 1.6, 2, .06), wallM); plateL.position.set(-.85, -1.5, 0); cl.add(plateL);
  const plateR = plateL.clone(); plateR.position.x = .85; cl.add(plateR);
  // ink inside
  const inkM = Mat({ color: 0x00a0e0, transparent: true, opacity: .35, shininess: 120, depthWrite: false });
  const ink = new THREE.Mesh(new THREE.BoxGeometry(2.1, 2.9, 1.3), inkM); ink.position.y = -.05; cl.add(ink);
  // ink channel from the side (refill)
  const chan = new THREE.Mesh(new THREE.BoxGeometry(2.4, .8, 1.3), inkM); chan.position.set(-2.6, .6, 0); cl.add(chan);
  const chanWall = new THREE.Mesh(new RoundedBoxGeometry(2.6, .3, 1.6, 2, .06), wallM); chanWall.position.set(-2.7, 1.15, 0); cl.add(chanWall);
  const chanWall2 = chanWall.clone(); chanWall2.position.y = .05; cl.add(chanWall2);
  L.position.y = -.55; L.scale.y = .62; // leave the inlet open above
  // heater resistor on the roof
  const resM = Mat({ color: 0x603020, emissive: 0xff3000, emissiveIntensity: 0 });
  const res = new THREE.Mesh(new RoundedBoxGeometry(1.2, .14, 1.0, 2, .04), resM); res.position.y = 1.2; cl.add(res);
  const glowM = new THREE.MeshBasicMaterial({ color: 0xff7020, transparent: true, opacity: 0, depthWrite: false });
  const glow = new THREE.Mesh(new THREE.SphereGeometry(.9, 16, 10), glowM); glow.scale.set(1, .35, .7); glow.position.y = 1.1; cl.add(glow);
  // vapor bubble
  const bubM = Mat({ color: 0xffffff, transparent: true, opacity: 0, shininess: 150, emissive: 0x8090b0, emissiveIntensity: .6 });
  const bub = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), bubM); bub.position.y = 1.0; cl.add(bub);
  // droplet being shot
  const dropM = Mat({ color: 0x00a0e0, shininess: 150 });
  const drop = new THREE.Mesh(new THREE.SphereGeometry(.28, 16, 12), dropM); cl.add(drop);
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(.08, .16, 1, 10), dropM); cl.add(tail);
  // refill arrows
  const arrM = new THREE.MeshBasicMaterial({ color: 0x80e0ff, transparent: true, opacity: 0 });
  const arrows = [0, 1, 2].map(i => { const a = new THREE.Mesh(new THREE.ConeGeometry(.15, .4, 10), arrM); a.rotation.z = -Math.PI / 2; cl.add(a); return { a, o: i / 3 }; });

  // ===== Dots field (step 5), above the paper: big CMYK dot grid forming a simple sun picture =====
  const dotsG = new THREE.Group(); dotsG.position.set(0, 3.6, .6); scene.add(dotsG);
  const dotObjs = [];
  for (let gx = -8; gx <= 8; gx++) for (let gy = -8; gy <= 8; gy++) {
    const d2 = Math.hypot(gx, gy); let c;
    if (d2 < 4.2) c = 2; else if (d2 < 5.2) c = 1; else if ((gx + gy) % 2 === 0) c = 0; else c = 3;
    if (d2 > 8.5) continue;
    const m = new THREE.MeshPhongMaterial({ color: CMYK[c], transparent: true, opacity: 0 });
    const s = new THREE.Mesh(new THREE.CircleGeometry(.11, 12), m); s.position.set(gx * .25, gy * .25, 0); dotsG.add(s); dotObjs.push({ s, m, r: d2 });
  }

  const shots = [
    [[15, 4.6, 13.5], [14, 2.8, 0]],
    [[-2, 6.5, 9], [0, 1.8, 0]],
    [[13.5, 5.2, 11], [14, 3.6, 0]],
    [[15.5, 3.8, 12.5], [14, 2.6, 0]],
    [[11.5, 4.2, 12.5], [12.8, 3.0, 0]],
    [[0, 4.0, 8.5], [0, 3.2, 0]],
    [[2, 7, 11], [0, 2.2, 0]],
  ];
  const cp = { p: V(), q: V() };
  let lastPaint = -1;
  function paint(n) {
    for (let k = lastPaint + 1; k <= n; k++) {
      const row = Math.floor(k / 60), col = k % 60;
      const x = 20 + col * 8 + (row % 2) * 4, y = 30 + row * 9;
      const cx = 256, cy = 300, d = Math.hypot(x - cx, y - cy);
      const c = d < 110 ? '#ffe020' : d < 140 ? '#f0208c' : (k % 3 === 0 ? '#00b4f0' : '#7fd6f6');
      pg.fillStyle = c; pg.beginPath(); pg.arc(x, y, 3.6, 0, 6.3); pg.fill();
    }
    lastPaint = Math.max(lastPaint, n); ptex.needsUpdate = true;
  }
  function update(t, si, lt, sd) {
    const pulse = .5 + .5 * Math.sin(t * 6);
    // carriage sweeps
    const sweep = Math.sin(t * 2.2);
    car.position.x = sweep * 2.8;
    stripM.emissiveIntensity = si === 1 || si >= 5 ? .4 + .4 * pulse : .1;
    drops.forEach(d => { const k = (t * 2.5 + d.o) % 1; d.d.position.set(car.position.x - .72 + d.c * .48, 1.6 - k * .55, -1.0 + .55 + d.o * .2); d.m.opacity = (si === 1 || si === 5 || si === 6) ? 1 : 0; });
    // paint the page progressively over steps 1..6
    const total = 60 * 60;
    const prog = si === 0 ? 0 : Math.min(total - 1, Math.floor(((si - 1) + Math.min(1, lt / Math.max(1, sd || 5))) / 6 * total * 1.1));
    if (prog > lastPaint) paint(prog);
    // ---- close-up cycle ----
    // cycle phase (repeat every ~1.6 s in steps 0,3; long show for 2,4)
    let heat = 0, bubR = 0, dropY = -1.2, dropOn = 0, refill = 0;
    if (si === 0 || si === 3) {
      const ph = (lt % 1.8) / 1.8;
      heat = ph < .2 ? 1 : Math.max(0, 1 - (ph - .2) * 4);
      bubR = ph < .15 ? 0 : ph < .55 ? ss(.15, .45, ph) : 1 - ss(.55, .8, ph);
      dropOn = ph > .3 ? 1 : 0; dropY = -1.5 - ss(.3, 1, ph) * 2.0;
    } else if (si === 2) {
      heat = .5 + .5 * (Math.sin(lt * 10) > 0 ? 1 : .2); bubR = .15 * heat;
    } else if (si === 4) {
      const ph = Math.min(1, lt / 2.5);
      bubR = 1 - ss(0, .5, ph); refill = ss(.3, .7, ph) * (1 - ss(3.5, 4.5, lt) * 0); dropOn = ph < .5 ? 1 : 0; dropY = -3.5 - ph * 1.5;
      if (lt > 2.5) { const p2 = ((lt - 2.5) % 2) / 2; refill = 1; }
    }
    resM.emissiveIntensity = heat * 1.4; glowM.opacity = heat * .6;
    bub.scale.set(1.0 * bubR + .001, .95 * bubR + .001, .6 * bubR + .001); bub.position.y = 1.15 - bubR * .55; bubM.opacity = bubR > .02 ? .9 : 0;
    drop.visible = tail.visible = dropOn > 0; drop.position.y = dropY; tail.position.y = dropY + .6; tail.scale.y = Math.max(.05, .6 - (-(dropY) - 1.5) / 3); tail.visible = drop.visible && dropY > -3.2;
    // ink level dips a little when bubble pushes, refills after
    inkM.opacity = .35;
    arrows.forEach(a => { const k = (t * 1.2 + a.o) % 1; a.a.position.set(-3.6 + k * 2.6, .6, .9); arrM.opacity = refill; });
    // dots field
    dotObjs.forEach(d => { const k = si === 5 ? ss(d.r * .25, d.r * .25 + .6, lt) : si === 6 ? 1 - ss(0, 1, lt) : 0; d.m.opacity = k; d.s.scale.setScalar(.3 + .7 * k); });
    dotsG.lookAt(camera.position);
    // camera
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const far = Math.abs(prev[1][0] - now[1][0]) > 6;
    const kk = si === 0 ? 1 : ease(lt / (far ? 1.1 : 1.4));
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], kk))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], kk)));
    const o = Math.sin(t * .2) * .08, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o));
    camera.lookAt(cp.q);
  }
  return { update };
}
