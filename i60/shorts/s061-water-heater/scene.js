// Inside 60 — Tank water heater. Steps: 0 hook (18% of home energy), 1 insulated tank, 2 dip tube to bottom, 3 burner heats + hot rises to outlet, 4 thermostat, 5 sacrificial anode, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const ss = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x555555, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x121a2e); scene.fog = new THREE.Fog(0x121a2e, 30, 80);
  scene.add(new THREE.HemisphereLight(0xf4f6ff, 0x40404c, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.8); key.position.set(5, 10, 9); scene.add(key);
  const rim = new THREE.DirectionalLight(0xa0c8ff, .8); rim.position.set(-6, 2, -6); scene.add(rim);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(30, 48), Mat({ color: 0x3a4052, shininess: 10 })); floor.rotation.x = -Math.PI / 2; scene.add(floor);

  const H = 6.0, R = 1.6, Y0 = .9; // tank height, radius, bottom
  const wh = new THREE.Group(); scene.add(wh);
  // outer jacket (fades), insulation layer (yellow), inner tank
  const jacketM = Mat({ color: 0xe6e9ef, transparent: true, opacity: 1, side: THREE.DoubleSide });
  const jacket = new THREE.Mesh(new THREE.CylinderGeometry(R + .25, R + .25, H + .4, 48, 1, false), jacketM); jacket.position.y = Y0 + H / 2; wh.add(jacket);
  const insM = Mat({ color: 0xffd040, emissive: 0x403000, transparent: true, opacity: 0, side: THREE.DoubleSide });
  const ins = new THREE.Mesh(new THREE.CylinderGeometry(R + .18, R + .18, H + .2, 48, 1, true, 0, Math.PI * 1.3), insM); ins.position.y = Y0 + H / 2; ins.rotation.y = Math.PI * .85; wh.add(ins);
  const legs = Mat({ color: 0x2a2e38, transparent: true, opacity: 1 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(R + .3, R + .3, .9, 40), legs); base.position.y = .45; wh.add(base);
  // water column: stacked slices coloured cold->hot
  const NL = 12, cold = new THREE.Color(0x3a80ff), hot = new THREE.Color(0xff4a2a);
  const layers = []; for (let k = 0; k < NL; k++) { const m = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H / NL, 40), new THREE.MeshPhongMaterial({ color: 0x3a80ff, transparent: true, opacity: 0, depthWrite: false })); m.position.y = Y0 + (k + .5) * H / NL; wh.add(m); layers.push(m); }
  // dip tube, outlet, inlet pipes on top
  const pipeM = Mat({ color: 0xc87a40, shininess: 120 });
  const dip = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, H - .5, 12), Mat({ color: 0xe0e4ec, transparent: true, opacity: 0 })); dip.position.set(-.8, Y0 + .5 + (H - .5) / 2, 0); wh.add(dip);
  const inP = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, 1.4, 12), pipeM); inP.position.set(-.8, Y0 + H + .7, 0); wh.add(inP);
  const outP = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, 1.4, 12), pipeM); outP.position.set(.8, Y0 + H + .7, 0); wh.add(outP);
  const inRing = new THREE.Mesh(new THREE.TorusGeometry(.2, .06, 8, 20), Mat({ color: 0x3a80ff, emissive: 0x2050ff })); inRing.rotation.x = Math.PI / 2; inRing.position.set(-.8, Y0 + H + 1.0, 0); wh.add(inRing);
  const outRing = new THREE.Mesh(new THREE.TorusGeometry(.2, .06, 8, 20), Mat({ color: 0xff4a2a, emissive: 0xff3010 })); outRing.rotation.x = Math.PI / 2; outRing.position.set(.8, Y0 + H + 1.0, 0); wh.add(outRing);
  // flue (centre) + burner flames at bottom
  const flue = new THREE.Mesh(new THREE.CylinderGeometry(.28, .28, H + 1.6, 16), Mat({ color: 0x80889a, transparent: true, opacity: 0 })); flue.position.set(0, Y0 + H / 2 + .5, 0); wh.add(flue);
  const flames = []; for (let k = 0; k < 10; k++) { const c = k % 2 ? 0x40a0ff : 0xff9020; const a = k / 10 * Math.PI * 2;
    const m = new THREE.Mesh(new THREE.ConeGeometry(.2, .8, 10), new THREE.MeshPhongMaterial({ color: c, emissive: c, emissiveIntensity: 1, transparent: true, opacity: 0 })); m.position.set(Math.cos(a) * .9, .55, Math.sin(a) * .9); wh.add(m); flames.push(m); }
  // thermostat box on front
  const tstat = new THREE.Group(); tstat.position.set(0, 1.5, R + .3); wh.add(tstat);
  tstat.add(new THREE.Mesh(new THREE.BoxGeometry(.9, .7, .3), Mat({ color: 0x30343e })));
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .15, 20), Mat({ color: 0xd02020 })); knob.rotation.x = Math.PI / 2; knob.position.z = .2; tstat.add(knob);
  const tick = new THREE.Mesh(new THREE.BoxGeometry(.04, .18, .04), new THREE.MeshBasicMaterial({ color: 0xffffff })); tick.position.set(0, .08, .3); knob.add(tick); tick.position.set(0, .3, .08);
  const ledM = Mat({ color: 0x40ff60, emissive: 0x20ff40, emissiveIntensity: .2 });
  const led = new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 8), ledM); led.position.set(.3, .2, .17); tstat.add(led);
  const probe = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 1.3, 8), Mat({ color: 0xffe040, emissive: 0x806000, transparent: true, opacity: 0 })); probe.rotation.x = Math.PI / 2; probe.position.set(0, 1.5, R - .55); wh.add(probe);
  // anode rod (magnesium, corrodes)
  const anM = Mat({ color: 0xd0f0ff, emissive: 0x000000, transparent: true, opacity: 0 });
  const anode = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, H - .9, 12), anM); anode.position.set(.8, Y0 + .9 + (H - .9) / 2, -.6); wh.add(anode);
  const rustM = Mat({ color: 0xd06020, emissive: 0x602000, transparent: true, opacity: 0 });
  const rust = []; for (let k = 0; k < 26; k++) { const m = new THREE.Mesh(new THREE.SphereGeometry(.07 + Math.random() * .06, 8, 6), rustM); const a = Math.random() * 7; m.position.set(.8 + Math.cos(a) * .12, Y0 + 1.2 + Math.random() * (H - 1.4), -.6 + Math.sin(a) * .12); wh.add(m); rust.push(m); }
  // water particles: cold down the dip tube, hot rising
  const cM = new THREE.MeshBasicMaterial({ color: 0x80c0ff, transparent: true, opacity: 0 });
  const hM = new THREE.MeshBasicMaterial({ color: 0xffa060, transparent: true, opacity: 0 });
  const cps = []; for (let k = 0; k < 14; k++) { const m = new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 6), cM); wh.add(m); cps.push(m); }
  const hps = []; for (let k = 0; k < 30; k++) { const m = new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 6), hM); wh.add(m); hps.push([m, Math.random(), Math.random() * 7, .4 + Math.random() * .9]); }

  const MID = Y0 + H / 2;
  const shots = [
    [[8.0, 7.0, 19.0], [0, MID - .3, 0]],     // 0 whole heater
    [[6.5, 6.0, 17.5], [0, MID - .2, 0]],     // 1 tank + insulation
    [[-4.5, 6.5, 15.0], [-.6, MID + .2, 0]],  // 2 dip tube
    [[6.5, 3.2, 17.0], [0, MID - .8, 0]],     // 3 burner + rising
    [[2.2, 2.3, 7.8], [0, 1.4, 1.2]],         // 4 thermostat close
    [[5.5, 5.5, 15.0], [.5, MID - .2, -.3]],  // 5 anode
    [[8.5, 7.5, 21.0], [0, MID - .3, 0]],     // 6 recap
  ];
  const cp = { p: V(), q: V() };
  function update(t, si, lt, sd) {
    const pulse = .5 + .5 * Math.sin(t * 6);
    const xr = si === 0 ? 0 : si === 1 ? ss(.8, 2.0, lt) : si === 6 ? lerp(1, .5, ss(0, 2, lt)) : 1;
    jacketM.opacity = lerp(1, .12, xr); jacketM.depthWrite = jacketM.opacity > .9;
    insM.opacity = si === 1 ? .85 * ss(.8, 2.0, lt) : 0;
    layers.forEach(m => m.material.opacity = .45 * xr);
    dip.material.opacity = .85 * xr; flue.material.opacity = .6 * xr; anM.opacity = .95 * xr; probe.material.opacity = .9 * xr;
    // water temperature gradient: before heating mostly cold; heats up in step 3
    const heat = si <= 2 ? .25 : si === 3 ? lerp(.25, 1, ss(.5, 3.5, lt)) : 1;
    layers.forEach((m, k) => { const f = Math.min(1, Math.max(0, (k / (NL - 1)) * 1.3 * heat + (heat - .3) * .4)); m.material.color.copy(cold).lerp(hot, f); });
    // cold particles down the dip tube (steps 2, 3, 6)
    const flowC = si === 2 || si === 3 || si === 6;
    cM.opacity = flowC ? 1 : 0;
    cps.forEach((m, k) => { const u = (t * .45 + k / cps.length) % 1; const yTop = Y0 + H + 1.0, yBot = Y0 + .5;
      if (u < .8) m.position.set(-.8, lerp(yTop, yBot, u / .8), 0); else { const w = (u - .8) / .2; m.position.set(lerp(-.8, .6, w), yBot + w * .2, 0); } });
    // flames + hot rising (steps 0 (dim), 3, 4, 6)
    const burn = si === 3 ? ss(0, .8, lt) : si === 4 ? (Math.sin(t * 1.3) > -.2 ? 1 : 0) : si === 0 || si === 6 ? 1 : .5;
    flames.forEach((m, k) => { m.material.opacity = burn * xr + (si === 0 ? .0 : 0); m.scale.y = 1 + .35 * Math.sin(t * 11 + k); });
    hM.opacity = (si === 3 || si === 6) ? 1 : 0;
    hps.forEach(([m, o, a, r]) => { const u = (t * .22 + o) % 1; m.position.set(Math.cos(a + u * 2) * r, Y0 + .3 + u * (H - .4), Math.sin(a + u * 2) * r); });
    // thermostat LED blinks with burner in step 4
    ledM.emissiveIntensity = si === 4 ? (burn ? 1 : .05) : .2; knob.rotation.z = si === 4 ? -.6 * ss(.3, 1.3, lt) : 0;
    // anode corrodes in step 5
    const cor = si === 5 ? ss(.5, 3.5, lt) : si === 6 ? 1 : 0;
    rustM.opacity = cor * xr; anode.scale.set(1 - cor * .45, 1, 1 - cor * .45); anM.emissive.setHex(si === 5 ? 0x2080a0 : 0x000000); anM.emissiveIntensity = si === 5 ? .5 + .5 * pulse : 1;
    legs.opacity = lerp(1, .3, xr); legs.depthWrite = legs.opacity > .9; dip.material.opacity = si === 5 ? .2 : dip.material.opacity;
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
