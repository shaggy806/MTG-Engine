import { defineCard } from "../define.js";

// "Scry 2, **then** draw two cards" — the draw has to wait for the scry
// decision, so it rides on `scry.then` rather than being the next step of a
// `sequence`.
export default defineCard({
  name: "Read the Bones",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Scry 2, then draw two cards. You lose 2 life.",
  effect: {
    kind: "scry",
    amount: 2,
    then: {
      kind: "sequence",
      effects: [
        { kind: "draw", amount: 2 },
        { kind: "lose-life", amount: 2 },
      ],
    },
  },
});
