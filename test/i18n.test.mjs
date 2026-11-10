// Run: node --test test/*.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../dist/climate-control-card.js', import.meta.url), 'utf8');
const escLine = src.split('\n').find(l => l.trim().startsWith('const esc ='));
const start = src.indexOf('  const I18N = {');
const end = src.indexOf('  const hhmm=');
assert.ok(escLine && start > 0 && end > start, 'i18n block not found');
const load = () => new Function(`${escLine}\n${src.slice(start, end)}\nreturn {I18N,setLang,tr,trh,monthNames,get LANG(){return LANG},get LOCALE(){return LOCALE}};`)();

// Card code without the dictionary block, so key lookups only see real usages.
const code = src.slice(0, start) + src.slice(end);
const literalKeys = [...new Set([...code.matchAll(/\btrh?\(\s*['"`](\w+)['"`]\s*[,)]/g)].map(m => m[1]))];
// tr('hvac_'+m): the suffix comes from a runtime value, only the prefix is visible.
const dynamicPrefixes = [...new Set([...code.matchAll(/\btrh?\(\s*['"`](\w+)['"`]\s*\+/g)].map(m => m[1]))];

test('every tr()/trh() key used in the card exists in the dictionary', () => {
  const { I18N } = load();
  assert.ok(literalKeys.length > 100, `key scan found only ${literalKeys.length} keys`);
  assert.deepEqual(literalKeys.filter(k => !(k in I18N.it)), []);
  for (const p of dynamicPrefixes)
    assert.ok(Object.keys(I18N.it).some(k => k.startsWith(p)), `no keys for prefix ${p}`);
});

test('no dead keys in the dictionary', () => {
  const { I18N } = load();
  // Keys passed as variables (trh(k) over ['today','week','month']) still appear as string literals.
  const used = k => dynamicPrefixes.some(p => k.startsWith(p)) || new RegExp(`['"\`]${k}['"\`]`).test(code);
  assert.deepEqual(Object.keys(I18N.it).filter(k => !used(k)), []);
});

test('every language has the same keys as Italian', () => {
  const { I18N } = load();
  const it = Object.keys(I18N.it).sort();
  for (const lang of ['en', 'pl']) assert.deepEqual(Object.keys(I18N[lang]).sort(), it, lang);
});

test('no empty translations and placeholders match', () => {
  const { I18N } = load();
  const ph = s => (s.match(/\{\w+\}/g) || []).sort().join();
  for (const [lang, dict] of Object.entries(I18N))
    for (const [k, v] of Object.entries(dict)) {
      assert.ok(typeof v === 'string' && v.trim(), `${lang}.${k} empty`);
      assert.equal(ph(v), ph(I18N.it[k]), `${lang}.${k} placeholders`);
    }
});

test('twelve months in every language', () => {
  const { I18N } = load();
  for (const dict of Object.values(I18N)) assert.equal(dict.months.split(',').length, 12);
});

test('language resolution and fallback', () => {
  const m = load();
  m.setLang({ locale: { language: 'pl' } }); assert.equal(m.LANG, 'pl'); assert.equal(m.tr('heating'), 'Ogrzewanie');
  m.setLang({ locale: { language: 'pl-PL' } }); assert.equal(m.LANG, 'pl');
  m.setLang({ language: 'it' }); assert.equal(m.tr('heating'), 'Riscaldamento');
  m.setLang({ locale: { language: 'de' } }); assert.equal(m.LANG, 'en'); assert.equal(m.LOCALE, 'de'); assert.equal(m.tr('heating'), 'Heating');
  m.setLang({ locale: { language: 'not a locale!!' } }); assert.equal(m.LOCALE, 'en');
  assert.equal(m.tr('missing_key'), 'missing_key');
  m.setLang({ locale: { language: 'en' } });
  assert.equal(m.tr('valve_n', { n: 3 }), 'Valve 3');
  m.setLang({ locale: { language: 'it' } });
  assert.equal(m.trh('aut_hint'), 'Configura automazioni nell&#39;editor della card.');
  assert.equal(m.monthNames()[0], 'Gen');
});
