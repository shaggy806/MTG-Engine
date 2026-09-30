import { defineCard } from "../define.js";

// Any creature or land card in your graveyard, not only one just milled.
export default defineCard({
  name: "Grapple with the Past",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["instant"],
  text:
    "Mill three cards, then you may return a creature or land card from your graveyard to your hand.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "mill", target: "you", amount: 3 },
      {
        kind: "look-and-choose",
        zone: "graveyard",
        min: 0,
        max: 1,
        destination: "hand",
        leftover: "stay",
        filter: { typesAnyOf: ["creature", "land"] },
      },
    ],
  },
});
