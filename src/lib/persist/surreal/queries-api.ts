import { RecordId } from "surrealdb";
import { surrealDb, type QueryNodeRecord } from ".";

export async function deleteQueryToDataImport(queryId: string) {
	const queryString = 'DELETE queries:' + queryId + '->connected;';
	surrealDb.query(queryString);
}

export async function addDataQueryEdge(sourceId: string, targetId: string): Promise<void> {
	const queryString = 'RELATE data:' + sourceId + '->connected->queries:' + targetId + ';';
	surrealDb.query(queryString);
}

export async function storeQueryFile(queryData: QueryNode) {
	const result = await surrealDb.insert<QueryNodeBody>('queries', {
		dataName: queryData.dataName,
		format: queryData.format,
		statement: queryData.statement,
		position: queryData.position
	});
	return result[0].id.id.toString();
}

export async function updateQueryStatement(id: string, statement: string) {
	surrealDb.merge(
		new RecordId('queries', id),
		{
			statement: statement,
		});
}

export async function getQueryName(queryId: string): Promise<string> {
	const result = await surrealDb.select<QueryNodeRecord>(
		new RecordId('queries', queryId)
	);
	return result.dataName;
}

