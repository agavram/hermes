<script>
  import * as words from './data/words.json'
  import * as quotes from './data/quotes.json'
  import Letter from './Letter.svelte'
  import ThemeSlider from './ThemeSlider.svelte'
  import WPM from './WPM.svelte'
  import Hermes from './assets/Hermes.svelte'
  import Redo from './assets/Redo.svelte'
  import { onMount } from 'svelte'
  import { smoothScroll } from './helpers/smoothScroll'
  import { newChart } from './helpers/chartController'
  import { removeArray, getRandom } from './helpers/utils'

  export let animateRedo
  export let lettersState = []
  export let wpm
  export let caretState = undefined
  export let lengthIndicatorState = undefined
  export let dataSourceIndicatorState = undefined
  export let fade = false
  export let lengths = [
    {
      minLength: 10,
      desc: 'short',
    },
    {
      minLength: 25,
      desc: 'medium',
    },
    {
      minLength: 50,
      desc: 'long',
    },
  ]

  let complete
  let timeStart
  let finish
  let keysDown = []
  let length = localStorage.getItem('length') ? JSON.parse(localStorage.getItem('length')) : lengths[1]
  let dataSource = localStorage.getItem('dataSource') === 'quotes' ? 'quotes' : 'words'

  let accuracy = []
  let showChart
  let focusLost = true

  let tc = document.getElementById('text-container')
  let ta = document.getElementById('textarea')

  onMount(() => {
    setTimeout(() => {
      tc = document.getElementById('text-container')
      ta = document.getElementById('textarea')

      tc.addEventListener('touch', touchHandler)
      tc.addEventListener('click', touchHandler)

      ta.addEventListener('focus', textContainerFocusChange)
      ta.addEventListener('blur', textContainerFocusChange)
      handleRedo()
    }, 0)
  })

  function touchHandler(event) {
    event.preventDefault()
    ta.focus()
  }
  let lastIndex = 0

  function textContainerFocusChange(event) {
    if (event.type === 'focus') {
      focusLost = false
      updateCaret(lastIndex)
      ta.selectionEnd = lastIndex
      ta.selectionStart = lastIndex
    } else {
      focusLost = true
      updateCaret(undefined)
    }
  }

  let correct = 0
  let total = 0
  function textChanged(e) {
    if (complete) return
    let position = e.target.selectionEnd
    const lastCharacter = e.data?.length > 0 ? e.data[e.data.length - 1] : null
    if (lettersState[position - 1]?.letter === ' ' && lastCharacter !== ' ' && lastCharacter !== null) {
      e.target.value = e.target.value.substring(e, position - 1)
      position = e.target.selectionEnd
    }

    const text = e.target.value
    if (timeStart === undefined) timeStart = Date.now()
    const start = Math.max(e.target.selectionStart - 1 ?? 0, 0)

    for (let i = start; i <= Math.min(Math.max(lastIndex, text.length - 1), lettersState.length - 1); i++) {
      const letter = text[i] ?? ''
      if (letter === lettersState[i].letter) {
        correct++
        total++
        lettersState[i].isCorrect = true
      } else if (letter === '') {
        lettersState[i].isCorrect = undefined
      } else {
        lettersState[i].isCorrect = false
        total++
      }
    }
    accuracy.push(correct / total)
    lastIndex = position
    updateWPM()
    updateCaret(position)
    const rect = document.getElementById(position)
    if (rect && tc.scrollHeight > tc.clientHeight && rect.offsetTop > rect.offsetHeight * 2 + tc.scrollTop) {
      smoothScroll(tc, rect.offsetTop, 300)
    }

    if (position === lettersState.length) {
      complete = true
      renderChart()
    }
  }

  function updateWPM() {
    if (timeStart === undefined) return

    finish = Date.now()

    let correct = 0
    let finalCount = 0
    for (let i = 0; i < lettersState.length; i++) {
      finalCount++
      const letterState = lettersState[i]
      if (letterState.isCorrect === undefined) break
      if (letterState.isCorrect) correct++
    }
    if (finalCount < 3) return

    // Assuming 5 characters per word
    wpm = Math.round(correct / 5 / ((finish - timeStart) / 1000 / 60))
  }

  document.onkeyup = function (event) {
    removeArray(keysDown, event.key)

    if (event.code === 'Escape') {
      handleRedo(true)
    }
  }

  // Needed if key is pressed down when focus is lost
  window.addEventListener('focus', function (event) {
    keysDown = []
  })

  function handleRedo(animate = false) {
    if (!animateRedo && animate) {
      animateRedo = true
      setTimeout(() => {
        animateRedo = false
      }, 1000)
    }

    ta.selectionEnd = 0
    ta.selectionStart = 0
    ta.value = ''
    lastIndex = 0
    correct = 0
    total = 0
    updateCaret(0)

    fade = true
    timeStart = undefined
    wpm = undefined
    complete = true
    accuracy = []

    setTimeout(() => {
      if (dataSource === 'words') {
        lettersState = getRandom(words.default, length.minLength)
          .join(' ')
          .split('')
          .map(function (letter) {
            return {
              letter: letter,
              isCorrect: undefined,
            }
          })
      } else if (dataSource === 'quotes') {
        let quote
        do {
          quote = getRandom(quotes.default, 1)[0]
        } while (Math.abs(quote.length / 5 - length.minLength) > 10)
        lettersState = quote.content.split('').map(function (letter) {
          return {
            letter: letter,
            isCorrect: undefined,
          }
        })
      }

      setTimeout(() => {
        updateLengthIndicator()
        handleDataSource()
        ta.focus();
        complete = false
      }, 0)

      // ms for color of letters to change
      setTimeout(() => {
        fade = false
        showChart = false

        setTimeout(() => {
          showChart = undefined
        }, 300)
        tc.scroll(0, 0)
      }, 120)
      // ms for fade out
    }, 150)
  }

  export let isLightTheme = localStorage.getItem('isLightTheme') === 'true' ? true : false
  function handleThemeChange(event) {
    isLightTheme = event.detail.isLight
    localStorage.setItem('isLightTheme', isLightTheme)
    if (showChart) {
      setTimeout(() => {
        renderChart()
      }, 0)
    }
  }

  async function renderChart() {
    var style = getComputedStyle(document.getElementById('main'))
    const accent = style.getPropertyValue('--accent-color')

    showChart = false
    await new Promise((resolve) => setTimeout(resolve, 0))
    showChart = true
    const dataset = accuracy.map((a) => a * 100)
    const data = {
      labels: dataset,
      datasets: [
        {
          label: 'Accuracy',
          data: dataset,
          fill: false,
          borderColor: accent,
          tension: 0.5,
        },
      ],
    }

    newChart(data)
  }

  function handleLengthSelected(newLength) {
    length = newLength
    handleRedo()
    localStorage.setItem('length', JSON.stringify(length))
  }

  function updateLengthIndicator() {
    let src = document.getElementById('length' + length.minLength)
    if (!src) {
      src = document.getElementsByClassName('length')[0]
    }

    lengthIndicatorState = {
      top: src.offsetHeight + 'px',
      left: src.offsetLeft + 'px',
      width: src.offsetWidth + 'px',
    }
  }

  function handleDataSource(newDataSource) {
    if (newDataSource === undefined) {
      newDataSource = dataSource
    } else {
      localStorage.setItem('dataSource', newDataSource)
      dataSource = newDataSource
      handleRedo()
    }
    let src = document.getElementById(newDataSource)

    dataSourceIndicatorState = {
      top: src.offsetHeight + 'px',
      left: src.offsetLeft + 'px',
      width: src.offsetWidth + 'px',
    }
  }

  function updateCaret(index) {
    if (index === undefined) caretState = undefined
    setTimeout(() => {
      let rect = document.getElementById(index)
      if (rect) {
        ta.style.top = rect.offsetTop + rect.offsetHeight + 'px'
        caretState = {
          top: rect.offsetTop + 'px',
          left: rect.offsetLeft - 3 + 'px',
        }
      }
    }, 0)
  }
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Urbanist:ital@1&display=swap" rel="stylesheet" />
  <link href="https://fonts.googleapis.com/css2?family=PT+Mono&display=swap" rel="stylesheet" />
</svelte:head>

<main class={isLightTheme ? 'light' : 'dark'} id="main">
  <div class="top-bar">
    <div />
    <div class="logo">
      <h1>hermes</h1>
      <Hermes />
    </div>
    <div>
      <ThemeSlider on:themeChange={handleThemeChange} />
    </div>
  </div>
  <div class="typing">
    {#if showChart !== undefined}
      <div class="chart-container" class:fade={showChart === false}>
        <canvas id="chart" />
      </div>
    {/if}
    <div />
    <div id="text-container" class="text-container" class:fade={showChart || fade}>
      <textarea id="textarea" cols="10" rows="10" on:input={textChanged} ondrop="return false;" onpaste="return false;" autocapitalize="none" autocomplete="off"/>
      {#if !focusLost && !complete && caretState !== undefined}
        <span class="caret" style={`top: ${caretState.top}; left: ${caretState.left}`} />
      {/if}
      {#each lettersState as letterState, id}
        <Letter {letterState} {id} />
      {/each}
    </div>
    <div class="bottom">
      <div>
        <WPM {wpm} />
      </div>
      <div class="redo" class:animate-redo={animateRedo}>
        <Redo on:redo={() => handleRedo(true)} />
      </div>
      <div class="settings">
        <div class="lengths">
          {#each lengths as length, index}
            {#if index !== 0}<span>/</span>{/if}
            <h2 class="length" id={'length' + length.minLength} on:click={() => handleLengthSelected(length)}>
              {length.desc}
            </h2>
          {/each}
          {#if lengthIndicatorState !== undefined}
            <hr style={`top: ${lengthIndicatorState.top}; left: ${lengthIndicatorState.left}; width: ${lengthIndicatorState.width}`} />
          {/if}
        </div>

        <div class="data-source">
          <h2 id="words" on:click={() => handleDataSource('words')}>words</h2>
          <span> /</span>
          <h2 id="quotes" on:click={() => handleDataSource('quotes')}>quotes</h2>
          {#if dataSourceIndicatorState !== undefined}
            <hr style={`top: ${dataSourceIndicatorState.top}; left: ${dataSourceIndicatorState.left}; width: ${dataSourceIndicatorState.width}`} />
          {/if}
        </div>
      </div>
    </div>
  </div>
</main>

<style>
  #textarea {
    pointer-events: none;
    width: 1px;
    height: 1px;
    min-width: 0px;
    min-height: 0px;
    margin: 0;
    padding: 0;
    position: absolute;
    outline: none !important;
    resize: none;
    border: none;
    overflow: hidden;
    color: transparent;
    background-color: transparent;
  }
  .chart-container {
    position: absolute;
    top: 25%;
    transform: translateY(-25%);
    width: 90%;
    max-width: 750px;
    opacity: 1;
    transition-property: opacity,background-color;
    transition-duration: 300ms;
    z-index: 1;
    background-color: var(--main-bg-color);
  }
  .animate-redo {
    animation: spin 1s forwards ease;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
  @keyframes flash {
    0% {
      opacity: 100%;
    }
    to {
      opacity: 0%;
    }
  }
  main {
    background-color: var(--main-bg-color);
    height: 100%;
    transition: 0.3s;
    transition-property: background-color, color;
    font-size: 28px;
    font-family: 'Urbanist', sans-serif;
    display: flex;
    flex-direction: column;
  }
  .dark {
    --main-bg-color: #282a36;
    --main-bg-color-contrast: #44475c;
    --contrast-color: #f8f8f2;
    --comment-color: #6272a4;
    --correct-color: #50fa7b;
    --incorrect-color: #ff5555;
    --accent-color: #ff79c6;
  }
  .light {
    --main-bg-color: #eff0f1;
    --main-bg-color-contrast: #dcdfe1;
    --contrast-color: #575f66;
    --comment-color: #a0a6ac;
    --correct-color: #86b300;
    --incorrect-color: #f07171;
    --accent-color: #ff9940;
  }
  .caret {
    display: inline-block;
    position: absolute;
    width: 3px;
    height: 1.1em;
    background-color: var(--contrast-color);
    animation: flash 0.5s infinite ease-in alternate;
    transition: 0.12s ease;
    transition-property: left, top;
  }
  .logo,
  .typing {
    display: flex;
    align-items: center;
  }
  .typing {
    height: 100%;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
  }
  .logo {
    flex-direction: row;
    justify-content: center;
    letter-spacing: 2px;
  }
  .top-bar {
    display: flex;
    align-items: center;
  }
  .top-bar > * {
    flex-grow: 1;
    flex-basis: 0;
  }
  .logo > h1 {
    font-style: italic;
    font-size: 64px;
    vertical-align: middle;
    margin: 0;
  }
  @media only screen and (max-height: 500px) {
    .bottom {
      display: none !important;
    }
    .typing {
      height: calc(100vh - 130px);
    }
    .text-container {
      max-height: 100% !important;
      height: 100% !important;
    }
  }
  @media only screen and (max-width: 490px) {
    .top-bar > *:first-child {
      display: none;
    }
    .logo {
      margin-left: 5%;
    }
    .logo > h1 {
      font-size: 48px;
    }
    .text-container {
      max-height: 60vh;
      min-width: 85%;
    }
    .bottom {
      font-size: 24px;
    }
  }
  .text-container {
    padding: 3px;
    text-align: left;
    width: 65%;
    max-width: 750px;
    font-size: 1em;
    display: inline-block;
    color: var(--comment-color);
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    transition: 0.15s ease;
    transition-property: opacity;
    line-height: 1.5em;
    font-family: 'PT Mono', monospace;
    position: relative;
    overflow-y: hidden;
    cursor: text;
  }
  .bottom,
  .logo > h1 {
    color: var(--contrast-color);
  }
  .bottom {
    width: 100%;
    display: flex;
    justify-content: center;
    text-align: center;
    flex-wrap: wrap;
  }
  .bottom > *,
  .settings > div {
    display: flex;
    align-items: center;
  }
  .bottom > * {
    flex: 1 1 0px;
    flex-basis: 0;
    height: auto;
    margin: 0;
    padding: 0;
    justify-content: center;
  }
  .settings {
    display: flex;
    flex-wrap: wrap;
  }
  .settings > div {
    margin: 0 16px 16px;
  }
  .settings > div:not(:first-child) {
    margin-left: 36px;
  }
  .settings span {
    margin: 0 10px;
  }
  .settings h2 {
    font-size: 1em;
    margin: 0;
    cursor: pointer;
  }
  .fade {
    opacity: 0;
  }
  hr {
    position: absolute;
    height: 0.25rem;
    width: 36px;
    margin: 0;
    background: var(--contrast-color);
    border: 0;
    transition: 0.2s ease-in-out;
    transition-property: width, top, left;
  }
  .lengths,
  .data-source {
    position: relative;
  }
</style>
