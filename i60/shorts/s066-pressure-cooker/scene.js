// Inside 60 — Pressure cooker. Steps: 0 hook, 1 gasket seal, 2 steam pressure, 3 boiling point (thermometer), 4 food cooks fast, 5 weighted valve, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 90, specular: 0x666666, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x182030); scene.fog = new THREE.Fog(0x182030, 30, 80);
  scene.add(new THREE.HemisphereLight(0xf4f8ff, 0x404048, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.8); key.position.set(6, 10, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0x90c0ff, .8); rim.position.set(-6, 4, -6); scene.add(rim);
  // stove
  const stove = new THREE.Mesh(new THREE.BoxGeometry(14, 1, 10), Mat({ color: 0x30343c, shininess: 40 })); stove.position.y = -.5; scene.add(stove);
  const flames = []; const flameM = new THREE.MeshBasicMaterial({ color: 0x40a0ff, transparent: true, opacity: .9 });
  for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; const f = new THREE.Mesh(new THREE.ConeGeometry(.18, .7, 8), flameM); f.position.set(Math.cos(a) * 1.9, .3, Math.sin(a) * 1.9); scene.add(f); flames.push(f); }
  // pot (cut-away: back half solid, front half transparent)
  const R = 3, H = 3.6;
  const potM = Mat({ color: 0xc8ccd6, shininess: 160, side: THREE.DoubleSide, transparent: true, opacity: 1 });
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(R, R * .96, H, 48, 1, true), potM); pot.position.y = H / 2 + .1; scene.add(pot);
  const bottom = new THREE.Mesh(new THREE.CylinderGeometry(R * .96, R * .96, .2, 48), Mat({ color: 0x9098a4 })); bottom.position.y = .1; scene.add(bottom);
  for (const s of [-1, 1]) { const h = new THREE.Mesh(new THREE.BoxGeometry(1.6, .35, .6), Mat({ color: 0x202020, shininess: 30 })); h.position.set(s * (R + .7), H - .3, 0); scene.add(h); }
  // water
  const waterM = Mat({ color: 0x3aa0ff, transparent: true, opacity: .75, emissive: 0x002040 });
  const water = new THREE.Mesh(new THREE.CylinderGeometry(R - .08, R * .95 - .08, 1.8, 48), waterM); water.position.y = 1.1; scene.add(water);
  // food chunks
  const foodM = Mat({ color: 0xff9a3a, emissive: 0x000000, shininess: 30 });
  const food = []; for (let k = 0; k < 7; k++) { const c = new THREE.Mesh(new THREE.BoxGeometry(.7, .55, .6), foodM); const a = k * 2.1; c.position.set(Math.cos(a) * (k ? 1.5 : 0), 1.0 + (k % 2) * .5, Math.sin(a) * (k ? 1.5 : 0)); c.rotation.set(k, k * .7, 0); scene.add(c); food.push(c); }
  // lid group
  const lid = new THREE.Group(); scene.add(lid);
  const lidM = Mat({ color: 0xdfe3ea, shininess: 180, transparent: true, opacity: 1 });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(R + .15, 48, 16, 0, Math.PI * 2, 0, Math.PI * .28), lidM); dome.scale.y = .9; dome.position.y = -2.25; lid.add(dome);
  const gasketM = Mat({ color: 0xff7030, emissive: 0x000000, shininess: 20 });
  const gasket = new THREE.Mesh(new THREE.TorusGeometry(R + .05, .14, 10, 64), gasketM); gasket.rotation.x = Math.PI / 2; gasket.position.y = 0; lid.add(gasket);
  const lh = new THREE.Mesh(new THREE.BoxGeometry(4.5, .4, .7), Mat({ color: 0x202020, shininess: 30 })); lh.position.set(0, 1.0, 0); lid.add(lh);
  // valve: stem + weight
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, .7, 10), Mat({ color: 0x9aa0aa })); stem.position.set(-1.2, 1.05, .6); lid.add(stem);
  const weightM = Mat({ color: 0x404650, emissive: 0x000000 });
  const weight = new THREE.Mesh(new THREE.CylinderGeometry(.35, .45, .6, 20), weightM); weight.position.set(-1.2, 1.45, .6); lid.add(weight);
  lid.position.y = H + .1;
  // steam particles inside (small spheres) + jet out of valve
  const stM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .55 });
  const steam = []; for (let k = 0; k < 70; k++) { const s = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 6), stM); s.userData = { a: Math.random() * 6.28, r: Math.random() * 2.5, y: Math.random(), sp: .5 + Math.random() }; scene.add(s); steam.push(s); }
  const jetM = new THREE.MeshBasicMaterial({ color: 0xf0f8ff, transparent: true, opacity: .7 });
  const jet = []; for (let k = 0; k < 24; k++) { const s = new THREE.Mesh(new THREE.SphereGeometry(.16, 8, 6), jetM); s.userData = { o: k / 24 }; scene.add(s); jet.push(s); }
  // pressure arrows (pushing outward on walls)
  const arrM = new THREE.MeshBasicMaterial({ color: 0xffd030 });
  const arrows = []; for (let k = 0; k < 8; k++) { const g = new THREE.Group(); const a = k / 8 * Math.PI * 2; const sh = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .8, 8), arrM); sh.rotation.z = Math.PI / 2; sh.position.x = -.4; g.add(sh); const hd = new THREE.Mesh(new THREE.ConeGeometry(.18, .35, 10), arrM); hd.rotation.z = -Math.PI / 2; g.add(hd); g.position.set(Math.cos(a) * 2.2, 2.9, Math.sin(a) * 2.2); g.rotation.y = -a; scene.add(g); arrows.push(g); }
  // thermometer (standing next to the pot)
  const th = new THREE.Group(); th.position.set(5.2, 0, 1.2); scene.add(th);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(.32, .32, 5.2, 20, 1, true), Mat({ color: 0xffffff, transparent: true, opacity: .35, side: THREE.DoubleSide })); tube.position.y = 3.0; th.add(tube);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(.55, 20, 14), Mat({ color: 0xff3030, emissive: 0x600000 })); bulb.position.y = .55; th.add(bulb);
  const merc = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, 1, 12), Mat({ color: 0xff3030, emissive: 0x800000 })); th.add(merc);
  const tick100 = new THREE.Mesh(new THREE.BoxGeometry(.9, .07, .07), new THREE.MeshBasicMaterial({ color: 0xffffff })); tick100.position.y = 3.6; th.add(tick100);
  const tick121 = new THREE.Mesh(new THREE.BoxGeometry(.9, .07, .07), new THREE.MeshBasicMaterial({ color: 0xffd030 })); tick121.position.y = 4.9; th.add(tick121);

  const shots = [
    [[9, 9, 14], [0, 2.8, 0]],      // 0 hook
    [[6, 8.2, 9.5], [0, 3.6, 0]],   // 1 gasket close
    [[0, 5, 11], [0, 2.6, 0]],      // 2 steam / pressure (cut-away)
    [[8.5, 5, 9.5], [3.4, 3.2, .6]],// 3 thermometer
    [[2.5, 5.8, 10.5], [0, 1.6, 0]], // 4 food
    [[-4, 7.6, 6.5], [-1.2, 5.6, .6]], // 5 valve
    [[10, 10, 15], [0, 3, 0]],      // 6 recap
  ];
  const cp = { p: V(), q: V() };
  function update(t, si, lt, sd) {
    const pulse = .5 + .5 * Math.sin(t * 6);
    flames.forEach((f, k) => { f.scale.y = .8 + .4 * Math.abs(Math.sin(t * 9 + k)); });
    // lid closes during step 0/1
    const close = si === 0 ? ease(lt / 2.0) : 1;
    lid.position.y = H + .1 + (1 - close) * 3; lid.rotation.z = (1 - close) * .3;
    gasketM.emissive.setHex(0xff6020); gasketM.emissiveIntensity = si === 1 ? .4 + .5 * pulse : 0;
    // cut-away transparency
    const xr = si >= 2 && si <= 4;
    potM.opacity = xr ? .22 : 1; potM.depthWrite = !xr; lidM.opacity = xr ? .35 : 1; lidM.depthWrite = !xr;
    // pressure level 0..1 grows over steps 1-3
    const pr = si === 0 ? 0 : si === 1 ? .2 * (lt / sd) : si === 2 ? .2 + .8 * ease(lt / sd) : 1;
    steam.forEach(s => { const u = s.userData; u.y = (u.y + .004 * u.sp) % 1; const y = 2.1 + u.y * 1.6; s.position.set(Math.cos(u.a + t * u.sp) * u.r, y, Math.sin(u.a + t * u.sp) * u.r); s.visible = pr > .05 && Math.random() < .3 + pr; s.scale.setScalar(.6 + pr); });
    stM.opacity = si === 4 ? .12 : .25 + .45 * pr;
    arrows.forEach((g, k) => { g.visible = si === 2; const a = k / 8 * Math.PI * 2, r = 2.2 + .35 * Math.sin(t * 5); g.position.x = Math.cos(a) * r; g.position.z = Math.sin(a) * r; });
    // bubbling water
    water.position.y = 1.1 + .04 * Math.sin(t * 8); waterM.emissiveIntensity = 1;
    waterM.emissive.setHex(si >= 3 ? 0x402010 : 0x002040);
    // thermometer
    th.visible = si === 3 || si === 4;
    const tv = si === 3 ? lerp(3.6, 4.9, ease((lt - .6) / 2.5)) : 4.9;
    merc.scale.y = tv - .6; merc.position.y = .6 + (tv - .6) / 2;
    // food glows (cooking)
    foodM.emissive.setHex(0xff5010); foodM.emissiveIntensity = si === 4 ? .25 + .4 * pulse : si > 4 ? .2 : 0;
    food.forEach((c, k) => { c.rotation.y += si === 4 ? .01 : .002; });
    // valve
    const vOpen = si === 5 ? (Math.sin(t * 7) > -.2 ? 1 : 0) : si === 6 ? .5 : 0;
    weight.position.y = 1.45 + vOpen * .18 + (si === 5 ? .04 * Math.sin(t * 40) : 0);
    weightM.emissive.setHex(0xffd030); weightM.emissiveIntensity = si === 5 ? .3 + .4 * pulse : 0;
    jet.forEach(s => { const o = (s.userData.o + t * .9) % 1; s.position.set(-1.2 + o * .8, lid.position.y + 1.8 + o * 3, .6 + o * .3); s.scale.setScalar(.5 + o * 2.2); s.visible = (si === 5 || si === 6) && vOpen > 0; });
    jetM.opacity = .7;
    // camera
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const kk = si === 0 ? 1 : ease(lt / 1.4);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], kk))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], kk)));
    const o = Math.sin(t * .25) * .15, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o));
    camera.lookAt(cp.q);
  }
  return { update };
}
