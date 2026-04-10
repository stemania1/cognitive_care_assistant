/**
 * USB thermal auto-detect: port ordering, multi-baud probe list.
 */

/**
 * Prefer likely USB CDC/adapter ports over generic Windows Bluetooth virtual COMs.
 * @param {object[]} ports
 */
function sortPortsUsbLikelyFirst(ports) {
  const isEsp32Adapter = (p) => {
    const desc = [p.manufacturer || "", p.friendlyName || "", p.pnpId || ""].join(" ").toLowerCase();
    return /ch340|ch341|cp210|ftdi|silicon.lab|esp32|wch/i.test(desc);
  };
  const isBluetooth = (p) => {
    const desc = [p.manufacturer || "", p.pnpId || "", p.friendlyName || ""].join(" ").toLowerCase();
    return desc.includes("bluetooth") || desc.includes("bthenum");
  };
  const isPiGadget = (p) => p.vendorId === "0525" && p.productId === "A4A7";

  const score = (p) => {
    if (isBluetooth(p)) return 0;
    if (isEsp32Adapter(p)) return 5;
    if (isPiGadget(p)) return 100;
    const vid = p.vendorId || "";
    if (vid) return 80;
    return 50;
  };
  return [...ports].sort((a, b) => score(b) - score(a));
}

/**
 * @param {string | undefined} [raw]
 * @returns {number[]}
 */
function parseProbeBauds(raw) {
  const s = raw !== undefined ? raw : process.env.THERMAL_PROBE_BAUDS || "115200,9600,57600";
  const list = s
    .split(/[,;\s]+/)
    .map((x) => parseInt(x.trim(), 10))
    .filter((n) => n >= 300 && n <= 4_000_000);
  return list.length ? list : [115200, 9600, 57600];
}

module.exports = { sortPortsUsbLikelyFirst, parseProbeBauds };
