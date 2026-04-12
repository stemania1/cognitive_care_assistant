# Anatomical brain asset

## Bundled mesh

`cerebrum.glb` — human brain model sourced via [MediaWiki3D](https://mediawiki3d.org/index.php/File:Model_of_a_human_brain.glb) (Science Museum Group / Sketchfab derivative). **Verify licensing** for your deployment (research / demo / commercial) before public release.

The viewer merges all meshes, centers and unit-scales the result, and applies **embedded** per-vertex clinical shading with anatomically anchored **region falloffs** (not separate floating markers).

## Replacing the asset

Swap `public/models/cerebrum.glb` with any high-quality cerebrum GLB/GLTF (Y-up typical). After swapping, you may need to tune `BRAIN_SCENE_ROTATION` in `src/app/components/biomedical/brain/regionConfig.ts` so the default camera shows a clear frontal view.
