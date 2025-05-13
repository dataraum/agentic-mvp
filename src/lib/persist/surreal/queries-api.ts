import { RecordId } from "surrealdb";
import { surrealDb, type InOutEdge, type QueryNodeRecord } from ".";

export async function deleteQueryToDataImport(queryId: string) {
	const queryString = 'DELETE queries:' + queryId + '->import;';
	surrealDb.query(queryString);
}

export async function addEdge(sourceId: string, targetId: string) {
	const queryString = 'RELATE queries:' + sourceId + '->import->data:' + targetId + ';';
	surrealDb.query(queryString);
}
export async function deleteItAll() {
	surrealDb.query('REMOVE DATABASE proto;');
}

export async function storeQueryFile(queryData: QueryNode) {
	const result = await surrealDb.insert<QueryNodeBody>('queries', {
		dataName: queryData.dataName,
		dataId: queryData.dataId,
		format: queryData.format,
		statement: queryData.statement,
		chartConfig: queryData.chartConfig,
		nodeView: queryData.nodeView,
		position: queryData.position
	});
	return result[0].id.id.toString();
}

export async function updateQueryFile(queryData: QueryNode) {
	if (!queryData.id) {
		throw new Error('Query file ID is required');
	}
	surrealDb.merge<QueryNodeRecord>(new RecordId('queries', queryData.id), {
		statement: queryData.statement,
		chartConfig: queryData.chartConfig,
		nodeView: queryData.nodeView,
	});
}

export async function linkQueryToDataFile(queryId: string, dataId: string) {
	surrealDb.merge<QueryNodeRecord>(new RecordId('queries', queryId), {
		dataId: dataId,
	});
}
