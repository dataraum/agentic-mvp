<script>
	import { onMount } from 'svelte';
	import { basicSetup } from 'codemirror';
	import { EditorView, keymap } from '@codemirror/view';
	import { sql } from '@codemirror/lang-sql';
	import { Compartment } from '@codemirror/state';
	import { schemas, setTableCache } from '../../datasets.svelte';
	import { defaultKeymap } from '@codemirror/commands';
	import { storePersistedQuery } from '$lib/processor/datafusion/cf-query-api';

	let { sqlText, dataName, dataId } = $props();
	let sqlEditorElementId = window ? window.crypto.randomUUID() : '';
	/**
	 * @type {string}
	 */
	let editedText;

	function saveSql() {
		storePersistedQuery(editedText, dataName, dataId)
			.then(() => setTableCache(dataName, editedText))
			.then(() => sqlText.set(editedText))
			.catch((err) => console.error('Error saving SQL:', err));
		return true;
	}

	onMount(async () => {
		editedText = $sqlText;
		const targetElement = document.getElementById(sqlEditorElementId);
		if (!targetElement) return;

		const comp = new Compartment();
		const editor = new EditorView({
			doc: editedText,
			extensions: [
				basicSetup,
				comp.of(
					sql({
						schema: $schemas
					})
				),
				EditorView.updateListener.of((update) => {
					if (update.docChanged) {
						editedText = update.state.doc.toString();
					}
				}),
				keymap.of([...defaultKeymap, { key: 'Ctrl-s', mac: 'Cmd-s', run: saveSql }])
			],
			parent: targetElement
		});
		schemas.subscribe((/**@type {any}*/ schms) => {
			editor.dispatch({
				effects: comp.reconfigure(
					sql({
						schema: schms
					})
				)
			});
		});
	});
</script>

<div class="bg-secondary/30 border-secondary/40 rounded-box collapse mt-2 border p-1">
	<div id={sqlEditorElementId}></div>
</div>
