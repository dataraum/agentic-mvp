import { deleteQueryToDataImport, addEdge, storeQueryFile } from '$lib/persist/surreal/queries-api';
import { deleteAllDataToQuery } from '$lib/persist/surreal/data-api';
import { deleteDataTable, registerDataTable } from "$lib/processor/datafusion/cf-table-api";
import { getTables, unpersistedQueryNode } from '$lib/processor/datafusion/cf-query-api';
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
	id: '',
	format: 'df/sql',
	chartConfig: DEFAULT_CHART_CFG,
	nodeView: -1,
	position: { x: 480, y: 50 },
};

const nodeStyle =
	'border: 1px solid #777; border-radius: 7px; padding: 10px; background: rgba(255, 255, 255, 0.65);';

/**
 * @type {import("@xyflow/svelte").Node[]}
 */
let nodes = $state.raw([]);
/**
 * @type {import("@xyflow/svelte").Edge[]}
 */
let edges = $state.raw([]);
export const getNodes = () => nodes;
export const getEdges = () => edges;

export const setNodes = (/** @type {import("@xyflow/svelte").Node[]} */ newNodes) => nodes = [...newNodes];
export const setEdges = (/** @type {import("@xyflow/svelte").Edge[]} */ newEdges) => edges = [...newEdges];

///// HELPER FUNCTIONS
export function resetGraph() {
	nodes = [];
	edges = [];
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
	nodes.push(node);
	nodes = [...nodes];
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
			edges = edges.reduce(
				(/** @type {import("@xyflow/svelte").Edge[]} */p, c) => (
					c.source !== nodeId && p.push(c), p), []);
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
 * @param {QueryNode} data 
 */
export function deleteQueryNode(data) {
	unpersistedQueryNode(data, data.dataId ?? '', data.dataName ?? '')
		.then(() => deleteNodeRecord('queries', data.id))
		.then(() => deleteNode(data.id))
		.then(() => deleteQueryToDataImport(data.id))
		.then(() => {
			edges = edges.reduce(
				(/** @type {import("@xyflow/svelte").Edge[]} */p, c) => (
					c.target !== data.id && p.push(c), p), []);
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
			edges = edges.reduce(
				(/** @type {import("@xyflow/svelte").Edge[]} */p, c) => (
					c.target !== id && c.label !== 'import' && p.push(c), p), []);
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
	edges.push(queryDataEdge);
	edges = [...edges];
}
/**
 * @param {string} nodeId
 */
function deleteNode(nodeId) {
	nodes = nodes.reduce(
		(/** @type {import("@xyflow/svelte").Node[]} */p, c) => (
			c.id !== nodeId && p.push(c), p), []);
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
