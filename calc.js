/**
 * Compound loss calculator — Locro landing page.
 *
 * The model, in one line:
 *   revenue × error-rate = annual loss; Locro prevents a share of it;
 *   a slice of each year's loss is lasting damage (a client who doesn't
 *   come back) and carries into every later year — that carry-forward
 *   is what makes the totals compound.
 *
 * Everything runs in the browser. Nothing is sent or stored.
 */

const HORIZONS = [3, 5, 10];            // years shown in the result tiles
const LOCALE = 'en-GB';

const hasDom = typeof document !== 'undefined';
const form = hasDom ? document.getElementById('calc-form') : null;
const outputs = {};
if (hasDom) document.querySelectorAll('[data-out]').forEach(el => { outputs[el.dataset.out] = el; });

/** Read a non-negative number from a form field, or null if it's empty/invalid. */
function readNumber(name) {
  const v = parseFloat(form.elements[name].value);
  return Number.isFinite(v) && v >= 0 ? v : null;
}

/**
 * Round down to 3 significant figures so the result never looks more
 * precise than the inputs (e.g. 23,456 → 23,400). Rounding down keeps
 * the estimate conservative.
 */
function roundDown3sf(n) {
  if (n < 1000) return Math.floor(n);
  const step = 10 ** (Math.floor(Math.log10(n)) - 2);
  return Math.floor(n / step) * step;
}

const euro = n => '€' + roundDown3sf(n).toLocaleString(LOCALE);
const pct = n => n.toLocaleString(LOCALE, { maximumFractionDigits: 2 }) + '%';

/**
 * Cumulative saving over `years`.
 *
 * Year k is worth  annual × (1 + carry × (k − 1))  — this year's saving plus
 * the lasting share of every earlier year. Summing k = 1..n gives:
 *
 *   annual × ( n + carry × n(n − 1) / 2 )
 */
function cumulative(years, annual, carry) {
  return annual * (years + carry * years * (years - 1) / 2);
}

function set(key, text) {
  if (outputs[key]) outputs[key].textContent = text;
}

function clear() {
  set('gross', '—');
  set('annual', '—');
  set('working', '');
  HORIZONS.forEach(y => set('y' + y, '—'));
}

/** The sum written out, so a visitor can follow (and defend) the number. */
function explain(revenue, errorPct, reductionPct, carryPct, gross, annual) {
  const last = HORIZONS[HORIZONS.length - 1];
  let s = `How it's worked out: ${euro(revenue)} × ${pct(errorPct)} = ${euro(gross)} lost a year, ` +
          `of which Locro prevents ${pct(reductionPct)} = ${euro(annual)}. `;
  s += carryPct > 0
    ? `Each year, ${pct(carryPct)} of the loss carries into every year after it — ` +
      `so year ${last} alone is worth ${euro(annual * (1 + carryPct / 100 * (last - 1)))}.`
    : 'With nothing carried forward, each year is worth the same.';
  return s;
}

function update() {
  const revenue = readNumber('revenue');
  const errorPct = readNumber('error');
  const reductionPct = readNumber('reduction');
  const carryPct = readNumber('carry');

  // Echo the folded-away assumptions in their summary line
  set('reduction', reductionPct === null ? '—' : String(reductionPct));
  set('carry', carryPct === null ? '—' : String(carryPct));

  if ([revenue, errorPct, reductionPct, carryPct].some(v => v === null)) return clear();

  const gross = revenue * errorPct / 100;
  const annual = gross * reductionPct / 100;

  set('gross', euro(gross));
  set('annual', euro(annual));
  set('working', explain(revenue, errorPct, reductionPct, carryPct, gross, annual));
  HORIZONS.forEach(y => set('y' + y, euro(cumulative(y, annual, carryPct / 100))));
}

if (form) {
  form.addEventListener('input', update);
  form.addEventListener('submit', e => e.preventDefault());
  update();
}

// Exported for tests (ignored in the browser)
if (typeof module !== 'undefined') module.exports = { cumulative, roundDown3sf };
