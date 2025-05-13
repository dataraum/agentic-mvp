<script>
	import { Alert, Card, Heading, Input, Label, Toggle } from "flowbite-svelte";
	import { InfoCircleSolid } from "flowbite-svelte-icons";

    let {csvConfig} = $props();
    
</script>

<Card size="lg" class="p-3" shadow="inner">
    <Heading tag="h6">Optional CSV format configuration</Heading>
    <div class="my-4 grid gap-4 sm:grid-cols-3">
        <div>
            <Label for="delimiter" class="text-xs">Delimiter (default: ',')</Label>
            <Input
                type="text"
                id="delimiter"
                bind:value={csvConfig.delimiter}
                size="sm"
                maxlength={Number(1)}
                required
            />
        </div>
        <div>
            <Label for="quote" class="text-xs">Quote (default: '"')</Label>
            <Input
                type="text"
                id="quote"
                bind:value={csvConfig.quote}
                size="sm"
                maxlength={Number(1)}
            />
        </div>
        <div>
            <Label for="comment" class="text-xs">Comment (default: '#')</Label>
            <Input
                type="text"
                id="comment"
                bind:value={csvConfig.comment}
                size="sm"
                maxlength={Number(1)}
            />
        </div>
        <div>
            <Label for="escape" class="text-xs">Excape (default: 'none')</Label>
            <Input
                type="text"
                id="escape"
                bind:value={csvConfig.escape}
                size="sm"
                maxlength={Number(1)}
            />
        </div>
        <div>
            <Label for="nullRegex" class="text-xs">Null Regex (default: '(NA)|$^')</Label>
            <Input
                type="text"
                id="nullRegex"
                size="sm"
                bind:value={csvConfig.null_regex}
                maxlength={Number(32)}
            />
        </div>
        <Toggle
            color="purple"
            size="small"
            id="truncated"
            class="mt-4"
            bind:checked={csvConfig.truncated}>Truncated Rows</Toggle
        >
    </div>
    <Alert color="fuchsia" class="mt-2 p-0.5">
        {#snippet icon()}<InfoCircleSolid class="h-4 w-4" />{/snippet}
        <span class="text-md"
            >The CSV file needs a header to import it meaningfully as table with Apache Arrow.</span
        >
    </Alert>
</Card> 