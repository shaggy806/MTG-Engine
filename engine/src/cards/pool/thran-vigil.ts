import { defineCard } from "../define.js";

// EDHREC rank 6269.

export default defineCard({
  name: "Thran Vigil",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: "Whenever one or more artifact and/or creature cards leave your graveyard during your turn, put a +1/+1 counter on target creature you control.",
  // Batched `leaves-graveyard` (Desecrated Tomb) with Kheru Goldkeeper's "during your turn".
  triggered: [
    {
      trigger: { on: "leaves-graveyard", who: "you", filter: { typesAnyOf: ["artifact", "creature"] } },
      condition: { kind: "your-turn" },
      targets: ["creature-you-control"],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever one or more artifact and/or creature cards leave your graveyard during your turn, put a +1/+1 counter on target creature you control.",
    },
  ],
});
