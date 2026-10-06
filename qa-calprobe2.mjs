export default async function run(page) {
  const logs = [];
  page.on('console', m => logs.push(m.type() + ': ' + m.text()));
  page.on('pageerror', e => logs.push('pageerror: ' + e.message));
  const reqs = [];
  page.on('requestfailed', r => reqs.push(r.url() + ' :: ' + (r.failure()?.errorText || '')));

  await page.goto('http://127.0.0.1:8799/');
  await page.waitForTimeout(3500);

  const info = await page.evaluate(() => {
    const s = [...document.querySelectorAll('script[src*="cal.com"]')];
    return {
      tags: s.map(x => ({ src: x.src, async: x.async, defer: x.defer, type: x.type })),
      calType: typeof window.Cal,
      keys: Object.keys(window).filter(k => /cal/i.test(k)).slice(0, 20),
    };
  });

  // fetch the embed source and look at its first bytes / whether it's JS
  const head = await page.evaluate(async () => {
    const r = await fetch('https://app.cal.com/embed/embed.js');
    const t = await r.text();
    return { len: t.length, start: t.slice(0, 160), ctype: r.headers.get('content-type') };
  });

  return { info, head, logs: logs.slice(0, 15), reqs };
}