<script lang="ts">
	import type { Writable } from "svelte/store";


	export let fileExtension: string,
		file: Writable<File | null>

	function dropHandler(event: DragEvent) {
		event.preventDefault();

		if (event.dataTransfer?.items) {
			if (event.dataTransfer.items.length > 1) {
				alert('Only drop one file');
			}
			for (let item of event.dataTransfer.items) {
				if (item.kind === 'file') {
					const f = item.getAsFile();
					if(f?.name.toLowerCase().includes(fileExtension.toLowerCase())){
                        $file = f
                    }
				}
			}
		}
	}

	function dragOverHandler(event: DragEvent) {
		event.preventDefault();
	}
</script>

<div class="drop" on:drop={dropHandler} on:dragover={dragOverHandler}>
	<p>Drop a file with {fileExtension} extension here</p>
</div>

<style>
    .drop {
        width: 100%;
        background-color: #f1f1f1;
        padding: 4rem 0;
        text-align: center;
        font-weight: 700;
        font-size: 1.5rem;
    }
</style>
