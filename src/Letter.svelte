<script>
    export let letterState;
    export let id;
</script>

<style>
    letter {
        transition: 0.2s;
    }

    .correct {
        color: #50fa7b;
    }

    .incorrect {
        color: #ff5555;
    }
</style>

<letter class:correct="{letterState.isCorrect === true}" class:incorrect="{letterState.isCorrect === false}" {id} >{letterState.letter}</letter>
