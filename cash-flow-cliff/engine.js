/** Pure, deterministic 30-day educational cash-flow model. All money is AUD. */

export const model = Object.freeze({
  schemaVersion: 1,
  currency: 'AUD',
  horizonDays: 30,
  synthetic: true,
  description: 'Every business, amount and payment date in these scenarios is invented. They illustrate cash timing, not typical Australian business performance.',
  convention: 'Day 0 is starting cash. Days 1–30 show the end-of-day balance after netting all receipts and payments on that day. This can hide an intraday shortfall.',
  depositConvention: 'A hypothetical agreed deposit arrives on day 1. It reduces the selected customer’s later payment by exactly the same amount. It is not extra revenue, and acceptance is not guaranteed.',
  bufferConvention: 'Opening buffer is additional hypothetical cash already available at the start. The model does not assume borrowing or explain how that cash is obtained.',
  negativeBalanceMeaning: 'A negative balance is an unfunded gap in this scenario. It does not mean an overdraft or other credit is available.',
  horizonConvention: 'A delayed receipt after day 30 is reported separately. It is not included in the closing balance and is not assumed lost.',
  limits: 'Amounts represent final cash movements. No GST or other tax calculation, interest, borrowing cost, legal payment deadline, eligibility assessment or personalised recommendation is modelled. Unlisted receipts, costs and obligations are omitted. Closing cash is not profit.',
  sourceScope: 'The official sources support the cash-flow principles only. They do not supply or validate the invented scenario amounts, dates or deposit percentages.',
  checkedOn: '2026-11-16',
  releaseDate: '2026-11-25',
  sources: [
    {
      title: 'Set up a cash flow statement — business.gov.au',
      url: 'https://business.gov.au/finance/cash-flow/set-up-a-cash-flow-statement',
      supports: 'Forecast receipts and payments with their timing; closing cash equals opening cash plus receipts minus payments.'
    },
    {
      title: 'Improve your cash flow — business.gov.au',
      url: 'https://business.gov.au/finance/cash-flow/improve-your-cash-flow',
      supports: 'Test timing changes in a forecast; upfront payments and special-order deposits are possible collection arrangements, subject to agreement.'
    }
  ],
  relatedResources: [
    {
      title: 'SMB Loan working-capital research',
      url: 'https://smbloan.com.au/research/working-capital-by-industry',
      relation: 'Related expense-duration model; no industry benchmark values are imported into this game.'
    },
    {
      title: 'SMB Loan offer-comparison worksheet',
      url: 'https://smbloan.com.au/business-loan-offer-comparison',
      relation: 'A separate tool for comparing written finance offers; this game does not compare or recommend loans.'
    }
  ],
  disclosure: 'Created by Joe, an AI assistant at Finofin, for SMB Loan. SMB Loan is an information publisher, not a lender, broker or marketplace. It may receive referral income from Lend. This educational model has not received independent professional review.'
});

export const scenarios = [
  {
    id: 'late_customer',
    title: 'The late customer',
    description: 'The month can finish with A$8,000 even though an earlier payment cannot be covered. Move one customer payment and inspect the lowest balance.',
    hypothetical: true,
    horizonDays: 30,
    openingCash: 5000,
    adjustableReceiptId: 'customer_invoice',
    depositDay: 1,
    receipts: [
      { id: 'customer_invoice', day: 10, amount: 15000, label: 'Customer invoice' }
    ],
    outgoings: [
      { id: 'materials', day: 7, amount: 6000, label: 'Materials payment' },
      { id: 'staff', day: 14, amount: 4000, label: 'Staff payment' },
      { id: 'overheads', day: 21, amount: 2000, label: 'Other operating payment' }
    ],
    prompt: 'Can a positive closing balance hide an earlier cash gap?',
    lesson: 'With no extra buffer or deposit, cash first falls below zero on day 7. A 15-day delay deepens the minimum from −A$1,000 to −A$7,000 while day-30 cash remains A$8,000.',
    baselineExpected: { minimumCash: -1000, firstNegativeDay: 7, closingCash: 8000, extraBufferNeeded: 1000 }
  },
  {
    id: 'growing_order',
    title: 'The growing order',
    description: 'A new order adds A$20,000 of receipts and A$16,000 of specified payments, but the payments come first. Try a hypothetical deposit agreed before work begins.',
    hypothetical: true,
    horizonDays: 30,
    openingCash: 5000,
    adjustableReceiptId: 'new_order',
    depositDay: 1,
    receipts: [
      { id: 'ordinary_customer', day: 10, amount: 10000, label: 'Existing customer receipt' },
      { id: 'new_order', day: 28, amount: 20000, label: 'New order final payment' }
    ],
    outgoings: [
      { id: 'order_materials', day: 3, amount: 12000, label: 'New order materials' },
      { id: 'order_labour', day: 12, amount: 4000, label: 'New order labour payment' },
      { id: 'ordinary_costs', day: 15, amount: 8000, label: 'Existing operating payments' }
    ],
    prompt: 'Why can an order that adds cash by month-end deepen the earlier gap?',
    lesson: 'The order adds A$4,000 to closing cash after its two specified payments, but creates a minimum balance of −A$9,000. A 45% deposit moves A$9,000 to day 1 and removes that gap. This is a timing example, not a recommended deposit rate or a full profit calculation.',
    baselineExpected: { minimumCash: -9000, firstNegativeDay: 3, closingCash: 11000, extraBufferNeeded: 9000 },
    withoutNewOrder: { openingCash: 5000, totalReceipts: 10000, totalOutgoings: 8000, closingCash: 7000, minimumCash: 5000 }
  },
  {
    id: 'lumpy_costs',
    title: 'The lumpy costs',
    description: 'A$20,000 arrives and A$18,000 leaves during the month, but rent and an equipment payment arrive before most receipts. Monthly totals hide the concentration.',
    hypothetical: true,
    horizonDays: 30,
    openingCash: 6000,
    adjustableReceiptId: 'project_invoice',
    depositDay: 1,
    receipts: [
      { id: 'sales_first', day: 10, amount: 5000, label: 'First customer receipts' },
      { id: 'sales_second', day: 20, amount: 5000, label: 'Second customer receipts' },
      { id: 'project_invoice', day: 24, amount: 10000, label: 'Project invoice' }
    ],
    outgoings: [
      { id: 'rent', day: 1, amount: 4000, label: 'Rent payment' },
      { id: 'equipment', day: 4, amount: 6000, label: 'One-off equipment payment' },
      { id: 'staff_first', day: 7, amount: 2000, label: 'First staff payment' },
      { id: 'staff_second', day: 14, amount: 2000, label: 'Second staff payment' },
      { id: 'staff_third', day: 21, amount: 2000, label: 'Third staff payment' },
      { id: 'staff_fourth', day: 28, amount: 2000, label: 'Fourth staff payment' }
    ],
    prompt: 'Does A$2,000 more coming in than going out mean every payment is covered?',
    lesson: 'The monthly net inflow is positive, yet the lowest daily balance is −A$6,000. Even moving 50% of the project invoice to day 1 leaves an A$1,000 gap. Starting cash, payment timing and monthly totals answer different questions.',
    baselineExpected: { minimumCash: -6000, firstNegativeDay: 4, closingCash: 8000, extraBufferNeeded: 6000 }
  }
];

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
deepFreeze(scenarios);

function boundedNumber(value, name, minimum, maximum, integer = false) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum || value > maximum || (integer && !Number.isInteger(value))) {
    throw new RangeError(`${name} must be ${integer ? 'an integer' : 'a number'} from ${minimum} to ${maximum}.`);
  }
  return value;
}

function toCents(amount, name) {
  boundedNumber(amount, name, 0, 100000000);
  const cents = Math.round(amount * 100);
  if (Math.abs(amount * 100 - cents) > 0.000001) throw new RangeError(`${name} must have at most two decimal places.`);
  return cents;
}

function validateScenario(scenario) {
  if (!scenario || typeof scenario !== 'object' || scenario.horizonDays !== 30) throw new TypeError('A 30-day scenario is required.');
  toCents(scenario.openingCash, 'scenario.openingCash');
  boundedNumber(scenario.depositDay, 'scenario.depositDay', 1, 30, true);
  if (!Array.isArray(scenario.receipts) || !Array.isArray(scenario.outgoings)) throw new TypeError('Scenario receipts and outgoings must be arrays.');
  if (scenario.receipts.length + scenario.outgoings.length > 1000) throw new RangeError('A scenario may contain at most 1000 events.');
  const ids = new Set();
  for (const event of [...scenario.receipts, ...scenario.outgoings]) {
    if (!event || typeof event.id !== 'string' || !event.id || ids.has(event.id)) throw new TypeError('Each event must have a unique non-empty id.');
    ids.add(event.id);
    boundedNumber(event.day, `${event.id}.day`, 1, 30, true);
    if (toCents(event.amount, `${event.id}.amount`) <= 0) throw new RangeError('Event amounts must be positive.');
  }
  const adjustable = scenario.receipts.find(event => event.id === scenario.adjustableReceiptId);
  if (!adjustable) throw new TypeError('The adjustable receipt must exist in receipts.');
  if (scenario.depositDay > adjustable.day) throw new RangeError('Deposit day cannot follow the original receipt day.');
}

/**
 * @param {object|string} scenario Preset object or preset id.
 * @param {{invoiceDelayDays?: number, depositPercent?: number, openingBuffer?: number}} settings
 * @returns {{days: Array<{day:number,cash:number,inflow:number,outflow:number}>, summary: object, scheduledEvents: Array<object>, pendingReceipts: Array<object>, settings: object}}
 * All result money fields are AUD; calculations use integer cents internally.
 * minimumCash includes day 0. extraBufferNeeded is additional cash beyond the
 * selected openingBuffer that would remove every end-of-day negative balance.
 */
export function simulate(scenario, settings = {}) {
  const chosen = typeof scenario === 'string' ? scenarios.find(item => item.id === scenario) : scenario;
  validateScenario(chosen);
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) throw new TypeError('settings must be an object.');
  for (const key of Object.keys(settings)) {
    if (!['invoiceDelayDays', 'depositPercent', 'openingBuffer'].includes(key)) throw new TypeError(`Unknown setting: ${key}`);
  }
  const values = {
    invoiceDelayDays: boundedNumber(settings.invoiceDelayDays ?? 0, 'invoiceDelayDays', 0, 21, true),
    depositPercent: boundedNumber(settings.depositPercent ?? 0, 'depositPercent', 0, 50, true),
    openingBuffer: boundedNumber(settings.openingBuffer ?? 0, 'openingBuffer', 0, 20000)
  };
  const openingCents = toCents(chosen.openingCash, 'openingCash') + toCents(values.openingBuffer, 'openingBuffer');
  const scheduled = [];
  for (const receipt of chosen.receipts) {
    const cents = toCents(receipt.amount, receipt.id);
    if (receipt.id === chosen.adjustableReceiptId) {
      // Round the deposit once to the nearest cent; remainder preserves the total.
      const deposit = Math.round(cents * values.depositPercent / 100);
      if (deposit > 0) scheduled.push({ id: `${receipt.id}_deposit`, label: `${receipt.label} — agreed deposit`, day: chosen.depositDay, cents: deposit, type: 'receipt' });
      scheduled.push({ id: receipt.id, label: receipt.label, day: receipt.day + values.invoiceDelayDays, cents: cents - deposit, type: 'receipt' });
    } else {
      scheduled.push({ id: receipt.id, label: receipt.label, day: receipt.day, cents, type: 'receipt' });
    }
  }
  for (const outgoing of chosen.outgoings) scheduled.push({ id: outgoing.id, label: outgoing.label, day: outgoing.day, cents: toCents(outgoing.amount, outgoing.id), type: 'outgoing' });
  scheduled.sort((a, b) => a.day - b.day || a.id.localeCompare(b.id));
  const days = [{ day: 0, cash: openingCents / 100, inflow: 0, outflow: 0 }];
  let cash = openingCents;
  let minimum = openingCents;
  let firstNegativeDay = null;
  let totalInflow = 0;
  let totalOutflow = 0;
  for (let day = 1; day <= chosen.horizonDays; day += 1) {
    let inflow = 0;
    let outflow = 0;
    for (const event of scheduled) {
      if (event.day !== day) continue;
      if (event.type === 'receipt') inflow += event.cents;
      else outflow += event.cents;
    }
    cash += inflow - outflow;
    totalInflow += inflow;
    totalOutflow += outflow;
    minimum = Math.min(minimum, cash);
    if (cash < 0 && firstNegativeDay === null) firstNegativeDay = day;
    days.push({ day, cash: cash / 100, inflow: inflow / 100, outflow: outflow / 100 });
  }
  const asPublicEvent = ({ cents, ...event }) => ({ ...event, amount: cents / 100 });
  const pending = scheduled.filter(event => event.type === 'receipt' && event.day > chosen.horizonDays);
  return {
    scenarioId: chosen.id,
    settings: values,
    days,
    summary: {
      openingCash: openingCents / 100,
      minimumCash: minimum / 100,
      firstNegativeDay,
      closingCash: cash / 100,
      extraBufferNeeded: Math.max(0, -minimum) / 100,
      totalInflow: totalInflow / 100,
      totalOutflow: totalOutflow / 100,
      pendingReceiptsAmount: pending.reduce((sum, event) => sum + event.cents, 0) / 100
    },
    scheduledEvents: scheduled.map(asPublicEvent),
    pendingReceipts: pending.map(asPublicEvent)
  };
}
