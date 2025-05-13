<script>
	import { onMount } from 'svelte';
	import { basicSetup, EditorView } from 'codemirror';
	import { sql } from '@codemirror/lang-sql';
	import { Compartment } from '@codemirror/state';

	let { sqlText, sqlEditorElementId, schemas } = $props();

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
				})
			],
			parent: targetElement
		});
		schemas.subscribe((/**@type {any}*/schms) => {
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
