// Manual Jest mock for dashboardNoteScheduler - the real module self-initializes
// a node-cron job as a side effect of being required, which would otherwise
// register a real (if harmless) timer on every test run. No-op here.
module.exports = {};
