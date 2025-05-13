<script>
	import { Button, ButtonGroup } from 'flowbite-svelte';
	import {
		ChartMixedOutline,
		DownloadOutline,
		EditOutline,
		FloppyDiskOutline,
		InfoCircleOutline,
		TableRowOutline
	} from 'flowbite-svelte-icons';
	import { DetailView } from '.';

	let { selectedView, chartComponent } = $props();

	async function updateQueryState() {
		$selectedView = 2;
	}
	/**
	 * @param {number | undefined} viewId
	 */
	async function saveState(viewId) {
		selectedView.set(-1);
		selectedView.set(viewId);
	}
</script>

<div class="text-right">
	<ButtonGroup>
		<Button
			outline
			color="purple"
			size="lg"
			class="h-8 w-8"
			onclick={() => saveState(DetailView.ViewBasic)}><InfoCircleOutline /></Button
		>
		<Button
			outline
			color="purple"
			size="lg"
			class="h-8 w-8"
			onclick={() => saveState(DetailView.ViewTable)}
			disabled={$selectedView < 0}><TableRowOutline /></Button
		>
		<Button
			outline
			color="purple"
			size="lg"
			class="h-8 w-8"
			onclick={() => saveState(DetailView.ViewChart)}
			disabled={$selectedView < 0}><ChartMixedOutline /></Button
		>
		<Button
			outline
			color="purple"
			size="lg"
			class="h-8 w-8"
			onclick={() => saveState(DetailView.ViewChartEditor)}
			disabled={$selectedView < 0}><EditOutline /></Button
		>
		<Button
			outline
			color="purple"
			size="lg"
			class="h-8 w-8"
			onclick={() => chartComponent.downloadChart()}
			disabled={$selectedView !== DetailView.ViewChart || $selectedView < 0}
			><DownloadOutline /></Button
		>
		<Button
			outline={$selectedView > -1}
			color="purple"
			size="lg"
			class="h-8 w-8"
			onclick={() => updateQueryState()}><FloppyDiskOutline /></Button
		>
	</ButtonGroup>
</div>
