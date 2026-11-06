// Fig. 1: a 2D point-distribution shape model, x = mean + sum(z_i * mode_i).
//
// PLACEHOLDER: MEAN and MODES below are drawn by hand so the page has something
// alive on it. They are not anatomy data and not model output. To use a real
// model, replace both with corresponded points from a real shape model, in the
// same format: MEAN is a list of closed contours, each [[x, y], ...], in the
// viewBox set in index.html. MODES is a list of modes, each shaped like MEAN and
// holding [dx, dy] per point at z = 1.
(function () {
  "use strict";

  const FEMUR = [
    // Break line, left to right (how a drafter draws "this keeps going").
    [180, 30], [186, 22], [212, 30], [240, 22], [268, 14], [294, 22], [300, 30],
    // Down the right side, around the condyle.
    [301, 80], [305, 130], [319, 175], [345, 212], [366, 240], [375, 268],
    [367, 296], [345, 314], [314, 318], [287, 304],
    // Intercondylar notch.
    [268, 281], [240, 268], [212, 281],
    // Around the other condyle and back up.
    [193, 304], [167, 314], [136, 310], [113, 292], [105, 264], [115, 238],
    [140, 208], [163, 172], [176, 128], [179, 80],
  ];

  const TIBIA = [
    // Plateau, left to right, with the tibial spines in the middle.
    [110, 348], [146, 341], [184, 343], [214, 338], [229, 322], [240, 333],
    [252, 320], [267, 338], [304, 345], [340, 342], [372, 348],
    // Down the right side.
    [381, 372], [368, 400], [340, 426], [312, 458], [298, 502], [294, 556],
    // Break line, right to left.
    [291, 592], [286, 600], [262, 608], [240, 600], [214, 592], [192, 600], [187, 592],
    // Up the left side.
    [185, 556], [181, 502], [167, 458], [140, 426], [113, 400], [100, 372],
  ];

  const FIBULA = [
    [92, 436], [106, 424], [124, 428], [134, 444], [130, 462], [134, 500],
    [140, 556], [146, 592], [130, 600], [124, 556], [114, 500], [102, 466],
  ];

  const MEAN = [FEMUR, TIBIA, FIBULA];

  const JOINT_X = 240;
  const JOINT_Y = 330;
  const smooth = (a, b, v) => {
    const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  const mode = (fn) => MEAN.map((contour, bone) => contour.map(([x, y]) => fn(x, y, bone)));

  const MODES = [
    // Condyles and plateau get wider or narrower together.
    mode((x, y) => [(x - JOINT_X) * 0.14 * smooth(130, 250, y) * (1 - smooth(400, 520, y)), 0]),
    // Alignment: the lower leg tilts against the femur, closing one side of the joint.
    mode((x, y, bone) => {
      const angle = bone === 0 ? -0.035 : 0.06;
      return [-angle * (y - JOINT_Y), angle * (x - JOINT_X)];
    }),
    // The notch deepens and the tibial spines sharpen.
    mode((x, y, bone) => {
      const central = 1 - smooth(8, 50, Math.abs(x - JOINT_X));
      if (bone === 0 && y > 200) return [0, -18 * central];
      if (bone === 1 && y < 360) return [0, -7 * central];
      return [0, 0];
    }),
    // Bony lipping grows at the rims of the joint.
    mode((x, y) => {
      const nearJoint = 1 - smooth(20, 90, Math.abs(y - JOINT_Y));
      const atRim = smooth(90, 125, Math.abs(x - JOINT_X));
      return [Math.sign(x - JOINT_X) * 12 * nearJoint * atRim, 0];
    }),
  ];

  // Slow, incommensurate drift, so the knee wanders without obviously looping.
  const WANDER = [
    { speed: 0.31, phase: 0.0 },
    { speed: 0.23, phase: 1.3 },
    { speed: 0.17, phase: 2.6 },
    { speed: 0.13, phase: 4.1 },
  ];

  // Distances of the contour rings from the bones, in viewBox units.
  const RING_DISTANCES = [16, 30, 46, 63, 82];
  const RING_LINE = 1.6;

  const SVG_NS = "http://www.w3.org/2000/svg";

  const bones = document.getElementById("bones");
  const rings = document.getElementById("rings");
  const pauseButton = document.getElementById("pause");

  // Painted farthest first. Each ring is a faded stroke with a background-coloured
  // stroke on top, which leaves a thin line at exactly that distance from the bones.
  // Both colours come from the theme in style.css.
  [...RING_DISTANCES].reverse().forEach((distance, i, all) => {
    const fade = 0.7 * ((i + 1) / all.length) + 0.1;
    [[distance * 2 + RING_LINE, "var(--ring)", fade], [distance * 2 - RING_LINE, "var(--paper)", 1]]
      .forEach(([width, stroke, opacity]) => {
        const use = document.createElementNS(SVG_NS, "use");
        use.setAttribute("href", "#bones");
        use.setAttribute("stroke-width", width);
        use.style.stroke = stroke;
        use.style.strokeOpacity = opacity;
        rings.appendChild(use);
      });
  });

  // Closed Catmull-Rom spline through the points, written as cubic Beziers.
  function toPath(points) {
    const n = points.length;
    let d = `M${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`;
    for (let i = 0; i < n; i++) {
      const [p0, p1, p2, p3] = [-1, 0, 1, 2].map((k) => points[(i + k + n) % n]);
      const c1x = p1[0] + (p2[0] - p0[0]) / 6;
      const c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6;
      const c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += `C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return d + "Z";
  }

  function draw(seconds) {
    const z = WANDER.map(({ speed, phase }) => Math.sin(seconds * speed + phase));
    const d = MEAN.map((contour, c) =>
      toPath(contour.map(([x, y], i) => [
        MODES.reduce((sum, m, k) => sum + z[k] * m[c][i][0], x),
        MODES.reduce((sum, m, k) => sum + z[k] * m[c][i][1], y),
      ]))
    ).join("");
    bones.setAttribute("d", d);
  }

  // Open index.html?t=20 to freeze the animation at t = 20 seconds, which keeps
  // screenshots repeatable.
  const frozenAt = parseFloat(new URLSearchParams(location.search).get("t"));
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)");

  let elapsed = Number.isNaN(frozenAt) ? 0 : frozenAt;
  draw(elapsed);
  if (!Number.isNaN(frozenAt) || calm.matches) return;

  let playing = true;
  let last = null;
  function tick(now) {
    if (last !== null) elapsed += Math.min(0.1, (now - last) / 1000);
    last = now;
    draw(elapsed);
    if (playing) requestAnimationFrame(tick);
  }

  pauseButton.hidden = false;
  pauseButton.addEventListener("click", () => {
    playing = !playing;
    pauseButton.textContent = playing ? "pause" : "play";
    if (playing) {
      last = null;
      requestAnimationFrame(tick);
    }
  });
  requestAnimationFrame(tick);
})();
