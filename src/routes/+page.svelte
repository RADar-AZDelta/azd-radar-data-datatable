<script lang="ts">
    import DataTableRenderer from "$lib/components/DataTableRenderer.svelte";
    export var data: [string, any][][]; data = [
        Object.entries({ name: "John", age: 35, country: "USA" }),
        Object.entries({ name: "Jane", age: 25, country: "Canada" }),
        Object.entries({ name: "Jack", age: 55, country: "USA" }),
        Object.entries({ name: "Jill", age: 45, country: "Canada"}),
    ];
    console.log(data)
</script>
<h1>Welcome to your library project</h1>
<p>Create your package using @sveltejs/package and preview/showcase your work with SvelteKit</p>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>

<DataTableRenderer bind:data />
