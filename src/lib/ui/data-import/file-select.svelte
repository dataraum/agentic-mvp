<script>
	import CsvConfigCard from './csv-config-card.svelte';
	import { loadDataTable } from '$lib/processor/datafusion/cf-table-api';
	import { addDataNode } from '../canvas/index.svelte';
	import { storeDataFile } from '$lib/persist/surreal/data-api';

	/**
	 * @type {FileList | null}
	 */
	let files = $state(null);

	/** @type {CsvConfig} */
	let csvConfig = $state({
		delimiter: ',',
		quote: '"',
		comment: '#',
		escape: '',
		null_regex: '(#DIV\/0\!)|(#N\/A)|(NA)|$^',
		truncated: false
	});

	/**
	 * @param {File} file
	 * @param {CsvConfig} csvConfig
	 */
	async function writeCsvFile(file, csvConfig) {
		const dataName = file.name.replace(/\.[^/.]+$/, '');
		const fileArrayBuffer = await file.arrayBuffer(); // encode as (utf-8) Uint8Array
		const dataFile = {
			id: '',
			dataName: dataName,
			format: 'text/csv',
			size: file.size,
			nodeView: 0,
			position: { x: 50, y: 50 }
		};
		const result = await storeDataFile(dataFile);
		// @ts-ignore
		await loadDataTable(fileArrayBuffer, csvConfig, result.id, dataName);
		addDataNode(result);
	}

	async function importFiles() {
		if (!files) return;
		for (const file of files) {
			await writeCsvFile(file, csvConfig);
		}
	}
</script>

<dialog id="file-select-modal" class="modal">
	<div class="modal-box">
		<form method="dialog">
			<button class="btn btn-sm btn-circle btn-ghost btn-secondary absolute top-2 right-2">✕</button>
		</form>
		<h3 class="text-md font-bold">Add CSV file to workspace</h3>
		<form method="dialog">
			<fieldset class="fieldset mt-4">
				<input
					id="csv-file-input"
					bind:files
					type="file"
					multiple
					class="file-input file-input-secondary"
					required
				/>
				<label class="label ml-1" for="csv-file-input">CSV only, max size 100MB</label>
			</fieldset>
			<CsvConfigCard {csvConfig} />
			<button type="submit" class="btn btn-primary mt-4 w-full" onclick={() => importFiles()}
				><span class="icon-[ph--rocket-launch-bold]"></span>Add new files
			</button>
		</form>
	</div>
</dialog>
