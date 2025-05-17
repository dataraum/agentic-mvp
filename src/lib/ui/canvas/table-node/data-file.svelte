<script>
	import { Handle, Position, useNodeConnections } from '@xyflow/svelte';
	import { Alert, Button, ButtonGroup, Input, Label } from 'flowbite-svelte';
	import {
		CloseCircleSolid,
		EyeOutline,
		InfoCircleOutline,
		TableRowOutline
	} from 'flowbite-svelte-icons';
	import { onDestroy, onMount } from 'svelte';
	import { readable, writable } from 'svelte/store';
	import { updateSelectedView } from '$lib/persist/surreal/data-api';
	import { deleteDataNode } from '$lib/ui/canvas/index.svelte';
	import { changeDataName } from '$lib/processor/datafusion/cf-table-api';
	import { runSql } from '$lib/processor/datafusion/cf-query-api';

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
	/**
	 * @type {import("svelte/store").Unsubscriber}
	 */
	let pageUnsubscribe;

	function updateDataName() {
		const tblNameInput = document.getElementById(tblNameElId);
		// @ts-ignore
		if (tblNameInput?.reportValidity()) {
			changeDataName(dataName, data).then(() => {
				data.dataName = dataName;
			});
		}
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
			table = readable(
				await runSql("SELECT * FROM '" + data.dataName + "' LIMIT 10 OFFSET " + pg)
			);
		});
	});
</script>

<div class="m-1">
	<div class="mb-2 grid sm:grid-cols-2">
		<div class="flex gap-2">
			<Button
				class="mt-0.5 h-6 w-6"
				pill
				size="xs"
				color="purple"
				onclick={() => deleteDataNode(id, data.dataName)}
				><CloseCircleSolid color="white" size="xl" /></Button
			><span class="text-xl font-semibold">TABLE [{dataName}]</span>
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
					<div class="ml-2 mt-0.5 w-64">
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
						<Button color="purple" disabled={connections.current.length > 0} outline size="sm" class="h-8" onclick={() => updateDataName()}
							>Change</Button
						>
					</div>
				</div>
			{#if connections.current.length > 0}
				<div class="mt-3 ml-1 pl-2 text-sm flex"><InfoCircleOutline />&nbsp;Can only be changed without depending nodes.</div>
			{/if}
			</Alert>
		{/if}
	</div>
</div>
<Handle type="source" position={Position.Bottom} />
