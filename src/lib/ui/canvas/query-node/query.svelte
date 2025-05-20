<script>
	import { Handle, Position, useNodeConnections } from '@xyflow/svelte';
	import SqlEditor from '$lib/ui/editor/sql/sql-editor.svelte';
	import { writable } from 'svelte/store';
	import { onDestroy, onMount } from 'svelte';
	import { addChartNode, deleteQueryNode, resetImportEdges } from '$lib/ui/canvas/index.svelte';
	import { changePersistedQueryName } from '$lib/processor/datafusion/cf-query-api';
	import { updateQueryStatement } from '$lib/persist/surreal/queries-api';
	import TableView from '$lib/ui/view/table-view.svelte';

	const connections = useNodeConnections();

	let { data, id } = $props();

	let tblNameElId = window ? window.crypto.randomUUID() : '';

	let sqlText = writable(data.statement);

	let dataName = $state();
	let tableNameChangeable = $state(true);
	let editName = $state(false);
	$effect(() => {
		tableNameChangeable = connections.current.every((conn) => conn.source !== id);
	});

	/**
	 * @type {import("svelte/store").Unsubscriber}
	 */
	let dataUnsubscribe;

	async function changeQueryName() {
		const tblNameInput = document.getElementById(tblNameElId);
		// @ts-ignore
		if (data.dataName != dataName && tblNameInput?.reportValidity()) {
			await changePersistedQueryName(dataName, data);
			data.dataName = dataName;
		}
		editName = false;
	}

	onDestroy(async () => {
		dataUnsubscribe();
	});

	onMount(async () => {
		dataName = data.dataName;
		dataUnsubscribe = sqlText.subscribe((sqlt) => {
			if (data.statement !== sqlt) {
				data.statement = sqlt;
				updateQueryStatement(data.id, data.statement);
				// rebuild edges to tables
				resetImportEdges(id, data.statement);
			}
		});
	});
</script>

<Handle type="target" position={Position.Top} />
<div class="flex flex-row items-center justify-between">
	<div>
		<div class="tooltip tooltip-secondary" data-tip="Delete query">
			<button
				aria-label="Delete query"
				class="btn btn-sm btn-circle btn-ghost btn-secondary"
				onclick={() => deleteQueryNode(id)}
				><span class="icon-[ph--calculator-bold] h-6 w-6"></span></button
			>
		</div>
		<span class="text-sm font-semibold">Data Query</span>
	</div>
	{#if !tableNameChangeable || !editName}
		<div class="ml-6">
			<span class="text-lg font-semibold">{dataName}</span>
			<div
				class="tooltip tooltip-secondary"
				data-tip={tableNameChangeable ? 'Edit query name' : 'Query is in use'}
			>
				<button
					aria-label="Edit table name"
					disabled={!tableNameChangeable}
					class="btn btn-secondary btn-ghost btn-circle btn-sm ml-1"
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
				disabled={!tableNameChangeable}
				class="input input-xs"
				pattern="[\w\-_]&lbrace;4,32&rbrace;"
			/>
			<button
				aria-label="Save table name"
				disabled={!tableNameChangeable}
				class="btn btn-secondary btn-circle btn-xs ml-1 p-0.5"
				onclick={() => changeQueryName()}
				><span class="icon-[ph--check-fat-fill] h-4 w-4"></span></button
			>
		</div>
	{/if}
</div>
<SqlEditor {sqlText} dataName={data.dataName} dataId={id} />
<TableView dataName={data.dataName} />
<div class="mt-2 flex flex-row items-center justify-center">
	<div class="tooltip tooltip-secondary tooltip-left" data-tip="Add Chart">
		<button
			aria-label="Add Chart"
			class="btn btn-sm btn-circle btn-ghost btn-secondary"
			onclick={() => addChartNode(id)}
			><span class="icon-[ph--chart-bar-bold] h-6 w-6"></span></button
		>
	</div>
</div>
<Handle type="source" position={Position.Bottom} />
