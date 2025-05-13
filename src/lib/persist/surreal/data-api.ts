import { surrealDb, type DataNodeRecord } from ".";
import { RecordId } from 'surrealdb';

export async function getDatasetData(dataId: string): Promise<DataNode> {
	const result = await surrealDb.select<DataNodeRecord>(
		new RecordId('data', dataId)
	);
	return {
		id: result.id.id.toString(),
		dataName: result.dataName,
		format: result.format,
		size: result.size,
		nodeView: result.nodeView,
		position: result.position
	};
}

export async function storeDataFile(dataFile: DataNode): Promise<DataNode> {
	const result = await surrealDb.insert<DataNodeBody>('data', {
		format: dataFile.format,
		dataName: dataFile.dataName,
		size: dataFile.size,
		nodeView: dataFile.nodeView,
		position: dataFile.position
	});
	return {
		id: result[0].id.id.toString(),
		dataName: result[0].dataName,
		format: result[0].format,
		size: result[0].size,
		nodeView: result[0].nodeView,
		position: result[0].position
	};
}

export async function updateDataName(id: string, dataName: string) {
	surrealDb.merge<DataNodeRecord>(
		new RecordId('data', id), {
		dataName: dataName
	});
}

export async function updateSelectedView(id: string, viewId: number) {
	surrealDb.merge(
		new RecordId('data', id), {
		nodeView: viewId
	});
}

export async function deleteAllDataToQuery(id: string) {
	const queryString = 'DELETE data:' + id + '<-import;DELETE data:' + id + '<-show;';
	surrealDb.query(queryString);
}
