// Inside 60 — Thermostat. Steps: 0 hook (10% saved), 1 bimetallic strip, 2 strip bends, 3 contact closes circuit, 4 furnace fires, 5 digital thermistor + chip, 6 recap
export async function setup({ THREE, scene, camera }) {
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const ss = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x555555, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x131a2c); scene.fog = new THREE.Fog(0x131a2c, 30, 85);
  scene.add(new THREE.HemisphereLight(0xf4f6ff, 0x40404c, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.8); key.position.set(5, 8, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0xa0c8ff, .8); rim.position.set(-6, 2, -6); scene.add(rim);

  // wall
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(80, 30), Mat({ color: 0x5a6680, shininess: 5 })); wall.position.set(0, 5, -.4); scene.add(wall);

  // ===== Thermostat (origin, on wall) =====
  const th = new THREE.Group(); th.position.set(0, 3, 0); scene.add(th);
  const back = new THREE.Mesh(new RoundedBoxGeometry(3.4, 3.4, .3, 3, .2), Mat({ color: 0xd8dce4 })); th.add(back);
  const coverM = Mat({ color: 0xf0f2f6, transparent: true, opacity: 1 });
  const cover = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.55, .5, 48), coverM); cover.rotation.x = Math.PI / 2; cover.position.z = .4; th.add(cover);
  const dialRing = new THREE.Mesh(new THREE.TorusGeometry(1.4, .07, 10, 48), Mat({ color: 0xff9a30, emissive: 0xff6000, emissiveIntensity: .4, transparent: true, opacity: 1 })); dialRing.position.z = .67; th.add(dialRing);
  // bimetallic strip: two layers, built as a bendable group of segments
  const NS = 14, segL = .14;
  const strip = new THREE.Group(); strip.position.set(-1.0, -.2, .45); th.add(strip);
  const mA = Mat({ color: 0xd87a3a, emissive: 0x401800 }), mB = Mat({ color: 0xb8c4d4, emissive: 0x101820 });
  const segs = []; let parent = strip;
  for (let k = 0; k < NS; k++) { const g = new THREE.Group(); g.position.x = k === 0 ? 0 : segL; parent.add(g);
    const a = new THREE.Mesh(new THREE.BoxGeometry(segL + .01, .07, .35), mA); a.position.set(segL / 2, .04, 0); g.add(a);
    const b = new THREE.Mesh(new THREE.BoxGeometry(segL + .01, .07, .35), mB); b.position.set(segL / 2, -.035, 0); g.add(b);
    segs.push(g); parent = g; }
  const tip = new THREE.Mesh(new THREE.SphereGeometry(.09, 12, 8), Mat({ color: 0xffd040, emissive: 0x806000 })); tip.position.set(segL, -.1, 0); parent.add(tip);
  const anchor = new THREE.Mesh(new THREE.BoxGeometry(.3, .5, .4), Mat({ color: 0x404858 })); anchor.position.set(-1.1, -.2, .45); th.add(anchor);
  const contactM = Mat({ color: 0xffd040, emissive: 0xffa000, emissiveIntensity: .1 });
  const contact = new THREE.Mesh(new THREE.BoxGeometry(.25, .25, .4), contactM); contact.position.set(.62, -1.0, .45); th.add(contact);
  const spark = new THREE.Mesh(new THREE.SphereGeometry(.22, 14, 10), new THREE.MeshBasicMaterial({ color: 0xfff080, transparent: true, opacity: 0, depthWrite: false })); spark.position.set(.58, -.88, .5); th.add(spark);
  // thermistor + chip (digital, step 5)
  const dig = new THREE.Group(); dig.position.set(0, 0, .35); th.add(dig);
  const pcb = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.0, .06), Mat({ color: 0x1f7a44 })); dig.add(pcb);
  const chipM = Mat({ color: 0x1c1f26, emissive: 0x30c0ff, emissiveIntensity: .2 });
  const chip = new THREE.Mesh(new THREE.BoxGeometry(.8, .8, .14), chipM); chip.position.set(.3, .2, .08); dig.add(chip);
  const thmM = Mat({ color: 0x3060ff, emissive: 0x2040ff, emissiveIntensity: .3 });
  const thm = new THREE.Mesh(new THREE.SphereGeometry(.16, 14, 10), thmM); thm.scale.set(1, 1.4, 1); thm.position.set(-.7, -.5, .18); dig.add(thm);
  const trM = new THREE.MeshBasicMaterial({ color: 0xffe080 });
  [[-.7, -.3, .3, -.1], [.7, .2, 1.0, .2], [.3, -.2, .3, -.7]].forEach(([x1, y1, x2, y2]) => { const L = Math.hypot(x2 - x1, y2 - y1); const m = new THREE.Mesh(new THREE.BoxGeometry(L, .04, .02), trM); m.position.set((x1 + x2) / 2, (y1 + y2) / 2, .04); m.rotation.z = Math.atan2(y2 - y1, x2 - x1); dig.add(m); });
  // screen digits as bars
  const scrM = Mat({ color: 0x103040, emissive: 0x40e0ff, emissiveIntensity: .5 });
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.4, .5), scrM); scr.position.set(0, .55, .67); th.add(scr);
  // room air particles (cold blue / warm orange)
  const airC = new THREE.Color(0x60b0ff), airW = new THREE.Color(0xff9040);
  const airM = new THREE.MeshBasicMaterial({ color: 0x60b0ff, transparent: true, opacity: .7, depthWrite: false });
  const air = []; for (let k = 0; k < 40; k++) { const m = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), airM); scene.add(m); air.push([m, Math.random() * 7, Math.random() * 7, Math.random()]); }
  // wire from thermostat to furnace
  const wC = new THREE.CatmullRomCurve3([V(0, 1.2, -.2), V(0, -.5, -.2), V(6, -.6, -.2), V(14, -.6, -.2), V(22, 1.0, -.2)]);
  const wire = new THREE.Mesh(new THREE.TubeGeometry(wC, 60, .06, 8), Mat({ color: 0xc03030 })); scene.add(wire);
  const sigM = new THREE.MeshBasicMaterial({ color: 0xfff060 });
  const sig = []; for (let k = 0; k < 8; k++) { const m = new THREE.Mesh(new THREE.SphereGeometry(.14, 10, 8), sigM); scene.add(m); sig.push(m); }

  // ===== Furnace (x = 22) =====
  const fu = new THREE.Group(); fu.position.set(22, 0, 0); scene.add(fu);
  { const box = new THREE.Mesh(new RoundedBoxGeometry(3.2, 5.0, 2.4, 3, .15), Mat({ color: 0xb8bec8 })); box.position.set(0, 2.5, 0); fu.add(box); }
  const win = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.4), Mat({ color: 0x101014 })); win.position.set(0, 3.0, 1.21); fu.add(win);
  const flm = []; for (let k = 0; k < 6; k++) { const c = [0x3080ff, 0xff8020][k % 2]; const m = new THREE.Mesh(new THREE.ConeGeometry(.17, .9, 10), new THREE.MeshPhongMaterial({ color: c, emissive: c, emissiveIntensity: 1, transparent: true, opacity: 0 })); m.position.set(-.9 + k * .36, 2.85, 1.3); fu.add(m); flm.push(m); }
  const duct = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.4, 1.6), Mat({ color: 0x9aa2ae })); duct.position.set(0, 6.2, 0); fu.add(duct);
  const ventM = Mat({ color: 0x9aa2ae });
  const vent = new THREE.Mesh(new THREE.BoxGeometry(5, 1.2, 1.2), ventM); vent.position.set(-3.3, 7.6, 0); fu.add(vent);
  const warmM = new THREE.MeshBasicMaterial({ color: 0xff9040, transparent: true, opacity: 0, depthWrite: false });
  const warm = []; for (let k = 0; k < 30; k++) { const m = new THREE.Mesh(new THREE.SphereGeometry(.13, 8, 6), warmM); fu.add(m); warm.push([m, Math.random(), Math.random() - .5]); }

  const shots = [
    [[3.0, 3.6, 10.0], [0, 3, 0]],         // 0 thermostat
    [[1.5, 3.2, 7.2], [0, 2.8, .4]],       // 1 strip close (cover fades)
    [[1.2, 3.5, 7.4], [0, 2.7, .4]],       // 2 bend
    [[2.2, 2.6, 7.0], [.1, 2.5, .4]],      // 3 contact
    [[18.5, 4.6, 19.0], [20.6, 4.4, 0]],   // 4 furnace
    [[1.6, 3.4, 7.4], [0, 3, .3]],         // 5 digital
    [[3.5, 4.0, 11.0], [0, 3, 0]],         // 6 recap
  ];
  const cp = { p: V(), q: V() };
  function update(t, si, lt, sd) {
    const pulse = .5 + .5 * Math.sin(t * 6);
    const open = si >= 1 && si <= 3 ? 1 : si === 5 ? 1 : 0;
    const fade = si === 1 ? ss(0, 1, lt) : open;
    coverM.opacity = lerp(1, .12, fade); coverM.depthWrite = coverM.opacity > .9; dialRing.material.opacity = coverM.opacity; scr.visible = fade < .5;
    // temperature cycle: cold -> bend down to contact in step 3; step 2 shows wobble
    let bend = .0;
    if (si === 2) bend = .5 * Math.sin(lt * 2.2);
    else if (si === 3) bend = lerp(0, -.75, ss(.2, 1.6, lt));
    else if (si === 4) bend = -.75;
    else bend = .1 * Math.sin(t * 1.2);
    segs.forEach((g, k) => { if (k > 0) g.rotation.z = bend / NS * 1.6; });
    const closed = (si === 3 && lt > 1.6) || si === 4;
    contactM.emissiveIntensity = closed ? .6 + .4 * pulse : .1; spark.material.opacity = closed && si === 3 ? .5 + .5 * pulse : 0;
    strip.visible = si !== 5; anchor.visible = si !== 5; contact.visible = si !== 5;
    dig.visible = si === 5;
    chipM.emissiveIntensity = .3 + .7 * pulse; thmM.emissiveIntensity = .3 + .5 * Math.sin(t * 4 + 1);
    // room air colour: cold in 3, warming in 4-6
    const warmth = si === 3 ? 0 : si === 4 ? ss(1, 4, lt) : si >= 5 ? 1 : .5 + .5 * Math.sin(t * .8);
    airM.color.copy(airC).lerp(airW, si === 2 ? .5 + .5 * Math.sin(lt * 2.2) : warmth);
    air.forEach(([m, a, b, c]) => { m.position.set(-3.2 + 6.4 * ((c + t * .03 + a * .1) % 1), 1 + 4 * (.5 + .5 * Math.sin(b + t * .6)), 1.5 + Math.sin(a + t) * .8); });
    // signal along wire when closed
    sig.forEach((m, k) => { m.visible = closed; m.position.copy(wC.getPoint((t * .35 + k / sig.length) % 1)); });
    // furnace
    const on = si === 4 ? ss(.6, 1.4, lt) : si >= 5 ? 1 : 0;
    flm.forEach((m, k) => { m.material.opacity = on; m.scale.y = 1 + .3 * Math.sin(t * 10 + k); });
    warmM.opacity = on * .8;
    warm.forEach(([m, o, a]) => { const u = (t * .5 + o) % 1; m.position.set(-.8 - u * 5, 7.6 + a * .6 - u * u * 2, .9 + a * .5); });
    // camera
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const far = Math.abs(prev[1][0] - now[1][0]) > 8;
    const kk = si === 0 ? 1 : ease(lt / (far ? 1.1 : 1.4));
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], kk))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], kk)));
    const o = Math.sin(t * .2) * .06, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o));
    camera.lookAt(cp.q);
  }
  return { update };
}
