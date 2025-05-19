import { writable } from "svelte/store";

const datasets = new Map();

export const setData = (/** @type {string} */ name, /** @type {import ("@apache-arrow/ts").Table} */ data) => datasets.set(name, data);

export const getData = (/** @type {string} */ name) => datasets.get(name);

/** @type {import("svelte/store").Writable<any>} */
export const schemas = writable({});

/**
 * @param {any} schema
 */
export function addSchema(schema) {
    schemas.update((schm) => {
        const dataName = Object.keys(schema)[0];
        schm[dataName] = schema[dataName];
        return schm;
    });
}
/**
 * @param {string} name
 */
export function deleteSchema(name) {
    schemas.update((schm) => {
        delete schm[name];
        return schm;
    });
}

/**
 * @param {string} name
 * @param {any} schema
 */
export function updateSchema(name, schema) {
    schemas.update((schm) => {
        if (name) { delete schm[name]; };
        const dataName = Object.keys(schema)[0];
        schm[dataName] = schema[dataName];
        return schm;
    });
}


