// Self-check: the live recount must reproduce every kit-published target,
// and tampering with a row must make verify() fail (the honesty layer works).
// Run: node reconcile/compute.test.mjs
import assert from 'node:assert/strict';
import { TICKETS_CSV, UPTIME_CSV, computeReport, verify } from './compute.js';

const report = computeReport(TICKETS_CSV, UPTIME_CSV);
const checks = verify(report);
const failed = checks.filter((c) => !c.pass);
assert.equal(failed.length, 0, 'all targets must reconcile, got drift: ' + JSON.stringify(failed, null, 2));

// Tamper: drop a closed ticket -> totals must move and verification must flag it.
const tampered = TICKETS_CSV.split('\n').filter((l) => !l.startsWith('TKT-1006')).join('\n');
const tamperedChecks = verify(computeReport(tampered, UPTIME_CSV));
assert.ok(tamperedChecks.some((c) => !c.pass), 'tampered data must fail verification');

console.log(`OK: ${checks.length}/${checks.length} targets reconcile; tamper correctly flagged.`);
