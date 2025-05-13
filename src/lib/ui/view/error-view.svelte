<script>
	import { Panel } from "@xyflow/svelte";
	import { Alert, Button } from "flowbite-svelte";
	import { BullhornOutline, CloseCircleOutline } from "flowbite-svelte-icons";
	import { errorView } from '$lib/errorUtils';

</script>

<Panel position="top-left" style="visibility: {$errorView.visibility}; width: 33%;">
    <Alert color={$errorView.color} dismissable>
        <BullhornOutline slot="icon" class="h-5 w-5" />
        <span class="text-sm font-medium">{$errorView.msg}</span>
        <Button
            slot="close-button"
            size="xs"
            pill
            on:click={() => ($errorView.visibility = 'hidden')}
            class="ms-auto h-6 w-6"
            ><CloseCircleOutline color="white" size="lg" strokeWidth="3" /></Button
        >
    </Alert>
</Panel>