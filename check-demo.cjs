// Run: node check-demo.cjs (with the local preview on port 8765).
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/ADMIN/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:8765/team3_demo.html');
  await page.screenshot({ path: 'D:/teams3/desktop-preview.png', fullPage: true });
  assert.equal(await page.locator('h1').textContent(), 'Good morning, Team3.');
  await page.evaluate(() => openProject('p0'));
  await page.getByRole('button', { name: 'Complete & hand off', exact: true }).click();
  await page.locator('[name=doc]').selectOption({ label: 'Furniture & floor layout · V2' });
  await page.locator('[name=note]').fill('Drafting complete; proceed with structural review.');
  await page.locator('#modal').getByRole('button', { name: 'Complete & hand off', exact: true }).click();
  assert.equal(await page.evaluate(() => project('p0').stage), 3);
  assert(await page.evaluate(() => project('p0').history.at(-1).note.includes('V2')));
  await page.evaluate(() => openProject('p2'));
  await page.getByRole('button', { name: 'Complete & hand off', exact: true }).click();
  assert(await page.locator('#modal button:has-text("Complete & hand off")').isDisabled());
  await page.evaluate(() => closeModal());
  await page.evaluate(() => { mobileTab = 'approval'; go('mobile'); });
  await page.screenshot({ path: 'D:/teams3/mobile-preview.png', fullPage: true });
  await page.locator('.phone').getByRole('button', { name: 'Approve', exact: true }).click();
  await page.locator('#modal').getByRole('button', { name: 'Approve & release to client' }).click();
  assert.equal(await page.evaluate(() => project('p3').stage), 6);
  await page.evaluate(() => openProject('p3'));
  await page.getByRole('button', { name: 'Record client decision' }).click();
  await page.locator('[name=note]').fill('Client approved by email; demo reference C-01.');
  await page.getByRole('button', { name: 'Record decision', exact: true }).click();
  assert.equal(await page.evaluate(() => project('p3').stage), 7);
  // A new version of the approved package must invalidate the release.
  await page.evaluate(() => uploadDialog('p3'));
  const packageId = await page.evaluate(() => project('p3').package);
  await page.locator('[name=previous]').selectOption(packageId);
  await page.locator('[name=sample]').check();
  await page.locator('#modal').getByRole('button', { name: 'Save document', exact: true }).click();
  assert.equal(await page.evaluate(() => project('p3').stage), 4);
  assert.equal(await page.evaluate(() => project('p3').package), null);
  // Real file content survives reload and is retrieved by document ID.
  await page.evaluate(() => uploadDialog('p0', true));
  await page.locator('[name=name]').fill('Site measurement notes');
  await page.locator('[name=file]').setInputFiles({ name: 'measurements.txt', mimeType: 'text/plain', buffer: Buffer.from('Beam span: demo measurement 4200 mm.') });
  await page.locator('#modal').getByRole('button', { name: 'Attach & send', exact: true }).click();
  await page.waitForFunction(() => !document.getElementById('modal').open);
  const docId = await page.evaluate(() => state.docs.at(-1).id);
  await page.reload();
  assert.equal(await page.evaluate(async id => (await getBlob(id)).text(), docId), 'Beam span: demo measurement 4200 mm.');
  assert(await page.evaluate(id => state.messages.some(m => m.doc === id), docId));
  await page.evaluate(() => { docQuery = 'Amit Sharma'; go('documents'); });
  assert((await page.locator('#docResults tbody tr').count()) >= 4);
  await page.evaluate(() => { chatProject = 'p0'; go('chat'); });
  await page.locator('[name=message]').fill('Please check the new site measurement notes.');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await page.evaluate(() => { mobileTab = 'chat'; mobileChannel = true; go('mobile'); });
  assert(await page.locator('.phone').getByText('Please check the new site measurement notes.').isVisible());
  await page.evaluate(() => go('attendance'));
  await page.getByRole('button', { name: 'Clock in', exact: true }).click();
  await page.getByRole('button', { name: 'Start session', exact: true }).click();
  assert.equal(await page.evaluate(() => state.sessions.filter(s => s.employee === 'Meena J.' && s.end === null).length), 1);
  const clockId = await page.evaluate(() => state.sessions.at(-1).id);
  await page.evaluate(id => { state.sessions.find(s => s.id === id).start -= 3600000; clockOut(id); }, clockId);
  assert((await page.evaluate(id => sessionHours(state.sessions.find(s => s.id === id)), clockId)) >= 1);
  // Cross-midnight sessions count only the overlap with the selected day.
  assert.equal(await page.evaluate(() => { const [a,b] = dayBounds(today()); return sessionHours({ start: a - 3600000, end: a + 2 * 3600000 }, a, b); }), 2);
  await page.evaluate(() => newProject());
  await page.locator('[name=name]').fill('Demo Direct Client');
  await page.locator('[name=client]').fill('Sample Client');
  await page.locator('[name=brief]').fill('Test the full direct-to-client path.');
  await page.locator('[name=route]').selectOption('client');
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  const newId = await page.evaluate(() => state.projects.at(-1).id);
  for (let stage = 0; stage <= 4; stage++) {
    await page.evaluate(id => uploadDialog(id), newId);
    await page.locator('[name=name]').fill('Deliverable for stage ' + stage);
    if (stage) await page.locator('[name=team]').selectOption(['Architect','Drafting','Structural','Visualizer'][stage-1]);
    await page.locator('[name=sample]').check();
    await page.getByRole('button', { name: 'Save document', exact: true }).click();
    await page.evaluate(id => handoffDialog(id), newId);
    await page.locator('[name=doc]').selectOption({ index: 1 });
    await page.locator('[name=note]').fill('Stage checked and completed.');
    await page.locator('#modal button.btn.primary').click();
  }
  assert.equal(await page.evaluate(id => project(id).stage, newId), 6);
  assert.equal(await page.evaluate(id => project(id).records.some(r => r.stage === 5), newId), false);
  await page.evaluate(id => revisionDialog(id), newId);
  await page.locator('[name=stage]').selectOption('2');
  await page.locator('[name=note]').fill('Client asked for a furniture layout revision.');
  await page.getByRole('button', { name: 'Send for revision', exact: true }).click();
  assert.equal(await page.evaluate(id => project(id).stage, newId), 2);
  assert.equal(await page.evaluate(id => project(id).records.filter(r => r.stage === 3).at(-1).completed, newId), null);
  for (const route of ['dashboard','projects','documents','chat','approval','attendance','reports','mobile','guide']) {
    await page.evaluate(route => go(route), route);
    assert.equal(await page.locator('h1').count(), route === 'reports' ? 4 : 1);
  }
  const downloads = page.waitForEvent('download');
  await page.evaluate(() => exportProjects());
  assert.equal((await downloads).suggestedFilename(), 'Team3-project-report.csv');
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ['dashboard','projects','documents','chat','attendance','mobile','guide']) {
    await page.evaluate(route => go(route), route);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), route + ' should not overflow horizontally');
  }
  await page.screenshot({ path: 'D:/teams3/responsive-preview.png', fullPage: true });
  assert.deepEqual(errors, []);
  console.log('PASS: sequential/direct routing, blockers, owner/client gates, revision invalidation, version history, file persistence, chat sync, clocks, exports, all screens and responsive overflow.');
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
