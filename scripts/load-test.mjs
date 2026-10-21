// -----------------------------------------------------------------------------
// scripts/load-test.mjs
// ShopSphere High-Traffic Concurrency & Load Testing Suite (10, 100, 500, 1000)
// -----------------------------------------------------------------------------

import { getProducts } from '../src/lib/products/queries.ts';
import { getProductAlternativeComparisonAction } from '../src/lib/pricing/actions.ts';
import { analyzeProductPricing } from '../src/lib/pricing/pricing-engine.ts';
import { getPricingDashboardData } from '../src/lib/pricing/store.ts';

const TIERS = [10, 100, 500, 1000];

function percentile(arr, p) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

async function runVirtualUserRequest(userIndex) {
  const operations = [
    // 1. Catalog query with budget tier filter & pagination
    () => getProducts({ categorySlug: 'electronics', priceTier: 'budget', page: 1, limit: 12 }),
    // 2. Best-value search across full marketplace
    () => getProducts({ sortBy: 'best-value', query: 'wireless', limit: 8 }),
    // 3. Side-by-side alternative comparison computation
    () => getProductAlternativeComparisonAction('sony-wh-1000xm5-wireless-noise-cancelling-headphones'),
    // 4. In-memory pricing profitability & guardrail analysis
    () =>
      Promise.resolve(
        analyzeProductPricing({
          id: `load-prod-${userIndex}`,
          slug: `load-prod-${userIndex}`,
          sku: `LOAD-SKU-${userIndex}`,
          title: 'Load Test High Fidelity Audio',
          price: 19990,
          stockQuantity: 15,
          categorySlug: 'electronics',
          brand: 'ShopSphere Audio',
        })
      ),
  ];

  // Pick operation deterministically based on virtual user index to simulate realistic mixed traffic
  const op = operations[userIndex % operations.length];
  const start = performance.now();
  try {
    const res = await op();
    const duration = performance.now() - start;
    if (res && res.success === false) {
      return { success: false, duration, error: res.error };
    }
    return { success: true, duration };
  } catch (err) {
    const duration = performance.now() - start;
    return { success: false, duration, error: err.message };
  }
}

async function runTier(concurrency) {
  const memBefore = process.memoryUsage().heapUsed / 1024 / 1024;
  const wallStart = performance.now();

  const promises = [];
  for (let i = 0; i < concurrency; i++) {
    promises.push(runVirtualUserRequest(i));
  }

  const results = await Promise.all(promises);
  const wallEnd = performance.now();
  const totalDurationSec = (wallEnd - wallStart) / 1000;
  const memAfter = process.memoryUsage().heapUsed / 1024 / 1024;

  const latencies = results.map((r) => r.duration);
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const rps = Math.round(concurrency / totalDurationSec);

  return {
    concurrency,
    totalDurationMs: Math.round(wallEnd - wallStart),
    requestsPerSecond: rps,
    medianLatencyMs: Math.round(percentile(latencies, 50) * 10) / 10,
    p95LatencyMs: Math.round(percentile(latencies, 95) * 10) / 10,
    minLatencyMs: Math.round(Math.min(...latencies) * 10) / 10,
    maxLatencyMs: Math.round(Math.max(...latencies) * 10) / 10,
    successCount: successful,
    failedCount: failed,
    errorRatePercent: Math.round((failed / concurrency) * 1000) / 10,
    heapDeltaMb: Math.round((memAfter - memBefore) * 10) / 10,
  };
}

async function main() {
  console.log('\n=============================================================');
  console.log('SHOPSPHERE HIGH-CONCURRENCY LOAD & STRESS TESTING SUITE');
  console.log('Simulating 10, 100, 500, and 1,000 Concurrent Virtual Users');
  console.log('=============================================================\n');

  const benchmarkResults = [];

  for (const tier of TIERS) {
    process.stdout.write(`Executing Concurrency Tier: ${tier} virtual users... `);
    const result = await runTier(tier);
    benchmarkResults.push(result);
    console.log(`COMPLETED in ${result.totalDurationMs}ms (${result.requestsPerSecond} req/sec)`);
  }

  console.log('\n---------------------------------------------------------------------------------------------------------');
  console.log('| Virtual Users | Total Time | RPS      | Median Latency | p95 Latency | Failed | Error % | Heap Delta  |');
  console.log('---------------------------------------------------------------------------------------------------------');
  for (const res of benchmarkResults) {
    const vu = String(res.concurrency).padEnd(13);
    const time = `${res.totalDurationMs}ms`.padEnd(10);
    const rps = `${res.requestsPerSecond}/s`.padEnd(8);
    const med = `${res.medianLatencyMs}ms`.padEnd(14);
    const p95 = `${res.p95LatencyMs}ms`.padEnd(11);
    const failed = String(res.failedCount).padEnd(6);
    const err = `${res.errorRatePercent}%`.padEnd(7);
    const heap = `${res.heapDeltaMb > 0 ? '+' : ''}${res.heapDeltaMb} MB`.padEnd(11);
    console.log(`| ${vu} | ${time} | ${rps} | ${med} | ${p95} | ${failed} | ${err} | ${heap} |`);
  }
  console.log('---------------------------------------------------------------------------------------------------------\n');

  const allPassed = benchmarkResults.every((r) => r.failedCount === 0);
  if (allPassed) {
    console.log('✅ ALL LOAD TIERS PASSED WITH ZERO CRASHES, SATURATION FAILURES, OR ERROR SPIKES.\n');
  } else {
    console.error('❌ SOME CONCURRENCY TIERS ENCOUNTERED FAILURES.\n');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal load test runner error:', err);
  process.exit(1);
});
