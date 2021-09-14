<script>
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();
  export let isChecked = localStorage.getItem("isLightTheme") === "true";

  function handleTheme(event) {
    isChecked = !isChecked;
    dispatch("themeChange", {
      isLight: isChecked,
    });
  }
</script>

<div class="switch">
  <span
    on:click={handleTheme}
    class={isChecked ? "slider round right" : "slider round"}
  />
</div>

<style>
  .switch {
    position: absolute;
    width: 60px;
    height: 34px;
    top: 16px;
    right: 16px;
    min-width: 16px;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--contrast-color);
    -webkit-transition: 0.4s;
    transition: 0.4s;
  }

  .slider:before {
    position: absolute;
    content: "";
    height: 26px;
    width: 26px;
    left: 4px;
    bottom: 4px;
    background-color: var(--main-bg-color);
    -webkit-transition: 0.4s;
    transition: 0.4s;
  }

  /* div + .slider {
      box-shadow: 0 0 10px white;
    } */

  .right:before {
    -webkit-transform: translateX(26px);
    -ms-transform: translateX(26px);
    transform: translateX(26px);
  }

  /* Rounded sliders */
  .slider.round {
    border-radius: 34px;
  }

  .slider.round:before {
    border-radius: 50%;
  }
</style>
