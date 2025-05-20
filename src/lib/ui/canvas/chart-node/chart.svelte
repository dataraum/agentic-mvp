<script lang="js">
	import JsEditor from '$lib/ui/editor/js/js-editor.svelte';
	import ChartView from '$lib/ui/view/chart-view.svelte';
	import { Handle, Position } from '@xyflow/svelte';
	import { writable } from 'svelte/store';
	import { deleteChartNode } from '../index.svelte';
	import { onMount } from 'svelte';
	import { getQueryName } from '$lib/persist/surreal/queries-api';
	import { updateChartConfig } from '$lib/persist/surreal/chart-api';

	let { data, id } = $props();
	let dataName = writable();

	let jsText = writable(data.chartConfig);

	onMount(async () => {
		dataName.set(await getQueryName(data.queryId));
		jsText.subscribe((js) => {
			if (data.chartConfig !== js) {
				data.chartConfig = js;
				updateChartConfig(data.id, data.chartConfig);
			}
		});
	});
</script>

<Handle type="target" position={Position.Top} />
<div>
	<div>
		<div class="tooltip tooltip-secondary" data-tip="Delete chart">
			<button
				aria-label="Delete chart"
				class="btn btn-sm btn-circle btn-ghost btn-secondary"
				onclick={() => deleteChartNode(id)}
				><span class="icon-[ph--chart-bar-bold] h-6 w-6"></span></button
			>
		</div>
		<span class="text-sm font-semibold">Data Chart</span>
	</div>
		<ChartView {jsText} {dataName} />

	<div class="bg-secondary/10 border-secondary rounded-box collapse mt-4 border">
		<input type="checkbox" />
		<div class="collapse-title font-semibold"><span>Edit the chart configuration.</span></div>
		<div class="collapse-content text-sm">
			<JsEditor {jsText} />
			<div role="alert" class="alert alert-info mt-6 alert-soft">
				<nobr
					><span class="icon-[ph--info-fill] h-4 w-4 mr-2"></span><span>A
					<a class="link" href="https://www.chartjs.org/docs/latest/" target="_blank">Chart.js</a>
					configuration, using the underlying data from an
					<a class="link" href="https://arrow.apache.org/docs/js" target="_blank">Arrow table</a
					>.</span>
			</div>
		</div>
	</div>
</div>
