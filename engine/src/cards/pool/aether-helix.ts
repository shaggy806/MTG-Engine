import { defineCard } from "../define.js";

export default defineCard({
  name: "Aether Helix",
  manaCost: "{3}{G}{U}",
  colors: ["U", "G"],
  types: ["sorcery"],
  text: "Return target permanent to its owner's hand. Return target permanent card from your graveyard to your hand.",
  targets: [
    "permanent",
    { kind: "card-in-graveyard", whose: "you", filter: { notTypes: ["instant", "sorcery"] } },
  ],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "return-to-hand", target: 0 },
      { kind: "return-to-hand", target: 1, from: "graveyard" },
    ],
  },
});
