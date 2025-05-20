import { RecordId } from "surrealdb";
import { surrealDb } from ".";

export async function storeChartConfig(queryData: ChartNode) {
    const result = await surrealDb.insert<ChartNodeBody>('charts', {
        queryId: queryData.queryId,
        queryName: queryData.queryName,
        chartConfig: queryData.chartConfig,
        chartName: queryData.chartName,
        position: queryData.position
    });
    return result[0].id.id.toString();
}

export async function updateChartConfig(id: string, chartConfig: string) {
    surrealDb.merge(
        new RecordId('charts', id),
        {
            chartConfig: chartConfig,
        });
}
