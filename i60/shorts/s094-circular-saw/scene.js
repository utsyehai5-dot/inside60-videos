// Inside 60 — Circular saw. Steps: 0 hook (saw on board), 1 motor spins blade, 2 carbide teeth + gullets + dust,
// 3 upcut direction, 4 spring guard, 5 depth + bevel, 6 recap
export async function setup({ THREE, scene, camera }) {
  const ease = x => { x = Math.min(1, Math.max(0, x)); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const Mat = o => new THREE.MeshPhongMaterial({ shininess: 80, specular: 0x444444, ...o });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  scene.background = new THREE.Color(0x1a2030); scene.fog = new THREE.Fog(0x1a2030, 30, 80);
  scene.add(new THREE.HemisphereLight(0xfff8f0, 0x303040, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 1.2); key.position.set(5, 9, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0x80c0ff, .5); rim.position.set(-6, 4, -8); scene.add(rim);
  const root = new THREE.Group(); scene.add(root); root.position.set(0, .4, 0);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(18, 48), Mat({ color: 0x2c3440, shininess: 5 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -3.2; root.add(floor);
  // sawhorses + board (board long along x, top at y = 0)
  const legM = Mat({ color: 0x506070 });
  for (const sx of [-3.5, 3.5]) { const h = new THREE.Mesh(new THREE.BoxGeometry(.3, 2.6, 2.6), legM); h.position.set(sx, -1.95, 0); root.add(h); }
  const woodM = Mat({ color: 0xe8b878, shininess: 12 });
  const boardL = new THREE.Mesh(new THREE.BoxGeometry(5, .6, 2.2), woodM); boardL.position.set(-2.5, -.3, 0); root.add(boardL);
  const boardR = new THREE.Mesh(new THREE.BoxGeometry(5, .6, 2.2), woodM); boardR.position.set(2.5, -.3, 0); root.add(boardR);
  const kerfM = new THREE.MeshBasicMaterial({ color: 0x5a3a20 });
  const kerf = new THREE.Mesh(new THREE.BoxGeometry(1, .62, .1), kerfM); root.add(kerf);
  // saw group moves along x; blade plane = xy (axle along z)
  const saw = new THREE.Group(); root.add(saw);
  const tilt = new THREE.Group(); saw.add(tilt); // bevel tilt about x
  const baseM = Mat({ color: 0xc0c8d0, shininess: 120, emissive: 0x40c0ff, emissiveIntensity: 0 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(3.4, .08, 1.8), baseM); base.position.set(0, .04, -.35); saw.add(base);
  const body = new THREE.Group(); tilt.add(body);
  const R = 1.25; const AX = V(0, .55, 0); // blade center above base; blade dips below board
  const motorM = Mat({ color: 0xffc020, emissive: 0xff8000, emissiveIntensity: 0 });
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, 1.4, 28).rotateX(Math.PI / 2), motorM); motor.position.set(AX.x, AX.y + .1, -.95); body.add(motor);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(.55, .14, 10, 24, Math.PI), Mat({ color: 0x202428 })); handle.position.set(-.6, 1.5, -.7); body.add(handle);
  const upGuardM = Mat({ color: 0xffc020, side: THREE.DoubleSide, transparent: true, opacity: .85 });
  const upGuard = new THREE.Mesh(new THREE.CylinderGeometry(R + .18, R + .18, .4, 40, 1, true, -Math.PI / 2 - 1.6, 3.2).rotateX(Math.PI / 2), upGuardM); upGuard.position.copy(AX); body.add(upGuard);
  // blade
  const blade = new THREE.Group(); blade.position.copy(AX); body.add(blade);
  const steelM = Mat({ color: 0xb8c0c8, shininess: 220 });
  const disk = new THREE.Mesh(new THREE.CylinderGeometry(R - .08, R - .08, .04, 48).rotateX(Math.PI / 2), steelM); blade.add(disk);
  const carbM = Mat({ color: 0x40444a, emissive: 0xffd040, emissiveIntensity: 0, shininess: 200 });
  const gulM = new THREE.MeshBasicMaterial({ color: 0x1a2030 });
  const N = 24;
  for (let k = 0; k < N; k++) {
    const a = k / N * Math.PI * 2;
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(.12, .16, .09), carbM); tooth.position.set(Math.cos(a) * (R - .02), Math.sin(a) * (R - .02), 0); tooth.rotation.z = a; blade.add(tooth);
    const g = new THREE.Mesh(new THREE.CircleGeometry(.07, 10), gulM); const ga = a + Math.PI / N; g.position.set(Math.cos(ga) * (R - .14), Math.sin(ga) * (R - .14), .03); blade.add(g);
    const g2 = g.clone(); g2.position.z = -.03; g2.rotation.y = Math.PI; blade.add(g2);
  }
  blade.add(new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, .12, 16).rotateX(Math.PI / 2), Mat({ color: 0x303438 })));
  const blurM = new THREE.MeshBasicMaterial({ color: 0xd0d8e0, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  const blur = new THREE.Mesh(new THREE.RingGeometry(R - .25, R + .06, 48), blurM); blur.position.copy(AX); body.add(blur);
  // lower (spring) guard: clear, rotates back
  const loGuardM = Mat({ color: 0x60d0ff, transparent: true, opacity: .6, side: THREE.DoubleSide, depthWrite: false, emissive: 0x2080ff, emissiveIntensity: 0 });
  const loGuard = new THREE.Group(); loGuard.position.copy(AX); body.add(loGuard);
  loGuard.add(new THREE.Mesh(new THREE.CylinderGeometry(R + .12, R + .12, .3, 40, 1, true, Math.PI / 2 - 1.5, 3.0).rotateX(Math.PI / 2), loGuardM));
  // up-arrow showing tooth direction at front-bottom
  const arrM = new THREE.MeshBasicMaterial({ color: 0x40ff80, transparent: true, opacity: 0 });
  const arc = new THREE.Mesh(new THREE.TorusGeometry(R + .45, .06, 8, 30, 1.2), arrM); arc.position.copy(AX); arc.rotation.z = -Math.PI / 2 - .2; body.add(arc);
  const head = new THREE.Mesh(new THREE.ConeGeometry(.16, .4, 12), arrM); body.add(head);
  { const a = -Math.PI / 2 + 1.0; head.position.set(AX.x + Math.cos(a) * (R + .45), AX.y + Math.sin(a) * (R + .45), 0); head.rotation.z = a; }
  // sawdust particles
  const dustM = new THREE.MeshBasicMaterial({ color: 0xffe0a0 });
  const dust = []; for (let i = 0; i < 26; i++) { const d = new THREE.Mesh(new THREE.BoxGeometry(.06, .06, .06), dustM); root.add(d); dust.push({ m: d, s: Math.random(), v: V((Math.random() - .5) * .6, Math.random() * .6, (Math.random() - .5) * .8) }); }
  // depth indicator
  const depM = new THREE.MeshBasicMaterial({ color: 0xffe040, transparent: true, opacity: 0 });
  const dep = new THREE.Mesh(new THREE.BoxGeometry(.05, 1, .05), depM); root.add(dep);

  const shots = [
    [[-6.85, 6.65, 12.75], [0.2, 0.2, 0.0]],     // 0 hook
    [[-2.7, 3.2, -8.5], [0, .8, -.5]],   // 1 motor side
    [[2.8, 2.0, 9.0], [.3, .6, 0]],      // 2 teeth close
    [[5.5, 1.2, 8.5], [.4, .4, 0]],     // 3 from front below
    [[3.2, 2.4, 9.5], [.3, .5, 0]],      // 4 guard
    [[6.75, 2.0, 7.2], [0.0, 0.2, 0.0]],       // 5 depth + bevel (front)
    [[-6.85, 6.65, 12.75], [0.2, 0.2, 0.0]],     // 6 recap
  ];
  const cp = { p: V(), q: V() };
  let bA = 0, lastT = 0;
  function update(t, si, lt) {
    const dt = Math.min(.05, Math.max(0, t - lastT)); lastT = t;
    const pulse = .5 + .5 * Math.sin(t * 7);
    // saw travel along +x (cutting through board)
    const sx = si === 0 ? lerp(-2.8, -1.2, ease(lt / 4)) : si <= 3 ? -1.2 + (si - 1) * .5 + lt * .08 : si === 4 ? lerp(.3, 1.6, ease((lt - .3) / 2.5)) : si === 5 ? 1.6 : lerp(1.6, 2.6, ease(lt / 3));
    saw.position.set(sx, 0, 0);
    kerf.scale.x = Math.max(.01, sx + 6.25); kerf.position.set((sx - 3.75) / 2, -.3, 0);
    // blade speed: slow-mo in close-ups so teeth read
    const w = si === 2 || si === 3 ? 1.6 : si === 1 ? 2 + 30 * ease(lt / 2) : 32;
    bA += dt * w; blade.rotation.z = bA; // front (right) teeth move upward
    blurM.opacity = w > 15 ? .45 : 0;
    motorM.emissiveIntensity = si === 1 ? .3 + .3 * pulse : 0;
    carbM.emissiveIntensity = si === 2 ? .4 + .4 * pulse : 0;
    arrM.opacity = si === 3 ? .5 + .4 * pulse : 0;
    // lower guard swings back while cutting at step 4, snaps shut after
    const open = si === 4 ? (lt < 3 ? ease((lt - .3) / .6) : 1 - ease((lt - 3.2) / .25)) : (si === 0 || si === 6 || si <= 3 ? 1 : 0);
    loGuard.rotation.z = open * 1.7; loGuardM.emissiveIntensity = si === 4 ? .4 + .3 * pulse : 0;
    // depth + bevel at step 5
    const bev = si === 5 ? ease((lt - 1.8) / 1.2) * (Math.PI / 4) : 0;
    tilt.rotation.x = bev; tilt.position.z = 0;
    body.position.y = si === 5 ? -.25 * ease(lt / 1) : 0;
    baseM.emissiveIntensity = si === 5 ? .4 + .3 * pulse : 0;
    depM.opacity = si === 5 ? .9 : 0; dep.position.set(sx + .9, -.3, 1.2); dep.scale.y = .6 + .02;
    // dust from where teeth exit the board (front, top)
    dust.forEach(d => {
      d.s = (d.s + dt * 1.2) % 1; const k = d.s;
      d.m.visible = si !== 5 && si !== 1;
      d.m.position.set(sx + 1.0 + d.v.x * k * 3, .05 + d.v.y * k * 3 + 1.2 * k - 1.6 * k * k, d.v.z * k * 3);
    });
    const prev = shots[Math.max(0, si - 1)], now = shots[si];
    const kk = si === 0 ? 1 : ease(lt / 1.4);
    cp.p.set(...prev[0].map((x, i) => lerp(x, now[0][i], kk))); cp.q.set(...prev[1].map((x, i) => lerp(x, now[1][i], kk)));
    cp.p.x += sx; cp.q.x += sx;
    const o = Math.sin(t * .25) * .08, dx = cp.p.x - cp.q.x, dz = cp.p.z - cp.q.z;
    camera.position.set(cp.q.x + dx * Math.cos(o) - dz * Math.sin(o), cp.p.y, cp.q.z + dz * Math.cos(o) + dx * Math.sin(o));
    camera.lookAt(cp.q);
  }
  return { update };
}
function RoundedBox(THREE, w, h, d, r) {
  const s = new THREE.Shape(); const x = w / 2 - r, y = d / 2 - r;
  s.moveTo(-x, -y); s.lineTo(x, -y); s.lineTo(x, y); s.lineTo(-x, y); s.lineTo(-x, -y);
  const g = new THREE.ExtrudeGeometry(s, { depth: h - 2 * r, bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelSegments: 3 });
  g.rotateX(-Math.PI / 2); g.translate(0, -(h - 2 * r) / 2, 0); return g;
}
