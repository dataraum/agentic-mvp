<script>
	import { Panel } from '@xyflow/svelte';
	import { SpeedDial, SpeedDialButton, SpeedDialTrigger } from 'flowbite-svelte';
	import {
		BrainOutline,
		CirclePlusOutline,
		CloudArrowUpOutline,
		DatabaseOutline,
		DownloadOutline,
		FacebookSolid,
		RocketOutline,
		ShareAllOutline,
		TruckOutline,
		UploadOutline
	} from 'flowbite-svelte-icons';
	import { addQueryNode } from '$lib/ui/canvas';
	import { showDataUpload } from '../data-import';
</script>

<Panel position="top-right">
	<SpeedDialTrigger class="end-5 bottom-5" gradient color="purpleToPink">
		{#snippet icon()}
			<CirclePlusOutline />
		{/snippet}
	</SpeedDialTrigger>
	<SpeedDial placement="left">
		<SpeedDialButton class="h-11 w-11" name="Model" disabled tooltip="bottom">
			<BrainOutline color="purple" />
		</SpeedDialButton>
		<SpeedDialButton class="h-11 w-11" name="Function" disabled tooltip="bottom">
			<FacebookSolid color="purple" />
		</SpeedDialButton>
		<SpeedDialButton
			class="h-11 w-11"
			name="Data"
			tooltip="bottom"
			onclick={() => showDataUpload.set(true)}
		>
			<UploadOutline color="purple" />
		</SpeedDialButton>
		<SpeedDialButton class="h-11 w-11" name="Query" tooltip="bottom" onclick={() => addQueryNode()}>
			<DatabaseOutline color="purple" />
		</SpeedDialButton>
	</SpeedDial>
	<SpeedDialTrigger class="mt-2" color="greenToBlue" gradient>
		{#snippet icon()}
			<TruckOutline />
		{/snippet}
	</SpeedDialTrigger>
	<SpeedDial placement="bottom">
		<SpeedDialButton class="h-11 w-11" name="Publish" disabled tooltip="left">
			<RocketOutline color="green" />
		</SpeedDialButton>
		<SpeedDialButton class="h-11 w-11" name="Share" disabled tooltip="left">
			<ShareAllOutline color="green" />
		</SpeedDialButton>
		<SpeedDialButton class="h-11 w-11" name="Deploy" disabled tooltip="left">
			<CloudArrowUpOutline color="green" />
		</SpeedDialButton>
		<SpeedDialButton class="h-11 w-11" name="Download" disabled tooltip="left">
			<DownloadOutline color="green" />
		</SpeedDialButton>
	</SpeedDial>
</Panel>
