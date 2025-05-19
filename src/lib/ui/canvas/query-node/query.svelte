<script>
	import { Handle, Position, useNodeConnections } from '@xyflow/svelte';
	import { A, Alert, Button, Input } from 'flowbite-svelte';
	import { CloseCircleSolid, InfoCircleOutline } from 'flowbite-svelte-icons';
	import SqlEditor from '$lib/ui/editor/sql/sql-editor.svelte';
	import JsEditor from '$lib/ui/editor/js-editor.svelte';
	import { readable, writable } from 'svelte/store';
	import { onDestroy, onMount } from 'svelte';
	import ChartView from '$lib/ui/view/chart-view.svelte';
	import { deleteQueryNode, resetImportEdges } from '$lib/ui/canvas/index.svelte';
	import { DetailView } from '.';
	import QueryButtonGroup from './query-button-group.svelte';
	import randomName from '@scaleway/random-name';
	import {
		runSql,
		addPersistedQuery,
		changePersistedQueryName,
		unpersistedQueryNode
	} from '$lib/processor/datafusion/cf-query-api';
	import { updateQueryFile } from '$lib/persist/surreal/queries-api';

	const connections = useNodeConnections();

	let { data, id } = $props();

	let sqlEditorElementId = window ? window.crypto.randomUUID() : '';
	let jsEditorElementId = window ? window.crypto.randomUUID() : '';
	let chartViewElementId = window ? window.crypto.randomUUID() : '';
	let tblNameElId = window ? window.crypto.randomUUID() : '';

	let sqlText = writable(data.statement);
	let jsText = writable(data.chartConfig);
	let selectedView = writable(-1);

	let table = $state();
	let dataName = $state();
	let chartComponent = $state();
	let tableNameChangeable = $state(true);
	$effect(() => {
		tableNameChangeable = connections.current.every((conn) => conn.source !== id);
	});

	/**
	 * @type {import("svelte/store").Unsubscriber}
	 */
	let dataUnsubscribe;

	async function persistQueryAsTable() {
		const tblNameInput = document.getElementById(tblNameElId);
		if (!dataName) {
			dataName = randomName('', '_')
		// @ts-ignore
		} else if (!tblNameInput?.reportValidity()) {
			return;
		}
		if ($table) {
			if (data.dataId && data.dataName != dataName) {
				changePersistedQueryName(dataName, data).then(() => {
					data.dataName = dataName;
				});
			} else {
				addPersistedQuery(data.statement, dataName, id).then((dataId) => {
					data.dataName = dataName;
					data.persisted = true;
					data.dataId = dataId;
				});
			}
		}
	}

	function setTable() {
		if (data.statement) {
			runSql(data.statement).then((tbl) => {
				table = readable(tbl);
			});
		}
	}

	onDestroy(async () => {
		dataUnsubscribe();
	});

	onMount(async () => {
		dataName = data.dataName;
		$selectedView = data.nodeView;
		dataUnsubscribe = selectedView.subscribe(async (view) => {
			if (view === -1) return;
			if (!table) setTable();
			if (view === DetailView.ViewChart || view === DetailView.ViewTable) {
				if (data.statement !== $sqlText) {
					data.statement = $sqlText;
					setTable();
					persistQueryAsTable();
					// rebuild edges to tables
					resetImportEdges(id, data.statement);
				} else if (data.chartConfig !== $jsText) {
					data.chartConfig = $jsText;
				}
			}
			data.nodeView = view;
			updateQueryFile(data);
			if (view === DetailView.ViewTable) {
				location.href = '/datasets/' + data.dataId;
			}
		});
	});
</script>

<Handle type="target" position={Position.Top} />
<div class="m-1 min-w-192">
	<div class="mb-2 grid grid-cols-2">
		<div class="flex gap-2">
			<Button
				class="mt-0.5 h-6 w-6"
				pill
				size="xs"
				color="purple"
				onclick={() => deleteQueryNode(id)}><CloseCircleSolid color="white" size="xl" /></Button
			>
			{#if dataName}
				<span class="text-xl font-semibold">SQL QUERY [{dataName}]</span>
			{:else}
				<span class="text-xl font-semibold">SQL QUERY</span>
			{/if}
		</div>
		<QueryButtonGroup {selectedView} {chartComponent} />
	</div>
	<Alert color="blue" class="mt-4 mb-1 py-2">
		<SqlEditor {sqlText} {sqlEditorElementId} />
	</Alert>
	{#if $selectedView === DetailView.ViewChartEditor && $table}
		<Alert color="red" class="mt-4 py-2">
			<JsEditor {jsText} {jsEditorElementId} />
		</Alert>
		<div class="mt-2 ml-1 text-sm">
			<A color="blue" href="https://www.chartjs.org/docs/latest/configuration/" target="_blank"
				>Chart.js configuration</A
			>
			using the underlying
			<A
				color="blue"
				href="https://arrow.apache.org/docs/js/classes/Arrow_dom.Table.html"
				target="_blank">Arrow table</A
			>. The 'table' is stored in memory within this context.
		</div>
	{:else if $selectedView === DetailView.ViewChart && $table}
		<div class="mt-4">
			<ChartView {jsText} {table} {chartViewElementId} bind:this={chartComponent} />
		</div>
	{:else}
		<Alert color="teal" class="mt-4 p-1">
			<div class="mb-2 flex">
				<div class="mt-3 w-64">
					<Input
						type="text"
						id={tblNameElId}
						bind:value={dataName}
						size="sm"
						class="h-8"
						disabled={!tableNameChangeable}
						pattern="[\w\-_]&lbrace;4,32&rbrace;"
						placeholder="Table name"
					/>
				</div>
				<div class="mt-3 ml-4">
					<Button
						color="purple"
						outline
						disabled={!tableNameChangeable}
						size="sm"
						class="h-8"
						onclick={() => persistQueryAsTable()}>Change</Button
					>
				</div>
			</div>
			{#if !tableNameChangeable}
				<div class="mt-3 mb-1 ml-2 pl-2 text-sm flex"><InfoCircleOutline />&nbsp;Can only be changed without depending nodes.</div>
			{/if}
		</Alert>
	{/if}
</div>
<Handle type="source" position={Position.Bottom} />
