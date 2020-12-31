<script>
    export let letterState;
    export let id;
</script>

<style>
    letter {
        transition: 0.12s;
        transition-property: color;
    }

    .correct {
        color: var(--correct-color);
    }

    .incorrect {
        color: var(--incorrect-color);
    }
</style>

<letter class:correct="{letterState.isCorrect === true}" class:incorrect="{letterState.isCorrect === false}" {id} >{letterState.letter}</letter>
