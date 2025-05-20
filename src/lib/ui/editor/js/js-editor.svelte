<script>
	import { onMount } from 'svelte';
	import { basicSetup } from 'codemirror';
	import { EditorView, keymap } from '@codemirror/view';
	import { javascript } from '@codemirror/lang-javascript';
	import { defaultKeymap } from '@codemirror/commands';

	let { jsText } = $props();

	let jsEditorElementId = window ? window.crypto.randomUUID() : '';

	/**
	 * @type {string}
	 */
	let editedText;

	function saveJs() {
		jsText.set(editedText);
		return true;
	}

	onMount(async () => {
		editedText = $jsText;
		const targetElement = document.getElementById(jsEditorElementId);
		if (!targetElement) return;
		new EditorView({
			doc: editedText,
			extensions: [
				basicSetup,
				javascript(),
				EditorView.updateListener.of((update) => {
					if (update.docChanged) {
						editedText = update.state.doc.toString();
					}
				}),
				keymap.of([...defaultKeymap, { key: 'Ctrl-s', mac: 'Cmd-s', run: saveJs }])
			],
			parent: targetElement
		});
	});
</script>

<div class="bg-secondary/10 border-secondary rounded-box collapse border">
	<div id={jsEditorElementId}></div>
</div>
