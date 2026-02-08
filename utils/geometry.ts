/**
 * Calculates the angle between three points (A, B, C).
 * B is the vertex (e.g., Elbow).
 */
export const calculateAngle = (a: any, b: any, c: any): number => {
  if (!a || !b || !c) return 0;

  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs(radians * 180.0 / Math.PI);

  if (angle > 180.0) {
    angle = 360 - angle;
  }

  return angle;
};

export const normalizeScore = (score: number) => {
    return Math.min(Math.max(score, 0), 1);
}