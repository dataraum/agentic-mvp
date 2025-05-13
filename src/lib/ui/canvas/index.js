import { deleteQueryToDataImport, addEdge, storeQueryFile } from '$lib/persist/surreal/queries-api';
import { writable } from 'svelte/store';
import { deleteAllDataToQuery } from '$lib/persist/surreal/data-api';
import { deleteDataTable, registerDataTable } from "$lib/processor/datafusion/cf-table-api";
import { getTables } from '$lib/processor/datafusion/cf-query-api';
import { showDataUpload } from '../data-import';
import { deleteNodeRecord, getDataGraph } from '$lib/persist/surreal';

export const DATA_NODE_TYPE = 'dataNode';
export const QUERY_NODE_TYPE = 'queryNode';
const DEFAULT_CHART_CFG = `{
	type: 'bar',
	data: {
		labels: table.toArray().map((row) => row[table.schema.fields[0].name]),
		datasets: table.schema.fields.slice(1).map((s) => {
			return {
				label: s.name,
				data: table.toArray().map((row) => Number(row[s.name])),
			};
		})
	}
}`;

const DEFAULT_QUERY_NODE = {
	format: 'df/sql',
	chartConfig: DEFAULT_CHART_CFG,
	nodeView: -1,
	position: { x: 480, y: 50 }
};

const nodeStyle =
	'border: 1px solid #777; border-radius: 7px; padding: 10px; background: rgba(255, 255, 255, 0.65);';

/** @type {import("svelte/store").Writable<import("@xyflow/svelte").Node[]>} */
export const nodes = writable([]);
/** @type {import("svelte/store").Writable<import("@xyflow/svelte").Edge[]>} */
export const edges = writable([]);

///// HELPER FUNCTIONS
export function resetGraph() {
	nodes.set([]);
	edges.set([]);
}
/**
 * @param {string} nodeType
 * @param {DataNode | QueryNode} data
 */
function updateNodeStore(nodeType, data) {
	const node = {};
	node.type = nodeType;
	node.id = data.id;
	node.deletable = false;
	node.connectable = false;
	node.position = data.position;
	node.style = nodeStyle;
	node.data = data;
	nodes.update((nodeArr) => {
		// @ts-ignore
		nodeArr.push(node);
		return nodeArr;
	});
}
/**
 * @param {DataNode} nodeData
 */
export async function addDataNode(nodeData) {
	if (nodeData.position) {
		updateNodeStore(DATA_NODE_TYPE, nodeData);
	}
}
/**
 * @param {string} nodeId 
 * @param {string} dataName 
 */
export function deleteDataNode(nodeId, dataName) {
	deleteNodeRecord('data', nodeId)
		.then(() => deleteNode(nodeId))
		.then(() => deleteAllDataToQuery(nodeId))
		.then(() => {
			edges.update((edgeArr) => {
				return edgeArr.reduce(
					(/** @type {import("@xyflow/svelte").Edge[]} */p, c) => (
						c.source !== nodeId && p.push(c), p), []);
			});
		})
		.then(() => deleteDataTable(nodeId, dataName));
}
export async function addQueryNode() {
	await storeQueryFile(DEFAULT_QUERY_NODE).then((id) => {
		const data = { ...DEFAULT_QUERY_NODE, id: id };
		updateNodeStore(QUERY_NODE_TYPE, data);
	});
}
/**
 * @param {string} nodeId 
 */
export function deleteQueryNode(nodeId) {
	deleteNodeRecord('queries', nodeId)
		.then(() => deleteNode(nodeId))
		.then(() => deleteQueryToDataImport(nodeId))
		.then(() => {
			edges.update((edgeArr) => {
				return edgeArr.reduce(
					(/** @type {import("@xyflow/svelte").Edge[]} */p, c) => (
						c.target !== nodeId && p.push(c), p), []);
			});
		});
}
/**
 * @param {string} id
 * @param {string} query
 */
export async function resetImportEdges(id, query) {
	// TODO this could be optimized to only run when necessary
	// while optimizing it should also find the depth and store it
	// on the edge entry in the db to make ordering in getDataGraph possible
	deleteQueryToDataImport(id)
		.then(() => {
			edges.update((edgeArr) => {
				return edgeArr.reduce(
					(/** @type {import("@xyflow/svelte").Edge[]} */p, c) => (
						c.target !== id && c.label !== 'import' && p.push(c), p), []);
			})
		})
		.then(async () => {
			(await getTables(query)).forEach((tableId) =>
				addEdge(tableId, id).then((sourceId) =>
					addQueryDataEdge(sourceId, id, 'import')
				)
			);
		});
}
/**
 * @param {string} dataId
 * @param {string} queryId
 * @param {string} label
 */
function addQueryDataEdge(dataId, queryId, label) {
	const queryDataEdge = {};
	//data
	queryDataEdge.source = dataId;
	//queries
	queryDataEdge.target = queryId;
	queryDataEdge.deletable = false;
	queryDataEdge.selectable = false;
	queryDataEdge.id = 'e' + dataId + '-' + queryId;
	queryDataEdge.data = {
		label: label
	};
	edges.update((edgeArr) => {
		edgeArr.push(queryDataEdge);
		return edgeArr;
	});
}
/**
 * @param {string} nodeId
 */
function deleteNode(nodeId) {
	nodes.update((nodesArr) => {
		return nodesArr.reduce(
			(/** @type {import("@xyflow/svelte").Node[]} */p, c) => (
				c.id !== nodeId && p.push(c), p), []);
	});
}
export async function initFlow() {
	resetGraph();
	const allData = await getDataGraph();
	if (!allData || allData.data.length === 0 && allData.queries.length === 0 && allData.import.length === 0) {
		showDataUpload.set(true);
		return;
	}
	const datasets = new Map();
	for (const dataset of allData.data) {
		// @ts-ignore
		await registerDataTable(dataset.id, dataset.dataName).then(() => addDataNode(dataset));
		datasets.set(dataset.id, dataset.dataName);
	}
	for (const query of allData.queries) {
		if (query.dataId) {
			const dataName = datasets.get(query.dataId);
			// @ts-ignore
			await registerDataTable(query.id, dataName);
			query.dataName = dataName;
		}
		updateNodeStore(QUERY_NODE_TYPE, query);
	}
	for (const edge of allData.import) {
		addQueryDataEdge(edge.in.id.toString(), edge.out.id.toString(), 'import');
	}
}
