<script>
	import { setErrorView } from '$lib/errorUtils';
	import { Chart, registerables } from 'chart.js';
	import { onMount } from 'svelte';

	let { table, jsText, chartViewElementId } = $props();
	let canvasElId = window ? window.crypto.randomUUID() : '';
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

	export function downloadChart() {
		if (chart) {
			var a = document.createElement('a');
			a.href = chart.toBase64Image();
			a.download = 'chart_' + canvasElId + '.png';
			// Trigger the download
			a.click();
		}
	}

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
		if (table && jsText) {
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
		Chart.register(...registerables);
		//setChart();
	});
	$effect(() => {
		setChart();
	});
</script>

<div
	id={chartViewElementId}
	class="mt-2 min-h-96 rounded-lg border-2 border-dotted border-pink-200 p-2"
	style="position: relative;"
></div>
