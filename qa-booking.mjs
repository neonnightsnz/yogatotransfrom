export default async function run(page) {
  const out = {};

  // ---------- 1. Overview check-in button ----------
  await page.goto('http://127.0.0.1:8799/');
  await page.waitForTimeout(800);
  out.overview = await page.evaluate(() => {
    const a = document.querySelector('#checkin-action a');
    if (!a) return { error: 'no button' };
    return {
      text: a.textContent,
      href: a.getAttribute('href'),
      target: a.getAttribute('target'),          // must be null now
      calLink: a.getAttribute('data-cal-link'),
      calNs: a.getAttribute('data-cal-namespace'),
      calConfig: a.getAttribute('data-cal-config'),
    };
  });
  // Cal embed script must be present
  out.overviewEmbedLoaded = await page.evaluate(() => typeof window.Cal === 'function');

  // Click it and see whether a NEW page/tab opens (the bug)
  const before = page.context().pages().length;
  const popupPromise = page.waitForEvent('popup', { timeout: 3000 }).catch(() => null);
  await page.evaluate(() => document.querySelector('#checkin-action a').click());
  const popup = await popupPromise;
  await page.waitForTimeout(1500);
  out.overviewClick = {
    newPageOpened: page.context().pages().length > before,
    popupUrl: popup ? popup.url() : null,
    stayedOnPage: page.url().includes('127.0.0.1:8799'),
  };
  if (popup) await popup.close().catch(() => { });

  // ---------- 2. Pause & Choose "Book a chat with Kristina" ----------
  await page.goto('http://127.0.0.1:8799/journey?tab=menu');
  await page.waitForTimeout(1200);
  // scroll to the help card
  out.menu = await page.evaluate(() => {
    const links = [...document.querySelectorAll('a')];
    const b = links.find(a => a.textContent.includes('Book a chat with'));
    if (!b) return { error: 'no book button', buttons: links.map(a => a.textContent).slice(0, 20) };
    return {
      text: b.textContent,
      href: b.getAttribute('href'),
      target: b.getAttribute('target'),          // should be null
      calLink: b.getAttribute('data-cal-link'),
      calNs: b.getAttribute('data-cal-namespace'),
      calConfig: b.getAttribute('data-cal-config'),
    };
  });
  out.journeyEmbedLoaded = await page.evaluate(() => typeof window.Cal === 'function');

  const before2 = page.context().pages().length;
  const popup2Promise = page.waitForEvent('popup', { timeout: 3000 }).catch(() => null);
  await page.evaluate(() => [...document.querySelectorAll('a')].find(a => a.textContent.includes('Book a chat with')).click());
  const popup2 = await popup2Promise;
  await page.waitForTimeout(1500);
  out.menuClick = {
    newPageOpened: page.context().pages().length > before2,
    popupUrl: popup2 ? popup2.url() : null,
    stayedOnPage: page.url().includes('127.0.0.1:8799'),
  };
  if (popup2) await popup2.close().catch(() => { });

  return out;
}