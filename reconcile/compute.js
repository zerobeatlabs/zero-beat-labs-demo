// Pure reconciliation core for the ZeroBeatLabs IT-ops report demo.
// Every published number is RECOUNTED from rows here — nothing is typed by hand.
// Shared by the browser (index.html) and the Node self-check (compute.test.mjs).
//
// ponytail: hand-rolled CSV split — no quoted/escaped fields in this controlled
// synthetic data. If real client exports with embedded commas/quotes ever flow
// through this, swap in a real CSV parser (papaparse) at the parse boundary only.

// --- Synthetic demo data (fictional "Northstar Field Services", labeled in UI) ---
// Crafted to reproduce the kit's published verification targets (06-Sample-Report.md).
export const TICKETS_CSV = `id,priority,category,status,sla_met,reopened,first_response_min,resolution_min
TKT-1001,P1,Network,Closed,yes,no,8,52
TKT-1002,P2,Network,Closed,yes,no,14,120
TKT-1003,P2,Access,Closed,yes,no,16,95
TKT-1004,P2,Endpoint,Closed,yes,no,20,110
TKT-1005,P2,Collaboration,Closed,yes,no,22,100
TKT-1006,P3,Endpoint,Closed,yes,no,5,30
TKT-1007,P3,Endpoint,Closed,yes,no,10,40
TKT-1008,P3,Endpoint,Closed,yes,no,12,45
TKT-1009,P3,Endpoint,Closed,yes,no,15,60
TKT-1010,P3,Access,Closed,yes,no,18,65
TKT-1011,P3,Access,Closed,yes,no,23,70
TKT-1012,P3,Collaboration,Closed,yes,no,24,75
TKT-1013,P3,File Services,Closed,yes,yes,30,87
TKT-1014,P3,File Services,Closed,yes,no,32,88
TKT-1015,P3,Ticketing,Closed,no,no,35,310
TKT-1016,P4,Endpoint,Closed,yes,no,40,90
TKT-1017,P4,Access,Closed,yes,no,25,80
TKT-1018,P4,Collaboration,Closed,yes,no,42,150
TKT-1019,P4,Printing,Closed,yes,no,45,180
TKT-1020,P4,Security,Closed,yes,no,48,210
TKT-1021,P4,Network,Closed,yes,no,28,85
TKT-1022,P3,Network,Open,no,no,60,
TKT-1023,P4,Access,Closed,yes,no,55,420
TKT-1024,P3,Security,Open,yes,no,90,`;

export const UPTIME_CSV = `service,window_min,downtime_min,incident_count
Identity Platform,10080,0,0
Primary Internet,10080,45,1
Email and Collaboration,10080,0,0
File Services,10080,18,1
Remote Access,10080,72,1
Ticketing Platform,10080,5,1
Monitoring Platform,10080,0,0`;

// Kit-published verification targets (06-Sample-Report.md). The honesty layer:
// the demo proves the live recount equals these, and flags any drift in red.
export const TARGETS = {
  ticketsOpened: 24,
  ticketsClosed: 22,
  ticketsOpen: 2,
  slaMet: 22,
  reopened: 1,
  priorityP1: 1,
  priorityP2: 4,
  priorityP3: 12,
  priorityP4: 7,
  medianFirstResponse: 24.5,
  medianResolution: 87.5,
  uptimeRows: 7,
  totalDowntime: 140,
  serviceIncidents: 4,
  weightedAvailabilityPct: 99.8,
};

export function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim() !== '');
  const header = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(',');
    const row = {};
    header.forEach((h, i) => {
      row[h] = (cells[i] ?? '').trim();
    });
    return row;
  });
}

function median(nums) {
  const xs = nums.filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (xs.length === 0) return null;
  const mid = Math.floor(xs.length / 2);
  return xs.length % 2 ? xs[mid] : (xs[mid - 1] + xs[mid]) / 2;
}

function num(v) {
  if (v === undefined || v === null || v === '') return NaN;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

export function computeReport(ticketsCsv, uptimeCsv) {
  const tickets = parseCSV(ticketsCsv);
  const uptime = parseCSV(uptimeCsv);

  const isClosed = (t) => t.status?.toLowerCase() === 'closed';
  const isOpen = (t) => t.status?.toLowerCase() === 'open';

  const closed = tickets.filter(isClosed);
  const open = tickets.filter(isOpen);

  // Ticket KPIs — every rate carries its numerator and denominator.
  const ticketsOpened = tickets.length;
  const ticketsClosed = closed.length;
  const ticketsOpen = open.length;
  const slaMet = tickets.filter((t) => t.sla_met?.toLowerCase() === 'yes').length;
  const reopened = tickets.filter((t) => t.reopened?.toLowerCase() === 'yes').length;

  const byPriority = {};
  const byCategory = {};
  for (const t of tickets) {
    byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
    byCategory[t.category] = (byCategory[t.category] || 0) + 1;
  }

  const medianFirstResponse = median(tickets.map((t) => num(t.first_response_min)));
  const medianResolution = median(closed.map((t) => num(t.resolution_min)));

  // Availability — computed from windows and downtime, never eyeballed.
  const services = uptime.map((u) => {
    const windowMin = num(u.window_min);
    const downtimeMin = num(u.downtime_min) || 0;
    const available = windowMin - downtimeMin;
    return {
      service: u.service,
      windowMin,
      downtimeMin,
      incidents: num(u.incident_count) || 0,
      availabilityPct: windowMin > 0 ? (available / windowMin) * 100 : null,
    };
  });
  const sumWindow = services.reduce((s, x) => s + x.windowMin, 0);
  const sumDowntime = services.reduce((s, x) => s + x.downtimeMin, 0);
  const serviceIncidents = services.reduce((s, x) => s + x.incidents, 0);
  const weightedAvailabilityPct = sumWindow > 0 ? ((sumWindow - sumDowntime) / sumWindow) * 100 : null;

  return {
    tickets,
    open,
    ticketsOpened,
    ticketsClosed,
    ticketsOpen,
    slaMet,
    reopened,
    closureRatePct: ticketsOpened ? (ticketsClosed / ticketsOpened) * 100 : null,
    slaAttainmentPct: ticketsOpened ? (slaMet / ticketsOpened) * 100 : null,
    reopenRatePct: ticketsClosed ? (reopened / ticketsClosed) * 100 : null,
    byPriority,
    byCategory,
    medianFirstResponse,
    medianResolution,
    services,
    uptimeRows: uptime.length,
    sumDowntime,
    serviceIncidents,
    weightedAvailabilityPct,
  };
}

// Round to 1 decimal for tolerant comparison against published targets.
const r1 = (n) => (n == null ? null : Math.round(n * 10) / 10);

export function verify(report, targets = TARGETS) {
  const got = {
    ticketsOpened: report.ticketsOpened,
    ticketsClosed: report.ticketsClosed,
    ticketsOpen: report.ticketsOpen,
    slaMet: report.slaMet,
    reopened: report.reopened,
    priorityP1: report.byPriority.P1 || 0,
    priorityP2: report.byPriority.P2 || 0,
    priorityP3: report.byPriority.P3 || 0,
    priorityP4: report.byPriority.P4 || 0,
    medianFirstResponse: r1(report.medianFirstResponse),
    medianResolution: r1(report.medianResolution),
    uptimeRows: report.uptimeRows,
    totalDowntime: report.sumDowntime,
    serviceIncidents: report.serviceIncidents,
    weightedAvailabilityPct: r1(report.weightedAvailabilityPct),
  };
  return Object.keys(targets).map((key) => ({
    key,
    expected: targets[key],
    actual: got[key],
    pass: got[key] === targets[key],
  }));
}
