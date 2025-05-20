<script>
	import { Panel } from '@xyflow/svelte';
	// import { Alert } from 'flowbite-svelte';
	// import { BullhornOutline, CloseCircleOutline } from 'flowbite-svelte-icons';
	import { errorView } from '$lib/ui/errorUtils';
</script>

<Panel position="top-left" style="visibility: {$errorView.visibility}; width: 33%;">
	<Alert
		color={$errorView.color}
		dismissable
		closeIcon={CloseCircleOutline}
		onclick={() => ($errorView.visibility = 'hidden')}
	>
		{#snippet icon()}<BullhornOutline class="h-5 w-5" />{/snippet}
		<span class="text-sm font-medium">{$errorView.msg}</span>
	</Alert>
</Panel>
