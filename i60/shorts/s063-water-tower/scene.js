// Inside 60 — Water tower. Steps: 0 hook (psi per foot), 1 night fill, 2 gravity to homes, 3 height = pressure, 4 morning peak, 5 fire/backup, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const ss = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 60, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const day = new THREE.Color(0x5a8ccc), night = new THREE.Color(0x0e1430);
  scene.background = new THREE.Color(0x5a8ccc); scene.fog = new THREE.Fog(0x5a8ccc, 45, 110);
  const hemi = new THREE.HemisphereLight(0xf4f6ff, 0x404a40, 1.5); scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff, 1.8); key.position.set(8, 14, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0xa0c8ff, .7); rim.position.set(-8, 4, -8); scene.add(rim);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(80, 48), Mat({ color: 0x4f7a44, shininess: 5 })); ground.rotation.x = -Math.PI / 2; scene.add(ground);
  // street
  const road = new THREE.Mesh(new THREE.PlaneGeometry(40, 3), Mat({ color: 0x3a3e46, shininess: 5 })); road.rotation.x = -Math.PI / 2; road.position.set(10, .02, 4); scene.add(road);

  // ===== Tower at origin =====
  const tw = new THREE.Group(); scene.add(tw);
  const legM = Mat({ color: 0xc8ced8, shininess: 90 });
  for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; const top = V(Math.cos(a) * 1.6, 11, Math.sin(a) * 1.6), bot = V(Math.cos(a) * 2.8, 0, Math.sin(a) * 2.8);
    const L = top.distanceTo(bot); const leg = new THREE.Mesh(new THREE.CylinderGeometry(.18, .22, L, 10), legM); leg.position.copy(top).add(bot).multiplyScalar(.5); leg.lookAt(top); leg.rotateX(Math.PI / 2); tw.add(leg); }
  for (const y of [3.5, 7.5]) { const r = new THREE.Mesh(new THREE.TorusGeometry(lerp(2.8, 1.6, y / 11) * 1.0, .07, 6, 4), legM); r.rotation.x = Math.PI / 2; r.rotation.z = Math.PI / 4; r.position.y = y; tw.add(r); }
  // riser pipe
  const riserM = Mat({ color: 0x8090a8 }); const riser = new THREE.Mesh(new THREE.CylinderGeometry(.35, .35, 11.5, 16), riserM); riser.position.y = 5.75; tw.add(riser);
  // tank (lathe, see-through so the water level shows)
  const prof = []; for (let k = 0; k <= 24; k++) { const a = k / 24 * Math.PI; prof.push(new THREE.Vector2(Math.sin(a) * 3.6 + .001, 13.6 - Math.cos(a) * 2.6)); }
  const tankM = Mat({ color: 0xe8ecf4, transparent: true, opacity: 1, side: THREE.DoubleSide, shininess: 110 });
  const tank = new THREE.Mesh(new THREE.LatheGeometry(prof, 48), tankM); tw.add(tank);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(3.62, 3.62, .5, 48, 1, true), Mat({ color: 0x2a7de0, emissive: 0x0a2040, transparent: true, opacity: 1 })); band.position.y = 13.6; tw.add(band);
  const waterM = Mat({ color: 0x2aa0ff, emissive: 0x0a3a70, transparent: true, opacity: 0, shininess: 120 });
  const water = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 2.2, 1, 40), waterM); tw.add(water);
  // pump house
  const ph = new THREE.Group(); ph.position.set(-6, 0, 2); scene.add(ph);
  const phb = new THREE.Mesh(new THREE.BoxGeometry(3, 2.2, 2.6), Mat({ color: 0xb06a48 })); phb.position.y = 1.1; ph.add(phb);
  const phr = new THREE.Mesh(new THREE.ConeGeometry(2.3, 1.2, 4), Mat({ color: 0x50545e })); phr.rotation.y = Math.PI / 4; phr.position.y = 2.8; ph.add(phr);
  const pumpGlowM = new THREE.MeshPhongMaterial({ color: 0x40ff90, emissive: 0x20ff70, emissiveIntensity: 0 });
  const pumpLight = new THREE.Mesh(new THREE.SphereGeometry(.3, 12, 8), pumpGlowM); pumpLight.position.set(0, 1.4, 1.35); ph.add(pumpLight);
  // pipes: pump -> riser base, riser base -> houses (under the street)
  const pipeM = Mat({ color: 0x506078, transparent: true, opacity: .9 });
  const upC = new THREE.CatmullRomCurve3([V(-6, .4, 2), V(-3, .4, 1.2), V(0, .4, 0), V(0, 11.3, 0)]);
  const downC = new THREE.CatmullRomCurve3([V(0, 11.3, 0), V(0, .4, 0), V(3, .35, 4), V(10, .35, 4), V(24, .35, 4)]);
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(-6, .4, 2), V(-3, .4, 1.2), V(0, .4, 0)]), 30, .2, 10), pipeM));
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(0, .4, 0), V(3, .35, 4), V(10, .35, 4), V(24, .35, 4)]), 60, .22, 10), pipeM));
  const dropM = new THREE.MeshBasicMaterial({ color: 0x70d8ff, transparent: true, opacity: 0 });
  const drops = []; for (let k = 0; k < 40; k++) { const m = new THREE.Mesh(new THREE.SphereGeometry(.2, 8, 6), dropM); scene.add(m); drops.push([m, k / 40]); }
  // houses along the street
  const houses = []; const hc = [0xf0d080, 0xe08a70, 0x90c0e0, 0xd0e0a0, 0xe0b0d0];
  for (let k = 0; k < 5; k++) { const g = new THREE.Group(); g.position.set(8 + k * 3.6, 0, 7); scene.add(g);
    const b = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2 + (k % 2) * 1.2, 2.2), Mat({ color: hc[k] })); b.position.y = b.geometry.parameters.height / 2; g.add(b);
    const r = new THREE.Mesh(new THREE.ConeGeometry(1.9, 1.1, 4), Mat({ color: 0x7a3a30 })); r.rotation.y = Math.PI / 4; r.position.y = b.geometry.parameters.height + .55; g.add(r);
    const winM = new THREE.MeshPhongMaterial({ color: 0x222833, emissive: 0xffd060, emissiveIntensity: 0 });
    const w = new THREE.Mesh(new THREE.PlaneGeometry(.7, .6), winM); w.position.set(0, 1.2, 1.11); g.add(w);
    houses.push([g, winM]); }
  // pressure gauge at the first house (big, faces camera)
  const gauge = new THREE.Group(); gauge.position.set(8, 4.6, 8.4); scene.add(gauge);
  gauge.add(new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, .25, 40), Mat({ color: 0xffffff })).rotateX(Math.PI / 2));
  const rimG = new THREE.Mesh(new THREE.TorusGeometry(1.1, .1, 8, 40), Mat({ color: 0x404650, shininess: 120 })); gauge.add(rimG);
  const arc = new THREE.Mesh(new THREE.RingGeometry(.75, .95, 40, 1, -Math.PI * .25, Math.PI * 1.5), new THREE.MeshBasicMaterial({ color: 0x30c060 })); arc.position.z = .14; gauge.add(arc);
  const nP = new THREE.Group(); nP.position.z = .18; gauge.add(nP);
  const needle = new THREE.Mesh(new THREE.BoxGeometry(.08, .9, .04), new THREE.MeshBasicMaterial({ color: 0xe02020 })); needle.position.y = .4; nP.add(needle);
  // height ruler next to tower (glowing marks per "foot" section)
  const ruler = new THREE.Group(); ruler.position.set(4.6, 0, 1.5); scene.add(ruler);
  const marks = []; for (let k = 0; k < 12; k++) { const m = new THREE.Mesh(new THREE.BoxGeometry(.9, .14, .14), new THREE.MeshPhongMaterial({ color: 0xffd23a, emissive: 0xffb000, emissiveIntensity: .6, transparent: true, opacity: 0 })); m.position.y = .5 + k; ruler.add(m); marks.push(m); }
  const rulerBar = new THREE.Mesh(new THREE.BoxGeometry(.12, 12.4, .12), new THREE.MeshPhongMaterial({ color: 0xffffff, transparent: true, opacity: 0 })); rulerBar.position.y = 6.2; ruler.add(rulerBar);
  // fire hydrant
  const hyd = new THREE.Group(); hyd.position.set(5.5, 0, 6.2); scene.add(hyd);
  const hydM = Mat({ color: 0xe02020, emissive: 0x300000 });
  const hb = new THREE.Mesh(new THREE.CylinderGeometry(.35, .42, 1.4, 16), hydM); hb.position.y = .7; hyd.add(hb);
  const ht = new THREE.Mesh(new THREE.SphereGeometry(.38, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), hydM); ht.position.y = 1.4; hyd.add(ht);
  const hn = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, 1.1, 10), hydM); hn.rotation.z = Math.PI / 2; hn.position.y = .95; hyd.add(hn);
  const jetM = new THREE.MeshBasicMaterial({ color: 0xa8e8ff, transparent: true, opacity: 0, depthWrite: false });
  const jet = []; for (let k = 0; k < 30; k++) { const m = new THREE.Mesh(new THREE.SphereGeometry(.16, 8, 6), jetM); scene.add(m); jet.push([m, Math.random(), Math.random() - .5]); }
  // stars + moon for night
  const starM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
  for (let k = 0; k < 60; k++) { const s = new THREE.Mesh(new THREE.SphereGeometry(.12, 6, 4), starM); s.position.set((Math.random() - .5) * 70, 18 + Math.random() * 20, -30 - Math.random() * 10); scene.add(s); }
  const moon = new THREE.Mesh(new THREE.SphereGeometry(1.6, 24, 16), new THREE.MeshBasicMaterial({ color: 0xfff4d0, transparent: true, opacity: 0 })); moon.position.set(-8, 26, -30); scene.add(moon);

  const shots = [
    [[11, 10, 44], [2, 9.5, 2]],      // 0 whole scene
    [[-13, 8, 31], [-2.5, 7.5, 1]],   // 1 pump + riser (night)
    [[7, 15, 23], [0, 11.5, 0]],      // 2 tank, water draining
    [[17, 8.5, 37], [5, 9.5, 3]],       // 3 ruler + gauge
    [[25, 7, 31], [14, 3.5, 6]],      // 4 houses, lights on
    [[0, 4, 17], [7, 2.2, 6]],        // 5 hydrant
    [[11, 11, 46], [3, 9.5, 2]],      // 6 recap
  ];
  const cp = { p: V(), q: V() }; const col = new THREE.Color();
  let level = .85;
  function update(t, si, lt, sd) {
    const pulse = .5 + .5 * Math.sin(t * 6);
    // night in step 1
    const nightK = si === 1 ? ss(0, 1, lt) * (1 - ss(sd - .8, sd, lt)) : 0;
    col.copy(day).lerp(night, nightK); scene.background.copy(col); scene.fog.color.copy(col);
    hemi.intensity = lerp(1.5, .7, nightK); key.intensity = lerp(1.8, .6, nightK);
    starM.opacity = nightK; moon.material.opacity = nightK;
    // x-ray tank on steps 1-4
    const xr = si >= 1 && si <= 4 ? 1 : si === 0 ? ss(.5, 2.5, lt) * .0 : 0;
    tankM.opacity = lerp(1, .3, xr); tankM.depthWrite = xr < .5; band.material.opacity = lerp(1, .35, xr);
    waterM.opacity = xr > 0 ? .9 : 0;
    // water level: fills in step 1, drains slowly in 2, 4
    const lv = si <= 0 ? .45 : si === 1 ? lerp(.45, .95, ss(.3, sd - .5, lt)) : si === 2 ? lerp(.95, .75, lt / sd) : si === 3 ? .75 : si === 4 ? lerp(.75, .45, lt / sd) : .6;
    const h = .3 + lv * 4.4; water.scale.y = h; water.position.y = 11.2 + h / 2;
    // flow direction: up in step 1, down in 2,3,4,5
    const up = si === 1, down = si >= 2 && si <= 5;
    dropM.opacity = up || down ? .95 : 0;
    drops.forEach(([m, o]) => { const u = (t * (up ? .35 : .3) + o) % 1; m.position.copy(up ? upC.getPoint(u) : downC.getPoint(u)); });
    pumpGlowM.emissiveIntensity = up ? .6 + .8 * pulse : si === 4 ? .3 : 0;
    // ruler + gauge
    const rk = si === 0 || si === 3 ? 1 : 0;
    rulerBar.material.opacity = rk;
    marks.forEach((m, k) => { const on = si === 3 ? ss(k * .15, k * .15 + .3, lt) : si === 0 ? ss(k * .12, k * .12 + .3, lt) : 0; m.material.opacity = on; m.material.emissiveIntensity = .4 + .6 * pulse * on; });
    const press = si === 3 ? ss(.3, 2.6, lt) : si >= 4 ? 1 : si === 2 ? ss(1, 3, lt) * .7 : 0;
    nP.rotation.z = Math.PI * .75 - press * Math.PI * 1.0 + Math.sin(t * 7) * .02 * press;
    gauge.visible = si !== 5;
    // houses light up in morning rush
    houses.forEach(([g, wm], k) => { wm.emissiveIntensity = si === 4 ? ss(k * .4, k * .4 + .4, lt) * (.6 + .4 * pulse) : si === 1 ? .8 * nightK : si >= 5 ? .5 : 0; });
    // hydrant jet in step 5
    jetM.opacity = si === 5 ? ss(.5, 1.2, lt) * .85 : 0;
    jet.forEach(([m, o, a]) => { const u = (t * 1.3 + o) % 1; m.position.set(5.5 + .6 + u * 4.0, .95 + u * 2.2 - u * u * 3.0, 6.2 + a * u); m.scale.setScalar(.6 + u * 1.6); });
    hydM.emissiveIntensity = si === 5 ? .4 + .6 * pulse : 0; hydM.emissive.setHex(0x500000);
    // camera
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const kk = si === 0 ? 1 : ease(lt / 1.4);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], kk))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], kk)));
    const o = Math.sin(t * .2) * .1, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o));
    camera.lookAt(cp.q);
  }
  return { update };
}
