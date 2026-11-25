import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { model, scenarios, simulate } from './engine.js';

test('published JSON and executable scenario definitions agree', async () => {
  assert.deepEqual(JSON.parse(await readFile(new URL('./scenarios.json', import.meta.url), 'utf8')), { model, scenarios });
});

test('all three independent baseline arithmetic results', () => {
  const expected = [
    { minimumCash: -1000, firstNegativeDay: 7, closingCash: 8000, extraBufferNeeded: 1000 },
    { minimumCash: -9000, firstNegativeDay: 3, closingCash: 11000, extraBufferNeeded: 9000 },
    { minimumCash: -6000, firstNegativeDay: 4, closingCash: 8000, extraBufferNeeded: 6000 }
  ];
  scenarios.forEach((scenario, index) => {
    const result = simulate(scenario);
    for (const [field, value] of Object.entries(expected[index])) assert.equal(result.summary[field], value, `${scenario.id}: ${field}`);
    assert.equal(result.days.length, 31);
    assert.equal(result.days[0].day, 0);
    assert.equal(result.days[30].day, 30);
  });
});

test('a 15-day delay preserves final cash but deepens the earlier gap', () => {
  const original = simulate('late_customer');
  const delayed = simulate('late_customer', { invoiceDelayDays: 15 });
  assert.equal(delayed.summary.closingCash, original.summary.closingCash);
  assert.equal(delayed.summary.minimumCash, -7000);
  assert.equal(delayed.days[24].cash, -7000);
  assert.equal(delayed.days[25].cash, 8000);
});

test('baseline and delayed daily cash match independent piecewise arithmetic', () => {
  for (const invoiceDelayDays of [0, 15]) {
    const result = simulate('late_customer', { invoiceDelayDays });
    for (const row of result.days) {
      const expected = 5000 + (row.day >= 10 + invoiceDelayDays ? 15000 : 0)
        - (row.day >= 7 ? 6000 : 0) - (row.day >= 14 ? 4000 : 0) - (row.day >= 21 ? 2000 : 0);
      assert.equal(row.cash, expected, `delay ${invoiceDelayDays}, day ${row.day}`);
    }
  }
});

test('opening buffer adds equally to every balance without changing cash flows', () => {
  for (const scenario of scenarios) {
    const baseline = simulate(scenario, { invoiceDelayDays: 21, depositPercent: 50 });
    const buffered = simulate(scenario, { invoiceDelayDays: 21, depositPercent: 50, openingBuffer: 20000 });
    assert.equal(buffered.summary.minimumCash, baseline.summary.minimumCash + 20000);
    assert.equal(buffered.summary.closingCash, baseline.summary.closingCash + 20000);
    for (let day = 0; day <= 30; day += 1) {
      assert.equal(buffered.days[day].cash, baseline.days[day].cash + 20000);
      assert.equal(buffered.days[day].inflow, baseline.days[day].inflow);
      assert.equal(buffered.days[day].outflow, baseline.days[day].outflow);
    }
  }
});

test('CSV downloads have all days, controls and exact model values', async () => {
  const loadCsv = async name => {
    const lines = (await readFile(new URL(`./${name}`, import.meta.url), 'utf8')).trim().split(/\r?\n/);
    const headers = lines.shift().split(',');
    return lines.map(line => Object.fromEntries(line.split(',').map((value, index) => [headers[index], value])));
  };
  const baseline = simulate('late_customer');
  const delayed = simulate('late_customer', { invoiceDelayDays: 15 });
  const baselineRows = await loadCsv('late-customer-baseline.csv');
  const comparisonRows = await loadCsv('late-customer-delay15-comparison.csv');
  assert.equal(baselineRows.length, 31);
  assert.equal(comparisonRows.length, 31);
  for (let day = 0; day <= 30; day += 1) {
    const row = baselineRows[day];
    const comparison = comparisonRows[day];
    assert.equal(Number(row.day), day);
    assert.equal(Number(comparison.day), day);
    assert.equal(row.hypothetical, 'true');
    assert.equal(row.release_date, '2026-11-25');
    assert.equal(row.currency, 'AUD');
    assert.equal(row.invoice_delay_days, '0');
    assert.equal(comparison.baseline_delay_days, '0');
    assert.equal(comparison.comparison_delay_days, '15');
    assert.equal(comparison.deposit_percent, '0');
    assert.equal(comparison.opening_buffer_aud, '0.00');
    for (const field of ['inflow', 'outflow', 'cash']) {
      assert.equal(Number(row[`${field}_aud`]), baseline.days[day][field]);
      assert.equal(Number(comparison[`baseline_${field}_aud`]), baseline.days[day][field]);
      assert.equal(Number(comparison[`delayed_${field}_aud`]), delayed.days[day][field]);
    }
  }
});

test('receipt on day 30 counts; day 31 remains pending rather than being lost', () => {
  const within = simulate('late_customer', { invoiceDelayDays: 20 });
  const beyond = simulate('late_customer', { invoiceDelayDays: 21 });
  assert.equal(within.summary.closingCash, 8000);
  assert.equal(within.summary.pendingReceiptsAmount, 0);
  assert.equal(beyond.summary.closingCash, -7000);
  assert.equal(beyond.summary.pendingReceiptsAmount, 15000);
  assert.equal(beyond.pendingReceipts[0].day, 31);
});

test('a deposit conserves total receipts and can remove a growth gap', () => {
  const result = simulate('growing_order', { depositPercent: 45 });
  assert.equal(result.days[1].inflow, 9000);
  assert.equal(result.days[28].inflow, 11000);
  assert.equal(result.summary.totalInflow, 30000);
  assert.equal(result.summary.closingCash, 11000);
  assert.equal(result.summary.minimumCash, 0);
  assert.equal(result.summary.extraBufferNeeded, 0);
  assert.equal(result.summary.firstNegativeDay, null);
});

test('a deposit can leave a gap; buffer measures the remaining amount only', () => {
  const withDeposit = simulate('lumpy_costs', { depositPercent: 50 });
  assert.equal(withDeposit.summary.minimumCash, -1000);
  assert.equal(withDeposit.summary.extraBufferNeeded, 1000);
  const withBoth = simulate('lumpy_costs', { depositPercent: 50, openingBuffer: 1000 });
  assert.equal(withBoth.summary.minimumCash, 0);
  assert.equal(withBoth.summary.extraBufferNeeded, 0);
  assert.equal(withBoth.summary.firstNegativeDay, null);
  assert.equal(withBoth.summary.closingCash, 9000);
});

test('daily accounting nets same-day movements, not an invented intraday order', () => {
  const scenario = {
    id: 'same_day', horizonDays: 30, openingCash: 0, depositDay: 1, adjustableReceiptId: 'paid',
    receipts: [{ id: 'paid', day: 1, amount: 100, label: 'Receipt' }],
    outgoings: [{ id: 'cost', day: 1, amount: 100, label: 'Payment' }]
  };
  const result = simulate(scenario);
  assert.deepEqual(result.days[1], { day: 1, cash: 0, inflow: 100, outflow: 100 });
  assert.equal(result.summary.firstNegativeDay, null);
  assert.equal(result.summary.minimumCash, 0);
});

test('cent rounding preserves the invoice total and decimal starting cash', () => {
  const scenario = {
    id: 'cents', horizonDays: 30, openingCash: 0.1, depositDay: 1, adjustableReceiptId: 'paid',
    receipts: [{ id: 'paid', day: 10, amount: 100.01, label: 'Receipt' }],
    outgoings: [{ id: 'cost', day: 3, amount: 0.2, label: 'Payment' }]
  };
  const result = simulate(scenario, { depositPercent: 33, openingBuffer: 0.2 });
  assert.equal(result.days[1].inflow, 33);
  assert.equal(result.days[10].inflow, 67.01);
  assert.equal(result.summary.closingCash, 100.11);
  assert.equal(result.summary.totalInflow, 100.01);
});

test('every delay/deposit combination conserves receipts and extra buffer removes deficits', () => {
  let checks = 0;
  for (const scenario of scenarios) {
    const totalReceipts = scenario.receipts.reduce((sum, event) => sum + event.amount, 0);
    for (let invoiceDelayDays = 0; invoiceDelayDays <= 21; invoiceDelayDays += 1) {
      for (let depositPercent = 0; depositPercent <= 50; depositPercent += 1) {
        const settings = { invoiceDelayDays, depositPercent };
        const result = simulate(scenario, settings);
        assert.equal(result.summary.totalInflow + result.summary.pendingReceiptsAmount, totalReceipts);
        assert.equal(result.summary.closingCash, scenario.openingCash + result.summary.totalInflow - result.summary.totalOutflow);
        assert.equal(result.summary.minimumCash, Math.min(...result.days.map(day => day.cash)));
        const adjusted = simulate(scenario, { ...settings, openingBuffer: result.summary.extraBufferNeeded });
        assert.ok(adjusted.summary.minimumCash >= 0);
        assert.equal(adjusted.summary.firstNegativeDay, null);
        checks += 1;
      }
    }
  }
  assert.equal(checks, 3366);
});

test('invalid controls and malformed scenarios fail explicitly', () => {
  for (const settings of [
    { invoiceDelayDays: -1 }, { invoiceDelayDays: 22 }, { invoiceDelayDays: 0.5 },
    { depositPercent: 51 }, { depositPercent: 1.5 }, { openingBuffer: 20000.01 },
    { openingBuffer: 0.001 }, { openingBuffer: NaN }, { openingBuffer: '5000' },
    { openBuffer: 1000 }, null
  ]) assert.throws(() => simulate('late_customer', settings));
  assert.throws(() => simulate('missing'));
  assert.throws(() => simulate({ ...scenarios[0], horizonDays: 31 }));
  assert.throws(() => simulate({ ...scenarios[0], adjustableReceiptId: 'absent' }));
  assert.throws(() => simulate({ ...scenarios[0], outgoings: [...scenarios[0].outgoings, scenarios[0].outgoings[0]] }));
});

test('simulations do not mutate presets or one another', () => {
  const before = JSON.stringify(scenarios);
  const result = simulate('late_customer');
  result.days[1].cash = 123;
  result.scheduledEvents[0].amount = 0;
  assert.equal(JSON.stringify(scenarios), before);
  assert.equal(simulate('late_customer').days[1].cash, 5000);
  assert.ok(Object.isFrozen(scenarios[0].receipts[0]));
});
