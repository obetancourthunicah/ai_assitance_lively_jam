/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BiometricFaceDescriptor } from '../types';

export interface Point3D {
  x: number;
  y: number;
  z?: number;
}

// MediaPipe FaceMesh Key Landmark Indices
export const MESH_INDICES = {
  // Left eye points
  LEFT_EYE_CORNER_OUTER: 33,
  LEFT_EYE_CORNER_INNER: 133,
  LEFT_EYE_TOP_1: 160,
  LEFT_EYE_TOP_2: 158,
  LEFT_EYE_BOTTOM_1: 144,
  LEFT_EYE_BOTTOM_2: 153,

  // Right eye points
  RIGHT_EYE_CORNER_INNER: 362,
  RIGHT_EYE_CORNER_OUTER: 263,
  RIGHT_EYE_TOP_1: 385,
  RIGHT_EYE_TOP_2: 387,
  RIGHT_EYE_BOTTOM_1: 373,
  RIGHT_EYE_BOTTOM_2: 380,

  // Structural facial points
  NOSE_TIP: 1,
  NOSE_BRIDGE: 168,
  CHIN: 152,
  FOREHEAD: 10,
  LEFT_CHEEK: 234,
  RIGHT_CHEEK: 454,
  MOUTH_LEFT: 61,
  MOUTH_RIGHT: 291,
  MOUTH_TOP: 13,
  MOUTH_BOTTOM: 14,
};

// Euclidean distance helper
export function euclideanDistance(p1: Point3D, p2: Point3D): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = (p1.z || 0) - (p2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// Eye Aspect Ratio (EAR)
export function calculateEyeAspectRatio(
  cornerOuter: Point3D,
  cornerInner: Point3D,
  top1: Point3D,
  top2: Point3D,
  bottom1: Point3D,
  bottom2: Point3D
): number {
  const horizontalDist = euclideanDistance(cornerOuter, cornerInner);
  if (horizontalDist < 0.0001) return 0.3; // Prevent division by zero
  const verticalDist1 = euclideanDistance(top1, bottom1);
  const verticalDist2 = euclideanDistance(top2, bottom2);
  return (verticalDist1 + verticalDist2) / (2.0 * horizontalDist);
}

// Calculate Head Yaw (horizontal rotation)
// Returns approximate angle in degrees: ~0 is centered, positive is turned right, negative is turned left
export function calculateHeadYaw(
  noseTip: Point3D,
  leftCheek: Point3D,
  rightCheek: Point3D
): number {
  const distLeft = euclideanDistance(noseTip, leftCheek);
  const distRight = euclideanDistance(noseTip, rightCheek);
  const total = distLeft + distRight;
  if (total < 0.0001) return 0;
  
  // Ratio centered is 0.5. Values > 0.5 mean nose is closer to right cheek (turned right in mirror view)
  const ratio = (distLeft - distRight) / total;
  // Convert ratio to degrees (-45 to +45 deg approx)
  return ratio * 90;
}

// Extract normalized 30-dimensional facial biometric distance vector
export function extractBiometricVector(landmarks: Point3D[]): number[] {
  if (landmarks.length < 468) {
    // Return standard synthetic signature if landmarks are partial
    return Array.from({ length: 30 }, (_, i) => Math.sin(i * 0.4) * 0.5 + 0.5);
  }

  const pNose = landmarks[MESH_INDICES.NOSE_TIP];
  const pLeftEye = landmarks[MESH_INDICES.LEFT_EYE_CORNER_INNER];
  const pRightEye = landmarks[MESH_INDICES.RIGHT_EYE_CORNER_INNER];
  const pChin = landmarks[MESH_INDICES.CHIN];
  const pForehead = landmarks[MESH_INDICES.FOREHEAD];
  const pLeftCheek = landmarks[MESH_INDICES.LEFT_CHEEK];
  const pRightCheek = landmarks[MESH_INDICES.RIGHT_CHEEK];
  const pMouthTop = landmarks[MESH_INDICES.MOUTH_TOP];
  const pMouthBottom = landmarks[MESH_INDICES.MOUTH_BOTTOM];
  const pMouthLeft = landmarks[MESH_INDICES.MOUTH_LEFT];
  const pMouthRight = landmarks[MESH_INDICES.MOUTH_RIGHT];

  // Normalization baseline: inter-ocular distance
  const baseScale = euclideanDistance(pLeftEye, pRightEye) || 0.1;

  const keyPoints = [
    pNose, pLeftEye, pRightEye, pChin, pForehead,
    pLeftCheek, pRightCheek, pMouthTop, pMouthBottom, pMouthLeft, pMouthRight
  ];

  const distances: number[] = [];
  // Calculate relative distances across key anatomical anchors
  for (let i = 0; i < keyPoints.length; i++) {
    for (let j = i + 1; j < keyPoints.length; j++) {
      if (distances.length >= 30) break;
      const d = euclideanDistance(keyPoints[i], keyPoints[j]) / baseScale;
      distances.push(Math.round(d * 1000) / 1000);
    }
  }

  // Ensure vector length is exactly 30
  while (distances.length < 30) distances.push(0.5);
  return distances.slice(0, 30);
}

// Cosine similarity and Euclidean distance matching between two vectors
export function matchBiometricDescriptors(
  sampleVector: number[],
  enrolledDescriptor: BiometricFaceDescriptor
): { match: boolean; confidence: number; distance: number } {
  const target = enrolledDescriptor.vector;
  if (!target || target.length === 0 || sampleVector.length === 0) {
    return { match: false, confidence: 0, distance: 1 };
  }

  // Calculate Euclidean distance
  let sumSq = 0;
  const len = Math.min(sampleVector.length, target.length);
  for (let i = 0; i < len; i++) {
    const diff = sampleVector[i] - target[i];
    sumSq += diff * diff;
  }
  const distance = Math.sqrt(sumSq / len);

  // Confidence mapping: lower distance = higher confidence
  // Distance under 0.25 is a strong biometric match
  const confidence = Math.max(0, Math.min(1, 1 - (distance / 0.35)));
  const match = confidence >= 0.70;

  return {
    match,
    confidence: Math.round(confidence * 100) / 100,
    distance: Math.round(distance * 1000) / 1000
  };
}

// Global MediaPipe FaceMesh loader declaration
declare global {
  interface Window {
    FaceMesh?: new (config: { locateFile: (file: string) => string }) => {
      setOptions: (options: Record<string, unknown>) => void;
      onResults: (callback: (results: MediaPipeFaceMeshResults) => void) => void;
      send: (data: { image: HTMLVideoElement | HTMLCanvasElement }) => Promise<void>;
      close: () => Promise<void>;
    };
    Camera?: new (
      videoElement: HTMLVideoElement,
      options: { onFrame: () => Promise<void>; width?: number; height?: number }
    ) => {
      start: () => Promise<void>;
      stop: () => Promise<void>;
    };
  }
}

export interface MediaPipeFaceMeshResults {
  multiFaceLandmarks?: Point3D[][];
  image?: HTMLVideoElement | HTMLCanvasElement;
}
