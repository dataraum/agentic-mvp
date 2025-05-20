import { surrealDb, type DataNodeRecord, type InOutEdge } from ".";
import { RecordId } from 'surrealdb';

export async function isEditable(dataId: string): Promise<boolean> {
	const queryString = 'SELECT * FROM data:' + dataId + '->connected;';
	const result = await surrealDb.query<InOutEdge[][]>(queryString);
	if (result && result[0] && result[0][0] && result[0][0].in.id.toString() === dataId) {
		return false;
	} else {
		return true;
	}
}

export async function getDatasetData(dataId: string): Promise<DataNode> {
	const result = await surrealDb.select<DataNodeRecord>(
		new RecordId('data', dataId)
	);
	return {
		id: result.id.id.toString(),
		dataName: result.dataName,
		format: result.format,
		size: result.size,
		position: result.position,
	};
}

export async function storeDataFile(dataFile: DataNode): Promise<DataNode> {
	const result = await surrealDb.insert<DataNodeBody>('data', {
		format: dataFile.format,
		dataName: dataFile.dataName,
		size: dataFile.size,
		position: dataFile.position,
	});
	return {
		id: result[0].id.id.toString(),
		dataName: result[0].dataName,
		format: result[0].format,
		size: result[0].size,
		position: result[0].position,
	};
}

export async function deleteAllDataToQuery(id: string) {
	const queryString = 'DELETE data:' + id + '->connected;';
	surrealDb.query(queryString);
}
