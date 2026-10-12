const catalyst = require('../shared/catalyst-sdk').getInitializer();

module.exports = async () => {
  try {
    const db = catalyst.datastore();

    // 1. Identify Modus Operandi clusters (same MO used in multiple cases)
    const moClusters = await db.execute(`
      SELECT f.modus_operandi, f.crime_type, COUNT(f.id) as case_count, 
             GROUP_CONCAT(f.fir_number, ', ') as connected_firs
      FROM FIR f
      GROUP BY f.modus_operandi
      HAVING case_count > 1
      ORDER BY case_count DESC
      LIMIT 5
    `);

    // 2. District-wise volume anomalies
    const districtStats = await db.execute(`
      SELECT district, COUNT(id) as total_incidents,
             SUM(CASE WHEN date_reported >= date('now', '-30 days') THEN 1 ELSE 0 END) as recent_30_days
      FROM FIR
      GROUP BY district
      ORDER BY recent_30_days DESC
    `);

    // 3. Generate alerts from case-level patterns
    const alerts = [];

    moClusters.forEach(mo => {
      alerts.push({
        type: "Modus Operandi Spike",
        severity: "High",
        title: `Repeated MO: ${mo.crime_type}`,
        description: `Modus Operandi pattern: "${mo.modus_operandi}" identified across ${mo.case_count} cases (${mo.connected_firs}). Indicates potential serial ring.`,
        timestamp: new Date().toISOString()
      });
    });

    districtStats.forEach(stat => {
      // If recent 30 days account for more than 40% of overall database cases (since our data spans 120 days), flag it
      if (stat.total_incidents > 0 && (stat.recent_30_days / stat.total_incidents) > 0.35) {
        alerts.push({
          type: "District Crime Surge",
          severity: "Medium",
          title: `Activity Spike in ${stat.district}`,
          description: `District ${stat.district} recorded ${stat.recent_30_days} cases in the last 30 days (total: ${stat.total_incidents}). Surge of ${Math.round((stat.recent_30_days / stat.total_incidents) * 100)}% of total case files.`,
          timestamp: new Date().toISOString()
        });
      }
    });

    return {
      success: true,
      anomalies: {
        moPatterns: moClusters,
        districtVolume: districtStats,
        generatedAlerts: alerts
      }
    };
  } catch (err) {
    console.error('Anomaly detection execution failed:', err);
    return { success: false, error: err.message };
  }
};
