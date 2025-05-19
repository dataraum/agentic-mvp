<script>
	import { Handle, Position, useNodeConnections } from '@xyflow/svelte';
	import { Alert, Button, ButtonGroup, Input, Label } from 'flowbite-svelte';
	import {
		CheckCircleOutline,
		CheckCircleSolid,
		CheckOutline,
		CloseCircleSolid,
		EditOutline,
		EditSolid,
		EyeOutline,
		InfoCircleOutline,
		TableRowOutline,
		TicketSolid
	} from 'flowbite-svelte-icons';
	import { onDestroy, onMount } from 'svelte';
	import { readable, writable } from 'svelte/store';
	import { updateDataName, updateSelectedView } from '$lib/persist/surreal/data-api';
	import { deleteDataNode } from '$lib/ui/canvas/index.svelte';
	import { runSql } from '$lib/processor/datafusion/cf-query-api';
	import { registerDataTable, unregisterDataTable } from '$lib/processor/datafusion/cf-table-api';

	let { data, id } = $props();
	let tblNameElId = window ? window.crypto.randomUUID() : '';

	const connections = useNodeConnections();

	const DetailView = Object.freeze({
		ViewTable: 1,
		ViewSchema: 2,
		ViewBasic: 0
	});

	let table = $state();
	let dataName = $state();
	let nodeViewState = $state();
	let page = writable(0);
	let editName = $state(false);
	/**
	 * @type {import("svelte/store").Unsubscriber}
	 */
	let pageUnsubscribe;

	function changeDataName() {
		const tblNameInput = document.getElementById(tblNameElId);
		// @ts-ignore
		if (tblNameInput?.reportValidity()) {
			unregisterDataTable(data.dataName)
				.then(() => registerDataTable(data.id, dataName))
				.then(() => updateDataName(data.id, dataName))
				.then(() => (data.dataName = dataName));
		}
		editName = false;
	}
	/**
	 * @param {number} nodeView
	 */
	async function saveNodeState(nodeView) {
		if (nodeView === DetailView.ViewTable) {
			location.href = '/datasets/' + data.id;
		} else {
			data.nodeView = nodeViewState = nodeView;
			updateSelectedView(id, nodeView);
		}
	}
	onDestroy(async () => {
		pageUnsubscribe();
	});
	onMount(async () => {
		dataName = data.dataName;
		nodeViewState = data.nodeView;
		pageUnsubscribe = page.subscribe(async (pg) => {
			table = readable(await runSql("SELECT * FROM '" + data.dataName + "' LIMIT 10 OFFSET " + pg));
		});
	});
</script>

<div class="m-1">
	<div class="flex items-center justify-between">
		<div class="flex gap-2">
			<Button
				class="mt-0.5 h-6 w-6"
				pill
				size="xs"
				color="purple"
				onclick={() => deleteDataNode(id, data.dataName)}
				><CloseCircleSolid color="white" size="xl" /></Button
			>
			{#if connections.current.length > 0 || !editName}
					<span class="text-xl font-semibold">TABLE&nbsp;&nbsp;{dataName}</span>
				<div class="flex gap-1">
					<Button
						color="undefined"
						disabled={connections.current.length > 0}
						size="xs"
						outline={false}
						pill={true}
						class="h-8 w-8 p-2!"
						onclick={() => (editName = true)}><EditOutline size="md" color="black" /></Button
					>
				</div>
			{:else}
				<span class="text-xl font-semibold">TABLE</span>
				<div class="mt-1 mr-6 ml-1 flex gap-2">
					<Input
						type="text"
						bind:value={dataName}
						size="sm"
						id={tblNameElId}
						disabled={connections.current.length > 0}
						class="h-6 w-32"
						pattern="[\w\-_]&lbrace;4,32&rbrace;"
					/>
					<Button
						color="undefined"
						disabled={connections.current.length > 0}
						size="xs"
						pill={true}
						outline={false}
						class="h-6 w-6 p-2!"
						onclick={() => {
							changeDataName();
						}}><CheckCircleOutline size="lg" color="black" /></Button
					>
				</div>
			{/if}
		</div>
		<div class="text-right">
			<ButtonGroup>
				<Button
					outline
					color="purple"
					size="lg"
					class="h-8 w-8"
					onclick={() => saveNodeState(DetailView.ViewBasic)}><InfoCircleOutline /></Button
				>
				<Button
					outline
					color="purple"
					size="lg"
					class="h-8 w-8"
					onclick={() => saveNodeState(DetailView.ViewSchema)}><EyeOutline /></Button
				>
				<Button
					outline
					color="purple"
					size="lg"
					class="h-8 w-8"
					onclick={() => saveNodeState(DetailView.ViewTable)}><TableRowOutline /></Button
				>
			</ButtonGroup>
		</div>
	</div>
	<div>
		{#if nodeViewState === DetailView.ViewSchema && $table}
			<Alert color="teal" class="p-2">
				<span class="mb-1 ml-1 text-lg font-semibold">Schema</span>
				<div class="grid w-max grid-cols-5 gap-1">
					{#each $table.schema.fields as field}
						<div class="grid grid-cols-2 border-2 border-dashed">
							<span class="ml-2 max-w-48">{field.name}</span><span class="mr-2 text-right"
								>{field.type}</span
							>
						</div>
					{/each}
				</div>
			</Alert>
		{:else}
			<Alert color="teal" class="mt-4 p-2">
				<div class="mb-2 flex gap-4">
					<div class="mt-0.5 ml-2 w-64">
						<Label for={tblNameElId} class="pb-0.5 pl-1 text-sm">Name</Label>
						<Input
							type="text"
							bind:value={dataName}
							size="sm"
							id={tblNameElId}
							disabled={connections.current.length > 0}
							class="h-8"
							pattern="[\w\-_]&lbrace;4,32&rbrace;"
						/>
					</div>
					<div class="mt-6">
						<Button
							color="purple"
							disabled={connections.current.length > 0}
							outline
							size="sm"
							class="h-8"
							onclick={() => changeDataName()}>Change</Button
						>
					</div>
				</div>
				{#if connections.current.length > 0}
					<div class="mt-3 ml-1 flex pl-2 text-sm">
						<InfoCircleOutline />&nbsp;Can only be changed without depending nodes.
					</div>
				{/if}
			</Alert>
		{/if}
	</div>
</div>
<Handle type="source" position={Position.Bottom} />
