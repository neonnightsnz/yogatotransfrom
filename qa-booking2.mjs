export default async function run(page) {
  const out = {};

  async function testButton(url, findText) {
    await page.goto(url);
    await page.waitForTimeout(3500); // let the Cal embed finish initialising
    const before = page.context().pages().length;
    const urlBefore = page.url();

    // does the embed mark the button as initialised?
    const pre = await page.evaluate((t) => {
      const a = [...document.querySelectorAll('a')].find(x => x.textContent.includes(t));
      return a ? {
        text: a.textContent, href: a.getAttribute('href'), target: a.getAttribute('target'),
        calLink: a.getAttribute('data-cal-link'), hasCalParent: !!a.closest('[data-cal-namespace], .cal-embed'),
      } : null;
    }, findText);

    const popupP = page.waitForEvent('popup', { timeout: 6000 }).catch(() => null);
    await page.evaluate((t) => [...document.querySelectorAll('a')].find(x => x.textContent.includes(t)).click(), findText);
    await page.waitForTimeout(2500);

    // Cal renders its modal inside an iframe in the SAME document
    const inline = await page.evaluate(() => {
      const ifr = [...document.querySelectorAll('iframe')].map(f => f.src);
      const dlg = document.querySelector('[role="dialog"], .cal-modal, cal-modal-box, [data-cal-modal]');
      return { iframes: ifr, hasDialog: !!dlg, dialogText: dlg ? dlg.textContent.slice(0, 120) : null };
    });

    const popup = await popupP;
    return {
      pre,
      newPageOpened: page.context().pages().length > before,
      popupUrl: popup ? popup.url() : null,
      stayedOnPage: page.url() === urlBefore,
      inlineEmbed: inline,
    };
  }

  out.overview = await testButton('http://127.0.0.1:8799/', 'Book a check-in');
  out.pauseAndChoose = await testButton('http://127.0.0.1:8799/journey?tab=menu', 'Book a chat with Kristina');
  return out;
}