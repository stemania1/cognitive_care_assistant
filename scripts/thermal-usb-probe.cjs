/**
 * USB thermal auto-detect: port ordering, multi-baud probe list.
 */

/**
 * Prefer likely USB CDC/adapter ports over generic Windows Bluetooth virtual COMs.
 * @param {object[]} ports
 */
function sortPortsUsbLikelyFirst(ports) {
  const score = (p) => {
    const m = String(p.manufacturer || "").toLowerCase();
    const vid = p.vendorId || "";
    if (vid) return 100;
    if (/silicon|ftdi|ft232|ch340|cp210|arduino|pjrc|teensy|esp|usb|wch/i.test(m)) return 80;
    if (/microsoft/i.test(m)) return 10;
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
