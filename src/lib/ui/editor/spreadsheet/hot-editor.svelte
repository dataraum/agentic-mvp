<script lang="js">
	import Handsontable from 'handsontable';
	import 'handsontable/styles/handsontable.css';
	import 'handsontable/styles/ht-theme-main.css';

	let { table } = $props();

	/**
	 * @param {HTMLDivElement} divElement
	 * @param {import('@apache-arrow/ts').Table} table
	 */
	function gridInit(divElement, table) {
		console.log('gridInit', table);
		const colHeaders = table.schema.fields.map((field) => field.name);
		const data = [];
		for (const row of table.toArray()) {
			data.push(row.toArray());
		}
		return new Handsontable(divElement, {
			colHeaders: colHeaders,
			data: data,
			rowHeaders: true,
			stretchH: 'all',
			autoWrapRow: true,
			autoWrapCol: true,
			minSpareCols: 0,
			licenseKey: 'non-commercial-and-evaluation',
			readOnly: true,
			disableVisualSelection: true,
			outsideClickDeselects: true
		});
	}
</script>

<div class="mt-4 mb-1 h-96 w-96 overflow-hidden">
	{#if $table}
		<div id="hot" class="hot" use:gridInit={$table}></div>
	{/if}
</div>
