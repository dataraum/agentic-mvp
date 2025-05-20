<script>
	import { Panel } from '@xyflow/svelte';
	import { errorView } from '$lib/ui/errorUtils';
</script>

<Panel position="top-left" style="visibility: {$errorView.visibility}; width: 33%;">
	<div role="alert" class="alert alert-error">
		<span class="icon-[ph--warning-octagon-fill] h-5 w-5"></span>
		<span>{$errorView.msg}</span>
		<button aria-label="Close" class="btn btn-circle btn-ghost btn-sm btn-error" onclick={() => ($errorView.visibility = 'hidden')}>
			<span class="icon-[ph--x-bold] h-5 w-5"></span>
		</button>
	</div>
</Panel>
