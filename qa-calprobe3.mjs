export default async function run(page) {
  const events = [];
  page.on('request', r => { if (r.url().includes('cal.com')) events.push('REQ ' + r.url().slice(0, 90)); });
  page.on('requestfailed', r => { if (r.url().includes('cal.com')) events.push('FAIL ' + r.url().slice(0, 90) + ' :: ' + (r.failure()?.errorText || '')); });
  await page.goto('http://127.0.0.1:8799/');
  await page.waitForTimeout(4000);
  // What did Cal add to the DOM?
  const dom = await page.evaluate(() => ({
    calScripts: [...document.querySelectorAll('script[src*="cal.com"]')].length,
    bodyCalEls: [...document.querySelectorAll('*')].filter(e => [...e.attributes].some(a => a.name.startsWith('data-cal'))).map(e => e.tagName + ':' + [...e.attributes].map(a => a.name).join(',')).slice(0, 10),
    calEmbeds: document.querySelectorAll('.cal-embed').length,
  }));
  // click and record what happens
  await page.evaluate(() => [...document.querySelectorAll('a')].find(x => x.textContent.includes('Book a check-in')).click());
  await page.waitForTimeout(3000);
  return { dom, events: events.slice(0, 12), finalUrl: page.url() };
}