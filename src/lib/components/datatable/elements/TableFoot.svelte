<script lang="ts">
  import options from '../../../helpers/Options.svelte'
  import ExtraLayer from '../extra/ExtraLayer.svelte'
</script>

{#if !options.internalOptions.hidePagination || !options.internalOptions.hideOptions}
  <tfoot>
    <ExtraLayer />
  </tfoot>
{/if}
