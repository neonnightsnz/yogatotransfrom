export default async function run(page) {
  const out = {};
  // seed two favourites directly in KV
  await page.evaluate(async () => {
    const t = new URL(location.href).searchParams.get('journey');
    const kv = JSON.parse(await (await fetch('/api/state?journey=' + t)).text());
    kv.y2t = kv.y2t || {}; kv.y2t.meals = kv.y2t.meals || {}; kv.y2t.meals.favourites = ['52771', '52941'];
    await fetch('/api/state?journey=' + t, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(kv) });
  });
  await page.reload(); await page.waitForTimeout(800);
  await page.evaluate(() => [...document.querySelectorAll('nav button')].find(b => b.textContent === 'Meals').click());
  await page.waitForTimeout(300);
  await page.evaluate(() => [...document.querySelectorAll('[data-mv]')].find(b => b.textContent === 'My favourites').click());
  await page.waitForFunction(() => document.querySelectorAll('[data-recipe]').length >= 2, null, { timeout: 20000 }).catch(() => { });
  out.before = await page.evaluate(() => ({ rows: document.querySelectorAll('[data-recipe]').length, names: [...document.querySelectorAll('[data-recipe]')].map(b => b.textContent) }));
  await page.evaluate(() => document.querySelector('[data-unfav]').click());
  await page.waitForTimeout(400);
  out.after = await page.evaluate(() => ({ rows: document.querySelectorAll('[data-recipe]').length }));
  await page.waitForTimeout(1100);
  out.kv = await page.evaluate(async () => { const t = new URL(location.href).searchParams.get('journey'); const kv = JSON.parse(await (await fetch('/api/state?journey=' + t)).text()); return kv.y2t?.meals?.favourites; });
  // cleanup
  await page.evaluate(async () => { const t = new URL(location.href).searchParams.get('journey'); await fetch('/api/state?journey=' + t, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }); });
  return out;
}
