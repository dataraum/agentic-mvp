<script lang="js">
	import { runSql } from '$lib/processor/datafusion/cf-query-api';
	import { initFusion } from '$lib/processor/datafusion/cf-table-api';
	import { Button, ButtonGroup, PaginationItem } from 'flowbite-svelte';
	import { ArrowLeftOutline, ArrowRightOutline, HomeOutline } from 'flowbite-svelte-icons';
	import Handsontable from 'handsontable';
	import 'handsontable/styles/handsontable.css';
	import 'handsontable/styles/ht-theme-main.css';
	import { register_table } from 'proto-query-engine';
	import { onDestroy, onMount } from 'svelte';
	import { writable } from 'svelte/store';

	/** @type {import('./$types').PageProps} */
	let { data } = $props();

	/** @type {Promise<import("@apache-arrow/ts").Table | undefined> | undefined} */
	let tablePromise = $state();

	let total_items = $state(0);
	let page = writable(0);
	const max_items = 20;
	let showFunctionEdit = writable(false);
	/**
	 * @type {import("svelte/store").Unsubscriber}
	 */
	let pageUnsubscribe;

	/**
	 * @type {Handsontable | undefined}
	 */
	let hot = undefined;

	async function setTotalItems() {
		total_items = await runSql("SELECT count(1) as total FROM '" + data.table_name + "'").then(
			(r) => Number(r?.toArray()[0]['total'])
		);
	}

	/**
	 * @param {HTMLDivElement} divElement
	 * @param {import('@apache-arrow/ts').Table} table
	 */
	function gridInit(divElement, table) {
		const colHeaders = table.schema.fields.map((field) => field.name);
		const data = [];
		for (const row of table.toArray()) {
			data.push(row.toArray());
		}
		hot = new Handsontable(divElement, {
			colHeaders: colHeaders,
			data: data,
			rowHeaders: true,
			height: '90%',
			width: 'auto',
			stretchH: 'all',
			autoWrapRow: true,
			autoWrapCol: true,
			minSpareCols: 0,
			licenseKey: 'non-commercial-and-evaluation',
			themeName: 'ht-theme-main',
			readOnly: true
		});
	}

	onDestroy(async () => {
		pageUnsubscribe();
	});
	onMount(async () => {
		await register_table(data.data_id, data.table_name);
		setTotalItems();
		pageUnsubscribe = page.subscribe(async (pg) => {
			tablePromise = runSql(
				"SELECT * FROM '" + data.table_name + "' LIMIT " + max_items + ' OFFSET ' + pg
			);
		});
	});
</script>

<div class="flex min-h-screen flex-row items-center justify-center">
	<div class="overview h-screen w-11/12 overflow-hidden pt-4">
		{#await tablePromise then table}
			<div class="grid grid-cols-3 py-3 pr-3 pl-3">
				{#if total_items > max_items}
					<span class="mt-1 text-left text-xs font-semibold text-purple-900">
						<span>{$page + 1}</span>
						to
						<span>{$page + max_items >= total_items ? total_items : $page + max_items}</span>
						of
						<span>{total_items}</span>
						rows
					</span>

					<div class="flex space-x-3 rtl:space-x-reverse">
						<PaginationItem
							class="flex h-6 items-center bg-slate-200 text-gray-900 hover:bg-purple-900 hover:text-purple-100"
							onclick={() => {
								if ($page > 0) $page -= max_items;
							}}
						>
							<ArrowLeftOutline class="me-2 h-4 w-4" />
							Prev {max_items} rows
						</PaginationItem>
						<PaginationItem
							class="flex h-6 items-center bg-slate-200 text-gray-900 hover:bg-purple-900 hover:text-purple-100"
							onclick={() => {
								if ($page + max_items < total_items) $page += max_items;
							}}
						>
							Next {max_items} rows
							<ArrowRightOutline class="ms-2 h-4 w-4" />
						</PaginationItem>
					</div>
				{:else}
					<div></div>
					<div></div>
				{/if}
				<div class="text-right">
					<ButtonGroup>
						<Button
							outline
							color="purple"
							size="lg"
							class="h-8 w-8"
							onclick={() => (location.href = '/')}><HomeOutline /></Button
						>
					</ButtonGroup>
				</div>
			</div>
			{#if table}
				<div class="hot w-full" use:gridInit={table}></div>
			{/if}
		{/await}
	</div>
</div>
