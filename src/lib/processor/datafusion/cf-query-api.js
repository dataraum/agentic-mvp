import { linkQueryToDataFile } from "$lib/persist/surreal/queries-api";
import { setErrorView } from "$lib/ui/errorUtils";
import { persist_sql, register_table, get_table_schema, run_sql } from "proto-query-engine";
import { deleteDataTable, unregisterDataTable, registerDataTable } from "./cf-table-api";
import { addSchema, deleteSchema, updateSchema } from "$lib/ui/datasets.svelte";
import { Table, tableFromIPC } from "@apache-arrow/ts";
import { storeDataFile, updateDataName } from "$lib/persist/surreal/data-api";
import { deleteNodeRecord } from "$lib/persist/surreal";

/**
 * @param {QueryNode} nodeData
 * @param {string} tableId
 * @param {string} dataName
 */
export async function unpersistedQueryNode(nodeData, tableId, dataName) {
    deleteSchema(dataName);
    return deleteNodeRecord('data', tableId)
        // @ts-ignore
        .then(() => linkQueryToDataFile(nodeData.id, ""))
        .then(() => deleteDataTable(tableId, dataName));
}
/**
 * @param {string} newDataName
 * @param {QueryNode} data
 */
export async function changePersistedQueryName(newDataName, data) {
    await unregisterDataTable(data.dataName ?? '')
        .then(() => registerDataTable(data.id ?? '', newDataName))
        .then((/**@type{any}*/ schema) => updateSchema(data.dataName ?? '', schema))
        .then(() => updateDataName(data.dataId ?? '', newDataName));
}
/**
 * @param {string} sqlStatement
 * @param {string} dataName
 * @param {string} queryId
 * @returns {Promise<string>}
 */
export async function addPersistedQuery(sqlStatement, dataName, queryId) {
    // query tables are registered under the query id and not the data digest
    const dataFile = {
        id: '',
        dataName: dataName,
        format: 'df/ipc',
        position: { x: 0, y: 0 },
    };
    const result = await storeDataFile(dataFile);
    const dataId = result.id ? result.id : "";

    await persist_sql(sqlStatement, dataId)
        .then(() => register_table(dataId, dataName))
        .then(() => get_table_schema(dataName))
        .then((/** @type {string} */ schema) => addSchema(JSON.parse(schema)))
        .then(() => linkQueryToDataFile(queryId, dataId))
        .catch((/** @type {Error} */ e) => {
            setErrorView(e.message);
        });
    return dataId;
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
                        const idLength = 'DataSourceExec: file_groups={1 group: [['.length;
                        const startIndex = candidate.indexOf('DataSourceExec: ');
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

