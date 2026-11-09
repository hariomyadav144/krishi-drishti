const Field = require('../models/Field');
const { runFieldMonitoringPipeline } = require('./fieldMonitoringService');
const { searchCopernicusSentinel2Archive } = require('./copernicusService');
const { isDbConnected } = require('../utils/statelessStore');

let schedulerTimer = null;
let isCycleRunning = false;

// Auditable set of processed satellite product IDs to prevent redundant re-processing
const processedProductIds = new Set();

// Monitoring execution logs
const monitoringAuditLogs = [];

const DEFAULT_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

/**
 * Autonomous Monitoring Cycle:
 * - Checks for newly available Sentinel-2 Level-2A satellite acquisitions
 * - Avoids duplicate processing using processedProductIds
 * - Recalculates vegetation indices, updates crop classification & harvest status
 * - Explicitly separates satellite acquisition time vs system processing time
 */
async function runAutonomousCycle() {
  if (isCycleRunning) {
    console.log('[AutonomousMonitoring] Previous cycle is still in progress, skipping.');
    return { skipped: true };
  }

  isCycleRunning = true;
  const processingStartTime = new Date();
  console.log(`[AutonomousMonitoring] Starting continuous field evaluation cycle at ${processingStartTime.toISOString()}`);

  const summary = {
    totalFieldsEvaluated: 0,
    successfulRuns: 0,
    newAcquisitionsProcessed: 0,
    errors: 0,
    processingStartTime: processingStartTime.toISOString(),
    processingEndTime: null,
    durationSeconds: 0
  };

  try {
    if (!isDbConnected()) {
      console.log('[AutonomousMonitoring] Database operating in resilient stateless mode.');
      isCycleRunning = false;
      summary.processingEndTime = new Date().toISOString();
      return summary;
    }

    const now = new Date();
    const fields = await Field.find({
      monitoringActive: { $ne: false },
      $or: [
        { nextCheckAt: { $lte: now } },
        { nextCheckAt: null },
        { lastMonitoringTimestamp: null }
      ]
    }).limit(50);

    summary.totalFieldsEvaluated = fields.length;

    for (const field of fields) {
      try {
        const fieldCoords = field.center || { lat: 25.4358, lng: 81.8463 };
        const polygon = field.points || [];

        // Check for latest satellite product
        let latestProduct = null;
        try {
          latestProduct = await searchCopernicusSentinel2Archive({
            polygon,
            centroid: fieldCoords,
            targetDate: now,
            toleranceDays: 5,
            maxCloudCover: 30
          });
        } catch (_) {}

        const productId = latestProduct?.id || latestProduct?.name;
        const acquisitionTime = latestProduct?.observationDate ? new Date(latestProduct.observationDate).toISOString() : null;

        // Prevent duplicate processing of the exact same satellite pass
        const isDuplicate = productId && processedProductIds.has(`${field._id}_${productId}`);

        if (isDuplicate) {
          console.log(`[AutonomousMonitoring] Field ${field.fieldName} (${field._id}): Product ${productId} already processed. Updating check timestamp.`);
          field.lastCheckedAt = new Date();
          field.nextCheckAt = new Date(Date.now() + 6 * 60 * 60 * 1000);
          await field.save().catch(() => {});
          summary.successfulRuns++;
          continue;
        }

        // Run full monitoring pipeline
        const pipelineResult = await runFieldMonitoringPipeline(field._id, field.farmerId);
        summary.successfulRuns++;

        if (productId) {
          processedProductIds.add(`${field._id}_${productId}`);
          summary.newAcquisitionsProcessed++;
        }

        // Log audit record
        monitoringAuditLogs.unshift({
          fieldId: String(field._id),
          fieldName: field.fieldName,
          productId: productId || 'LATEST_SYNTHESIZED',
          satellite: latestProduct?.platform || 'Sentinel-2 (MSI L2A)',
          acquisitionTime,
          processingTime: new Date().toISOString(),
          status: 'SUCCESS'
        });

        if (monitoringAuditLogs.length > 100) {
          monitoringAuditLogs.pop();
        }

        field.lastCheckedAt = new Date();
        field.nextCheckAt = new Date(Date.now() + 6 * 60 * 60 * 1000);
        await field.save().catch(() => {});
      } catch (fieldErr) {
        console.warn(`[AutonomousMonitoring] Field ${field._id} check warning:`, fieldErr.message);
        summary.errors++;
        field.nextCheckAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
        await field.save().catch(() => {});
      }
    }
  } catch (err) {
    console.error('[AutonomousMonitoring] Cycle error:', err.message);
  } finally {
    isCycleRunning = false;
    const processingEndTime = new Date();
    summary.processingEndTime = processingEndTime.toISOString();
    summary.durationSeconds = Math.round((processingEndTime - processingStartTime) / 1000);
    console.log(`[AutonomousMonitoring] Cycle finished in ${summary.durationSeconds}s. Evaluated ${summary.successfulRuns}/${summary.totalFieldsEvaluated} fields.`);
  }

  return summary;
}

function startMonitoringScheduler(intervalMs = DEFAULT_INTERVAL_MS) {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
  }

  console.log(`[AutonomousMonitoring] Initializing background scheduler (Interval: ${Math.round(intervalMs / (60 * 1000))} minutes)`);

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

function getMonitoringAuditLogs() {
  return monitoringAuditLogs;
}

module.exports = {
  startMonitoringScheduler,
  stopMonitoringScheduler,
  runAutonomousCycle,
  getMonitoringAuditLogs
};
