<!-- src/components/Tooltip.svelte -->
<script>
    export let tooltip = { html: '', x: 0, y: 0, visible: false };
  </script>
  
  {#if tooltip.visible}
    <div 
      class="tooltip" 
      style="left: {tooltip.x}px; top: {tooltip.y}px;"
    >
      {@html tooltip.html}
    </div>
  {/if}
  
  <style>
    .tooltip {
      position: absolute;
      z-index: 100;
      pointer-events: none;
      /* Los estilos adicionales se aplican en Map.svelte via :global() */
    }
  </style>