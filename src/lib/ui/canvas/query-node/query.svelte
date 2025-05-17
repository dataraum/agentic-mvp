<script>
	import { Handle, Position, useNodeConnections } from '@xyflow/svelte';
	import { A, Alert, Button, Input, Toggle } from 'flowbite-svelte';
	import { CloseCircleSolid, InfoCircleOutline } from 'flowbite-svelte-icons';
	import SqlEditor from '$lib/ui/editor/sql-editor.svelte';
	import JsEditor from '$lib/ui/editor/js-editor.svelte';
	import { readable, writable } from 'svelte/store';
	import TableView from '$lib/ui/view/table-view.svelte';
	import { onDestroy, onMount } from 'svelte';
	import ChartView from '$lib/ui/view/chart-view.svelte';
	import { deleteQueryNode, resetImportEdges } from '$lib/ui/canvas/index.svelte';
	import { DetailView } from '.';
	import QueryButtonGroup from './query-button-group.svelte';
	import { schemas } from '$lib/processor/datafusion/cf-table-api';
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
	let slicedTable = $state();
	let total_items = $state(0);
	let page = writable(0);
	let chartComponent = $state();
	let persistedState = $state();
	let tableNameChangeable = $state(true);
	$effect(() => {
		tableNameChangeable = connections.current.every((conn) => conn.source !== id);
	});

	/**
	 * @type {import("svelte/store").Unsubscriber}
	 */
	let dataUnsubscribe;

	/**
	 * @type {import("svelte/store").Unsubscriber}
	 */
	let pageUnsubscribe;

	async function persistQueryAsTable() {
		const tblNameInput = document.getElementById(tblNameElId);
		// @ts-ignore
		if (tblNameInput?.reportValidity()) {
			if ($table && persistedState) {
				if (data.dataId) {
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
			} else {
				// delete table again
				const oldDataName = data.dataName;
				const oldDataDigest = data.dataId;
				data.dataId = undefined;
				persistedState = false;
				dataName = undefined;
				unpersistedQueryNode(data, oldDataDigest, oldDataName);
			}
		}
	}

	function setTable() {
		if (data.statement) {
			runSql(data.statement).then((tbl) => {
				table = readable(tbl);
				slicedTable = readable($table?.slice(0, 10));
				$page = 0;
				total_items = $table?.numRows;
			});
		}
	}

	onDestroy(async () => {
		dataUnsubscribe();
		pageUnsubscribe();
	});

	onMount(async () => {
		dataName = data.dataName;
		$selectedView = data.nodeView;
		persistedState = data.dataId ? true : false;
		dataUnsubscribe = selectedView.subscribe(async (view) => {
			if (view === -1) return;
			if (!table) setTable();
			if (view === DetailView.ViewChart || view === DetailView.ViewTable) {
				if (data.statement !== $sqlText) {
					data.statement = $sqlText;
					setTable();
					// rebuild edges to tables
					resetImportEdges(id, data.statement);
				} else if (data.chartConfig !== $jsText) {
					data.chartConfig = $jsText;
				}
			}
			if (!persistedState || view !== DetailView.ViewTable) {
				data.nodeView = view;
			}
			updateQueryFile(data);
			if (view === DetailView.ViewTable && persistedState) {
				location.href = '/datasets/' + data.dataId;
			}
		});
		pageUnsubscribe = page.subscribe(async (pg) => {
			slicedTable = readable($table?.slice(pg, pg + 10));
		});
		console.log(
			'TEST:',
			connections.current.every((conn) => conn.source !== id)
		);
		console.log('ID:', id);
		console.log('query node mounted', connections.current);
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
		<SqlEditor {sqlText} {sqlEditorElementId} {schemas} />
	</Alert>
	{#if $selectedView === DetailView.ViewTable && slicedTable && !persistedState}
		<TableView table={slicedTable} {page} {total_items} />
	{:else if $selectedView === DetailView.ViewChartEditor && $table}
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
				<div class="mt-4 ml-4 h-8 w-64">
					<Toggle
						id="tgl_{tblNameElId}"
						color="purple"
						bind:checked={persistedState}
						disabled={!tableNameChangeable}>Persist query results as table</Toggle
					>
				</div>
				<div class="mt-3 w-64">
					<Input
						type="text"
						id={tblNameElId}
						bind:value={dataName}
						size="sm"
						class="h-8"
						disabled={!persistedState || !tableNameChangeable}
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
						onclick={() => persistQueryAsTable()}>Save state</Button
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
