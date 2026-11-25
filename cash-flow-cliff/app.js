import { scenarios, simulate } from './engine.js';

const $ = id => document.getElementById(id);
const canonical = 'https://thisismyuserdealwithit.github.io/smbloan-business-survival-notes/cash-flow-cliff/';
const money = value => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 2 }).format(value);
const params = new URLSearchParams(location.search);
let chosen = scenarios.find(s => s.id === params.get('scenario')) || scenarios[0];
let revealed = false;
let current;
const clean = (value, max, integer = true) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > max) return 0;
  return integer ? Math.round(number) : Math.round(number * 100) / 100;
};
$('delay').value = clean(params.get('delay'), 21);
$('deposit').value = clean(params.get('deposit'), 50);
$('buffer').value = clean(params.get('buffer'), 20000, false);
$('buffer').step = '0.01';
for (let day = 1; day <= 30; day++) {
  const option = document.createElement('option');
  option.value = String(day); option.textContent = `Day ${day}`; $('guess').append(option);
}
scenarios.forEach((s, i) => {
  const button = document.createElement('button');
  button.type = 'button'; button.dataset.scenario = s.id;
  const label = document.createElement('span'); label.textContent = `Challenge 0${i + 1}`;
  button.append(label, document.createTextNode(s.title));
  button.addEventListener('click', () => { chosen = s; reset(); });
  $('scenarios').append(button);
});
function settings() {
  const buffer = Number($('buffer').value);
  if (!$('buffer').value.trim() || !Number.isFinite(buffer) || buffer < 0 || buffer > 20000 || Math.abs(buffer * 100 - Math.round(buffer * 100)) > .000001) {
    $('buffer').setAttribute('aria-invalid', 'true');
    $('toast').textContent = 'Enter extra opening cash from $0 to $20,000, with no more than two decimal places.';
    return null;
  }
  $('buffer').removeAttribute('aria-invalid');
  return { invoiceDelayDays: Number($('delay').value), depositPercent: Number($('deposit').value), openingBuffer: buffer };
}
function reset() {
  $('delay').value = '0'; $('deposit').value = '0'; $('buffer').value = '0';
  $('guess').value = 'none'; $('feedback').textContent = ''; $('toast').textContent = '';
  revealed = false; render();
}
function render() {
  const values = settings(); if (!values) return false;
  current = simulate(chosen, values);
  const { summary } = current;
  $('delay-out').textContent = `${values.invoiceDelayDays} days`;
  $('deposit-out').textContent = `${values.depositPercent}%`;
  for (const button of $('scenarios').querySelectorAll('button')) button.setAttribute('aria-pressed', String(button.dataset.scenario === chosen.id));
  $('scenario-title').textContent = chosen.title;
  $('scenario-desc').textContent = chosen.description;
  const adjustable = chosen.receipts.find(r => r.id === chosen.adjustableReceiptId);
  $('opening').textContent = `Original opening cash: ${money(chosen.openingCash)}. Selected receipt: ${adjustable.label}, ${money(adjustable.amount)}, originally day ${adjustable.day}.`;
  $('minimum').textContent = revealed ? money(summary.minimumCash) : 'Reveal to see';
  $('minimum').classList.toggle('negative', revealed && summary.minimumCash < 0);
  $('min-day').textContent = revealed ? `First reaches this on day ${current.days.find(d => d.cash === summary.minimumCash).day}` : 'Read the transactions first';
  $('first').textContent = revealed ? summary.firstNegativeDay === null ? 'None' : `Day ${summary.firstNegativeDay}` : 'Your guess?';
  $('first').classList.toggle('negative', revealed && summary.firstNegativeDay !== null);
  $('closing').textContent = money(summary.closingCash);
  $('closing').classList.toggle('negative', summary.closingCash < 0);
  $('chart-box').hidden = !revealed;
  $('status').textContent = summary.extraBufferNeeded > 0
    ? `${money(summary.extraBufferNeeded)} more opening cash would bring the lowest day-end balance to zero with these settings. This is the model's remaining gap, not a suggested loan amount.`
    : 'Every modelled day ends at or above zero. This does not test intraday timing, missing obligations or what happens after day 30.';
  $('pending').textContent = current.pendingReceipts.length
    ? `${money(summary.pendingReceiptsAmount)} is now due after day 30 (${current.pendingReceipts.map(r => `day ${r.day}`).join(', ')}). It remains pending and is excluded from the closing balance.`
    : '';
  $('transactions').replaceChildren();
  const events = current.scheduledEvents.filter(e => e.day <= 30);
  const opening = document.createElement('tr');
  addCell(opening, '0 · Opening cash'); addCell(opening, money(summary.openingCash)); addCell(opening, '—'); addCell(opening, money(summary.openingCash), true); $('transactions').append(opening);
  for (const day of current.days.slice(1).filter(d => d.inflow || d.outflow)) {
    const row = document.createElement('tr');
    const labels = events.filter(e => e.day === day.day).map(e => e.label).join('; ');
    addCell(row, `${day.day} · ${labels}`); addCell(row, day.inflow ? money(day.inflow) : '—'); addCell(row, day.outflow ? `−${money(day.outflow)}` : '—');
    const balance = addCell(row, money(day.cash), true); balance.classList.toggle('negative', day.cash < 0);
    $('transactions').append(row);
  }
  for (const cell of document.querySelectorAll('.balance-cell')) cell.hidden = !revealed;
  if (revealed) chart();
  const share = scenarioURL();
  $('embed').value = `<iframe src="${share}" title="Cash-flow Cliff: a fictional cash-flow challenge" width="100%" height="1100" loading="lazy" style="border:0;"></iframe>`;
  return true;
}
function addCell(row, text, balance = false) {
  const cell = document.createElement('td'); cell.textContent = text;
  if (balance) cell.className = 'balance-cell'; row.append(cell); return cell;
}
function scenarioURL() {
  const url = new URL(canonical); const s = current.settings;
  url.searchParams.set('scenario', chosen.id);
  if (s.invoiceDelayDays) url.searchParams.set('delay', String(s.invoiceDelayDays));
  if (s.depositPercent) url.searchParams.set('deposit', String(s.depositPercent));
  if (s.openingBuffer) url.searchParams.set('buffer', String(s.openingBuffer));
  url.hash = 'play'; return url.href;
}
function svg(tag, attrs, text) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  if (text !== undefined) node.textContent = text; return node;
}
function chart() {
  const original = simulate(chosen), plot = $('chart');
  plot.replaceChildren(svg('title', { id: 'chart-title' }, 'Day-end cash balance in Australian dollars'), svg('desc', { id: 'chart-desc' }, `Fictional 30-day scenario. Your settings have a minimum of ${money(current.summary.minimumCash)} and close at ${money(current.summary.closingCash)}. Grey dashed line shows the original scenario. Negative balances indicate an unfunded gap.`));
  const all = [...current.days, ...original.days].map(d => d.cash);
  let low = Math.min(0, ...all), high = Math.max(0, ...all); const range = high - low || 1000;
  low -= range * .12; high += range * .12;
  const x = day => 78 + day / 30 * 622, y = cash => 224 - (cash - low) / (high - low) * 190;
  const y0 = y(0);
  plot.append(svg('rect', { x: 78, y: y0, width: 622, height: Math.max(0, 224 - y0), fill: '#f9ece6' }));
  for (const cash of [Math.min(...all, 0), 0, Math.max(...all, 0)].filter((v, i, a) => a.indexOf(v) === i)) {
    plot.append(svg('line', { x1: 78, x2: 700, y1: y(cash), y2: y(cash), stroke: cash === 0 ? '#a23a2a' : '#d6dcd1', 'stroke-width': cash === 0 ? 1.5 : 1 }));
    plot.append(svg('text', { x: 70, y: y(cash) + 4, 'text-anchor': 'end', fill: '#536762', 'font-size': 12 }, money(cash)));
  }
  for (const day of [0, 5, 10, 15, 20, 25, 30]) plot.append(svg('text', { x: x(day), y: 245, 'text-anchor': 'middle', fill: '#536762', 'font-size': 12 }, day));
  plot.append(svg('text', { x: 389, y: 273, 'text-anchor': 'middle', fill: '#536762', 'font-size': 13 }, 'Day of fictional month (0 = opening balance)'));
  plot.append(svg('text', { x: 78, y: 18, fill: '#536762', 'font-size': 12 }, 'Cash balance · AUD'));
  const path = days => days.map((d, i) => i === 0 ? `M ${x(d.day)} ${y(d.cash)}` : `H ${x(d.day)} V ${y(d.cash)}`).join(' ');
  plot.append(svg('path', { d: path(original.days), fill: 'none', stroke: '#9ca69e', 'stroke-width': 3, 'stroke-dasharray': '6 5' }));
  plot.append(svg('path', { d: path(current.days), fill: 'none', stroke: '#142c2b', 'stroke-width': 3 }));
  for (const d of current.days.filter(d => d.inflow || d.outflow)) plot.append(svg('circle', { cx: x(d.day), cy: y(d.cash), r: 3, fill: d.cash < 0 ? '#a23a2a' : '#142c2b' }));
}
function reveal() {
  if (!settings()) return;
  revealed = true; render();
  const answer = current.summary.firstNegativeDay === null ? 'none' : String(current.summary.firstNegativeDay);
  const correct = $('guess').value === answer;
  $('feedback').textContent = `${correct ? 'Correct.' : 'Here is the result.'} ${answer === 'none' ? 'No day ends below zero.' : `Day ${answer} is the first negative day.`} Now move the controls and compare the curves.`;
}
async function copyText(text, message) {
  try { await navigator.clipboard.writeText(text); $('toast').textContent = message; }
  catch { $('toast').textContent = 'Automatic copying is unavailable. Select and copy the text below.'; $('embed').value = text; $('embed').focus(); $('embed').select(); }
}
for (const id of ['delay', 'deposit', 'buffer']) $(id).addEventListener('input', () => { $('feedback').textContent = ''; $('toast').textContent = ''; render(); });
$('reset').addEventListener('click', reset);
$('reveal').addEventListener('click', reveal);
$('share').addEventListener('click', () => { if (render()) copyText(scenarioURL(), 'Scenario link copied. It contains only the fictional settings.'); });
$('copy-embed').addEventListener('click', () => { if (render()) copyText($('embed').value, 'Embed code copied.'); });
$('download').addEventListener('click', () => {
  if (!render()) return;
  const lines = ['scenario_id,day,opening_or_day_end_cash_aud,cash_received_aud,cash_paid_aud,invoice_delay_days,deposit_percent,extra_opening_cash_aud,synthetic'];
  for (const d of current.days) lines.push([chosen.id, d.day, d.cash.toFixed(2), d.inflow.toFixed(2), d.outflow.toFixed(2), current.settings.invoiceDelayDays, current.settings.depositPercent, current.settings.openingBuffer.toFixed(2), 'true'].join(','));
  for (const p of current.pendingReceipts) lines.push([chosen.id, p.day, '', p.amount.toFixed(2), '', current.settings.invoiceDelayDays, current.settings.depositPercent, current.settings.openingBuffer.toFixed(2), 'pending_receipt_outside_30_days'].join(','));
  const blob = new Blob([lines.join('\r\n') + '\r\n'], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = `cash-flow-cliff-${chosen.id}.csv`; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000); $('toast').textContent = 'Ledger downloaded. Rows after day 30 are pending receipts, not part of the month-end balance.';
});
$('print').addEventListener('click', () => { if (!settings()) return; revealed = true; render(); window.print(); });
render();
