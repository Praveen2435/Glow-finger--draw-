export type GestureType = 'draw' | 'pause' | 'pointer' | 'none';

export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
}

export interface GestureState {
  gesture: GestureType;
  indexTip: NormalizedLandmark | null;
  isIndexUp: boolean;
  isMiddleUp: boolean;
  isRingUp: boolean;
  isPinkyUp: boolean;
  isThumbUp: boolean;
}

/** Returns true if a finger is raised (tip.y < pip.y in normalized coords) */
function isFingerUp(tip: NormalizedLandmark, pip: NormalizedLandmark): boolean {
  return tip.y < pip.y;
}

/** Thumb special case: tip.x vs ip.x (for right hand mirrored) */
function isThumbUp(thumbTip: NormalizedLandmark, thumbIp: NormalizedLandmark): boolean {
  return Math.abs(thumbTip.y - thumbIp.y) > 0.02;
}

/**
 * Detects the current gesture from a set of 21 MediaPipe hand landmarks.
 * Landmark indices:
 *   0: WRIST
 *   4: THUMB_TIP, 3: THUMB_IP
 *   8: INDEX_TIP, 6: INDEX_PIP
 *   12: MIDDLE_TIP, 10: MIDDLE_PIP
 *   16: RING_TIP, 14: RING_PIP
 *   20: PINKY_TIP, 18: PINKY_PIP
 */
export function detectGesture(landmarks: NormalizedLandmark[]): GestureState {
  if (!landmarks || landmarks.length < 21) {
    return {
      gesture: 'none',
      indexTip: null,
      isIndexUp: false,
      isMiddleUp: false,
      isRingUp: false,
      isPinkyUp: false,
      isThumbUp: false,
    };
  }

  const thumbTip = landmarks[4];
  const thumbIp = landmarks[3];
  const indexTip = landmarks[8];
  const indexPip = landmarks[6];
  const middleTip = landmarks[12];
  const middlePip = landmarks[10];
  const ringTip = landmarks[16];
  const ringPip = landmarks[14];
  const pinkyTip = landmarks[20];
  const pinkyPip = landmarks[18];

  const indexUp = isFingerUp(indexTip, indexPip);
  const middleUp = isFingerUp(middleTip, middlePip);
  const ringUp = isFingerUp(ringTip, ringPip);
  const pinkyUp = isFingerUp(pinkyTip, pinkyPip);
  const thumbUpState = isThumbUp(thumbTip, thumbIp);

  let gesture: GestureType = 'none';

  // Open palm (pause) — all 4 fingers up
  if (indexUp && middleUp && ringUp && pinkyUp) {
    gesture = 'pause';
  }
  // Draw gesture — index up, middle down
  else if (indexUp && !middleUp) {
    gesture = 'draw';
  }
  // Pointer — index up, middle up but ring and pinky down
  else if (indexUp && middleUp && !ringUp && !pinkyUp) {
    gesture = 'pointer';
  }
  else {
    gesture = 'none';
  }

  return {
    gesture,
    indexTip,
    isIndexUp: indexUp,
    isMiddleUp: middleUp,
    isRingUp: ringUp,
    isPinkyUp: pinkyUp,
    isThumbUp: thumbUpState,
  };
}

/** Distance between two normalized landmarks */
export function landmarkDistance(
  a: NormalizedLandmark,
  b: NormalizedLandmark
): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}
