<script lang="js">
	import { onMount } from 'svelte';
	import '../style.css';
	import { openGraphDb } from '$lib/persist/surreal';
	import { initFusion, logDataFiles } from '$lib/processor/datafusion/cf-table-api';
	import { initFlow } from '$lib/ui/canvas/index.svelte';

	let { children } = $props();

	onMount(async () => {
		//logDataFiles();
		//only init necessary data globally
		await openGraphDb();
		await initFusion();
		await initFlow();
	});
</script>

<main>
	{@render children()}
</main>
