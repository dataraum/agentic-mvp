import { writable } from "svelte/store";
///// SVELTE STORES
export const errorView = writable({
	visibility: 'hidden',
	msg: '...'
});

/**
 * @param {string} msg
 */
export function setErrorView(msg) {
	errorView.set({
		visibility: 'visible',
		msg: msg
	});
}
