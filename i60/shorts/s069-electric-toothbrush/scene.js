// Inside 60 — Electric toothbrush. Steps: 0 hook (head buzzing), 1 battery+PCB (x-ray), 2 coil current, 3 magnets swing shaft, 4 cleaning teeth, 5 inductive charging base, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 90, specular: 0x555555, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x14202e); scene.fog = new THREE.Fog(0x14202e, 30, 80);
  scene.add(new THREE.HemisphereLight(0xf4f8ff, 0x404050, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.7); key.position.set(6, 10, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0x90d0ff, .8); rim.position.set(-6, 4, -6); scene.add(rim);
  const floor = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, .3, 48), Mat({ color: 0x2a3444, shininess: 30 })); floor.position.y = -.15; scene.add(floor);
  // charging base
  const base = new THREE.Group(); base.position.set(0, 0, 0); scene.add(base);
  const baseM = Mat({ color: 0xe8ecf2, transparent: true, opacity: 1 });
  const baseB = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, .9, 40), baseM); baseB.position.y = .45; base.add(baseB);
  const bCoilM = Mat({ color: 0xd07a30, emissive: 0x000000 });
  const bCoil = []; for (let k = 0; k < 4; k++) { const c = new THREE.Mesh(new THREE.TorusGeometry(.55 + k * .05, .05, 8, 40), bCoilM); c.rotation.x = Math.PI / 2; c.position.y = .3 + k * .12; base.add(c); bCoil.push(c); }
  const fieldM = new THREE.MeshBasicMaterial({ color: 0x60e0ff, transparent: true, opacity: .6 });
  const rings = []; for (let k = 0; k < 4; k++) { const r = new THREE.Mesh(new THREE.TorusGeometry(.7, .035, 8, 40), fieldM); r.rotation.x = Math.PI / 2; scene.add(r); rings.push(r); }
  // brush group (handle bottom at y=0 local)
  const brush = new THREE.Group(); scene.add(brush);
  const shellM = Mat({ color: 0xf4f6fa, shininess: 140, transparent: true, opacity: 1 });
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(.75, .7, 5.4, 40), shellM); handle.position.y = 2.7; brush.add(handle);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(.75, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), shellM); cap.position.y = 5.4; brush.add(cap);
  const btn = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .12, 20), Mat({ color: 0x30a0ff, emissive: 0x104080 })); btn.rotation.x = Math.PI / 2; btn.position.set(0, 4.2, .74); brush.add(btn);
  // internals
  const batM = Mat({ color: 0x40c060, emissive: 0x000000 });
  const bat = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, 2.2, 24), batM); bat.position.y = 1.6; brush.add(bat);
  const batTop = new THREE.Mesh(new THREE.CylinderGeometry(.15, .15, .15, 12), Mat({ color: 0xcccccc })); batTop.position.y = 2.78; brush.add(batTop);
  const pcbM = Mat({ color: 0x208040, emissive: 0x000000 });
  const pcb = new THREE.Mesh(new THREE.BoxGeometry(.9, 2.6, .08), pcbM); pcb.position.set(0, 2.2, -.5); brush.add(pcb);
  const chip = new THREE.Mesh(new THREE.BoxGeometry(.4, .4, .1), Mat({ color: 0x202020 })); chip.position.set(0, 2.6, -.42); brush.add(chip);
  // drive coil
  const dCoilM = Mat({ color: 0xd07a30, emissive: 0x000000 });
  const dCoil = new THREE.Group(); dCoil.position.y = 4.0; brush.add(dCoil);
  for (let k = 0; k < 7; k++) { const c = new THREE.Mesh(new THREE.TorusGeometry(.46, .06, 8, 32), dCoilM); c.rotation.x = Math.PI / 2; c.position.y = -.4 + k * .13; dCoil.add(c); }
  // shaft + magnets (swing group pivots at y=4)
  const swing = new THREE.Group(); swing.position.y = 4.0; brush.add(swing);
  const magN = Mat({ color: 0xff4040, emissive: 0x000000 }), magS = Mat({ color: 0x4070ff, emissive: 0x000000 });
  const m1 = new THREE.Mesh(new THREE.BoxGeometry(.25, .7, .3), magN); m1.position.set(-.16, 0, 0); swing.add(m1);
  const m2 = new THREE.Mesh(new THREE.BoxGeometry(.25, .7, .3), magS); m2.position.set(.16, 0, 0); swing.add(m2);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 3.2, 12), Mat({ color: 0xb0b8c4 })); shaft.position.y = 1.8; swing.add(shaft);
  // neck + head (on swing)
  const neckM = Mat({ color: 0xf4f6fa, shininess: 140 });
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.22, .45, 3, 24), neckM); neck.position.y = 2.9; swing.add(neck);
  const head = new THREE.Mesh(new THREE.BoxGeometry(.5, 1.3, .35), neckM); head.position.set(0, 4.9, 0); swing.add(head);
  const brM = Mat({ color: 0x40c8ff, shininess: 20, emissive: 0x000000 });
  for (let i = 0; i < 3; i++) for (let j = 0; j < 7; j++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .5, 6), (j % 2 ? brM : Mat({ color: 0xffffff, shininess: 20 }))); b.rotation.x = Math.PI / 2; b.position.set(-.15 + i * .15, 4.35 + j * .18, .42); swing.add(b); }
  brush.position.y = .9;
  // current pulse dots along wires battery->pcb->coil
  const dotM = new THREE.MeshBasicMaterial({ color: 0xffe040 });
  const dots = []; for (let k = 0; k < 10; k++) { const d = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), dotM); brush.add(d); dots.push(d); }
  // teeth row (for cleaning step), placed to the right
  const teeth = new THREE.Group(); teeth.position.set(0, 10.0, 1.25); teeth.rotation.y = -Math.PI / 2; scene.add(teeth);
  const toothM = Mat({ color: 0xfffbf0, shininess: 120 }); const gum = Mat({ color: 0xe88a98, shininess: 30 });
  const gumB = new THREE.Mesh(new THREE.BoxGeometry(.4, 4.2, 1.1), gum); gumB.position.x = .55; teeth.add(gumB);
  const plaqueM = Mat({ color: 0xe0c040, transparent: true, opacity: .9 });
  const plaque = [];
  for (let k = 0; k < 4; k++) { const tt = new THREE.Mesh(new THREE.SphereGeometry(.55, 20, 14), toothM); tt.scale.set(.8, 1, 1.2); tt.position.set(0, -1.5 + k * 1.0, 0); teeth.add(tt);
    for (let p = 0; p < 4; p++) { const pl = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 6), plaqueM); pl.position.set(-.42, -1.7 + k + p * .14, -.3 + p * .2); teeth.add(pl); plaque.push(pl); } }
  const bubM = new THREE.MeshBasicMaterial({ color: 0xbfefff, transparent: true, opacity: .6 });
  const bubbles = []; for (let k = 0; k < 30; k++) { const b = new THREE.Mesh(new THREE.SphereGeometry(.08 + Math.random() * .08, 8, 6), bubM); b.userData = { a: Math.random() * 6.28, y: Math.random() * 4 - 2, s: Math.random() }; teeth.add(b); bubbles.push(b); }

  const shots = [
    [[8, 10, 33], [0, 6.2, 0]],       // 0 hook: whole brush
    [[5, 4.5, 10], [0, 3.0, 0]],     // 1 battery/pcb
    [[4.5, 6.8, 8.5], [0, 5.4, 0]],  // 2 coil
    [[-5, 8.5, 11], [0, 7.0, 0]],    // 3 magnets swing + head
    [[8, 11.5, 5.5], [0, 10.0, .6]], // 4 cleaning teeth
    [[4.5, 3.5, 9.5], [0, 1.6, 0]],  // 5 charging base
    [[-6, 9, 25], [0, 5.6, 0]],      // 6 recap
  ];
  const cp = { p: V(), q: V() };
  function update(t, si, lt, sd) {
    const pulse = .5 + .5 * Math.sin(t * 6);
    const on = si !== 5;
    const xr = si >= 1 && si <= 3 || si === 5;
    shellM.opacity = xr ? .22 : 1; shellM.depthWrite = !xr; baseM.opacity = si === 5 ? .3 : 1; baseM.depthWrite = si !== 5;
    // brush position: lifted off base except step 5/6
    const docked = si >= 5 ? 1 : 0;
    brush.position.set(0, lerp(1.2, .9, docked), 0);
    // swing
    const amp = si === 3 ? .05 + .04 * Math.sin(t * 2) : on ? .035 : 0;
    swing.rotation.z = Math.sin(t * 260 * 2 * Math.PI / 30) * amp;
    // battery / pcb glow
    batM.emissive.setHex(0x20ff60); batM.emissiveIntensity = si === 1 ? .3 + .4 * pulse : si === 5 ? .2 + .5 * (lt / sd) : 0;
    pcbM.emissive.setHex(0x40ff80); pcbM.emissiveIntensity = si === 1 ? .25 * pulse : 0;
    // coil current flipping color
    const flip = Math.sin(t * 14) > 0;
    dCoilM.emissive.setHex(flip ? 0xff8020 : 0x20a0ff); dCoilM.emissiveIntensity = (si === 2 || si === 3) ? .9 : on && si > 0 ? .2 : 0;
    magN.emissive.setHex(0xff2020); magN.emissiveIntensity = si === 3 ? .4 + .4 * pulse : 0;
    magS.emissive.setHex(0x2040ff); magS.emissiveIntensity = si === 3 ? .4 + .4 * (1 - pulse) : 0;
    dots.forEach((d, k) => { const o = (k / dots.length + t * .6) % 1; d.visible = si === 1 || si === 2; const y = lerp(2.8, 4.0, o); d.position.set(Math.sin(o * 6) * .2, y, -.35); });
    // head glow on hook
    brM.emissive.setHex(0x40c8ff); brM.emissiveIntensity = si === 0 || si === 4 ? .3 + .3 * pulse : 0;
    // teeth + plaque
    teeth.visible = si === 4;
    const clean = si === 4 ? ease((lt - .5) / (sd - 1)) : 0;
    plaque.forEach((p, k) => { p.visible = clean < (k % 16) / 16 + .1; });
    bubbles.forEach(b => { const u = b.userData; b.position.set(-.6 + Math.sin(t * 3 + u.a) * .25, ((u.y + t * (.5 + u.s)) % 4) - 2, Math.cos(t * 2 + u.a) * .5); });
    // charging field
    bCoilM.emissive.setHex(0xffa040); bCoilM.emissiveIntensity = si === 5 ? .5 + .4 * pulse : 0;
    rings.forEach((r, k) => { const o = (k / 4 + t * .5) % 1; r.visible = si === 5 || si === 6; r.position.y = .4 + o * 1.6; r.scale.setScalar(.8 + o * .6); });
    fieldM.opacity = .7;
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
