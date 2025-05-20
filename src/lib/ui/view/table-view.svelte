<script>
	import { onMount } from 'svelte';
	import { getCachedTable } from '../datasets.svelte';

	let { dataName } = $props();

	let table = $state();

	onMount(() => {
		table = getCachedTable(dataName);
		console.log('table', table);
	});
</script>

{#if $table}
	<div class="h-96 w-96" style="overflow-x:auto;">
		<table class="table-xs table-pin-rows table-pin-cols table">
			<thead>
				<tr>
					<th></th>
					{#each $table.schema.fields as field}
						<th>{field.name}</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each $table.toArray() as row, i}
					<tr>
						<th>{i}</th>
						{#each row.toArray() as value}
							<td>{value}</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{:else}
	<div class="skeleton h-96 w-96"></div>
{/if}
