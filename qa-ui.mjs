export default async function run(page) {
  const result = {};
  const click = async (sel) => page.evaluate((s) => document.querySelector(s)?.click(), sel);

  // --- 1. Three-choice progress bar + post-completion check-in ---
  await click('#challenge-open');
  await page.waitForTimeout(200);
  await page.evaluate(() => document.querySelectorAll('.chip[data-p]').forEach((c, i) => { if (i < 2) c.click(); }));
  await page.waitForTimeout(150);
  await click('#st');
  await page.waitForTimeout(200);
  result.progressInitial = await page.evaluate(() => ({
    label: document.querySelector('#task-progress-label')?.textContent,
    value: document.querySelector('#task-progress')?.value,
    max: document.querySelector('#task-progress')?.max,
  }));
  // tick both (2 of 3) -> no check-in yet
  await page.evaluate(() => document.querySelectorAll('[data-i]').forEach(b => b.click()));
  await page.waitForTimeout(200);
  result.progressAfterTwo = await page.evaluate(() => ({
    label: document.querySelector('#task-progress-label')?.textContent,
    value: document.querySelector('#task-progress')?.value,
    checkinShown: document.querySelector('[data-dayfeel]') !== null,
    msg: document.querySelector('.msg')?.textContent,
  }));
  // change choices -> re-pick 3rd -> complete all three -> check-in appears
  await click('#ch');
  await page.waitForTimeout(200);
  await page.evaluate(() => document.querySelectorAll('.chip[data-p]').forEach((c, i) => { if (i < 3) c.click(); }));
  await click('#st');
  await page.waitForTimeout(200);
  await page.evaluate(() => document.querySelectorAll('[data-i]').forEach(b => { if (!b.checked) b.click(); }));
  await page.waitForTimeout(250);
  result.progressComplete = await page.evaluate(() => ({
    label: document.querySelector('#task-progress-label')?.textContent,
    value: document.querySelector('#task-progress')?.value,
    checkinShown: document.querySelectorAll('[data-dayfeel]').length === 5,
    msg: document.querySelector('.msg')?.textContent,
  }));
  // pick a feeling
  await page.evaluate(() => document.querySelector('[data-dayfeel="4"]').click());
  await page.waitForTimeout(200);
  result.feelingPicked = await page.evaluate(() => document.querySelector('[data-dayfeel="4"]')?.getAttribute('aria-pressed'));
  // untick one -> check-in disappears again
  await page.evaluate(() => document.querySelector('[data-i]').click());
  await page.waitForTimeout(200);
  result.checkinHidesWhenIncomplete = await page.evaluate(() => document.querySelector('[data-dayfeel]') === null);

  // --- 2. Tomorrow challenges checkbox flow ---
  // tick the gift "Choose tomorrow's 3 challenges"
  const ticked = await page.evaluate(() => {
    const box = [...document.querySelectorAll('[data-gi]')].find(b => b.closest('label')?.innerText.toLowerCase().includes('tomorrow'));
    if (box) { box.click(); return true; } return false;
  });
  await page.waitForTimeout(200);
  result.giftTicked = ticked;
  result.openButtonShown = await page.evaluate(() => !!document.querySelector('#topen'));
  await click('#topen');
  await page.waitForTimeout(200);
  await page.evaluate(() => document.querySelectorAll('.chip[data-p2]').forEach((c, i) => { if (i < 3) c.click(); }));
  await page.waitForTimeout(150);
  result.counter = await page.evaluate(() => [...document.querySelectorAll('.sub')].map(s => s.textContent).find(t => t.includes('of 3 chosen for')));
  await click('#tsave');
  await page.waitForTimeout(200);
  result.readyMsg = await page.evaluate(() => document.querySelector('#main').innerText.includes('ready for future-you'));
  // untick gift: picker message should disappear
  await page.evaluate(() => {
    const box = [...document.querySelectorAll('[data-gi]')].find(b => b.closest('label')?.innerText.toLowerCase().includes('tomorrow'));
    box?.click();
  });
  await page.waitForTimeout(200);
  result.msgGoneWhenUnticked = await page.evaluate(() => !document.querySelector('#main').innerText.includes('ready for future-you'));

  // --- 3. Overview width on mobile ---
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:8799/');
  await page.waitForTimeout(600);
  result.overviewMobile = await page.evaluate(() => {
    const main = document.querySelector('main');
    const cs = getComputedStyle(main);
    const card = document.querySelector('.card');
    return {
      maxWidth: cs.maxWidth,
      actualWidth: main.getBoundingClientRect().width,
      viewport: window.innerWidth,
      noHorizontalOverflow: document.documentElement.scrollWidth <= window.innerWidth,
      cardFits: card ? card.getBoundingClientRect().right <= window.innerWidth + 1 : false,
    };
  });
  // check-in card placeholder on overview
  result.checkinPlaceholder = await page.evaluate(() => document.querySelector('#checkin-action')?.textContent.trim());
  return result;
}
