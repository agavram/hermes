<script>
	import * as dict from "./dict.json";
	import Letter from "./Letter.svelte";
	import ThemeSlider from "./ThemeSlider.svelte";
	import WPM from "./WPM.svelte";
	import Hermes from "./assets/Hermes.svelte";
	import Redo from "./assets/Redo.svelte";
	import { onMount } from "svelte";

	export let lettersState = [];
	export let wpm;
	export let caretState = undefined;
	export let fade = false;
	export let typingSpeeds = [10, 25, 50];

	let complete = undefined;
	let current = 0;
	let start;
	let finish;
	let keysDown = [];
	let speed = localStorage.getItem("speed")
		? localStorage.getItem("speed")
		: 25;

	onMount(() => {
		handleRedo();

		updateSpeedIndicator();
	});

	document.onkeypress = function (e) {
		if (complete || lettersState.length === 0) return;
		if (start === undefined) start = Date.now();

		if (e.key !== "Delete") {
			let currentLetter = lettersState[current].letter;
			if (currentLetter === e.key) {
				lettersState[current].isCorrect = true;
			} else {
				lettersState[current].isCorrect = false;
			}
			current++;
		}

		updateWPM();
		if (current !== lettersState.length) {
			updateCaret();
		} else {
			complete = true;
			lettersState.pop();
			current--;
		}
	};

	function updateWPM() {
		if (current <= 1) return;

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
			// Stops from going back in firefox
			e.preventDefault();
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
		current = 0;
		start = undefined;
		wpm = undefined;

		setTimeout(() => {
			let words = getRandom(dict.default, speed);

			lettersState = (words.join(" ") + " ")
				.split("")
				.map(function (letter) {
					return {
						letter: letter,
						isCorrect: undefined,
					};
				});

			setTimeout(() => {
				updateCaret();
				updateSpeedIndicator();
				complete = false;
			}, 0);
			fade = false;
		}, 300);
	}

	export let isLightTheme =
		localStorage.getItem("isLightTheme") === "true" ? true : false;
	function handleThemeChange(event) {
		isLightTheme = event.detail.isLight;
		localStorage.setItem("isLightTheme", isLightTheme);
	}

	function handleSpeedSelected(e) {
		updateSpeedIndicator(e);

		const newSpeed = parseInt(e.srcElement.innerHTML);
		if (newSpeed !== speed) {
			speed = newSpeed;
			localStorage.setItem("speed", speed);
			handleRedo();
		}
	}

	function updateSpeedIndicator(e) {
		if (!e) {
			let src = document.getElementById("speed" + speed);
			if (!src) {
				src = document.getElementsByClassName("speed")[0];
			}
			e = { srcElement: src };
		}
		const hr = document.getElementById("hr");
		hr.style.left = e.srcElement.getBoundingClientRect().left + "px";
		hr.style.top = e.srcElement.getBoundingClientRect().bottom + "px";
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
		updateSpeedIndicator();
	};
</script>

<style>
	main {
		background-color: var(--main-bg-color);
		height: 100%;
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

	.typing {
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		align-items: center;
	}

	.logo {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
	}

	.logo > h1 {
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
		transition: 0.2s ease all;
	}

	.results {
		margin-top: 25px;
		width: 100%;
		display: flex;
		justify-content: center;
		color: var(--contrast-color);
		text-align: center;
	}

	.results > * {
		display: flex;
		flex: 1 1 0px;
		flex-basis: 0;
		height: auto;
		margin: 0;
		padding: 0;
		transition: 0.2s ease all;
		font-family: monospace;
		justify-content: center;
		align-items: center;
	}

	.typing-speed span {
		margin: 0 10px 0 10px;
	}

	.typing-speed h4 {
		cursor: pointer;
	}

	@keyframes flash {
		from {
			opacity: 100%;
		}
		to {
			opacity: 0%;
		}
	}

	.fade {
		opacity: 0;
	}

	#hr {
		position: absolute;
		height: 0.25rem;
		width: 36px;
		margin: 0;
		background: var(--contrast-color);
		border: none;
		transition: 0.3s ease-in-out;
	}
</style>

<main class={isLightTheme ? 'light' : 'dark'} id="main">
	<ThemeSlider on:themeChange={handleThemeChange} />
	{#if !complete && caretState !== undefined}
		<span
			class="caret"
			id="caret"
			style={`top: ${caretState.top}; left: ${caretState.left}`} />
	{/if}
	<div class="typing">
		<div class="logo">
			<h1>hermes</h1>
			<Hermes />
		</div>
		<div class="text-container" class:fade>
			{#each lettersState as letterState, id}
				<Letter {letterState} {id} />
			{/each}
		</div>
		<div class="results">
			<div>
				<WPM {wpm} />
			</div>
			<div class="redo">
				<Redo on:redo={handleRedo} />
			</div>
			<div class="typing-speed">
				{#each typingSpeeds as typingSpeed, index}
					{#if index !== 0}<span>/</span>{/if}
					<h4
						class="speed"
						on:click={handleSpeedSelected}
						id={'speed' + typingSpeed}>
						{typingSpeed}
					</h4>
				{/each}
				<hr id="hr" />
			</div>
		</div>
	</div>
</main>
