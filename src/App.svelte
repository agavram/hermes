<script>
	import * as words from "./data/words.json";
	import * as quotes from "./data/quotes.json";
	import Letter from "./Letter.svelte";
	import ThemeSlider from "./ThemeSlider.svelte";
	import WPM from "./WPM.svelte";
	import Hermes from "./assets/Hermes.svelte";
	import Redo from "./assets/Redo.svelte";
	import { onMount } from "svelte";

	export let lettersState = [];
	export let wpm;
	export let caretState = undefined;
	export let lengthIndicatorState = undefined;
	export let dataSourceIndicatorState = undefined;
	export let fade = false;
	export let lengths = [
		{
			minLength: 10,
			desc: "short",
		},
		{
			minLength: 25,
			desc: "medium",
		},
		{
			minLength: 50,
			desc: "long",
		},
	];

	let current = 0;
	let complete;
	let start;
	let finish;
	let keysDown = [];
	let length = localStorage.getItem("length")
		? JSON.parse(localStorage.getItem("length"))
		: lengths[1];
	let dataSource =
		localStorage.getItem("dataSource") === "quotes" ? "quotes" : "words";

	onMount(() => {
		setTimeout(() => {
			handleRedo();
		}, 0);
	});

	document.onkeypress = function (e) {
		if (complete || lettersState.length === 0) return;
		if (start === undefined) start = Date.now();

		if (e.key !== "Delete") {
			let currentLetter = lettersState[current].letter;
			if (e.key !== " " || lettersState[current].letter === " ") {
				if (currentLetter === e.key) {
					lettersState[current].isCorrect = true;
				} else {
					if (lettersState[current].letter === " ") {
						current--;
					} else {
						lettersState[current].isCorrect = false;
					}
				}
				current++;
			}
		}

		updateWPM();
		if (current !== lettersState.length) {
			updateCaret();
		} else {
			complete = true;
		}
	};

	function updateWPM() {
		if (current <= 1 && start !== undefined) return;

		finish = Date.now();

		let correct = 0;
		for (let i = 0; i < current; i++) {
			const letterState = lettersState[i];
			if (letterState.isCorrect) correct++;
		}

		// Assuming 5 characters per word
		wpm = Math.round(correct / 5 / ((finish - start) / 1000 / 60));
	}

	document.onkeydown = function (e) {
		if (complete) return;
		keysDown.push(e.key);

		if (keysDown.includes("Backspace")) {
			if (e.key === "Backspace") {
				// Stops from going back in firefox
				e.preventDefault();
				deleteLetter();
			}
			if (
				keysDown.includes("Meta") ||
				keysDown.includes("Control") ||
				keysDown.includes("Alt")
			) {
				while (
					lettersState[current - 1] !== undefined &&
					lettersState[current - 1].letter !== " "
				) {
					deleteLetter();
				}
			}
			updateCaret();
		}
	};

	document.onkeyup = function (event) {
		removeArray(keysDown, event.key);

		if (event.code === "Escape") {
			handleRedo();
		}
	};

	// Needed if key is pressed down when focus is lost
	window.addEventListener("focus", function (event) {
		keysDown = [];
	});

	function handleRedo() {
		fade = true;
		start = undefined;
		wpm = undefined;
		complete = true;

		setTimeout(() => {
			if (dataSource === "words") {
				lettersState = getRandom(words.default, length.minLength)
					.join(" ")
					.split("")
					.map(function (letter) {
						return {
							letter: letter,
							isCorrect: undefined,
						};
					});
			} else if (dataSource === "quotes") {
				let quote;
				do {
					quote = getRandom(quotes.default, 1)[0];
				} while (Math.abs(quote.length / 5 - length.minLength) > 10);
				lettersState = (quote.content + " ")
					.split("")
					.map(function (letter) {
						return {
							letter: letter,
							isCorrect: undefined,
						};
					});
			}

			setTimeout(() => {
				updateCaret();
				updateLengthIndicator();
				handleDataSource();
				complete = false;
				current = 0;
			}, 0);

			// ms for color of letters to change
			setTimeout(() => {
				fade = false;
			}, 120);
			// ms for fade out
		}, 150);
	}

	export let isLightTheme =
		localStorage.getItem("isLightTheme") === "true" ? true : false;
	function handleThemeChange(event) {
		isLightTheme = event.detail.isLight;
		localStorage.setItem("isLightTheme", isLightTheme);
	}

	function handleLengthSelected(newLength) {
		length = newLength;
		handleRedo();
		localStorage.setItem("length", JSON.stringify(length));
	}

	function updateLengthIndicator() {
		let src = document.getElementById("length" + length.minLength);
		if (!src) {
			src = document.getElementsByClassName("length")[0];
		}

		lengthIndicatorState = {
			top: src.getBoundingClientRect().bottom + "px",
			left: src.getBoundingClientRect().left + "px",
			width:
				src.getBoundingClientRect().right -
				src.getBoundingClientRect().left +
				"px",
		};
	}

	function handleDataSource(newDataSource) {
		if (newDataSource === undefined) {
			newDataSource = dataSource;
		} else {
			localStorage.setItem("dataSource", newDataSource);
			dataSource = newDataSource;
			handleRedo();
		}
		let src = document.getElementById(newDataSource);

		dataSourceIndicatorState = {
			top: src.getBoundingClientRect().bottom + "px",
			left: src.getBoundingClientRect().left + "px",
			width:
				src.getBoundingClientRect().right -
				src.getBoundingClientRect().left +
				"px",
		};
	}

	function updateCaret() {
		setTimeout(() => {
			let rect = document.getElementById(current).getBoundingClientRect();
			caretState = {
				top: rect.top + "px",
				left: rect.left - 3 + "px",
			};
		}, 0);
	}

	function deleteLetter() {
		if (current - 1 >= 0) {
			current--;
			lettersState[current].isCorrect = undefined;
			if (lettersState[current].temporary) {
				lettersState.splice(current, 1);
			}
		}
	}

	function removeArray(arr) {
		var what,
			a = arguments,
			L = a.length,
			ax;
		while (L > 1 && arr.length) {
			what = a[--L];
			while ((ax = arr.indexOf(what)) !== -1) {
				arr.splice(ax, 1);
			}
		}
		return arr;
	}

	function getRandom(arr, n) {
		var result = new Array(n),
			len = arr.length,
			taken = new Array(len);
		if (n > len)
			throw new RangeError(
				"getRandom: more elements taken than available"
			);
		while (n--) {
			var x = Math.floor(Math.random() * len);
			result[n] = arr[x in taken ? taken[x] : x];
			taken[x] = --len in taken ? taken[len] : len;
		}
		return result;
	}

	window.onresize = function (event) {
		updateCaret();
		updateLengthIndicator();
		handleDataSource();
	};
</script>

<style>
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
		font-family: "Roboto Mono", monospace;
	}
	.dark {
		--main-bg-color: #282a36;
		--contrast-color: #f8f8f2;
		--comment-color: #6272a4;
		--correct-color: #50fa7b;
		--incorrect-color: #ff5555;
		--accent-color: #ff79c6;
	}
	.light {
		--main-bg-color: #eff0f1;
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
		height: 1.25em;
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
	}
	.logo {
		margin-top: 64px;
		flex-direction: row;
		justify-content: center;
	}
	.logo > h1 {
		font-style: italic;
		font-size: 64px;
		vertical-align: middle;
		margin: 0;
	}
	.text-container {
		text-align: left;
		width: 65%;
		max-width: 750px;
		font-size: 1em;
		display: inline-block;
		height: auto;
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
	}
	.bottom,
	.logo > h1 {
		color: var(--contrast-color);
	}
	.bottom {
		margin-top: 25px;
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
		padding: 0 16px;
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
</style>

<svelte:head>
	<link rel="preconnect" href="https://fonts.gstatic.com" />
	<link
		href="https://fonts.googleapis.com/css2?family=Roboto+Mono:ital@0;1&display=swap"
		rel="stylesheet" />
</svelte:head>

<main class={isLightTheme ? 'light' : 'dark'} id="main">
	<ThemeSlider on:themeChange={handleThemeChange} />
	<div class="typing">
		<div class="logo">
			<h1>hermes</h1>
			<Hermes />
		</div>
		<div class="text-container" class:fade>
			{#if !complete && caretState !== undefined}
				<span
					class="caret"
					style={`top: ${caretState.top}; left: ${caretState.left}`} />
			{/if}
			{#each lettersState as letterState, id}
				<Letter {letterState} {id} />
			{/each}
		</div>
		<div class="bottom">
			<div>
				<WPM {wpm} />
			</div>
			<div class="redo">
				<Redo on:redo={handleRedo} />
			</div>
			<div class="settings">
				<div class="lengths">
					{#each lengths as length, index}
						{#if index !== 0}<span>/</span>{/if}
						<h2
							class="length"
							id={'length' + length.minLength}
							on:click={() => handleLengthSelected(length)}>
							{length.desc}
						</h2>
					{/each}
				</div>

				<div>
					<h2 id="words" on:click={() => handleDataSource('words')}>
						words
					</h2>
					<span> /</span>
					<h2 id="quotes" on:click={() => handleDataSource('quotes')}>
						quotes
					</h2>
				</div>

				{#if lengthIndicatorState !== undefined}
					<hr
						style={`top: ${lengthIndicatorState.top}; left: ${lengthIndicatorState.left}; width: ${lengthIndicatorState.width}`} />
				{/if}
				{#if dataSourceIndicatorState !== undefined}
					<hr
						style={`top: ${dataSourceIndicatorState.top}; left: ${dataSourceIndicatorState.left}; width: ${dataSourceIndicatorState.width}`} />
				{/if}
			</div>
		</div>
	</div>
</main>
