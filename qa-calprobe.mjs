export default async function run(page) {
  await page.waitForTimeout(2500);
  const probe = await page.evaluate(() => ({
    calType: typeof window.Cal,
    loaded: window.Cal ? window.Cal.loaded : null,
    ns: window.Cal && window.Cal.ns ? Object.keys(window.Cal.ns) : null,
    embedScriptPresent: !!document.querySelector('script[src*="cal.com/embed"]'),
  }));
  // does the embed script actually fetch OK?
  const resp = await page.evaluate(async () => {
    try {
      const r = await fetch('https://app.cal.com/embed/embed.js', { method: 'GET' });
      return { ok: r.ok, status: r.status, type: r.type };
    } catch (e) { return { error: String(e) }; }
  });
  return { probe, resp };
}