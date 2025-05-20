<script>
	let { csvConfig } = $props();
</script>

<div>
	<h4 class="mt-4 text-sm font-semibold">Optional CSV format configuration</h4>
	<fieldset class="fieldset">
		<div class="grid sm:grid-cols-3">
			<div class="mt-1 mr-2">
				<label class="label" for="delimiter-input">Delimiter (default: ',')</label>
				<input
					id="delimiter-input"
					type="text"
					class="input input-xs"
					bind:value={csvConfig.delimiter}
					maxlength={Number(1)}
					required
				/>
			</div>
			<div class="mt-1 mr-2">
				<label class="label" for="quote-input">Quote (default: '"')</label>
				<input
					id="quote-input"
					type="text"
					class="input input-xs"
					bind:value={csvConfig.quote}
					maxlength={Number(1)}
					required
				/>
			</div>
			<div class="mt-1">
				<label class="label" for="comment-input">Comment (default: '#')</label>
				<input
					id="comment-input"
					type="text"
					class="input input-xs"
					bind:value={csvConfig.comment}
					maxlength={Number(1)}
					required
				/>
			</div>
			<div class="mt-2 mr-2">
				<label class="label" for="escape-input">Escape (default: 'none')</label>
				<input
					id="escape-input"
					type="text"
					class="input input-xs"
					bind:value={csvConfig.escape}
					maxlength={Number(1)}
				/>
			</div>
			<div class="mt-2 mr-2">
				<label class="label" for="regex-input">Null Regex</label>
				<input
					id="regex-input"
					type="text"
					class="input input-xs"
					bind:value={csvConfig.null_regex}
					maxlength={Number(32)}
					required
				/>
			</div>
			<div class="mt-2">
				<label class="label" for="truncated-input">Truncated Rows</label>
				<br />
				<input
					id="truncated-input"
					type="checkbox"
					class="toggle toggle-primary"
					bind:checked={csvConfig.truncated}
				/>
				<div></div>
			</div>
		</div>
	</fieldset>
	<div role="alert" class="alert alert-info alert-soft mt-4">
		<span class="icon-[ph--info-bold] h-4 w-4"></span>
		<span>The CSV file needs a header to be import as table.</span>
	</div>
</div>
