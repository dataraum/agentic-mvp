import { linkQueryToDataFile } from "$lib/persist/surreal/queries-api";
import { setErrorView } from "$lib/errorUtils";
import { persist_sql, register_table, get_table_schema, run_sql } from "proto-query-engine";
import { schemas, deleteDataTable, unregisterDataTable, registerDataTable, addSchema } from "./cf-table-api";
import { Table, tableFromIPC } from "@apache-arrow/ts";
import { storeDataFile, updateDataName } from "$lib/persist/surreal/data-api";
import { deleteNodeRecord } from "$lib/persist/surreal";

/**
 * @param {QueryNode} nodeData
 * @param {string} oldTableId
 * @param {string} oldDataName
 */
export async function unpersistedQueryNode(nodeData, oldTableId, oldDataName) {
    schemas.update((schm) => {
        delete schm[oldDataName];
        return schm;
    });
    return deleteNodeRecord('data', oldTableId)
        .then(() => deleteDataTable(oldTableId, oldDataName));
}
/**
 * @param {string} newDataName
 * @param {QueryNode} data
 */
export async function changePersistedQueryName(newDataName, data) {
    console.log('changePersistedQueryName', data);
    // @ts-ignore
    await unregisterDataTable(data.dataName)
        // @ts-ignore
        .then(() => registerDataTable(data.id, newDataName))
        .then((/**@type{any}*/ schema) => {
            console.log('changePersistedQueryName', schema);
            schemas.update((schm) => {
                if (data.dataName) { delete schm[data.dataName]; };
                const dataName = Object.keys(schema)[0];
                schm[dataName] = schema[dataName];
                return schm;
            });
        })
        // @ts-ignore
        .then(() => updateDataName(data.dataId, newDataName));
}
/**
 * @param {string} sqlStatement
 * @param {string} dataDigest
 * @param {string} dataName
 * @param {string} queryId
 * @returns {Promise<any>}
 */
export async function addPersistedQuery(sqlStatement, dataDigest, dataName, queryId) {
    // query tables are registered under the query id and not the data digest
    const dataFile = {
        id: dataDigest,
        dataName: dataName,
        format: 'df/ipc',
    };
    return persist_sql(sqlStatement, dataDigest)
        .then(() => register_table(dataDigest, dataName))
        .then(() => get_table_schema(dataName))
        .then((schema) => addSchema(JSON.parse(schema)))
        .then(() => storeDataFile(dataFile))
        .then(() => linkQueryToDataFile(queryId, dataDigest))
        .catch((/** @type {Error} */ e) => {
            setErrorView(e.message);
        });
}
/**
 *
 * @param {string} sqlStatement
 * @returns {Promise<Set<string>>}
 */
export async function getTables(sqlStatement) {
    const tables = new Set();
    return run_sql('EXPLAIN ' + sqlStatement)
        .then((/** @type {any} */ ipcResult) => {
            const table = tableFromIPC(ipcResult);
            for (const result of table.toArray()) {
                const row = result.toArray();
                // TODO this could probably be done in a more robust way on the rust side...
                if (row[0] === 'physical_plan') {
                    for (const analysis of row[1].split(/\n/)) {
                        let candidate = analysis.trim();
                        const idLength = 'ArrowExec: file_groups={1 group: [['.length;
                        const startIndex = candidate.indexOf('ArrowExec: ');
                        if (startIndex == 0) {
                            const endIndex = candidate.indexOf('.arrow');
                            candidate = candidate.substring(idLength, endIndex);
                            tables.add(candidate.trim());
                        }
                    }
                }
            }
            return tables;
        })
        .catch((/** @type {Error} */ e) => {
            setErrorView(e.message);
            return new Set();
        });
}
/**
 *
 * @param {string} sqlStatement
 * @returns {Promise<Table | undefined>}
 */
export async function runSql(sqlStatement) {
    return run_sql(sqlStatement)
        .then((/** @type {Promise<any>} */ reslt) => {
            return tableFromIPC(reslt);
        })
        .catch((/** @type {Error} */ e) => {
            setErrorView(e.message);
            return undefined;
        });
}

