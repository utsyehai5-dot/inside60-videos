// Inside 60 — Ceiling fan. Steps: 0 hook (fan + breeze on figure), 1 capacitor + rotating field in stator (cutaway),
// 2 outer rotor carries blades, 3 tilted blade pushes air down, 4 evaporation cools skin, 5 winter reverse (warm air), 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x182030);
  scene.add(new THREE.HemisphereLight(0xfff6ea, 0x404050, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, .9); key.position.set(5, 6, 9); scene.add(key);
  const root = new THREE.Group(); scene.add(root);
  const CY = 2.8, FY = 1.6, GY = -3.2;

  // room: ceiling, floor, back wall
  const ceil = new THREE.Mesh(new THREE.BoxGeometry(16, .3, 12), Mat({ color: 0xece6da, shininess: 5 })); ceil.position.set(0, CY + .15, 0); root.add(ceil);
  const floor = new THREE.Mesh(new THREE.BoxGeometry(16, .3, 12), Mat({ color: 0x9a7050, shininess: 20 })); floor.position.set(0, GY - .15, 0); root.add(floor);
  const wall = new THREE.Mesh(new THREE.BoxGeometry(16, CY - GY, .3), Mat({ color: 0x5a7a90, shininess: 5 })); wall.position.set(0, (CY + GY) / 2, -6); root.add(wall);
  // fan
  const FAN = new THREE.Group(); FAN.position.y = FY; root.add(FAN);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, CY - FY, 12), Mat({ color: 0xc0a060, shininess: 150 })); rod.position.y = (CY - FY) / 2; FAN.add(rod);
  const canopy = new THREE.Mesh(new THREE.CylinderGeometry(.25, .4, .25, 24), Mat({ color: 0xc0a060, shininess: 150 })); canopy.position.y = CY - FY - .12; FAN.add(canopy);
  // stator (fixed) — inside housing
  const stator = new THREE.Group(); FAN.add(stator);
  stator.add(new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, .3, 32), Mat({ color: 0x707880 })));
  const coilMs = [];
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const m = Mat({ color: 0xb06030, emissive: 0x40a0ff, emissiveIntensity: 0, shininess: 160 }); coilMs.push(m);
    const c = new THREE.Mesh(new THREE.BoxGeometry(.16, .28, .18), m); c.position.set(Math.cos(a) * .62, 0, Math.sin(a) * .62); c.rotation.y = -a; stator.add(c); }
  // capacitor
  const capM = Mat({ color: 0x202020, emissive: 0xffd040, emissiveIntensity: 0 });
  const cap = new THREE.Mesh(new THREE.BoxGeometry(.34, .22, .16), capM); cap.position.set(0, .42, .35); FAN.add(cap);
  // rotor (spins): outer shell + blade irons + blades
  const rotor = new THREE.Group(); FAN.add(rotor);
  const shellM = Mat({ color: 0xc0a060, shininess: 150, transparent: true, opacity: 1, side: THREE.DoubleSide });
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(.95, .95, .55, 40, 1, true), shellM); rotor.add(shell);
  const capTop = new THREE.Mesh(new THREE.CylinderGeometry(.95, .95, .06, 40), shellM); capTop.position.y = .3; rotor.add(capTop);
  const capBot = new THREE.Mesh(new THREE.CylinderGeometry(.95, .5, .3, 40), shellM); capBot.position.y = -.42; rotor.add(capBot);
  const magM = Mat({ color: 0xd03030, emissive: 0xff3030, emissiveIntensity: 0 });
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; const m = new THREE.Mesh(new THREE.BoxGeometry(.1, .4, .08), magM); m.position.set(Math.cos(a) * .86, 0, Math.sin(a) * .86); m.rotation.y = -a; rotor.add(m); }
  const bladeM = Mat({ color: 0x8a5a30, shininess: 60, emissive: 0xffa040, emissiveIntensity: 0 });
  const PITCH = .24;
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; const g = new THREE.Group(); g.rotation.y = a; rotor.add(g);
    const iron = new THREE.Mesh(new THREE.BoxGeometry(.9, .06, .2), Mat({ color: 0x303030 })); iron.position.set(1.25, -.1, 0); g.add(iron);
    const b = new THREE.Mesh(new THREE.BoxGeometry(3.0, .05, .75), bladeM); b.position.set(3.1, -.12, 0); b.rotation.x = PITCH; g.add(b); }
  const light = new THREE.Mesh(new THREE.SphereGeometry(.45, 24, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), Mat({ color: 0xfff6e0, emissive: 0xffe8b0, emissiveIntensity: .5 })); light.position.y = -.55; FAN.add(light);
  // field arrow (rotating highlight) shown in cutaway
  const fieldM = new THREE.MeshBasicMaterial({ color: 0x60d0ff, transparent: true, opacity: 0, depthWrite: false });
  const field = new THREE.Mesh(new THREE.TorusGeometry(.62, .05, 6, 40, Math.PI * .6), fieldM); field.rotation.x = Math.PI / 2; FAN.add(field);
  // air particles
  const airM = new THREE.MeshBasicMaterial({ color: 0x90e0ff, transparent: true, opacity: .85 });
  const air = Array.from({ length: 60 }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), airM); m.userData = { a: Math.random() * Math.PI * 2, r: 1.2 + Math.random() * 3.2, o: i / 60 }; root.add(m); return m; });
  // figure (faceless) on floor + sweat droplets
  const fig = new THREE.Group(); fig.position.set(1.2, GY * .2, 1.2); fig.scale.setScalar(.8); root.add(fig);
  const figM = Mat({ color: 0x8a96a8, emissive: 0xff5010, emissiveIntensity: 0, shininess: 40 });
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(.45, .38, 1.5, 20), figM); torso.position.y = GY + 2.55; fig.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.34, 20, 16), figM); head.position.y = GY + 3.65; fig.add(head);
  [-1, 1].forEach(s => { const l = new THREE.Mesh(new THREE.CylinderGeometry(.15, .13, 1.75, 12), figM); l.position.set(s * .2, GY + .9, 0); fig.add(l);
    const a = new THREE.Mesh(new THREE.CylinderGeometry(.11, .1, 1.35, 12), figM); a.position.set(s * .58, GY + 2.5, 0); fig.add(a); });
  const dropM = new THREE.MeshBasicMaterial({ color: 0xc0f0ff, transparent: true, opacity: 0 });
  const drops = Array.from({ length: 12 }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 6), dropM); m.userData = { x: (Math.random() - .5) * .9, y: GY + 2 + Math.random() * 1.9, o: i / 12 }; fig.add(m); return m; });

  const shots = [
    [[6.0, .6, 16.5], [0, -.3, 0]],            // 0 wide room
    [[3.0, FY + 1.0, 3.8], [0, FY - .05, 0]],    // 1 motor cutaway
    [[3.0, FY + 1.0, 5.2], [0, FY - .1, 0]],   // 2 rotor + blades
    [[5.5, FY - 2.6, 6.5], [2.4, FY - .8, 0]], // 3 blade from below-side
    [[4.0, -.4, 9.0], [1.0, -1.2, 1.0]],       // 4 figure breeze
    [[6.5, .4, 17.0], [0, -.2, 0]],            // 5 winter wide
    [[6.0, .8, 16.5], [0, -.3, 0]],            // 6 recap
  ];
  const cp = { p: V(), q: V() };
  let ang = 0, lastT = 0, spd = 0;
  function update(t, si, lt, sd) {
    const dt = Math.min(.05, Math.max(0, t - lastT)); lastT = t;
    const pulse = .5 + .5 * Math.sin(t * 7);
    const f = Math.min(1, lt / Math.max(.1, sd));
    // spin: counterclockwise from below (= +y rotation viewed from below is cw; use negative), winter reversed
    const winter = si === 5;
    const target = si === 1 ? .6 : (si === 3 ? 1.6 : 3.2);
    const dir = winter ? (f < .2 ? lerp(1, -1, f / .2) : -1) : 1;
    spd = lerp(spd, target * dir, Math.min(1, dt * 3));
    ang += spd * dt; rotor.rotation.y = ang;
    // cutaway
    const cut = si === 1 || si === 2 ? 1 : 0;
    const op = si === 1 ? 1 - .9 * ease(f / .2) : (si === 2 ? .1 + .9 * ease((f - .55) / .3) : 1);
    shellM.opacity = op; light.visible = si !== 1 && si !== 2;
    coilMs.forEach((m, i) => { const a = i / 12 * Math.PI * 2; const d = Math.cos(a + t * 3 * (cut ? 1 : 0)); m.emissiveIntensity = si === 1 ? Math.max(0, d) * 1.6 : 0; });
    fieldM.opacity = si === 1 ? .8 : 0; field.rotation.z = -t * 3;
    capM.emissiveIntensity = si === 1 ? .4 + .4 * pulse : 0;
    magM.emissiveIntensity = si === 2 ? .3 + .3 * pulse : 0;
    bladeM.emissiveIntensity = si === 3 ? .2 + .2 * pulse : 0;
    // air flow
    const showAir = si === 0 || si >= 3;
    airM.color.setHex(winter ? 0xffa050 : 0x90e0ff);
    air.forEach(m => { const u = m.userData; const k = (t * .35 + u.o) % 1; m.visible = showAir && !(si === 3 && u.r > 2.8 && false);
      let x, y, z;
      if (!winter) { // down through fan, spread out on floor
        y = lerp(FY - .3, GY + .2, Math.min(1, k * 1.4)); const rr = k < .72 ? u.r * .9 : u.r * .9 + (k - .72) * 14;
        x = Math.cos(u.a + k * 2) * rr; z = Math.sin(u.a + k * 2) * rr;
      } else { // up to ceiling, out, down walls
        if (k < .3) { y = lerp(FY - .5, CY - .2, k / .3); x = Math.cos(u.a) * u.r; z = Math.sin(u.a) * u.r; }
        else if (k < .6) { const rr = lerp(u.r, 7, (k - .3) / .3); y = CY - .3; x = Math.cos(u.a) * rr; z = Math.sin(u.a) * rr * .6; }
        else { y = lerp(CY - .3, GY + .3, (k - .6) / .4); x = Math.cos(u.a) * 7; z = Math.sin(u.a) * 4.2; }
      }
      m.position.set(x, y, z); });
    // figure + evaporation
    figM.emissiveIntensity = si === 4 ? .25 * (1 - f) : 0;
    dropM.opacity = si === 4 ? .9 : 0;
    drops.forEach(d => { const u = d.userData, k = (t * .5 + u.o) % 1; d.visible = si === 4; d.position.set(u.x + Math.sin(k * 6) * .1, u.y + k * 1.4, .5); d.scale.setScalar(1 - k * .8); });
    // camera
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const kk = si === 0 ? 1 : ease(lt / 1.4);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], kk))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], kk)));
    const ob = Math.sin(t * .25) * .06, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(ob) - dz * Math.sin(ob), cp.p.y, cp.q.z + dz * Math.cos(ob) + dx * Math.sin(ob));
    camera.lookAt(cp.q);
  }
  return { update };
}
