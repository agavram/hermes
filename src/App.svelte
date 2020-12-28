<script>
	import { onMount } from "svelte";
	import * as dict from "./dict.json";
	import Letter from "./Letter.svelte";
	import ThemeSlider from "./ThemeSlider.svelte";

	let complete = false;
	let words = getRandom(dict.default, 25);

	export let lettersState = (words.join(" ") + " ")
		.split("")
		.map(function (letter) {
			return {
				letter: letter,
				isCorrect: undefined,
			};
		});

	let current = 0;
	let caret;
	onMount(() => {
		caret = document.getElementById("caret");
		updateCaret();
	});

	export let wpm;
	export let accuracy;

	let start;
	let finish;
	let keysDown = [];
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
		}

		updateCaret();
	};

	document.onkeyup = function (event) {
		removeArray(keysDown, event.key);
	};

	// Needed if key is pressed down when focus is lost
	window.addEventListener("focus", function (event) {
		keysDown = [];
	});

	export let isLightTheme = localStorage.getItem('isLightTheme') === 'true' ? true : false;
	function handleThemeChange(event) {
		isLightTheme = event.detail.isLight;
		localStorage.setItem('isLightTheme', isLightTheme);
	}

	function updateCaret() {
		let rect = document.getElementById(current).getBoundingClientRect();
		caret.style.left = rect.left + "px";
		caret.style.top = rect.top - 49 + "px";
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
	}

	.dark {
		--main-bg-color: #282a36;
		--contrast-color: #f8f8f2;
		--comment-color: #6272a4;
		--correct-color: #50fa7b;
		--incorrect-color: #ff5555;
	}

	.light {
		--main-bg-color: #EFF0F1;
		--contrast-color: #575f66;
		--comment-color: #A0A6AC;
		--correct-color: #86B300;
		--incorrect-color: #f07171;
	}

	main div {
		margin-top: 50px;
		max-width: 500px;
		display: block;
		margin-left: auto;
		margin-right: auto;
	}

	div {
		text-align: center;
	}

	.caret {
		display: inline-block;
		position: absolute;
		width: 2px;
		height: 1.5rem;
		background-color: var(--contrast-color);
		animation: flash 0.5s infinite ease-out alternate;
		transition: all 0.15s ease 0s;
	}

	.text-container {
		display: inline-block;
		font-size: 24px;
		font-family: monospace;
		color: var(--comment-color);
		-webkit-touch-callout: none;
		-webkit-user-select: none;
		-khtml-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		user-select: none;
	}

	.wpm {
		color: var(--contrast-color);
		margin-top: 50px;
		font-size: 24px;
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
		<ThemeSlider on:themeChange={handleThemeChange} />
		<div class="text-container">
			<div class="caret" id="caret" />
			{#each lettersState as letterState, id}
				<Letter {letterState} {id} />
			{/each}
		</div>
		{#if wpm}
			<div class="wpm">{wpm}</div>
		{/if}
	</div>
</main>
