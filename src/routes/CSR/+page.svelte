<script lang="ts">
  import DataTableRendererCsr from '$lib/components/DataTable/DataTableRendererCSR.svelte'
  import DragAndDrop from '$lib/components/Extra/DragAndDrop.svelte'
  import type IStatus from '$lib/interfaces/IStatus'
  import { writable } from 'svelte/store'
  import type { PageData } from './$types'

  export let data: PageData

  let statuses: IStatus[] = [
    {
      column: 'mappingStatus',
      status: 'APPROVED',
      color: 'hsl(120, 100%, 75%)',
      priority: 1,
    },
    {
      column: 'mappingStatus',
      status: '',
      color: 'hsl(0, 100%, 75%)',
      priority: 1,
    },
    {
      column: 'statusSetBy',
      status: 'Dupulthys Stijn',
      color: 'hsl(16, 100%, 75%)',
      priority: 0,
    },
    {
      column: 'statusSetBy',
      status: 'Kim Denturck',
      color: 'hsl(240, 100%, 75%)',
      priority: 0,
    },
  ]

  const urlJSON = 'data:application/json;base64,' + btoa(JSON.stringify(data.data))
  const urlCSV =
    'https://raw.githubusercontent.com/RADar-AZDelta/AZDelta-OMOP-CDM/main/observation/observation_concept_id/mzg_usagi.csv'
  const fetchOptionsJSON = {
    method: 'GET',
    header: {
      'Content-Type': 'application/json',
    },
  }
  const fetchOptionsCSV = {
    method: 'GET',
    header: {
      'Content-Type': 'text/csv;charset=UTF-8',
    },
  }

  const fileName: string = 'medicatie_usagi.csv'

  const delimiter: string = ',' // Specific for CSV

  const file = writable<File | null>(null)
</script>

<h1>RADar-DataTable Demo - REST data</h1>
<p>This page demonstrates how the already manipulated data gets fetched from the API and rendered in the DataTable.</p>
<!-- <DataTableRendererCsr url={urlCSV} fetchOptions={fetchOptionsCSV} dataType="CSV" {delimiter} editable={true}/> -->
<!-- <DataTableRendererCsr url={urlJSON} fetchOptions={fetchOptionsJSON} dataType="JSON" /> -->
<!-- <DataTableRendererCsr {fileName} {delimiter} dataType="csv"/> -->

<DragAndDrop {file} fileExtension="csv" />
{#if $file != null}
  <DataTableRendererCsr statusScheme={statuses} file={$file} dataType="csv" {delimiter} />
{/if}
