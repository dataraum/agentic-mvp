<script>
	import { Button, Dropzone, Modal } from 'flowbite-svelte';
	import CsvConfigCard from './csv-config-card.svelte';
	import { showDataUpload } from '.';
	import { loadDataTable } from '$lib/processor/datafusion/cf-table-api';
	import { addDataNode } from '../canvas';
	import { storeDataFile } from '$lib/persist/surreal/data-api';
	import { RocketOutline } from 'flowbite-svelte-icons';

	/**
	 * @type {FileList | null}
	 */
	let files = $state(null);

	/**
	 * @param {{ target: any; }} event
	 */
	function handleChange(event) {
		const target = event.target;
		files = target.files;
	}

	/**
	 * @param {DragEvent} event
	 */
	function dropHandle(event) {
		event.preventDefault();
		files = event.dataTransfer?.files ?? null;
	}

	/**
	 * @param {FileList} files
	 */
	function showFiles(files) {
		if (!files || files.length === 0) return 'No files selected.';
		return Array.from(files)
			.map((file) => file.name)
			.join(', ');
	}

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
			dataName: dataName,
			format: 'text/csv',
			size: file.size,
			nodeView: 0,
			position: { x: 50, y: 50 }
		};
		const result = await storeDataFile(dataFile);
		// @ts-ignore
		await loadDataTable(fileArrayBuffer, csvConfig, result.id, dataName);
		await addDataNode(result);
	}

	async function importFiles() {
		if (!files) return;
		for (const file of files) {
			await writeCsvFile(file, csvConfig);
		}
	}
</script>

<Modal title="Add CSV file to workspace" bind:open={$showDataUpload} autoclose>
	<Dropzone
		id="dropzone"
		bind:files
		ondrop={dropHandle}
		ondragover={(event) => event.preventDefault()}
		onchange={handleChange}
	>
		<svg
			aria-hidden="true"
			class="mb-3 h-10 w-10 text-gray-400"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
			/>
		</svg>

		{#if !files || files.length === 0}
			<p class="mb-2 text-sm text-gray-500 dark:text-gray-400">
				<span class="font-semibold">Click to upload</span>
				or drag and drop
			</p>
			<p class="text-xs text-gray-500 dark:text-gray-400">CSV (MAX. 200MB)</p>
		{:else}
			<p class="text-sm text-green-600">{showFiles(files)}</p>
		{/if}
	</Dropzone>
	<CsvConfigCard {csvConfig} />
	<Button color="purple" type="submit" class="w-full" onclick={() => importFiles()}>
		<RocketOutline class="mr-2 h-4 w-4" />Add new files
	</Button>
</Modal>
