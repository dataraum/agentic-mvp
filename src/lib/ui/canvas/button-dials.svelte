<script>
	import { Panel } from '@xyflow/svelte';
	import { addQueryNode } from '$lib/ui/canvas/index.svelte';
	function showFileSelect() {
		const fileSelect = document.querySelector('#file-select-modal');
		if (fileSelect) {
			// @ts-ignore
			fileSelect.showModal();
		}
	}
</script>

<Panel position="top-right" style="width: 6%;">
	<ul class="menu bg-primary rounded-box">
		<li>
			<button class="btn btn-square btn-ghost btn-primary" onclick={() => showFileSelect()}>
				<span class="icon-[ph--upload-simple-bold] h-6 w-6">1</span>
			</button>
		</li>
		<li>
			<button class="btn btn-square btn-ghost btn-primary" onclick={() => addQueryNode()}>
				<span class="icon-[ph--calculator-bold] h-6 w-6">1</span>
			</button>
		</li>
	</ul>
</Panel>
