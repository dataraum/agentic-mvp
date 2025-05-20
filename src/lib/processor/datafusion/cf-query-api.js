import { setErrorView } from "$lib/ui/errorUtils";
import { persist_sql, register_table, get_table_schema, run_sql } from "proto-query-engine";
import { unregisterDataTable, registerDataTable } from "./cf-table-api";
import { addSchema } from "$lib/ui/datasets.svelte";
import { Table, tableFromIPC } from "@apache-arrow/ts";
import { updateDataName } from "$lib/persist/surreal";

/**
 * @param {string} newDataName
 * @param {QueryNode} data
 */
export async function changePersistedQueryName(newDataName, data) {
    await unregisterDataTable(data.dataName ?? '')
        .then(() => registerDataTable(data.id ?? '', newDataName))
        //.then((/**@type{any}*/ schema) => updateSchema(data.dataName ?? '', schema))
        .then(() => updateDataName('queries', data.id ?? '', newDataName));
}
/**
 * @param {string} sqlStatement
 * @param {string} dataName
 * @param {string} queryId
 * @returns {Promise<void>}
 */
export async function storePersistedQuery(sqlStatement, dataName, queryId) {
    await persist_sql(sqlStatement, queryId)
        .then(() => register_table(queryId, dataName))
        .then(() => get_table_schema(dataName))
        .then((/** @type {string} */ schema) => addSchema(JSON.parse(schema)))
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

