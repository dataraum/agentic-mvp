import { writable } from "svelte/store";
///// SVELTE STORES
export const errorView = writable({
	color: 'red',
	visibility: 'hidden',
	msg: '...'
});

/**
 * @param {string} msg
 */
export function setErrorView(msg) {
	errorView.set({
		color: 'red',
		visibility: 'visible',
		msg: msg
	});
}
