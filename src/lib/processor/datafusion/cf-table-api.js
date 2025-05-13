import { updateDataName } from "$lib/persist/surreal/data-api";
import { setErrorView } from "$lib/errorUtils";
import init, { init_panic_hook, register_table, get_table_schema, unegister_table, load_csv_bytes } from "proto-query-engine";
import { writable } from "svelte/store";

/** @type {import("svelte/store").Writable<any>} */

export const schemas = writable({});

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
 * @param {any} schema
 */
export function addSchema(schema) {
    console.log("addSchema", schema);
    schemas.update((schm) => {
        const dataName = Object.keys(schema)[0];
        schm[dataName] = schema[dataName];
        return schm;
    });
}
/**
 * @param {string} dataId
 * @param {string} dataName
 */
export async function registerDataTable(dataId, dataName) {
    // console.log("registerDataTable", dataId, dataName);
    // await register_table(dataId, dataName)
    // console.log("registerDataTable", dataId, dataName);
    // const schema = await get_table_schema(dataName);
    // console.log("registerDataTable", schema);
    // addSchema(JSON.parse(schema));
    // return schema;
    //     .catch((/** @type {Error} */ e) => {
    //         setErrorView(e.message);
    //     });
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
    console.log("unregisterDataTable", dataName);
    return unegister_table(dataName)
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
    schemas.update((schms) => {
        delete schms[dataName];
        return schms;
    });
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
/**
 * @param {string} newDataName
 * @param {DataNode} data
 */
export async function changeDataName(newDataName, data) {
    await unregisterDataTable(data.dataName)
        // @ts-ignore
        .then(() => registerDataTable(data.id, newDataName))
        .then(() => {
            // adding is already done in registerArrowTable
            schemas.update((schm) => {
                delete schm[data.dataName];
                return schm;
            });
            data.dataName = newDataName;
            // @ts-ignore
            updateDataName(data.id, newDataName);
        });
}
