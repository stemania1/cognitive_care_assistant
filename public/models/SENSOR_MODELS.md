# CCA sensor CAD models

## Component STEP → GLB (in use)

See [`cad/README.md`](./cad/README.md). Sources:

- `AMG8833--3DModel-STEP-56544.STEP`
- `ESP-WROOM-32--3DModel-STEP-56544.STEP`
- `RASPBERRY PI 3 MODEL B---3DModel-STEP-56544.STEP`

Convert with:

```bash
python scripts/convert-step-to-glb.py
```

## Optional full-assembly GLBs (future)

| File | Model |
|------|--------|
| `myoware-wristband.glb` | Complete MyoWare wristband assembly |
| `raspberry-pi-amg8833-enclosure.glb` | Complete thermal hub assembly |

Until full-assembly GLBs exist, the viewer uses STEP component CAD plus procedural fixtures (enclosure / strap).
