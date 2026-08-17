/** Easy-to-replace model paths. Component CAD from STEP→GLB lives under /models/cad. */
export const MODEL_PATHS = {
  myoware: "/models/myoware-wristband.glb",
  thermalHub: "/models/raspberry-pi-amg8833-enclosure.glb",
  amg8833: "/models/cad/amg8833.glb",
  esp32: "/models/cad/esp-wroom-32.glb",
  raspberryPi: "/models/cad/raspberry-pi-3-model-b.glb",
} as const;

export type SensorModelId = "myoware" | "thermal-hub";

export type SensorPart = {
  id: string;
  name: string;
  purpose: string;
  ccaUsage: string;
  category: "Electronics" | "Mechanics" | "Wearable" | "Connectors" | "Indicators" | "Anatomy";
  layer: number;
  explodeOffset: [number, number, number];
};

export const SENSOR_MODELS: {
  id: SensorModelId;
  label: string;
  shortLabel: string;
  blurb: string;
  glbPath: string;
  layers: string[];
}[] = [
  {
    id: "myoware",
    label: "MyoWare 2.0",
    shortLabel: "MyoWare 2.0",
    blurb:
      "Red triangular Muscle Sensor + rectangular Wireless board (ESP32, LiPo, USB-C) — geometry from product photos",
    glbPath: MODEL_PATHS.myoware,
    layers: [
      "Muscle sensor PCB",
      "Electrode snaps",
      "Wireless PCB",
      "ESP32 module",
      "Battery & USB-C",
      "Switches & Qwiic",
    ],
  },
  {
    id: "thermal-hub",
    label: "Raspberry Pi & AMG8833 Enclosure",
    shortLabel: "Pi + AMG8833",
    blurb: "Compact thermal hub with Raspberry Pi 3 Model B and AMG8833 Grid-EYE (STEP CAD)",
    glbPath: MODEL_PATHS.thermalHub,
    layers: [
      "Outer enclosure",
      "Top cover",
      "Thermal sensor mount",
      "AMG8833 sensor (STEP CAD)",
      "Raspberry Pi 3 (STEP CAD)",
      "Wiring",
      "Mounting hardware & base",
    ],
  },
];

export const MYOWARE_PARTS: SensorPart[] = [
  {
    id: "mw-sensor-pcb",
    name: "MyoWare Muscle Sensor PCB",
    purpose:
      "Cherry-red rounded triangular FR-4 board with silkscreen logo mark and gold edge pads (VIN/GND/ENV/RAW).",
    ccaUsage: "Primary EMG front-end board CCA reads for Exercise and Biomedical muscle signals.",
    category: "Electronics",
    layer: 0,
    explodeOffset: [0, 0.55, -0.35],
  },
  {
    id: "mw-snap-ref",
    name: "Electrode snap (REF)",
    purpose: "Stainless clothing-style snap at the triangle tip for the reference electrode.",
    ccaUsage: "Stabilizes baseline so Biomedical and Exercise EMG panels stay readable.",
    category: "Connectors",
    layer: 1,
    explodeOffset: [0, 0.45, -0.35],
  },
  {
    id: "mw-snap-end",
    name: "Electrode snap (END / input−)",
    purpose: "Stainless snap for the complementary differential input electrode.",
    ccaUsage: "Completes the bipolar EMG pair used in CCA activation scoring.",
    category: "Connectors",
    layer: 1,
    explodeOffset: [-0.4, 0.45, 0.35],
  },
  {
    id: "mw-snap-mid",
    name: "Electrode snap (MID / input+)",
    purpose: "Stainless snap for the primary differential EMG electrode.",
    ccaUsage: "Attaches disposable gel pads for CCA Exercise muscle pickup.",
    category: "Connectors",
    layer: 1,
    explodeOffset: [0.4, 0.45, 0.35],
  },
  {
    id: "mw-link-pcb",
    name: "MyoWare Wireless / Link PCB",
    purpose:
      "Rectangular red FR-4 carrier with mate snaps, GPIO header rows, and power-management layout.",
    ccaUsage: "Hosts ESP32 and battery so CCA can stream EMG wirelessly from Exercise sessions.",
    category: "Electronics",
    layer: 2,
    explodeOffset: [0, 0.2, 0.45],
  },
  {
    id: "mw-esp32",
    name: "ESP32 module (shield can)",
    purpose: "Wi-Fi/Bluetooth module under a silver RF shield on the wireless board.",
    ccaUsage: "Digitizes and transmits EMG packets that CCA bridges ingest.",
    category: "Electronics",
    layer: 3,
    explodeOffset: [0.55, 0.75, 0.35],
  },
  {
    id: "mw-battery",
    name: "LiPo battery pack",
    purpose: "Foil pouch cell with Kapton end tape and JST leads.",
    ccaUsage: "Untethered power for wearable EMG capture during CCA Exercise.",
    category: "Electronics",
    layer: 4,
    explodeOffset: [0.45, 0.55, -0.35],
  },
  {
    id: "mw-usbc",
    name: "USB-C port",
    purpose: "USB-C receptacle on the wireless board edge for charge / serial.",
    ccaUsage: "Programming and charging path before CCA field use.",
    category: "Connectors",
    layer: 4,
    explodeOffset: [-0.95, 0.35, 0.35],
  },
  {
    id: "mw-switches",
    name: "Power switches & buttons",
    purpose: "Slide switches (power / source) and BOOT/RST tactiles.",
    ccaUsage: "Operator controls when pairing the MyoWare stack with CCA.",
    category: "Mechanics",
    layer: 5,
    explodeOffset: [-0.45, 0.65, 0.55],
  },
  {
    id: "mw-qwiic",
    name: "Qwiic connectors",
    purpose: "White SparkFun Qwiic / STEMMA QT I2C ports on the board edges.",
    ccaUsage: "Optional accessory bus alongside the primary EMG path.",
    category: "Connectors",
    layer: 5,
    explodeOffset: [-0.75, 0.45, 0.75],
  },
];

export const THERMAL_PARTS: SensorPart[] = [
  {
    id: "th-enclosure",
    name: "Outer enclosure shell",
    purpose: "3D-printable compact housing with rounded corners and port cutouts.",
    ccaUsage: "Protects the overnight thermal hub used by Sleep Behaviors and Biomedical.",
    category: "Mechanics",
    layer: 0,
    explodeOffset: [0, -0.15, 0],
  },
  {
    id: "th-lid",
    name: "Removable top cover",
    purpose: "Lid with thermal window aperture and status LED recess.",
    ccaUsage: "Service access while keeping AMG8833 aimed at the sleep zone.",
    category: "Mechanics",
    layer: 1,
    explodeOffset: [0, 0.95, 0],
  },
  {
    id: "th-vents",
    name: "Ventilation openings",
    purpose: "Passive airflow slots along the enclosure wall.",
    ccaUsage: "Thermal relief for continuous overnight Pi operation.",
    category: "Mechanics",
    layer: 0,
    explodeOffset: [0.95, 0.1, 0],
  },
  {
    id: "th-mount",
    name: "Thermal sensor mount",
    purpose: "Bracket aligning the AMG8833 to the lid camera opening.",
    ccaUsage: "Keeps the 8×8 grid registered for Sleep Behaviors heatmaps.",
    category: "Mechanics",
    layer: 2,
    explodeOffset: [0.3, 0.55, 0.65],
  },
  {
    id: "th-amg",
    name: "AMG8833 Grid-EYE module",
    purpose: "Panasonic AMG8833 8×8 IR array (STEP CAD package) on the thermal breakout.",
    ccaUsage: "Thermal source for Sleep Behaviors and Biomedical heatmaps (I2C 0x69).",
    category: "Electronics",
    layer: 3,
    explodeOffset: [0.3, 0.8, 0.8],
  },
  {
    id: "th-pi",
    name: "Raspberry Pi 3 Model B",
    purpose:
      "Edge SBC (STEP CAD) including GPIO header, Ethernet, USB, HDMI, and power connectors.",
    ccaUsage: "Runs the thermal server and streams frames to CCA (ports 8091/8092).",
    category: "Electronics",
    layer: 4,
    explodeOffset: [0, 0.15, -0.2],
  },
  {
    id: "th-wiring",
    name: "I2C jumper wiring",
    purpose: "Color-coded leads from Pi GPIO (SDA/SCL/3V3/GND) to AMG8833 pads.",
    ccaUsage: "Critical path for live thermal ingest into Cognitive Care Assistant.",
    category: "Connectors",
    layer: 5,
    explodeOffset: [0.55, 0.4, 0.35],
  },
  {
    id: "th-standoffs",
    name: "Mounting posts & screws",
    purpose: "Standoffs and fasteners securing the Pi and brackets.",
    ccaUsage: "Clearance for airflow and cable routing inside the hub.",
    category: "Mechanics",
    layer: 6,
    explodeOffset: [0.35, -0.35, -0.4],
  },
  {
    id: "th-base",
    name: "Base plate",
    purpose: "Bottom plate of the enclosure assembly.",
    ccaUsage: "Structural floor for the CCA thermal hub prototype.",
    category: "Mechanics",
    layer: 6,
    explodeOffset: [0, -0.75, 0],
  },
];

export function partsForModel(id: SensorModelId): SensorPart[] {
  return id === "myoware" ? MYOWARE_PARTS : THERMAL_PARTS;
}

export function getPart(modelId: SensorModelId, partId: string): SensorPart | undefined {
  return partsForModel(modelId).find((p) => p.id === partId);
}

export function maxLayerFor(id: SensorModelId): number {
  const m = SENSOR_MODELS.find((x) => x.id === id);
  return (m?.layers.length ?? 1) - 1;
}
