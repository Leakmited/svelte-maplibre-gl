<script lang="ts">
	import type { Map as MapLibreMap, StyleSpecification, VectorTileSource as VectorTileSourceImpl } from 'maplibre-gl';
	import { MapLibre, VectorTileSource } from 'svelte-maplibre-gl';

	let map: MapLibreMap | undefined = $state();
	let tiles = $state(['https://example.com/a/{z}/{x}/{y}.pbf']);
	let zoom = $state(5);

	const style = {
		version: 8,
		sources: {},
		layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#ffffff' } }]
	} satisfies StyleSpecification;

	const calls: string[] = [];
	let hooksInstalled = false;

	function installHooks(map: MapLibreMap) {
		const source = map.getSource('tiles-zoom-sync') as VectorTileSourceImpl | undefined;
		if (!source || !('setTiles' in source) || hooksInstalled) {
			return false;
		}

		const originalSetTiles = source.setTiles.bind(source);
		const originalJumpTo = map.jumpTo.bind(map);

		source.setTiles = (...args) => {
			calls.push('setTiles');
			return originalSetTiles(...args);
		};
		map.jumpTo = (...args) => {
			calls.push('jumpTo');
			return originalJumpTo(...args);
		};

		hooksInstalled = true;

		const win = window as unknown as {
			__map: MapLibreMap;
			__swapTilesAndZoom: () => void;
			__getUpdateOrder: () => string[];
		};
		win.__map = map;
		win.__getUpdateOrder = () => calls;
		win.__swapTilesAndZoom = () => {
			calls.length = 0;
			tiles = ['https://example.com/b/{z}/{x}/{y}.pbf'];
			zoom = 10;
		};
		return true;
	}

	$effect(() => {
		if (!map) return;

		if (installHooks(map)) {
			return;
		}

		const onData = () => {
			installHooks(map!);
		};
		map.on('sourcedata', onData);
		return () => {
			map?.off('sourcedata', onData);
		};
	});
</script>

<MapLibre bind:map {style} class="h-[200px] w-full" bind:zoom center={{ lng: 0, lat: 0 }}>
	<VectorTileSource id="tiles-zoom-sync" {tiles} />
</MapLibre>
