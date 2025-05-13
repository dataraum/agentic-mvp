<script>
	import { onMount } from 'svelte';
	import { basicSetup, EditorView } from 'codemirror';
	import { javascript } from '@codemirror/lang-javascript';

	let {jsText, jsEditorElementId} = $props();

	onMount(async () => {
		const targetElement = document.getElementById(jsEditorElementId);
		if (!targetElement) return;
		new EditorView({
			doc: $jsText,
			extensions: [
				basicSetup,
				javascript(),
				EditorView.updateListener.of((update) => {
					if (update.docChanged) {
						$jsText = update.state.doc.toString();
					}
				})
			],
			parent: targetElement
		});
	});
</script>

<div id={jsEditorElementId}></div>
