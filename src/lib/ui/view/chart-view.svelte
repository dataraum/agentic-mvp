<script>
	import { setErrorView } from '$lib/ui/errorUtils';
	import { Chart, registerables } from 'chart.js';
	import { onMount } from 'svelte';
	import { getCachedTable } from '../datasets.svelte';

	let { jsText, dataName } = $props();

	let chartViewElementId = window ? window.crypto.randomUUID() : '';
	let canvasElId = window ? window.crypto.randomUUID() : '';

	let table = $state();

	/**
	 * @type {HTMLCanvasElement}
	 */
	let canvas;
	/**
	 * @type {HTMLScriptElement}
	 */
	let config;
	/**
	 * @type {Chart | undefined}
	 */
	let chart;

	function setCanvas() {
		canvas?.remove();
		const host = document.getElementById(chartViewElementId);
		const shadow = host?.shadowRoot || host?.attachShadow({ mode: 'open' });
		canvas = document.createElement('canvas');
		canvas.setAttribute('class', 'w-full');
		canvas.setAttribute('id', canvasElId);
		shadow?.appendChild(canvas);
	}

	function setConfig() {
		config?.remove();
		const host = document.getElementById(chartViewElementId);
		const shadow = host?.shadowRoot || host?.attachShadow({ mode: 'open' });
		config = document.createElement('script');
		config.textContent = "function getCfg(table){return " + $jsText + ";}";
		shadow?.appendChild(config);
	}

	function setChart() {
		chart?.destroy();
		setCanvas();
		let cfg = {
			type: 'bar',
			data: {
				labels: [],
				datasets: []
			}
		};
		if ($table && jsText) {
			const getCfg = new Function("table", "return " + $jsText);
			//alternative with shadow root: setConfig();
			cfg = getCfg($table);
		}
		try {
			chart = new Chart(canvas, cfg);
		} catch (e) {
			let errMsg = 'chart config: ';
			if (typeof e === 'string') {
				errMsg += e.toUpperCase(); // works, `e` narrowed to string
			} else if (e instanceof Error) {
				errMsg += e.message; // works, `e` narrowed to Error
			}
			setErrorView(errMsg);
		}
	}

	onMount(async () => {
		dataName.subscribe((/** @type {string} */ name) => {
			table = getCachedTable(name);
			setChart();
		});
		jsText.subscribe(() => {
			setChart();
		});
		Chart.register(...registerables);
		//setChart();
	});
	// $effect(() => {
	// 	setChart();
	// });
</script>

<div
	id={chartViewElementId}
	class="mt-2 min-w-96 rounded-lg border-2 border-dotted p-2 relative bg-secondary/10 border-secondary"
></div>
