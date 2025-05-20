import { deleteQueryToDataImport, addDataQueryEdge, storeQueryFile, getQueryName } from '$lib/persist/surreal/queries-api';
import { deleteAllDataToQuery } from '$lib/persist/surreal/data-api';
import { deleteDataTable, registerDataTable } from "$lib/processor/datafusion/cf-table-api";
import { getTables } from '$lib/processor/datafusion/cf-query-api';
import { deleteNodeRecord, getDataGraph } from '$lib/persist/surreal';
import randomName from '@scaleway/random-name';
import { setTableCache } from '../datasets.svelte';
import { storeChartConfig } from '$lib/persist/surreal/chart-api';

export const DATA_NODE_TYPE = 'dataNode';
export const CHART_NODE_TYPE = 'chartNode';
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
	dataName: '',
	position: { x: 480, y: 50 },
};

const DEFAULT_CHART_NODE = {
	id: '',
	queryId: '',
	chartConfig: DEFAULT_CHART_CFG,
	chartName: '',
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
 * @param {DataNode | QueryNode | ChartNode} data
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
	let data = { ...DEFAULT_QUERY_NODE, dataName: randomName('', '_') };
	await storeQueryFile(data).then((id) => {
		setTableCache(data.dataName, undefined);
		data = { ...data, id: id };
		updateNodeStore(QUERY_NODE_TYPE, data);
	});
}
/**
 * @param {DataNode} dataset
 */
export function addDataNode(dataset) {
	const statement = "SELECT * FROM '" + dataset.dataName + "'";
	setTableCache(dataset.dataName, statement)
		.then(() => updateNodeStore(DATA_NODE_TYPE, dataset));
}
/**
 * @param {string} queryId
 */
export async function addChartNode(queryId) {
	let data = { ...DEFAULT_CHART_NODE, 
		chartName: randomName('', '_'), 
		queryId: queryId, 
		queryName: await getQueryName(queryId) };
	await storeChartConfig(data).then(async (id) => {
		data = { ...data, id: id };
		updateNodeStore(CHART_NODE_TYPE, data);
		addEdge(data.queryId, data.id, 'import');
	});
}
/**
 * @param {string} id 
 */
export function deleteChartNode(id) {
	deleteNodeRecord('charts', id)
		.then(() => deleteNode(id))
		.then(() => {
			edges = edges.reduce(
				(/** @type {import("@xyflow/svelte").Edge[]} */p, c) => (
					c.target !== id && p.push(c), p), []);
		});
}
/**
 * @param {string} id 
 */
export function deleteQueryNode(id) {
	deleteNodeRecord('queries', id)
		.then(() => deleteNode(id))
		.then(() => deleteQueryToDataImport(id))
		.then(() => {
			edges = edges.reduce(
				(/** @type {import("@xyflow/svelte").Edge[]} */p, c) => (
					c.target !== id && p.push(c), p), []);
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
				addDataQueryEdge(tableId, id).then(() =>
					addEdge(tableId, id, 'import')
				)
			);
		});
}
/**
 * @param {string} dataId
 * @param {string} queryId
 * @param {string} label
 */
function addEdge(dataId, queryId, label) {
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
		showFileSelect();
		return;
	}
	for (const dataset of allData.data) {
		await registerDataTable(dataset.id, dataset.dataName);
		addDataNode(dataset);
	}
	for (const query of allData.queries) {
		if (query.statement) {
			await registerDataTable(query.id, query.dataName);
			await setTableCache(query.dataName, query.statement);
		}
		updateNodeStore(QUERY_NODE_TYPE, query);
	}
	for (const chart of allData.charts) {
		updateNodeStore(CHART_NODE_TYPE, chart);
		addEdge(chart.queryId, chart.id, 'import');
	}
	for (const edge of allData.import) {
		addEdge(edge.in.id.toString(), edge.out.id.toString(), 'import');
	}
}
export function showFileSelect() {
	const fileSelect = document.querySelector('#file-select-modal');
	if (fileSelect) {
		// @ts-ignore
		fileSelect.showModal();
	}
}