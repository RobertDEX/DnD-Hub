const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const { resolve } = require('node:path');
const { chromium } = require('playwright');

const root = resolve(__dirname, '..');
const source = file => readFileSync(resolve(root, file), 'utf8');
// Exercise the actual UI renderers without initializing the shared Firebase backend.
function declaration(file, name) {
  const text = source(file);
  const start = text.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `Missing renderer: ${name}`);
  const firstLine = text.slice(start, text.indexOf('\n', start)).trimEnd();
  if (firstLine.endsWith('}')) return firstLine;
  const end = text.indexOf('\n}', start);
  assert.notEqual(end, -1, `Missing renderer end: ${name}`);
  return text.slice(start, end + 2);
}

let browser;
before(async () => {
  const executablePath = process.env.CHROMIUM_PATH ||
    (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
  browser = await chromium.launch({ executablePath, args: ['--no-sandbox'] });
});
after(async () => { await browser?.close(); });

const setup = `
  const STATS = ['STR','DEX','CON','INT','WIS','CHA'];
  const character = {
    stats: Object.fromEntries(STATS.map(s => [s, 10])),
    race: 'faunus', faunusBonusStat: 'STR', systemStats: { str: 10 },
    points: 100, rank: 'E', level: 1
  };
  const el = id => document.getElementById(id);
  const getChar = () => character;
  const fmtMod = n => n >= 0 ? '+' + n : String(n);
  let writes = 0;
  const pushState = () => writes++;
  const renderSkillsMatrix = () => {};
  const renderCalcPanel = () => {};
  const renderMagicBanner = () => {};
  const renderHeader = () => {};
  const renderStatusWindow = () => {};
  const getMagicCat = () => null;
  let statsLocked = false;
  const canEditStats = () => !statsLocked;
  const FAUNUS_STAT_BONUS = 5;
  const featStatBonus = () => 2;
  const STAT_LABELS = Object.fromEntries(STATS.map(s => [s, s]));
  const getClassDef = () => ({ bonuses: { STR: 1 } });
  const STATUS_POINTS_PER_DND_POINT = 5;
`;

for (const file of ['Fairy_Tail/ft.js', 'RWBY/rwby.js', 'RWBY/rwby2.js', 'Dungeon_Slop/Dungeonslop.js']) {
  test(`${file}: multi-digit stats retain focus and update modifiers`, async () => {
    const page = await browser.newPage();
    try {
      await page.setContent('<div id="statsGrid"></div><div id="basePointsRemaining"></div>');
      const dungeon = file.startsWith('Dungeon');
      let helpers = declaration(file, 'mod');
      if (!file.startsWith('Fairy')) helpers += '\n' + declaration(file, 'effectiveStat');
      if (dungeon) {
        for (const name of ['systemStatDndBonus', 'totalBasePoints', 'basePointsSpent', 'basePointsRemaining']) {
          helpers += '\n' + declaration(file, name);
        }
      }
      await page.addScriptTag({ content: setup + helpers + '\n' + declaration(file, 'renderStats') + '\nrenderStats();' });
      const input = page.locator(dungeon ? '.stat-score[data-stat="STR"]' : '.stat-score-input[data-stat="STR"]');
      await input.fill('');
      await input.pressSequentially('18');
      assert.equal(await input.inputValue(), '18');
      assert.equal(await input.evaluate(node => document.activeElement === node), true);
      assert.equal(await page.evaluate(() => character.stats.STR), 18);
      const expected = dungeon ? '5' : file.startsWith('Fairy') ? '+4' : '+7';
      assert.equal(await page.locator(dungeon ? '.stat-mod-val' : '.stat-mod').first().textContent(), expected);
      if (file.startsWith('RWBY')) {
        assert.equal(await page.locator('.stat-eff').textContent(), '▸ 25');
        await page.evaluate(() => { statsLocked = true; renderStats(); });
        assert.equal(await input.getAttribute('readonly'), '');
      }
    } finally { await page.close(); }
  });
}

for (const file of ['Fairy_Tail/ft.js', 'RWBY/rwby.js', 'RWBY/rwby2.js', 'Dungeon_Slop/Dungeonslop.js']) {
  test(`${file}: calculated settings keep focus, accept zero and follow the selected character`, async () => {
    const page = await browser.newPage();
    try {
      await page.setContent('<div id="calcPanel"></div>');
      const dungeon = file.startsWith('Dungeon');
      const fairy = file.startsWith('Fairy');
      const names = ['mod', 'profBonus'];
      if (!dungeon) names.push('getEffectivePB');
      if (fairy) names.push('calcInitiative', 'getMagicStat', 'spellMod', 'spellAtkBonus', 'spellSaveDC');
      else names.push('effectiveStat', 'attackBonus');
      if (dungeon) names.push('systemStatDndBonus', 'calcInitiative');
      if (file.startsWith('RWBY')) names.push('spellDC');
      const code = setup.replace('const renderCalcPanel = () => {};', '')
        .replace('const getChar = () => character;', 'let selected = character; const getChar = () => selected;');
      await page.addScriptTag({ content: code + `
        character.profBonusOverride = null; character.initiativeBonus = 0;
        character.spells = []; character.armor = 10;
        const passivePerception = () => 10, skillTotal = () => 0;
        const systemMilestoneTier = () => 0, featBonus = () => 0;
        const esc = String;
      ` + declaration('shared-ui.js', 'updateCalculatedPanel') + '\n' +
        names.map(name => declaration(file, name)).join('\n') + '\n' + declaration(file, 'renderCalcPanel') + '\nrenderCalcPanel();' });
      const input = page.locator('#pbOverrideInp');
      const original = await input.elementHandle();
      await input.pressSequentially('12');
      assert.equal(await input.inputValue(), '12');
      assert.equal(await input.evaluate((node, old) => node === old && document.activeElement === node, original), true);
      assert.equal(await page.evaluate(() => character.profBonusOverride), 12);
      assert.equal(await page.locator(dungeon ? '.calc-v' : '.calc-value').first().textContent(), '+12');
      if (file.startsWith('RWBY')) {
        assert.equal(await page.locator('.calc-value').nth(1).textContent(), '+15');
        assert.equal(await page.locator('.calc-value').nth(2).textContent(), '21');
      }
      await input.fill('0');
      assert.equal(await page.evaluate(() => character.profBonusOverride), 0);
      await input.fill('');
      assert.equal(await page.evaluate(() => character.profBonusOverride), null);
      assert.equal(await page.locator(dungeon ? '.calc-v' : '.calc-value').first().textContent(), '+2');
      if (!file.startsWith('RWBY')) {
        const initiative = page.locator('#initBonusInp');
        await initiative.fill(''); await initiative.pressSequentially('-12');
        assert.equal(await initiative.inputValue(), '-12');
        assert.equal(await initiative.evaluate(node => document.activeElement === node), true);
      }
      await page.evaluate(() => {
        document.activeElement.blur();
        selected = { ...character, profBonusOverride:4 };
        renderCalcPanel();
      });
      assert.equal(await input.inputValue(), '4');
      await input.fill('6');
      assert.deepEqual(await page.evaluate(() => [selected.profBonusOverride, character.profBonusOverride]), [6, null]);
      await input.evaluate(node => {
        node.disabled = true; node.readOnly = true; node.classList.add('spectator-disabled');
      });
      await page.evaluate(() => renderCalcPanel());
      assert.equal(await input.isEnabled(), true);
      assert.equal(await input.getAttribute('readonly'), null);
    } finally { await page.close(); }
  });
}

test('Dungeon shop: typing preserves input, selection, filtering and purchase indices', async () => {
  const page = await browser.newPage();
  try {
    await page.setContent('<div id="shopFilter"></div><div id="shopList"></div><div id="shopBalance"></div>');
    const file = 'Dungeon_Slop/Dungeonslop.js';
    await page.addScriptTag({ content: setup + `
      const state = { shop: [
        { name:'Iron Sword', category:'Weapons', price:10, tier:1, rarity:'common' },
        { name:'Mana Potion', category:'Consumables', price:5, tier:1, rarity:'common' }
      ] };
      const esc = s => String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
      const fmtGold = String;
      const RANK_TO_TIER = { E:1 };
      const TIER_LABEL = { 1:'E-RANK' }, TIER_COLOR = { 1:'#888' };
      const RARITY_COLORS = { common:'#888' };
      const SHOP_CATEGORIES = ['Weapons','Consumables'];
      const SHOP_RARITY_ORDER = { common:1 };
      const canEdit = () => true;
      let bought = -1;
      const buyItem = index => { bought = index; };
      let _shopQuery = '', _shopSort = 'recommended', _shopTier = 'all';
      let _shopCategory = 'all', _shopRarity = 'all', _shopAffordable = false;
    ` + declaration(file, 'shopCategoryIcon') + '\n' + declaration(file, 'compareShopItems') + '\n' + declaration(file, 'renderShop') + '\nrenderShop();' });
    const search = page.locator('#shopSearchInput');
    const original = await search.elementHandle();
    await search.pressSequentially('potion');
    assert.equal(await search.inputValue(), 'potion');
    assert.equal(await search.evaluate((node, old) => node === old && document.activeElement === node, original), true);
    assert.equal(await page.locator('.shop-item-name').allTextContents().then(x => x.join()), 'Mana Potion');
    await page.locator('.shop-buy-btn').click();
    assert.equal(await page.evaluate(() => bought), 1);
    await search.fill('no matches');
    assert.equal(await page.locator('.shop-empty-state strong').textContent(), 'NO MATCHING STOCK');
    await search.fill('');
    await page.locator('#shopSortSelect').selectOption('priceAsc');
    assert.equal(await search.evaluate((node, old) => node === old, original), true);
    assert.equal(await page.locator('.shop-item-name').count(), 2);
    await page.locator('.shop-filter-btn[data-cat="Weapons"]').click();
    assert.deepEqual(await page.locator('.shop-item-name').allTextContents(), ['Iron Sword']);
    await search.fill('iron sword');
    await search.evaluate(node => { node.setSelectionRange(0, 4); });
    await page.evaluate(() => renderShop());
    assert.deepEqual(await search.evaluate(node => [node.selectionStart, node.selectionEnd]), [0, 4]);
  } finally { await page.close(); }
});

async function openHub(page) {
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.hostname !== 'dnd.test') return route.abort();
    return route.fulfill({ contentType:'text/html', body:url.pathname === '/' ? source('index.html') : '<title>Campaign destination</title>' });
  });
  await page.goto('http://dnd.test/');
}

test('Hub: pointer effects batch frames, cancel on exit and respect reduced motion', async () => {
  const page = await browser.newPage();
  try {
    await page.addInitScript(() => {
      let next = 1;
      const frames = new Map();
      window.requestAnimationFrame = callback => { const id = next++; frames.set(id, callback); return id; };
      window.cancelAnimationFrame = id => frames.delete(id);
      window.pendingFrames = () => frames.size;
      window.flushFrames = () => { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(cb => cb()); };
    });
    await openHub(page);
    const card = page.locator('.world').first();
    const result = await card.evaluate(node => {
      const rect = node.getBoundingClientRect();
      for (const fraction of [.1, .2, .7]) {
        node.dispatchEvent(new PointerEvent('pointermove', { pointerType:'mouse', clientX:rect.left + rect.width*fraction, clientY:rect.top + rect.height*.5 }));
      }
      const queued = pendingFrames(), before = node.style.getPropertyValue('--mx');
      flushFrames();
      return { queued, before, after:parseFloat(node.style.getPropertyValue('--mx')) };
    });
    assert.equal(result.queued, 1);
    assert.equal(result.before, '');
    assert.ok(Math.abs(result.after - 70) < 1);
    await card.dispatchEvent('pointermove', { pointerType:'mouse', clientX:0, clientY:0 });
    await card.dispatchEvent('pointerleave');
    assert.equal(await page.evaluate(() => pendingFrames()), 0);
    assert.equal(await card.evaluate(node => node.style.getPropertyValue('--mx')), '50%');
    await page.emulateMedia({ reducedMotion:'reduce' });
    await card.dispatchEvent('pointermove', { pointerType:'mouse', clientX:0, clientY:0 });
    assert.equal(await page.evaluate(() => pendingFrames()), 0);
    await page.emulateMedia({ reducedMotion:'no-preference' });
    await card.dispatchEvent('pointermove', { pointerType:'touch', clientX:0, clientY:0 });
    assert.equal(await page.evaluate(() => pendingFrames()), 0);
  } finally { await page.close(); }
});

test('Hub: shortcuts tolerate punctuation and leave editable content alone', async () => {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await openHub(page);
    await page.keyboard.press('"');
    await page.evaluate(() => {
      const editable = document.createElement('div');
      editable.contentEditable = 'true'; document.body.append(editable); editable.focus();
    });
    await page.keyboard.press('1');
    assert.equal(new URL(page.url()).pathname, '/');
    assert.equal(await page.locator('[contenteditable]').textContent(), '1');
    await page.locator('[contenteditable]').evaluate(node => node.blur());
    await page.keyboard.press('2');
    await page.waitForURL('**/Fairy_Tail/fairytail.html');
    assert.deepEqual(errors, []);
  } finally { await page.close(); }
});

for (const file of ['RWBY/rwby.html', 'RWBY/rwby2.html', 'Fairy_Tail/fairytail.html', 'Dungeon_Slop/Dungeonslop.html']) {
  test(`${file}: mobile menu works independently of Firebase and remains accessible`, async () => {
    const page = await browser.newPage({ viewport:{ width:390, height:844 }, reducedMotion:'reduce' });
    try {
      // Load real HTML/CSS/navigation; leave campaign modules and Firebase disconnected.
      await page.route('**/*', route => {
        const url = new URL(route.request().url());
        if (url.hostname !== 'dnd.test') return route.abort();
        const path = decodeURIComponent(url.pathname.slice(1));
        if (path.endsWith('.js') && path !== 'shared-ui.js') return route.abort();
        const contentType = path.endsWith('.js') ? 'text/javascript' : path.endsWith('.css') ? 'text/css' : path.endsWith('.png') ? 'image/png' : 'text/html';
        return route.fulfill({ contentType, body:readFileSync(resolve(root, path)) });
      });
      await page.goto('http://dnd.test/' + file);
      const toggle = page.locator('#sidebarToggle');
      await page.locator('#sidebarToggle[data-menu-bound="true"]').waitFor();
      const sidebar = page.locator('#campaignSidebar');
      assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
      assert.equal(await sidebar.evaluate(node => node.inert), true);
      assert.equal(await page.locator('.main').evaluate(node => node.getBoundingClientRect().top < 100), true);
      assert.equal(await page.locator('.main').evaluate(node => node.getBoundingClientRect().width > innerWidth * .9), true);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await toggle.click();
      assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
      assert.equal(await sidebar.evaluate(node => !node.inert && node.contains(document.activeElement) && node.getBoundingClientRect().left >= 0), true);
      const box = await toggle.boundingBox();
      assert.ok(box.width >= 44 && box.height >= 44);
      await page.keyboard.press('Escape');
      assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
      assert.equal(await toggle.evaluate(node => document.activeElement === node), true);
      await toggle.click();
      await page.mouse.click(380, 400);
      assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
      await page.setViewportSize({ width:1440, height:1000 });
      await page.waitForFunction(() => !document.getElementById('campaignSidebar').inert);
      assert.equal(await sidebar.evaluate(node => getComputedStyle(node).position), 'sticky');
      assert.equal(await sidebar.evaluate(node => node.getBoundingClientRect().left >= 0), true);
    } finally { await page.close(); }
  });
}
