export default async function run(page) {
  const result = {};
  await page.evaluate(async () => { await fetch('/api/state?journey=' + new URL(location.href).searchParams.get('journey'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }); });
  await page.reload();
  await page.waitForTimeout(800);

  // Save two favourites via search
  await page.evaluate(() => [...document.querySelectorAll('nav button')].find(b => b.textContent === 'Meals').click());
  await page.waitForTimeout(300);
  await page.evaluate(() => [...document.querySelectorAll('[data-mv]')].find(b => b.textContent === 'Find recipes').click());
  await page.waitForTimeout(200);
  await page.evaluate(() => { document.querySelector('#msq').value = 'soup'; });
  await page.evaluate(() => document.querySelector('#msb').click());
  await page.waitForFunction(() => document.querySelectorAll('[data-fav]').length > 0, null, { timeout: 20000 });
  await page.evaluate(() => document.querySelectorAll('[data-fav]')[0].click());
  await page.waitForTimeout(200);
  await page.evaluate(() => document.querySelectorAll('[data-fav]')[1].click());
  await page.waitForTimeout(1300); // debounced save

  // New session: open the My favourites tab — names should auto-load
  await page.reload();
  await page.waitForTimeout(800);
  await page.evaluate(() => [...document.querySelectorAll('nav button')].find(b => b.textContent === 'Meals').click());
  await page.waitForTimeout(300);
  await page.evaluate(() => [...document.querySelectorAll('[data-mv]')].find(b => b.textContent === 'My favourites').click());
  result.initial = await page.evaluate(() => [...document.querySelectorAll('.card')].map(c => c.innerText).find(t => t.includes('My favourites'))?.slice(0, 300));
  await page.waitForFunction(() => [...document.querySelectorAll('[data-recipe]')].filter(b => !/^Recipe \d+$/.test(b.textContent)).length >= 2, null, { timeout: 20000 }).catch(() => { });
  result.afterLoad = await page.evaluate(() => ({
    favouritesText: [...document.querySelectorAll('.card')].map(c => c.innerText).find(t => t.includes('My favourites'))?.slice(0, 400),
    namedRecipes: [...document.querySelectorAll('[data-recipe]')].filter(b => !/^Recipe \d+$/.test(b.textContent)).length,
  }));
  // open one
  await page.evaluate(() => [...document.querySelectorAll('[data-recipe]')].find(b => !/^Recipe \d+$/.test(b.textContent))?.click());
  await page.waitForFunction(() => !!document.querySelector('#md-close'), null, { timeout: 20000 }).catch(() => { });
  result.detailOpens = await page.evaluate(() => !!document.querySelector('#md-close'));
  // remove from favourites
  await page.evaluate(() => document.querySelector('#md-close')?.click());
  await page.waitForTimeout(300);
  await page.evaluate(() => [...document.querySelectorAll('[data-mv]')].find(b => b.textContent === 'My favourites').click());
  await page.waitForTimeout(200);
  await page.evaluate(() => document.querySelector('[data-unfav]')?.click());
  await page.waitForTimeout(200);
  result.afterRemove = await page.evaluate(() => [...document.querySelectorAll('.card')].map(c => c.innerText).find(t => t.includes('My favourites'))?.slice(0, 300));
  // cleanup
  await page.evaluate(async () => { await fetch('/api/state?journey=' + new URL(location.href).searchParams.get('journey'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }); });
  return result;
}
