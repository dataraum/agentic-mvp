import { addSchema, deleteSchema } from "$lib/ui/datasets.svelte";
import { setErrorView } from "$lib/ui/errorUtils";
import init, { init_panic_hook, register_table, get_table_schema, unegister_table, load_csv_bytes } from "proto-query-engine";

export async function initFusion() {
    await init();
    init_panic_hook();
}
/**
 * @returns {Promise<void>}
 */
export async function logDataFiles() {
    const dataDir = await (await window.navigator.storage.getDirectory()).getDirectoryHandle("data", { create: false });
    // @ts-ignore
    for await (const [key, value] of dataDir.entries()) {
        console.log({ key, value });
    }
}
/**
 * @param {string} dataId
 * @param {string} dataName
 */
export async function registerDataTable(dataId, dataName) {
    return register_table(dataId, dataName)
        .then(() => get_table_schema(dataName))
        .then((schema) => addSchema(JSON.parse(schema)))
        .catch((/** @type {Error} */ e) => {
            setErrorView(e.message);
        });
}
/**
 * @param {string} dataName
 * @returns {Promise<void>}
 */
export async function unregisterDataTable(dataName) {
    return unegister_table(dataName)
        .then(() => deleteSchema(dataName))
        .catch((/** @type {Error} */ e) => {
            setErrorView(e.message);
        });
}
/**
 * @param {string} fileId
 * @param {string} dataName
 * @returns {Promise<void>}
 */
export async function deleteDataTable(fileId, dataName) {
    deleteSchema(dataName);
    const dataDir = await (await window.navigator.storage.getDirectory()).getDirectoryHandle("data", { create: true });
    return dataDir.removeEntry(fileId + ".arrow").then(() => unregisterDataTable(dataName));
}
/**
 * @param {ArrayBuffer} fileArrayBuffer
 * @param {any} csvConfig
 * @param {string} dataId
 * @param {string} dataName
 * @returns {Promise<any>}
 */
export async function loadDataTable(fileArrayBuffer, csvConfig, dataId, dataName) {
    return load_csv_bytes(fileArrayBuffer, dataId, csvConfig)
        .then(() => register_table(dataId, dataName))
        .then(async () => {
            addSchema(JSON.parse(await get_table_schema(dataName)));
        }).catch((/** @type {Error} */ e) => {
            setErrorView(e.message);
        });
}
