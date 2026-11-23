// Inside 60 — MRI scanner. Steps: 0 hook big magnet field, 1 superconducting coil + helium, 2 protons align,
// 3 radio pulse flips + signal back, 4 gradient coils knock, 5 slice image, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x141a2a); scene.fog = new THREE.Fog(0x141a2a, 30, 80);
  scene.add(new THREE.HemisphereLight(0xf4f8ff, 0x303840, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.2); key.position.set(6, 10, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0x80c0ff, .6); rim.position.set(-6, 3, -8); scene.add(rim);

  const root = new THREE.Group(); scene.add(root);
  // bore along z axis. Outer shell = lathe ring, cut-away half (front open) so we see inside
  const R0 = 2.0, R1 = 3.2, L = 4.4;
  const shellM = Mat({ color: 0xeef2f6, side: THREE.DoubleSide, shininess: 60 });
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(R1, R1, L, 48, 1, true, Math.PI * .5, Math.PI * 1.25), shellM); shell.rotation.x = Math.PI / 2; root.add(shell);
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(R0, R0, L, 48, 1, true, Math.PI * .5, Math.PI * 1.25), Mat({ color: 0xd8dee6, side: THREE.DoubleSide })); inner.rotation.x = Math.PI / 2; root.add(inner);
  // end caps (rings)
  for (const z of [-L / 2, L / 2]) { const c = new THREE.Mesh(new THREE.RingGeometry(R0, R1, 48, 1, Math.PI * .5, Math.PI * 1.25), shellM); c.position.z = z; root.add(c); }
  // superconducting coils (copper torus loops inside shell)
  const coilM = Mat({ color: 0xd88040, emissive: 0xff8020, emissiveIntensity: 0, shininess: 120 });
  const coils = []; for (let k = 0; k < 6; k++) { const c = new THREE.Mesh(new THREE.TorusGeometry(2.7, .12, 10, 64), coilM); c.position.z = -1.8 + k * .72; root.add(c); coils.push(c); }
  // helium bath glow (translucent cyan cylinder between radii)
  const heM = new THREE.MeshPhongMaterial({ color: 0x60e0ff, emissive: 0x40c0ff, emissiveIntensity: .0, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
  const he = new THREE.Mesh(new THREE.CylinderGeometry(2.95, 2.95, L - .2, 48, 1, true), heM); he.rotation.x = Math.PI / 2; root.add(he);
  // gradient coils (thin green saddle bands inside bore)
  const gM = Mat({ color: 0x40e080, emissive: 0x20ff80, emissiveIntensity: 0 });
  const grads = []; for (let k = 0; k < 3; k++) { const g = new THREE.Mesh(new THREE.TorusGeometry(2.2, .07, 8, 64), gM); g.position.z = -1.4 + k * 1.4; root.add(g); grads.push(g); }
  // field lines (step 0): arrows along z through bore
  const fieldM = new THREE.MeshBasicMaterial({ color: 0x60b0ff, transparent: true, opacity: .8 });
  const fieldL = []; for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; const m = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, 9, 6), fieldM); m.rotation.x = Math.PI / 2; m.position.set(Math.cos(a) * 1.2, Math.sin(a) * 1.2, 0); root.add(m); fieldL.push(m); }
  const fieldHeads = fieldL.map(f => { const h = new THREE.Mesh(new THREE.ConeGeometry(.14, .35, 12), fieldM); h.rotation.x = Math.PI / 2; root.add(h); return h; });

  // table + simple body (capsules, no face)
  const table = new THREE.Mesh(new THREE.BoxGeometry(1.4, .16, 8), Mat({ color: 0x3a4a60 })); table.position.set(0, -1.15, 1.6); root.add(table);
  const legs = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 1.2), Mat({ color: 0x8090a0 })); legs.position.set(0, -2.6, 5.0); root.add(legs);
  const bodyM = Mat({ color: 0x90b8e8, transparent: true, opacity: 1, shininess: 30 });
  const body = new THREE.Group(); body.position.set(0, -.75, 0); root.add(body);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(.42, 2.2, 8, 16), bodyM); torso.rotation.x = Math.PI / 2; body.add(torso);
  const headB = new THREE.Mesh(new THREE.SphereGeometry(.36, 20, 14), bodyM); headB.position.z = -1.8; body.add(headB);
  const legB = new THREE.Mesh(new THREE.CapsuleGeometry(.3, 2.0, 8, 12), bodyM); legB.rotation.x = Math.PI / 2; legB.position.z = 2.6; body.add(legB);

  // protons: small spheres with arrows inside the torso region
  const pM = Mat({ color: 0xff5060, emissive: 0xff3040, emissiveIntensity: .4 });
  const aM = new THREE.MeshBasicMaterial({ color: 0xffe040 });
  const protons = [];
  for (let i = 0; i < 18; i++) {
    const g = new THREE.Group(); g.position.set(((i % 3) - 1) * .5, -.75 + ((Math.floor(i / 3) % 2) - .5) * .5 + .45, -1.2 + Math.floor(i / 6) * 1.0); root.add(g);
    g.add(new THREE.Mesh(new THREE.SphereGeometry(.1, 12, 10), pM));
    const ar = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .4, 6), aM); ar.position.y = .2; g.add(ar);
    const hd = new THREE.Mesh(new THREE.ConeGeometry(.06, .12, 8), aM); hd.position.y = .44; g.add(hd);
    const r = [Math.random() * 6, Math.random() * 6, Math.random() * 6];
    protons.push({ g, r });
  }
  // RF wave rings (step 3) and signal rings coming back
  const rfM = new THREE.MeshBasicMaterial({ color: 0xff60d0, transparent: true });
  const rf = []; for (let k = 0; k < 4; k++) { const r = new THREE.Mesh(new THREE.TorusGeometry(1, .04, 6, 48), rfM.clone()); root.add(r); rf.push(r); }
  // slice image panel (step 5): canvas texture of an abstract body cross-section
  const cv = document.createElement('canvas'); cv.width = cv.height = 256; const cx = cv.getContext('2d');
  cx.fillStyle = '#000'; cx.fillRect(0, 0, 256, 256);
  const gr = cx.createRadialGradient(128, 128, 20, 128, 128, 110); gr.addColorStop(0, '#bbb'); gr.addColorStop(1, '#555');
  cx.fillStyle = gr; cx.beginPath(); cx.ellipse(128, 128, 110, 80, 0, 0, 7); cx.fill();
  cx.fillStyle = '#eee'; cx.beginPath(); cx.ellipse(85, 120, 30, 40, 0, 0, 7); cx.fill(); cx.beginPath(); cx.ellipse(171, 120, 30, 40, 0, 0, 7); cx.fill();
  cx.fillStyle = '#333'; cx.beginPath(); cx.arc(128, 175, 16, 0, 7); cx.fill();
  cx.fillStyle = '#999'; cx.beginPath(); cx.arc(128, 95, 18, 0, 7); cx.fill();
  const tex = new THREE.CanvasTexture(cv);
  const panelM = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, side: THREE.DoubleSide });
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.2), panelM); panel.position.set(0, 1.0, 4.0); root.add(panel);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(3.5, 3.5, .1), Mat({ color: 0x223040, transparent: true, opacity: 0 })); frame.position.set(0, 1.0, 3.93); root.add(frame);
  const slice = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.6), new THREE.MeshBasicMaterial({ color: 0x40ffb0, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })); slice.position.set(0, -.6, -.3); root.add(slice);

  const shots = [
    [[5.5, 4.0, 10.5], [0, -.3, 0]],     // 0 whole scanner + field
    [[6.0, 1.8, 5.5], [0, 0, 0]],        // 1 coils + helium
    [[1.6, 1.4, 4.6], [0, -.5, -.6]],    // 2 protons close
    [[2.2, 1.6, 5.0], [0, -.4, -.6]],    // 3 rf pulse
    [[-5.5, 2.2, 6.0], [0, -.2, 0]],     // 4 gradient coils
    [[0, 1.6, 10.5], [0, .6, 2.5]],      // 5 image panel
    [[6.0, 4.0, 10.0], [0, -.2, .5]],    // 6 recap
  ];
  const cp = { p: V(), q: V() };
  const up = V(0, 1, 0), tmp = new THREE.Quaternion(), qa = new THREE.Quaternion(), e = new THREE.Euler();
  function update(t, si, lt, sd) {
    const pulse = .5 + .5 * Math.sin(t * 7);
    // field
    const fOn = si === 0 || si === 6;
    fieldL.forEach((f, k) => { f.visible = fOn; fieldHeads[k].visible = fOn; fieldHeads[k].position.set(f.position.x, f.position.y, 4.6 + .2 * Math.sin(t * 3 + k)); });
    fieldM.opacity = .5 + .4 * pulse;
    coilM.emissiveIntensity = si === 1 ? .5 + .4 * pulse : (si === 0 ? .25 : 0);
    heM.opacity = si === 1 ? .35 : 0; heM.emissiveIntensity = si === 1 ? .5 + .3 * pulse : 0;
    shellM.opacity = 1;
    gM.emissiveIntensity = si === 4 ? (Math.sin(t * 22) > 0 ? 1.2 : .1) : 0;
    grads.forEach((g, k) => { const s = si === 4 ? 1 + .04 * Math.sin(t * 44 + k) : 1; g.scale.set(s, s, 1); });
    root.position.x = si === 4 ? .02 * Math.sin(t * 60) : 0;
    // body slides in during step 0
    body.position.z = si === 0 ? lerp(4.0, 0, ease(lt / 2.5)) : 0; table.position.z = body.position.z + 1.6;
    bodyM.opacity = si >= 2 && si <= 4 ? .35 : 1;
    // protons: 0..1 random spin, 2 align up (+z field -> point along z), 3 tip over then relax
    const showP = si >= 2 && si <= 4;
    protons.forEach((p, i) => {
      p.g.visible = showP;
      if (!showP) return;
      let k = 1;
      if (si === 2) k = ease((lt - .6) / 1.6);
      e.set(p.r[0] + t * 1.5, p.r[1] + t * 2, p.r[2]); qa.setFromEuler(e);
      tmp.setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)); // arrow +y -> +z (field direction)
      let flip = 0;
      if (si === 3) { const c = (lt % 2.6); flip = c < .5 ? ease(c / .5) : 1 - ease((c - .5) / 1.8); }
      const q2 = tmp.clone(); if (flip > 0) q2.multiply(new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), -flip * Math.PI / 2)).multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), t * 6));
      p.g.quaternion.copy(qa).slerp(q2, si === 2 ? k : 1);
    });
    pM.emissiveIntensity = si === 3 ? .6 + .4 * pulse : .4;
    // rf rings: step 3, out from coil then signal back (cyan)
    rf.forEach((r, k) => {
      r.visible = si === 3;
      const c = ((lt + k * .65) % 2.6) / 2.6;
      const outward = k < 2;
      const s = outward ? lerp(2.2, .4, c) : lerp(.4, 2.2, c);
      r.scale.set(s, s, 1); r.position.set(0, -.5, -.6 + (k - 1.5) * .3);
      r.material.color.setHex(outward ? 0xff60d0 : 0x60ffff); r.material.opacity = (1 - c) * .9;
    });
    // slice + panel
    slice.material.opacity = si === 5 ? .4 + .2 * pulse : 0; slice.position.z = -1.2 + ((t * .6) % 2.4);
    const pOn = si === 5 ? ease((lt - .5) / 1) : (si === 6 ? 1 : 0);
    panelM.opacity = pOn; frame.material.opacity = pOn; panel.visible = frame.visible = pOn > .01;
    panel.position.y = frame.position.y = 1.0 + (1 - pOn) * -.6 + (si === 6 ? 1.8 : 0);
    panel.scale.setScalar(si === 6 ? .7 : 1); frame.scale.setScalar(si === 6 ? .7 : 1);
    // camera
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const kk = si === 0 ? 1 : ease(lt / 1.4);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], kk))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], kk)));
    const o = Math.sin(t * .25) * .08, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o));
    camera.lookAt(cp.q);
  }
  return { update };
}
