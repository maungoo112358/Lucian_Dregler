import type { Color, Material, Texture } from 'three';

export interface ThemeParams {
  /** One color per face: +X, -X, +Y, -Y, +Z, -Z. */
  faceColors: Color[];
  /** Optional picture per face (null = use the solid color). */
  faceImages?: (Texture | null)[];
}

/** Contract for every visual style. Swap with cube.setTheme(theme). */
export interface CubeTheme {
  name: string;
  createMaterial(params: ThemeParams): Material;
  /** Called every frame, for animated looks. */
  update?(timeSeconds: number): void;
}
