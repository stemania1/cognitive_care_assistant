# CCA STEP → GLB CAD assets

Converted from vendor STEP files with `scripts/convert-step-to-glb.py` (cascadio).

| File | Source STEP | Used in |
|------|-------------|---------|
| `amg8833.glb` | `AMG8833--3DModel-STEP-56544.STEP` | Thermal hub sensor package |
| `esp-wroom-32.glb` | `ESP-WROOM-32--3DModel-STEP-56544.STEP` | MyoWare / EMG wireless module |
| `raspberry-pi-3-model-b.glb` | `RASPBERRY PI 3 MODEL B---3DModel-STEP-56544.STEP` | Thermal hub SBC |

Re-convert after updating STEP sources:

```bash
python scripts/convert-step-to-glb.py
```
