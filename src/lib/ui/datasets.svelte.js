import { runSql } from "$lib/processor/datafusion/cf-query-api";
import { writable } from "svelte/store";

const tableCache = new Map();

/**
 * @param {string} name
 * @param {string | undefined} statement
 */
export async function setTableCache(name, statement) {
    const table = statement ? await runSql(statement) : undefined;
    if (tableCache.has(name)) {
        tableCache.get(name).set(table);
    } else {
        tableCache.set(name, writable(table));
    }
}

/**
 * @param {string} name
 * @returns {import("svelte/store").Writable<any>}
 */
export function getCachedTable(name) {
    const table = tableCache.get(name);
    return table ? table : writable(null);
}

/**
 * @param {string} name
 * @param {string} newName
 */
export function updateCachedTableName(name, newName) {
    const table = tableCache.get(name);
    if (table) {
        tableCache.set(newName, table);
        tableCache.delete(name);
    }
}

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


