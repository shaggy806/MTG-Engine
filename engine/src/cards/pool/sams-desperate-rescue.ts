import { defineCard } from "../define.js";

// EDHREC rank 4114.
export default defineCard({
  name: "Sam's Desperate Rescue",
  manaCost: "{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Return target creature card from your graveyard to your hand. The Ring tempts you.",
  targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
  effect: {
    kind: "sequence",
    effects: [{ kind: "return-to-hand", target: 0, from: "graveyard" }, { kind: "the-ring-tempts-you" }],
  },
});
