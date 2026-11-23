// Inside 60 — Ultrasonic humidifier (cutaway). Steps: 0 hook, 1 tank feeds basin, 2 piezo disc, 3 droplets/mist,
// 4 fan pushes mist up nozzle, 5 humidity sensor, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x1a2438);
  scene.add(new THREE.HemisphereLight(0xfff4ea, 0x404050, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, .9); key.position.set(4, 8, 10); scene.add(key);
  const root = new THREE.Group(); scene.add(root);
  const floor = new THREE.Mesh(new THREE.BoxGeometry(16, .3, 10), Mat({ color: 0xb89c80, shininess: 10 })); floor.position.y = -2.85; root.add(floor);
  const wall = new THREE.Mesh(new THREE.BoxGeometry(16, 12, .3), Mat({ color: 0x5f7f96, shininess: 5 })); wall.position.set(0, 2, -4); root.add(wall);

  // base housing (open box, front transparent)
  const shellM = Mat({ color: 0xf2f2f2, transparent: true, opacity: 1, side: THREE.DoubleSide });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.2, 1.6, 48, 1, true), shellM); base.position.y = -1.9; root.add(base);
  const baseBot = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, .15, 48), Mat({ color: 0x556070 })); baseBot.position.y = -2.65; root.add(baseBot);
  // basin water (shallow disc) near bottom
  let basinM; const basin = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, .5, 40, 1, true), basinM = Mat({ color: 0x8899aa, side: THREE.DoubleSide, transparent: true, opacity: 1 })); basin.position.y = -1.95; root.add(basin);
  const waterM = Mat({ color: 0x3aa0ff, emissive: 0x1060c0, emissiveIntensity: .2, transparent: true, opacity: .8 });
  const water = new THREE.Mesh(new THREE.CylinderGeometry(1.08, 1.08, .35, 40), waterM); water.position.y = -2.0; root.add(water);
  // piezo disc at the bottom of basin
  const piezoM = Mat({ color: 0xd8b070, emissive: 0xffaa22, emissiveIntensity: 0 });
  const piezo = new THREE.Mesh(new THREE.CylinderGeometry(.45, .45, .08, 32), piezoM); piezo.position.y = -2.2; root.add(piezo);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.5, .04, 8, 40), Mat({ color: 0x888888 })); ring.rotation.x = Math.PI / 2; ring.position.y = -2.2; root.add(ring);
  // wires
  const wireM = Mat({ color: 0xff4040, emissive: 0xff2020, emissiveIntensity: 0 });
  const wire = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V(.4, -2.25, 0), V(1.0, -2.45, .3), V(1.6, -2.4, .6)]), 20, .04, 6), wireM); root.add(wire);
  // tank above
  const tankM = Mat({ color: 0x9fd8ff, transparent: true, opacity: .35, side: THREE.DoubleSide });
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 2.0, 2.6, 48, 1, true), tankM); tank.position.y = .2; root.add(tank);
  const tankTop = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, .12, 48), Mat({ color: 0xf2f2f2 })); tankTop.position.y = 1.55; root.add(tankTop);
  const tankWaterM = Mat({ color: 0x3aa0ff, transparent: true, opacity: .45 });
  const tankWater = new THREE.Mesh(new THREE.CylinderGeometry(1.85, 1.95, 1.8, 40), tankWaterM); tankWater.position.y = -.2; root.add(tankWater);
  // feed valve: small tube from tank to basin, with falling drops
  const valve = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, .7, 12), Mat({ color: 0x667788 })); valve.position.set(-1.3, -1.25, 0); root.add(valve);
  const dropM = Mat({ color: 0x55b8ff, emissive: 0x2080ff, emissiveIntensity: .5 });
  const drops = Array.from({ length: 8 }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), dropM); m.userData.o = i / 8; root.add(m); return m; });
  // mist nozzle: tube through the middle of the tank to the top
  const nozM = Mat({ color: 0xdde6ee, transparent: true, opacity: .5, side: THREE.DoubleSide });
  const noz = new THREE.Mesh(new THREE.CylinderGeometry(.35, .45, 3.8, 24, 1, true), nozM); noz.position.y = -.1; root.add(noz);
  const cap = new THREE.Mesh(new THREE.TorusGeometry(.4, .08, 10, 30), Mat({ color: 0x33bbff, emissive: 0x1188ff, emissiveIntensity: .4 })); cap.rotation.x = Math.PI / 2; cap.position.y = 1.7; root.add(cap);
  // fan at the side of the base
  const fanM = Mat({ color: 0xffcc33, emissive: 0xffaa00, emissiveIntensity: .2 });
  const fan = new THREE.Group(); fan.position.set(1.55, -1.8, .6); fan.rotation.y = -.6; root.add(fan);
  for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.08, .45, .16), fanM); b.position.y = .22; const g = new THREE.Group(); g.rotation.z = i * Math.PI / 3; b.rotation.y = .5; g.add(b); fan.add(g); }
  // sensor box with LED
  const sensor = new THREE.Mesh(new RoundedBox(THREE, .6, .4, .2), Mat({ color: 0x334455 })); sensor.position.set(-1.2, -1.6, 1.85); root.add(sensor);
  const ledM = Mat({ color: 0x40ff80, emissive: 0x20ff60, emissiveIntensity: .2 });
  const led = new THREE.Mesh(new THREE.SphereGeometry(.08, 12, 8), ledM); led.position.set(-1.05, -1.6, 1.97); root.add(led);
  // humidity bar (gauge) next to the unit
  const gaugeBg = new THREE.Mesh(new THREE.BoxGeometry(.35, 3, .2), Mat({ color: 0x223040 })); gaugeBg.position.set(-2.5, -.6, 2.1); root.add(gaugeBg);
  const gaugeM = Mat({ color: 0x40d0ff, emissive: 0x20a0ff, emissiveIntensity: .5 });
  const gauge = new THREE.Mesh(new THREE.BoxGeometry(.28, 1, .22), gaugeM); root.add(gauge);
  const band = new THREE.Mesh(new THREE.BoxGeometry(.5, .6, .05), Mat({ color: 0x40ff80, emissive: 0x20ff60, emissiveIntensity: .4, transparent: true, opacity: .5 })); band.position.set(-2.5, -.9, 2.25); root.add(band);

  // mist particles: rise from water surface up the nozzle and spread out of the top
  const mistM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .7 });
  const mist = Array.from({ length: 110 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(.07 + Math.random() * .06, 8, 6), mistM); m.userData = { a: Math.random() * Math.PI * 2, o: Math.random(), r: Math.random() }; root.add(m); return m; });
  // surface ripples
  const ripM = new THREE.MeshBasicMaterial({ color: 0xbfe8ff, transparent: true, opacity: .8 });
  const rips = [0, 1, 2].map(i => { const m = new THREE.Mesh(new THREE.TorusGeometry(.3, .02, 6, 40), ripM); m.rotation.x = Math.PI / 2; m.position.y = -1.81; m.userData.o = i / 3; root.add(m); return m; });

  const shots = [
    [[2.5, 1.2, 13.5], [0, -.2, 0]],      // 0 wide
    [[-4.5, .2, 7.5], [-1.1, -1.0, 0]],   // 1 tank + valve
    [[1.6, -.9, 3.6], [0, -2.15, 0]],      // 2 piezo close
    [[1.6, .2, 5.6], [0, -1.6, 0]],       // 3 surface mist
    [[4.6, .6, 7.5], [.8, -.6, 0]],       // 4 fan + nozzle
    [[-2.6, .2, 6.6], [-1.8, -1.1, 1.9]],   // 5 sensor + gauge
    [[2.5, 1.2, 13.5], [0, -.2, 0]],      // 6 recap
  ];
  const cp = { p: V(), q: V() };
  function update(t, si, lt, sd) {
    const pulse = .5 + .5 * Math.sin(t * 6), on = !(si === 5 && lt > sd * .7);
    basinM.opacity = si === 2 ? .25 : 1; waterM.opacity = si === 2 ? .35 : .8;
    shellM.opacity = si === 0 || si === 6 ? .85 : .2;
    tankM.opacity = si === 1 ? .5 : .3;
    piezoM.emissiveIntensity = si === 2 || si === 3 ? .5 + .5 * Math.sin(t * 60) : (on ? .2 : 0);
    piezo.position.y = -2.2 + (on ? Math.sin(t * 90) * .01 : 0);
    wireM.emissiveIntensity = si === 2 ? .4 + .4 * pulse : .1;
    fan.rotation.z = on ? t * 12 : fan.rotation.z; fanM.emissiveIntensity = si === 4 ? .7 : .2;
    ledM.emissiveIntensity = si === 5 ? (on ? .9 : .1) : .3; ledM.color.set(si === 5 && !on ? 0xff6040 : 0x40ff80); ledM.emissive.set(si === 5 && !on ? 0xff3010 : 0x20ff60);
    // gauge rises in step 5 to 45 %
    const lvl = si === 5 ? lerp(.2, .48, ease(lt / (sd * .7))) : (si === 6 ? .48 : .3);
    gauge.scale.y = 3 * lvl; gauge.position.set(-2.5, -2.1 + 1.5 * lvl, 2.12);
    // drops from tank into basin
    drops.forEach(m => { const k = (m.userData.o + t * .9) % 1; m.position.set(-1.3, lerp(-1.6, -1.9, k), 0); m.visible = si === 1 || si === 0; });
    // ripples on the surface above the disc
    rips.forEach(m => { const k = (m.userData.o + t * 1.5) % 1; m.scale.setScalar(.5 + k * 2.5); ripM.opacity = .7; m.visible = on && si >= 2 && si <= 4; });
    // mist
    mist.forEach(m => { const u = m.userData, k = (u.o + t * (si === 3 ? .2 : .3)) % 1; let x, y, z;
      if (k < .15) { const kk = k / .15; const r = u.r * .35; x = Math.cos(u.a) * r; z = Math.sin(u.a) * r; y = lerp(-1.8, -1.4, kk); }
      else if (k < .6) { const kk = (k - .15) / .45, r = u.r * .3; x = Math.cos(u.a) * r; z = Math.sin(u.a) * r; y = lerp(-1.4, 1.7, kk); }
      else { const kk = (k - .6) / .4, r = .3 + kk * 2.4; x = Math.cos(u.a) * r; z = Math.sin(u.a) * r; y = 1.8 + kk * 1.4; }
      m.position.set(x, y, z); m.visible = on && (si !== 1 && si !== 2 || k < .15); });
    mistM.opacity = si === 3 ? .9 : .65;
    // camera
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const kk = si === 0 ? 1 : ease(lt / 1.4);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], kk))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], kk)));
    const ob = Math.sin(t * .25) * .1, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(ob) - dz * Math.sin(ob), cp.p.y, cp.q.z + dz * Math.cos(ob) + dx * Math.sin(ob));
    camera.lookAt(cp.q);
  }
  return { update };
}
function RoundedBox(THREE, w, h, d) { return new THREE.BoxGeometry(w, h, d); }
