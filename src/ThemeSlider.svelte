<script>
	import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();
  
  function handleTheme(event) {
    event.preventDefault();
    dispatch('themeChange', {
      isLight: event.srcElement.checked
    })
  }
</script>

<style>
  .switch {
    position: absolute;
    display: inline-block;
    width: 60px;
    height: 34px;
    top: 16px;
    right: 16px;
  }

  .switch input {
    opacity: 0;
    width: 0;
    height: 0;
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

  /* input + .slider {
      box-shadow: 0 0 10px white;
    } */

  input:checked + .slider:before {
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

<label class="switch">
  <input type="checkbox" on:change={handleTheme} checked={localStorage.getItem('isLightTheme') === 'true'}/>
  <span class="slider round" />
</label>
