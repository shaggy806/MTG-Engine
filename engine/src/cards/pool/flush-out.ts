import { defineCard } from "../define.js";

// The Omen of Stormshriek Feral (rule 720). "If you do": the draw needs a
// card actually discarded, so an empty hand draws nothing.
export default defineCard({
  name: "Flush Out",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["sorcery"],
  subtypes: ["Omen"],
  text: "Discard a card. If you do, draw two cards. (Then shuffle this card into its owner's library.)",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "discard", target: "you", amount: 1 },
      {
        kind: "conditional",
        condition: { kind: "this-way", what: "discarded" },
        then: { kind: "draw", amount: 2 },
      },
    ],
  },
  faces: ["Stormshriek Feral", "Flush Out"],
  omen: true,
});
