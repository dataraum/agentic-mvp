<script>
	import { Handle, Position, useNodeConnections } from '@xyflow/svelte';
	import { onMount } from 'svelte';
	import { updateDataName } from "$lib/persist/surreal";
	import { deleteDataNode } from '$lib/ui/canvas/index.svelte';
	import { registerDataTable, unregisterDataTable } from '$lib/processor/datafusion/cf-table-api';
	import TableView from '$lib/ui/view/table-view.svelte';

	let { data, id } = $props();
	let tblNameElId = window ? window.crypto.randomUUID() : '';

	const connections = useNodeConnections();

	let dataName = $state();
	let editName = $state(false);

	function changeDataName() {
		const tblNameInput = document.getElementById(tblNameElId);
		// @ts-ignore
		if (tblNameInput?.reportValidity()) {
			unregisterDataTable(data.dataName)
				.then(() => registerDataTable(data.id, dataName))
				.then(() => updateDataName('data', data.id, dataName))
				.then(() => (data.dataName = dataName));
		}
		editName = false;
	}

	onMount(async () => {
		dataName = data.dataName;
	});
</script>

<div class="flex flex-row items-center justify-between">
	<div>
		<div class="tooltip tooltip-secondary" data-tip="Delete table">
			<button
				aria-label="Delete table"
				class="btn btn-sm btn-circle btn-ghost btn-secondary"
				onclick={() => deleteDataNode(id, data.dataName)}
				><span class="icon-[ph--table-bold] h-6 w-6"></span></button
			>
		</div>
		<span class="text-sm font-semibold">Data Table</span>
	</div>
	{#if connections.current.length > 0 || !editName}
		<div class="ml-6">
			<span class="text-lg font-semibold">{dataName}</span>
			<div
				class="tooltip tooltip-secondary"
				data-tip={connections.current.length === 0 ? 'Edit table name' : 'Table is in use'}
			>
				<button
					aria-label="Edit table name"
					disabled={connections.current.length > 0}
					class="btn btn-ghost btn-secondary btn-circle btn-sm ml-1"
					onclick={() => (editName = true)}
					><span class="icon-[ph--pencil-bold] h-5 w-5"></span></button
				>
			</div>
		</div>
	{:else}
		<div class="mt-1 ml-6 flex w-32">
			<input
				type="text"
				bind:value={dataName}
				id={tblNameElId}
				disabled={connections.current.length > 0}
				class="input input-xs"
				pattern="[\w\-_]&lbrace;4,32&rbrace;"
			/>
			<button
				aria-label="Save table name"
				disabled={connections.current.length > 0}
				class="btn btn-secondary btn-circle btn-xs ml-1 p-0.5"
				onclick={() => changeDataName()}
				><span class="icon-[ph--check-fat-fill] h-4 w-4"></span></button
			>
		</div>
	{/if}
</div>
<TableView dataName={data.dataName} />
<Handle type="source" position={Position.Bottom} />
