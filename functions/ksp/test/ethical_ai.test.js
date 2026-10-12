const assert = require('assert');
const riskScoring = require('../risk-scoring/index');
const toolRouter = require('../tool-router/index');

console.log('--- Running Phase 5 Ethical Intelligence & Bias Test Suite ---');

async function testIndividualScoringDisabled() {
  const result = await riskScoring('Sharief');
  assert.deepStrictEqual(result, {
    success: false,
    code: 'INDIVIDUAL_SCORING_DISABLED',
    error: 'Individual risk and threat scoring is disabled by policy.'
  });
  console.log('✓ Test 1 Passed: Individual risk and threat scoring is disabled');

  const routed = await toolRouter('Assess the risk of Jacky', 'test-officer', 'Investigator');
  assert.strictEqual(routed.success, true);
  assert.strictEqual(routed.tool, 'text');
  assert.strictEqual(routed.data, null);
  assert.match(routed.narrative, /Individual risk scoring and threat classification are disabled/);
  console.log('✓ Test 2 Passed: Chat requests cannot route to person-level scoring');
}

testIndividualScoringDisabled().then(() => {
  console.log('=== Phase 5 Ethical Intelligence Test Suite: ALL TESTS PASSED ===');
}).catch(err => {
  console.error('Phase 5 Test Failure:', err);
  process.exit(1);
});
