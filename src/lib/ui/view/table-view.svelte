<script>
	import { onMount } from 'svelte';
	import { getCachedTable } from '../datasets.svelte';

	let { dataName } = $props();

	let table = $state();

	onMount(() => {
		table = getCachedTable(dataName);
	});
</script>

{#if $table}
	<div class="h-48 w-96 bg-secondary/30 border-secondary/40 rounded-sm border p-1 mt-4" style="overflow-x:auto;">
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
	<div class="skeleton h-48 w-96"></div>
{/if}
