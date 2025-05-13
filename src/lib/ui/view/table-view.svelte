<script>
	import {
		Table as ViewTable,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell,
		PaginationItem
	} from 'flowbite-svelte';
	import { slide } from 'svelte/transition';
	import { ArrowLeftOutline, ArrowRightOutline } from 'flowbite-svelte-icons';

	let { table, total_items, page } = $props();

	let openRow = $state(-1);

	/**
	 * @param {number} i
	 */
	function toggleRow(i) {
		openRow = openRow === i ? -1 : i;
	}
</script>

<div class="mt-4">
	{#if $table}
		<ViewTable hoverable={true}>
			<TableHead>
				{#each $table.schema.fields as field, j}
					{#if j < 8}
						<TableHeadCell padding="px-2 py-1 text-center bg-slate-200" scope="col"
							><nobr>{field.name}</nobr></TableHeadCell
						>
					{:else if j === 9}
						<TableHeadCell padding="px-2 py-1 text-center bg-slate-200">...</TableHeadCell>
					{/if}
				{/each}
			</TableHead>
			<TableBody class="nodrag divide-y">
				{#each $table.toArray() as row, i}
					<TableBodyRow
						onclick={() => {
							if ($table?.schema.fields.length > 8) toggleRow(i);
						}}
					>
						{#each row.toArray() as value, j}
							{#if j < 8}
								<TableBodyCell class="px-2 py-1 text-center">{value}</TableBodyCell>
							{:else if j === 9}
								<TableBodyCell class="px-2 py-1 text-center">...</TableBodyCell>
							{/if}
						{/each}
					</TableBodyRow>
					{#if openRow === i}
						<TableBodyRow>
							<TableBodyCell colspan={Number(8)} class="p-0">
								<div
									class="grid w-max grid-cols-5 gap-1 py-2"
									transition:slide={{ duration: 300, axis: 'y' }}
								>
									{#each row.toArray() as value, j}
										<div class="grid grid-cols-2 border-2 border-dashed">
											<span class="ml-2 max-w-48">{$table.schema.fields[j].name}</span><span
												class="mr-2 text-right">{value}</span
											>
										</div>
									{/each}
								</div>
							</TableBodyCell>
						</TableBodyRow>
					{/if}
				{/each}
			</TableBody>
		</ViewTable>
	{/if}
	{#if total_items > 10}
		<div class="mx-2 grid grid-cols-2 gap-2 pt-2">
			<div class="flex space-x-3 rtl:space-x-reverse">
				<PaginationItem
					class="flex h-6 items-center bg-slate-200 text-gray-900 hover:bg-purple-900 hover:text-purple-100"
					onclick={() => {
						if ($page > 0) $page -= 10;
					}}
				>
					<ArrowLeftOutline class="me-2 h-4 w-4" />
					Prev
				</PaginationItem>
				<PaginationItem
					class="flex h-6 items-center bg-slate-200 text-gray-900 hover:bg-purple-900 hover:text-purple-100"
					onclick={() => {
						if ($page < total_items) $page += 10;
					}}
				>
					Next
					<ArrowRightOutline class="ms-2 h-4 w-4" />
				</PaginationItem>
			</div>
			<div class="mt-1 text-right text-xs font-semibold">
				<span class="rounded bg-slate-200 px-2.5 py-1.5 text-gray-900"
					>Showing <span>{$page + 1}</span>
					to
					<span>{$page + 10 >= total_items ? total_items : $page + 10}</span>
					of
					<span>{total_items}</span>
					Entries</span
				>
			</div>
		</div>
	{/if}
</div>
