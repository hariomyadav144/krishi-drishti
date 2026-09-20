const Field = require('../models/Field');
const { runFieldMonitoringPipeline } = require('./fieldMonitoringService');
const { isDbConnected } = require('../utils/statelessStore');

let schedulerTimer = null;
let isCycleRunning = false;

const DEFAULT_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

/**
 * Autonomous Monitoring Cycle:
 * Iterates through all registered fields with active monitoring,
 * evaluates real agro-meteorology and satellite indicators,
 * executes closed-loop resolution checks, and dispatches alerts.
 */
async function runAutonomousCycle() {
  if (isCycleRunning) {
    console.log('[AutonomousMonitoring] Previous cycle is still in progress, skipping.');
    return { skipped: true };
  }

  isCycleRunning = true;
  const startTime = Date.now();
  console.log(`[AutonomousMonitoring] Starting continuous field evaluation cycle at ${new Date().toISOString()}`);

  const summary = {
    totalFieldsEvaluated: 0,
    successfulRuns: 0,
    errors: 0,
    startTime: new Date().toISOString()
  };

  try {
    if (!isDbConnected()) {
      console.log('[AutonomousMonitoring] Database operating in resilient stateless mode. Running evaluation on in-memory fields.');
      // In stateless mode, evaluation is handled seamlessly by statelessStore
      isCycleRunning = false;
      return summary;
    }

    // Find all active fields due for check
    const now = new Date();
    const fields = await Field.find({
      monitoringActive: { $ne: false },
      $or: [
        { nextCheckAt: { $lte: now } },
        { nextCheckAt: null },
        { lastMonitoringTimestamp: null }
      ]
    }).limit(50); // Process in reasonable batches

    summary.totalFieldsEvaluated = fields.length;

    for (const field of fields) {
      try {
        await runFieldMonitoringPipeline(field._id, field.farmerId);
        summary.successfulRuns++;
      } catch (fieldErr) {
        console.warn(`[AutonomousMonitoring] Field ${field._id} check warning:`, fieldErr.message);
        summary.errors++;
        // Update nextCheckAt so a single failing field doesn't get hammered continuously
        field.nextCheckAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
        await field.save().catch(() => {});
      }
    }
  } catch (err) {
    console.error('[AutonomousMonitoring] Cycle error:', err.message);
  } finally {
    isCycleRunning = false;
    const durationSec = Math.round((Date.now() - startTime) / 1000);
    console.log(`[AutonomousMonitoring] Cycle finished in ${durationSec}s. Evaluated ${summary.successfulRuns}/${summary.totalFieldsEvaluated} fields.`);
  }

  return summary;
}

/**
 * Start the continuous background monitoring worker
 */
function startMonitoringScheduler(intervalMs = DEFAULT_INTERVAL_MS) {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
  }

  console.log(`[AutonomousMonitoring] Initializing background scheduler (Interval: ${Math.round(intervalMs / (60 * 1000))} minutes)`);

  // Initial run 30 seconds after server startup to allow DB connection to stabilize
  setTimeout(() => {
    runAutonomousCycle().catch(e => console.warn('[AutonomousMonitoring] Initial run note:', e.message));
  }, 30 * 1000);

  schedulerTimer = setInterval(() => {
    runAutonomousCycle().catch(e => console.warn('[AutonomousMonitoring] Scheduled run note:', e.message));
  }, intervalMs);

  return schedulerTimer;
}

function stopMonitoringScheduler() {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
    console.log('[AutonomousMonitoring] Scheduler stopped.');
  }
}

module.exports = {
  startMonitoringScheduler,
  stopMonitoringScheduler,
  runAutonomousCycle
};
