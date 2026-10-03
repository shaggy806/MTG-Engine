import { defineCard } from "../define.js";

// Asked as it resolves (the 2017-07-14 ruling): this spell cast from your
// hand, and a second Approach cast this game — this one is one of the two
// counted, so it takes two (`spells-cast-this-game`). The first may have been
// cast from anywhere and needn't have resolved (countered still counts), and
// the same card cast again later is "another spell" (rule 400.7). A copy was
// never cast: it gains the life, and ceases to exist rather than going into
// a library (rule 707.10a). "Seventh from the top" is the bottom of a library
// with fewer than six cards (the ruling).
export default defineCard({
  name: "Approach of the Second Sun",
  manaCost: "{6}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text:
    "If this spell was cast from your hand and you've cast another spell named Approach of the Second Sun this " +
    "game, you win the game. Otherwise, put Approach of the Second Sun into its owner's library seventh from the " +
    "top and you gain 7 life.",
  effect: {
    kind: "conditional",
    condition: {
      kind: "all",
      of: [
        { kind: "source", filter: { castFrom: "hand" } },
        { kind: "spells-cast-this-game", named: "Approach of the Second Sun", atLeast: 2 },
      ],
    },
    then: { kind: "win-game" },
    else: {
      kind: "sequence",
      effects: [
        { kind: "put-on-library", target: "source", position: { fromTop: 7 } },
        { kind: "gain-life", amount: 7 },
      ],
    },
  },
});
