const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

const url = process.argv[2] || pathToFileURL(path.join(__dirname, 'site', 'index.html')).href;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    timezoneId: 'Asia/Shanghai'
  });
  page.setDefaultTimeout(2500);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });

  try {
    const response = await page.goto(url);
    if (response) assert(response.ok(), `HTTP ${response.status()}`);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('.job-card');
    assert.equal(await page.locator('.job-card').count(), 6, 'six demo jobs are shown initially');

    await page.getByRole('button', { name: '餐饮服务', exact: true }).click();
    assert.equal(await page.locator('.job-card').count(), 2, 'category filter works');
    await page.getByRole('button', { name: '全部机会', exact: true }).click();
    await page.getByRole('searchbox').fill('书店');
    assert.equal(await page.locator('.job-card').count(), 1, 'search works');
    await page.getByRole('searchbox').fill('没有这份工作');
    assert(await page.locator('#empty').isVisible(), 'no-results state is shown');
    await page.getByRole('searchbox').fill('');
    await page.locator('[data-day-filter="saturday"]').click();
    assert.equal(await page.locator('.job-card').count(), 4, 'Saturday filter works');
    await page.locator('#pay-filter').selectOption('hourly-20');
    assert.equal(await page.locator('.job-card').count(), 3, 'hourly pay filter works');
    await page.locator('[data-day-filter="sunday"]').click();
    assert.equal(await page.locator('.job-card').count(), 3, 'Sunday filter combines with other filters');
    await page.locator('#pay-filter').selectOption('daily-150');
    assert.equal(await page.locator('.job-card').count(), 1, 'Sunday daily-pay filter keeps the matching market shift');
    await page.locator('[data-day-filter="all"]').click();
    assert.equal(await page.locator('.job-card').count(), 2, 'daily pay filter works');
    await page.locator('#pay-filter').selectOption('all');

    const cafe = page.locator('.job-card').filter({ hasText: '咖啡店周末店员' });
    assert.match(await cafe.innerText(), /(本周|下周)周六 \d+\/\d+/);
    await cafe.locator('.detail-button').click();
    assert(await page.locator('#details').isVisible(), 'job details open');
    assert.match(await page.locator('#detail-content').innerText(), /按实际工时结算/);
    await page.keyboard.press('Escape');
    assert(!(await page.locator('#details').isVisible()), 'Escape closes job details');

    await cafe.locator('.detail-button').click();
    await page.locator('#apply-from-detail').click();
    await page.locator('#application-dialog').waitFor({ state: 'visible' });
    await page.getByLabel('学生昵称', { exact: true }).fill('林同学');
    await page.getByLabel('可工作时间').selectOption({ index: 1 });
    await page.getByRole('button', { name: '确认报名', exact: true }).click();
    assert(await page.locator('#toast').isVisible(), 'application success feedback is shown');
    assert.match(await page.locator('#toast').innerText(), /报名成功/);
    assert(await cafe.locator('.apply-button').isDisabled(), 'the same student cannot apply twice');

    await page.locator('[data-student-view="applications"]').click();
    assert.match(await page.locator('#student-applications').innerText(), /待商家确认/);
    await page.getByRole('button', { name: '商家端', exact: true }).click();
    assert.equal(await page.locator('.application-row').count(), 1, 'merchant sees the student application');
    assert.match(await page.locator('.application-row').innerText(), /林同学/);
    await page.locator('.application-row').getByRole('button', { name: '录用', exact: true }).click();
    assert.match(await page.locator('.application-row').innerText(), /已录用/);

    await page.getByRole('button', { name: '学生端', exact: true }).click();
    await page.locator('[data-student-view="applications"]').click();
    assert.match(await page.locator('#student-applications').innerText(), /已录用/);
    await page.reload();
    await page.locator('[data-student-view="applications"]').click();
    assert.match(await page.locator('#student-applications').innerText(), /已录用/, 'application status survives reload');

    await page.locator('#switch-student').click();
    await page.getByLabel('演示学生昵称').fill('陈同学');
    await page.getByRole('button', { name: '切换身份', exact: true }).click();
    await page.locator('[data-student-view="jobs"]').click();
    const cafeAfterReload = page.locator('.job-card').filter({ hasText: '咖啡店周末店员' });
    await cafeAfterReload.locator('.apply-button').click();
    await page.getByLabel('可工作时间').selectOption({ index: 1 });
    await page.getByRole('button', { name: '确认报名', exact: true }).click();
    await page.getByRole('button', { name: '商家端', exact: true }).click();
    const chenApplication = page.locator('.application-row').filter({ hasText: '陈同学' });
    assert.equal(await chenApplication.count(), 1);
    await chenApplication.getByRole('button', { name: '录用', exact: true }).click();
    assert.match(await page.locator('.merchant-job-card').filter({ hasText: '咖啡店周末店员' }).innerText(), /已招满/);

    await page.getByRole('button', { name: '学生端', exact: true }).click();
    const fullCafe = page.locator('.job-card').filter({ hasText: '咖啡店周末店员' });
    assert.match(await fullCafe.innerText(), /已招满/);
    assert(await fullCafe.locator('.apply-button').isDisabled(), 'a full job cannot accept more applications');

    const bookstore = page.locator('.job-card').filter({ hasText: '书店整理与收银' });
    await bookstore.locator('.apply-button').click();
    await page.getByLabel('可工作时间').selectOption({ index: 0 });
    await page.getByRole('button', { name: '确认报名', exact: true }).click();
    await page.getByRole('button', { name: '商家端', exact: true }).click();
    const bookstoreWork = page.locator('.merchant-job-card').filter({ hasText: '书店整理与收银' });
    const bookstoreApplication = bookstoreWork.locator('.application-row').filter({ hasText: '陈同学' });
    assert.equal(await bookstoreApplication.count(), 1);
    await bookstoreApplication.getByRole('button', { name: '不录用', exact: true }).click();
    assert.match(await bookstoreApplication.innerText(), /未录用/);
    await page.getByRole('button', { name: '学生端', exact: true }).click();
    await page.locator('[data-student-view="applications"]').click();
    assert.match(await page.locator('#student-applications').innerText(), /未录用/, 'rejection status syncs to the student view');
    await page.getByRole('button', { name: '商家端', exact: true }).click();

    await page.locator('#post-job-open').click();
    await page.getByLabel('商家名称').fill('大学城展览空间');
    await page.getByLabel('岗位名称').fill('周末展览签到协助');
    await page.getByLabel('工作内容').fill('协助来访者签到与现场指引。');
    const postDates = await page.evaluate(() => {
      const formatLocalDate = date => [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0')
      ].join('-');
      const nextWeekday = target => {
        const date = new Date();
        const days = (target - date.getDay() + 7) % 7 || 7;
        date.setDate(date.getDate() + days);
        return formatLocalDate(date);
      };
      return {
        saturday: nextWeekday(6),
        sunday: nextWeekday(0),
        monday: nextWeekday(1)
      };
    });
    await page.getByRole('textbox', { name: '工作日期' }).fill(postDates.monday);
    await page.getByLabel('开始时间').fill('10:00');
    await page.getByLabel('结束时间').fill('16:00');
    await page.getByLabel('薪资金额').fill('150');
    await page.getByLabel('薪资单位').selectOption('天');
    await page.getByLabel('工作地点').fill('大学城 · 艺术中心');
    await page.getByLabel('招募人数').fill('2');
    await page.getByLabel('结算方式').fill('活动结束后结算（示例）');
    assert.equal(await page.locator('#post-date').evaluate(input => input.checkValidity()), false, 'weekday dates are invalid');
    await page.getByRole('button', { name: '发布岗位', exact: true }).click();
    assert(await page.locator('#post-job-dialog').isVisible(), 'the merchant can correct the invalid date');
    assert.equal(await page.locator('.merchant-job-card').count(), 6, 'weekday jobs are not published');
    await page.getByRole('textbox', { name: '工作日期' }).fill(postDates.saturday);
    assert.equal(await page.locator('#post-date').evaluate(input => input.checkValidity()), true, 'Saturday dates are valid');
    await page.getByRole('textbox', { name: '工作日期' }).fill(postDates.sunday);
    assert.equal(await page.locator('#post-date').evaluate(input => input.checkValidity()), true, 'Sunday dates are valid');
    await page.getByRole('textbox', { name: '工作日期' }).fill(postDates.saturday);
    await page.getByRole('button', { name: '发布岗位', exact: true }).click();
    assert(await page.locator('#toast').isVisible());
    assert.match(await page.locator('#toast').innerText(), /岗位已发布/);
    await page.getByRole('button', { name: '学生端', exact: true }).click();
    await page.locator('[data-student-view="jobs"]').click();
    await page.getByRole('searchbox').fill('展览签到');
    assert.equal(await page.locator('.job-card').count(), 1, 'new merchant job appears in the student listing');
    await page.getByRole('searchbox').fill('');

    await page.reload();
    await page.getByRole('searchbox').fill('展览签到');
    assert.equal(await page.locator('.job-card').count(), 1, 'published jobs survive reload');
    await page.getByRole('searchbox').fill('');
    await page.getByRole('button', { name: '重置演示数据', exact: true }).click();
    assert.equal(await page.locator('.job-card').count(), 6, 'reset restores the six seed jobs');
    await page.locator('[data-student-view="applications"]').click();
    assert.match(await page.locator('#student-applications').innerText(), /还没有报名记录/);
    await page.locator('[data-student-view="jobs"]').click();
    await page.locator('#toast').waitFor({ state: 'hidden' });

    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'desktop layout has no horizontal overflow');
    await page.screenshot({ path: 'desktop.png', fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: 'mobile.png', fullPage: true });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'mobile layout has no horizontal overflow');
    const cardGaps = await page.locator('.job-card').evaluateAll(cards => cards.slice(1).map((card, index) => {
      const previous = cards[index].getBoundingClientRect();
      return card.getBoundingClientRect().top - previous.bottom;
    }));
    assert(cardGaps.every(gap => gap < 80), `mobile job cards have no large blank gaps: ${cardGaps.join(', ')}`);
    await page.getByRole('button', { name: '商家端', exact: true }).click();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'mobile merchant workspace has no horizontal overflow');
    assert.equal(await page.locator('.merchant-job-card').count(), 6, 'merchant workspace adapts to mobile');
    assert.deepEqual(errors, [], `no JavaScript errors: ${errors.join('; ')}`);

    console.log('PASS: listing, category/search/weekend/pay filters, details, duplicate protection, apply→hire→status sync, reject, capacity, weekend-date validation, publish, reload persistence, reset, mobile layout, and no JS errors.');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
