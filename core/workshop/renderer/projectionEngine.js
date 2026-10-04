/**
 * AURA Holographic Workshop — Mathematical Projection Engine
 * Subsystem: 3D / 4D Spatial Projection, Raycasting & Coordinate Math
 * 
 * Local-first zero-CDN 3D mathematical pipeline.
 */

export class ProjectionEngine {
  /**
   * Rotates a 3D vector by Euler angles (yaw, pitch, roll).
   * @param {{x: number, y: number, z: number}} v 
   * @param {number} rotX - Pitch in radians
   * @param {number} rotY - Yaw in radians
   * @param {number} rotZ - Roll in radians
   * @returns {{x: number, y: number, z: number}}
   */
  static rotateVector(v, rotX, rotY, rotZ) {
    // 1. Yaw (Y-axis)
    const cosY = Math.cos(rotY);
    const sinY = Math.sin(rotY);
    const x1 = v.x * cosY + v.z * sinY;
    const y1 = v.y;
    const z1 = -v.x * sinY + v.z * cosY;

    // 2. Pitch (X-axis)
    const cosX = Math.cos(rotX);
    const sinX = Math.sin(rotX);
    const x2 = x1;
    const y2 = y1 * cosX - z1 * sinX;
    const z2 = y1 * sinX + z1 * cosX;

    // 3. Roll (Z-axis)
    const cosZ = Math.cos(rotZ);
    const sinZ = Math.sin(rotZ);
    const x3 = x2 * cosZ - y2 * sinZ;
    const y3 = x2 * sinZ + y2 * cosZ;
    const z3 = z2;

    return { x: x3, y: y3, z: z3 };
  }

  /**
   * Projects a 3D world vector onto 2D canvas coordinates.
   * @param {{x: number, y: number, z: number}} v 
   * @param {number} width - Viewport width
   * @param {number} height - Viewport height
   * @param {Object} camera - Camera configuration {rotX, rotY, rotZ, panX, panY, zoom, focalLength, camDist}
   * @returns {{ x: number, y: number, z: number, scale: number, alpha: number, visible: boolean }}
   */
  static projectPoint(v, width, height, camera = {}) {
    const rotX = camera.rotX || 0;
    const rotY = camera.rotY || 0;
    const rotZ = camera.rotZ || 0;
    const panX = camera.panX || 0;
    const panY = camera.panY || 0;
    const zoom = Math.max(0.2, camera.zoom || 1.0);
    const focalLength = camera.focalLength || 520;
    const camDist = (camera.camDist || 540) / zoom;
    const modelScale = camera.modelScale || 1.0;

    const rotated = this.rotateVector(v, rotX, rotY, rotZ);
    const zEff = rotated.z + camDist;

    if (zEff <= 10) {
      return { x: 0, y: 0, z: rotated.z, scale: 0, alpha: 0, visible: false };
    }

    const scale = (focalLength / zEff) * modelScale;
    const screenX = width / 2 + panX + rotated.x * scale;
    const screenY = height / 2 + panY - rotated.y * scale;

    // Depth attenuation for atmospheric holographic glow
    const alpha = Math.min(0.98, Math.max(0.15, (rotated.z + 280) / 500));

    return {
      x: screenX,
      y: screenY,
      z: rotated.z,
      scale,
      alpha,
      visible: true
    };
  }

  /**
   * Computes Euclidean 3D distance and dimensional deltas between two points.
   * @param {{x: number, y: number, z: number}} p1 
   * @param {{x: number, y: number, z: number}} p2 
   * @returns {{ distance: number, dx: number, dy: number, dz: number }}
   */
  static computeDistance(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dz = p2.z - p1.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    return {
      distance: parseFloat(distance.toFixed(2)),
      dx: parseFloat(dx.toFixed(2)),
      dy: parseFloat(dy.toFixed(2)),
      dz: parseFloat(dz.toFixed(2))
    };
  }

  /**
   * Raycasts screen cursor position to test for object hits.
   * @param {number} mouseX 
   * @param {number} mouseY 
   * @param {Array<Object>} objects 
   * @param {number} width 
   * @param {number} height 
   * @param {Object} camera 
   * @returns {Object|null} The nearest hit object or null
   */
  static raycastObjects(mouseX, mouseY, objects, width, height, camera) {
    let nearestObj = null;
    let maxZ = -Infinity;

    for (const obj of objects) {
      if (!obj.visible) continue;
      const proj = this.projectPoint(obj.position, width, height, camera);
      if (!proj.visible) continue;

      const hitRadius = Math.max(22, 35 * proj.scale * (obj.scale?.x || 1.0));
      const distSq = (mouseX - proj.x) ** 2 + (mouseY - proj.y) ** 2;

      if (distSq <= hitRadius * hitRadius) {
        if (proj.z > maxZ) {
          maxZ = proj.z;
          nearestObj = obj;
        }
      }
    }

    return nearestObj;
  }

  /**
   * Computes camera target pan to frame/focus on an object.
   * @param {{x: number, y: number, z: number}} objPos 
   * @param {Object} camera 
   * @returns {{ panX: number, panY: number, zoom: number }}
   */
  static computeFocusCamera(objPos, camera) {
    // Center the camera on this object
    return {
      panX: -objPos.x * 0.5,
      panY: objPos.y * 0.5,
      zoom: 1.25
    };
  }
}
