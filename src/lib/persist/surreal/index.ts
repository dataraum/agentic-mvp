import { RecordId, Surreal, type RecordIdValue } from 'surrealdb';
import { surrealdbWasmEngines } from '@surrealdb/wasm';

export type DataNodeRecord = DataNodeBody & GeneralResult;
export type QueryNodeRecord = QueryNodeBody & GeneralResult;
export type ChartNodeRecord = ChartNodeBody & GeneralResult;
export type GeneralResult = {
	id: RecordId;
};
export type InOutEdge = GeneralResult & {
	in: RecordId;
	out: RecordId;
};

export const surrealDb = new Surreal({
	engines: surrealdbWasmEngines()
});
export async function closeGraphDb() {
	await surrealDb.close();
}
export async function openGraphDb() {
	await surrealDb.connect('indxdb://configuration', { namespace: 'browser', database: 'proto' });
	// TODO make it schemafull
	// .then(
	//     () => (db.query(
	//     "DEFINE FIELD in ON TABLE import TYPE record<DataFile>;"
	//     + "DEFINE FIELD out ON TABLE import TYPE record<Transformer>;"
	//     + "DEFINE INDEX unique_relationships ON TABLE import COLUMNS in, out UNIQUE;").then(
	//     (result) => (console.log(result)
	//     ))));
}

export async function getDataGraph(): Promise<any> {
	const result = surrealDb.query<GeneralResult[][]>(
		'SELECT * FROM data;SELECT * FROM queries;SELECT * FROM charts;SELECT * FROM connected;'
	);
	const retResult = {
		data: [] as DataNode[],
		queries: [] as QueryNode[],
		charts: [] as ChartNode[],
		import: [] as InOutEdge[]
	};
	(await result).map((data) => {
		data.map((entry) => {
			switch (entry.id.tb) {
				case 'data':
					const dataEntry = entry as DataNodeRecord;
					retResult.data.push({
						id: dataEntry.id.id.toString(),
						dataName: dataEntry.dataName,
						format: dataEntry.format,
						size: dataEntry.size,
						position: dataEntry.position,
					});
					break;
				case 'queries':
					const queryEntry = entry as QueryNodeRecord;
					retResult.queries.push({
						id: queryEntry.id.id.toString(),
						dataName: queryEntry.dataName,
						format: queryEntry.format,
						statement: queryEntry.statement,
						position: queryEntry.position
					});
					break;
				case 'charts':
					const chartEntry = entry as ChartNodeRecord;
					retResult.charts.push({
						id: chartEntry.id.id.toString(),
						queryId: chartEntry.queryId,
						queryName: chartEntry.queryName,
						chartName: chartEntry.chartName,
						chartConfig: chartEntry.chartConfig,
						position: chartEntry.position
					});
					break;
				case 'connected':
					const connectedEntry = entry as InOutEdge;
					retResult.import.push({
						id: connectedEntry.id,
						in: connectedEntry.in,
						out: connectedEntry.out
					});
					break;
			}
		});
	});
	return retResult;
}
export async function updatePosition(table: string, position: { x: number; y: number; }, id: RecordIdValue) {
	surrealDb.merge(
		new RecordId(table, id), {
		position: position
	});
}

export async function deleteNodeRecord(table: string, dataId: string) {
	surrealDb.delete(new RecordId(table, dataId));
}

export async function updateDataName(table: string, id: string, dataName: string) {
	surrealDb.merge<DataNodeRecord>(
		new RecordId(table, id), {
		dataName: dataName
	});
}

export async function deleteItAll() {
	surrealDb.query('REMOVE DATABASE proto;');
}

