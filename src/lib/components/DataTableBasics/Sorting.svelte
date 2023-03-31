<script lang="ts">
  import SortDirection from '../../classes/enums/SortDirection'
  export let col: string, direction: number, updateSorting: Function
</script>

<div>
  <button class="button is-small is-fullwidth" on:click={updateSorting(col, direction)}>
    <p>{col}</p>
    <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="1em" height="1rem" version="1.1">
      <g>
        <path
          fill="%23888888"
          class={`${direction == SortDirection.None || direction == SortDirection.Ascending ? 'fill' : 'empty'}`}
          d="M1.5 6.5l6 -6 5.962 6c-0.984,0 -4.962,0 -11.962,0z"
        />
        <path
          fill="%23888888"
          class={`${direction == SortDirection.None || direction == SortDirection.Descending ? 'fill' : 'empty'}`}
          id="down"
          d="M13.5 9.5l-6 6 -6 -6c0,0 12,0 12,0z"
        />
      </g>
    </svg>
  </button>
</div>

<style>
  .fill {
    fill: #888888;
  }

  .empty {
    fill: #ffffff;
  }
</style>
