<script>
	import { onMount } from 'svelte';
	import { basicSetup } from 'codemirror';
	import { EditorView, keymap } from '@codemirror/view';
	import { sql } from '@codemirror/lang-sql';
	import { Compartment } from '@codemirror/state';
	import { schemas } from '../../datasets.svelte';
	import { defaultKeymap } from '@codemirror/commands';

	let { sqlText, sqlEditorElementId } = $props();

	onMount(async () => {
		const targetElement = document.getElementById(sqlEditorElementId);
		if (!targetElement) return;

		const comp = new Compartment();
		const editor = new EditorView({
			doc: $sqlText,
			extensions: [
				basicSetup,
				comp.of(
					sql({
						schema: $schemas
					})
				),
				EditorView.updateListener.of((update) => {
					if (update.docChanged) {
						$sqlText = update.state.doc.toString();
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

<div id={sqlEditorElementId}></div>
