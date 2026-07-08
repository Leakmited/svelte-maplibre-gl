import { expect, test } from '@playwright/test';

test('setTiles runs before jumpTo when tiles and zoom change together', async ({ page }) => {
	const errors: string[] = [];
	page.on('pageerror', (err) => errors.push(err.message.split('\n')[0]));

	await page.goto('/test/tiles-zoom-sync/');
	await page.waitForFunction(() => (window as unknown as { __swapTilesAndZoom?: unknown }).__swapTilesAndZoom);
	await page.waitForTimeout(200);

	await page.evaluate(() => {
		(window as unknown as { __swapTilesAndZoom: () => void }).__swapTilesAndZoom();
	});

	await page.waitForFunction(() => {
		const order = (window as unknown as { __getUpdateOrder: () => string[] }).__getUpdateOrder();
		return order.includes('setTiles') && order.includes('jumpTo');
	});

	const order = await page.evaluate(() =>
		(window as unknown as { __getUpdateOrder: () => string[] }).__getUpdateOrder()
	);

	expect(order.indexOf('setTiles')).toBeGreaterThanOrEqual(0);
	expect(order.indexOf('jumpTo')).toBeGreaterThan(order.indexOf('setTiles'));
	expect(errors).toEqual([]);
});
