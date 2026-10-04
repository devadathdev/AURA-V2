export const MathUtils = {
  clamp: (val, min, max) => Math.min(max, Math.max(min, val)),
  degToRad: (deg) => (deg * Math.PI) / 180,
  radToDeg: (rad) => (rad * 180) / Math.PI,
  distance3D: (p1, p2) => Math.hypot(p2.x - p1.x, p2.y - p1.y, p2.z - p1.z)
};
