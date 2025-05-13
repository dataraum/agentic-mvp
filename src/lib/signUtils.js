/**
 * @type {IDBDatabase}
 */
let signDb;
const USER_ID = 'BERNY';
export function openSigningDB() {
	const DBOpenRequest = window.indexedDB.open('identity');
	DBOpenRequest.onsuccess = (e) => {
		signDb = DBOpenRequest.result;
	};
	DBOpenRequest.onupgradeneeded = (e) => {
		// @ts-ignore
		signDb = e.target?.result;
		signDb.createObjectStore('keypairs', { keyPath: 'id' });
	};
}
export function resetKeys() {
	indexedDB.deleteDatabase('identity');
}
/**
 * @param {CryptoKeyPair} keys
 */
function storeKeyPair(keys) {
	const store = signDb.transaction('keypairs', 'readwrite').objectStore('keypairs');
	store.add({ id: USER_ID, keys: keys });
}
/**
 * @param {string} id
 * @returns {Promise<CryptoKeyPair>}
 */
async function getKeyPair(id) {
	return new Promise((resolve, reject) => {
		/**
		 * @type {Promise<CryptoKeyPair>}
		 */
		let keys;
		const tx = signDb.transaction('keypairs', 'readonly');
		tx.oncomplete = () => resolve(keys);
		tx.onerror = (event) => {
			if (event.target) {
				reject(tx.error);
			}
		};
		const store = tx.objectStore('keypairs');
		const request = store.get(id);
		request.onsuccess = () => {
			if (request.result) {
				keys = request.result.keys;
			} else {
				keys = initKeyPair();
			}
		};
	});
}
/**
 * 
 * @returns {Promise<CryptoKeyPair>}
 */
async function initKeyPair() {
	// TODO use proper user onboarding to set a key
	const keyPair = await crypto.subtle.generateKey(
		{
			name: 'RSASSA-PKCS1-v1_5',
			// Consider using a 4096-bit key for systems that require long-term security
			modulusLength: 2048,
			publicExponent: new Uint8Array([1, 0, 1]),
			hash: 'SHA-256'
		},
		false,
		['sign', 'verify']
	);
	/** original user id
	const pubKey = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
	const enc = new TextEncoder();
	const pubKeyString = await quickHash(enc.encode(pubKey.n));
	*/
	storeKeyPair(keyPair);
	return keyPair;
}
/**
 * @param {Uint8Array} fileArrayBuffer
 * @returns {Promise<string>}
 */
export async function digestFile(fileArrayBuffer) {
	const keys = await getKeyPair(USER_ID);
	const MAX_F_SIZE = 8e6; // 8MB
	//if (keys === undefined) return '';
	if (fileArrayBuffer.byteLength < MAX_F_SIZE) {
		return digestBuffer(fileArrayBuffer, keys);
	} else {
		const noSlices = Math.ceil(fileArrayBuffer.byteLength / MAX_F_SIZE);
		const arrBoundaries = Array.from({ length: noSlices }, (_, i) => i * MAX_F_SIZE);
		const DIGEST_LENGTH = 256; // length of RSASSA-PKCS1-v1_5 digest
		const flattArray = new ArrayBuffer(noSlices * DIGEST_LENGTH);
		const flattView = new Uint8Array(flattArray);
		await Promise.all(
			arrBoundaries.map(async (boundary, i, arr) => {
				const byteSlice =
					i < noSlices
						? fileArrayBuffer.slice(boundary, arr[i + 1])
						: fileArrayBuffer.slice(boundary, fileArrayBuffer.byteLength);
				const digBuff = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', keys.privateKey, byteSlice);
				flattView.set(new Uint8Array(digBuff), i * DIGEST_LENGTH);
			})
		);
		return quickHash(flattView);
	}
}
/**
 * @param {string} data
 * @returns {Promise<string>}
 */
export async function digestString(data) {
	const enc = new TextEncoder();
	const dataUint8 = enc.encode(data); // encode as (utf-8) Uint8Array
	const keys = await getKeyPair(USER_ID);
	if (keys === undefined) return '';
	return digestBuffer(dataUint8, keys);
}
/**
 * @param {string} str
 * @returns {Promise<string>}
 */
export async function stringHash(str) {
	const enc = new TextEncoder();
	const dataUint8 = enc.encode(str); // encode as (utf-8) Uint8Array
	return quickHash(dataUint8); // convert bytes to hex string
}
/**
 * @param {Uint8Array} value
 * @returns {Promise<string>}
 */
async function quickHash(value) {
	const hashBuffer = await crypto.subtle.digest('SHA-1', value); // quickly hash the value
	const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
	return hashArray.map((b) => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
}
/**
 * @param {Uint8Array} buffer
 * @param {CryptoKeyPair} keys
 * @returns {Promise<string>}
 */
async function digestBuffer(buffer, keys) {
	const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', keys.privateKey, buffer);
	return quickHash(new Uint8Array(signature));
}
