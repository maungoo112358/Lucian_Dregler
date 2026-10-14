/** What a pointer is trying to do. */
export type Channel = 'turn' | 'orbit';

/** One input event, identical whether it comes from the mouse or from hand tracking. */
export interface PointerSignal {
  channel: Channel;
  phase: 'down' | 'move' | 'up';
  /** Normalized screen coordinates, -1..1 (x right, y up) - same space Three.js raycasting uses. */
  x: number;
  y: number;
}

/** Contract for every input method. The cube never knows which one is active. */
export interface InputSource {
  start(): Promise<void>;
  stop(): void;
  onSignal(callback: (signal: PointerSignal) => void): void;
}
