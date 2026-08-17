"""Convert vendor STEP CAD files to GLB for the CCA sensor viewer."""
from pathlib import Path
import cascadio
import trimesh

OUT = Path(__file__).resolve().parents[1] / "public" / "models" / "cad"
OUT.mkdir(parents=True, exist_ok=True)

JOBS = [
    (
        Path(r"c:\Users\bobby\Downloads\AMG8833--3DModel-STEP-56544.STEP"),
        OUT / "amg8833.glb",
    ),
    (
        Path(r"c:\Users\bobby\Downloads\ESP-WROOM-32--3DModel-STEP-56544.STEP"),
        OUT / "esp-wroom-32.glb",
    ),
    (
        Path(r"c:\Users\bobby\Downloads\RASPBERRY PI 3 MODEL B---3DModel-STEP-56544.STEP"),
        OUT / "raspberry-pi-3-model-b.glb",
    ),
]


def main() -> None:
    for src, dst in JOBS:
        print(f"Converting {src.name} -> {dst.name} ...", flush=True)
        cascadio.step_to_glb(str(src), str(dst), 0.08, 0.45)
        scene = trimesh.load(dst, force="scene")
        bounds = scene.bounds
        size = bounds[1] - bounds[0]
        print(
            f"  size={dst.stat().st_size / 1024:.1f} KB  "
            f"extents_mm~[{size[0]:.2f}, {size[1]:.2f}, {size[2]:.2f}]",
            flush=True,
        )
    print("ALL_OK", flush=True)


if __name__ == "__main__":
    main()
