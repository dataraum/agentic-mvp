import { openGraphDb } from '$lib/persist/surreal';
import { getDatasetData } from '$lib/persist/surreal/data-api';
import { initFusion } from '$lib/processor/datafusion/cf-table-api';
import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageLoad} */
export function load({ params }) {
	if (params.data_id) {
		return initFusion()
			.then(() => openGraphDb())
			.then(() => getDatasetData(params.data_id))
			.then((dataset) => {
				return {
					data_id: params.data_id,
					table_name: dataset.dataName
				};
			})
	}
	error(404, 'Not found');
}