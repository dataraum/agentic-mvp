<script lang="js">
	import { onMount } from 'svelte';
	import '../app.css';
	import { openSigningDB } from '$lib/signUtils';
	import { openGraphDb } from '$lib/persist/surreal';
	import { initFusion } from '$lib/processor/datafusion/cf-table-api';
	import { initFlow } from '$lib/ui/canvas';

	let { children } = $props();

	onMount(async () => {
		//logDataFiles();
		//only init necessary data globally
		openSigningDB();
		await openGraphDb()
			.then(() => initFusion())
			.then(() => initFlow());
	});
</script>

<main>
	{@render children()}
</main>
