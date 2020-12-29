<script>
	import { onMount } from "svelte";
	import * as dict from "./dict.json";
	import Letter from "./Letter.svelte";
	import ThemeSlider from "./ThemeSlider.svelte";
	import Hermes from "./assets/Hermes.svelte";
	import Redo from "./assets/Redo.svelte";

	export let lettersState = [];
	export let wpm;
	export let accuracy;
	export let caretState = undefined;

	let complete = false;
	let current = 0;
	let start;
	let finish;
	let keysDown = [];

	handleRedo();

	document.onkeypress = function (event) {
		if (complete) return;
		if (start === undefined) start = Date.now();

		if (event.key === "Delete") {
		} else {
			let currentLetter = lettersState[current].letter;
			if (currentLetter === event.key) {
				lettersState[current].isCorrect = true;
			} else {
				lettersState[current].isCorrect = false;
			}
			current++;
		}

		if (current === lettersState.length) {
			lettersState.pop();
			current--;
			complete = true;
			finish = Date.now();

			let accuracy = 0;
			lettersState.forEach((letterState) => {
				if (letterState.isCorrect) accuracy++;
			});

			wpm =
				Math.round(accuracy / 5 / ((finish - start) / 1000 / 60)) +
				" wpm";

			accuracy = (accuracy / lettersState.length) * 100;
		} else {
			updateCaret();
		}
	};

	document.onkeydown = function (event) {
		if (complete) return;
		keysDown.push(event.key);

		if (keysDown.includes("Backspace")) {
			deleteLetter();
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
	};

	// Needed if key is pressed down when focus is lost
	window.addEventListener("focus", function (event) {
		keysDown = [];
	});

	function handleRedo() {
		complete = false;
		wpm = undefined;
		current = 0;
		start = undefined;

		let words = getRandom(dict.default, 25);

		lettersState = (words.join(" ") + " ").split("").map(function (letter) {
			return {
				letter: letter,
				isCorrect: undefined,
			};
		});

		setTimeout(() => {
			updateCaret();
		}, 0);
	}

	export let isLightTheme =
		localStorage.getItem("isLightTheme") === "true" ? true : false;
	function handleThemeChange(event) {
		isLightTheme = event.detail.isLight;
		localStorage.setItem("isLightTheme", isLightTheme);
	}

	function updateCaret() {
		let rect = document.getElementById(current).getBoundingClientRect();

		caretState = {
			top: rect.top + "px",
			left: rect.left - 3 + "px",
		};
	}

	function deleteLetter() {
		if (current - 1 >= 0) {
			current--;
			lettersState[current].isCorrect = undefined;
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
	};
</script>

<style>
	main {
		background-color: var(--main-bg-color);
		height: 100%;
		overflow: auto;
		transition: 0.3s;
		font-size: 32px;
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
		height: 1em;
		background-color: var(--contrast-color);
		animation: flash 0.5s infinite ease-in alternate;
		transition: all 0.12s ease 0s;
	}

	main div {
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		align-items: center;
		min-height: 35vh;
	}

	.logo {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
	}

	.logo h1 {
		font-family: monospace;
		font-style: italic;
		font-size: 64px;
		color: var(--contrast-color);
		vertical-align: middle;
	}

	.text-container {
		text-align: left;
		width: 50%;
		max-width: 750px;
		font-size: 1em;
		display: inline-block;
		height: auto;
		font-family: monospace;
		color: var(--comment-color);
		-webkit-touch-callout: none;
		-webkit-user-select: none;
		-khtml-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		user-select: none;
	}

	.results {
		color: var(--contrast-color);
		margin-top: 50px;
		font-size: 1em;
		font-family: monospace;
		display: flex;
		flex-direction: row;
		height: auto;
		align-items: center;
		justify-content: center;
	}

	.results p {
		display: inline;
		padding-right: 24px;
	}

	@keyframes flash {
		from {
			opacity: 100%;
		}
		to {
			opacity: 0%;
		}
	}
</style>

<main class={isLightTheme ? 'light' : 'dark'} id="main">
	<div>
		<div class="logo">
			<h1>hermes</h1>
			<Hermes />
		</div>
		<ThemeSlider on:themeChange={handleThemeChange} />
		<div class="text-container">
			{#if !complete && caretState !== undefined}
				<span class="caret" id="caret" style={`top: ${caretState.top}; left: ${caretState.left}`} />
			{/if}
			{#each lettersState as letterState, id}
				<Letter {letterState} {id} />
			{/each}
		</div>
	</div>
	<div class="results">
		{#if wpm}
			<p>{wpm}</p>
		{/if}
		<Redo on:redo={handleRedo} />
	</div>
</main>
