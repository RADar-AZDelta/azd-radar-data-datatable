import { writable } from 'svelte/store';
import type ISorting from '$lib/interfaces/ISorting';
import type IPaginated from './interfaces/IPaginated';

const sorting = writable<Array<ISorting>>([]);

const pagination = writable<IPaginated>({
    currentPage: 1,
    totalPages: 1,
    rowsPerPage: 10
})

export { sorting, pagination };
