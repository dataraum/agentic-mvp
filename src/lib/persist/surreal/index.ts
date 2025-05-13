import { RecordId, Surreal, type RecordIdValue } from 'surrealdb';
import { surrealdbWasmEngines } from '@surrealdb/wasm';

export type DataNodeRecord = DataNodeBody & GeneralResult;
export type QueryNodeRecord = QueryNodeBody & GeneralResult;
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
		'SELECT * FROM data;SELECT * FROM queries;SELECT * FROM import;'
	);
	const retResult = {
		data: [] as DataNode[],
		queries: [] as QueryNode[],
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
						nodeView: dataEntry.nodeView,
						position: dataEntry.position
					});
					break;
				case 'queries':
					const queryEntry = entry as QueryNodeRecord;
					retResult.queries.push({
						id: queryEntry.id.id.toString(),
						dataName: queryEntry.dataName,
						dataId: queryEntry.dataId,
						format: queryEntry.format,
						statement: queryEntry.statement,
						chartConfig: queryEntry.chartConfig,
						nodeView: queryEntry.nodeView,
						position: queryEntry.position
					});
					break;
				case 'import':
					const importEntry = entry as InOutEdge;
					retResult.import.push({
						id: importEntry.id,
						in: importEntry.in,
						out: importEntry.out
					});
				break;
			}
		});
	});
	return retResult;
}
export async function updatePosition(table: string, position: { x: number; y: number; }, id: RecordIdValue) {
	surrealDb.merge<DataNodeRecord>(
		new RecordId(table, id), {
		position: position
	});
}

export async function deleteNodeRecord(table: string, dataId: string) {
	surrealDb.delete(new RecordId(table, dataId));
}