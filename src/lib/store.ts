import { writable } from 'svelte/store'

const workerMess = writable<boolean>(false)

export { workerMess }
