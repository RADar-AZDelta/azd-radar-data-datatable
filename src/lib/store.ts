import { writable } from 'svelte/store'

const loading = writable<boolean>(false)

export { loading }
