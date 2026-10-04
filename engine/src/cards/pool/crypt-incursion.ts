import { defineCard } from "../define.js";

// EDHREC rank 4409.

export default defineCard({
  name: "Crypt Incursion",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Exile all creature cards from target player's graveyard. You gain 3 life for each card exiled this way.",
  targets: ["player"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "exile-graveyard", target: 0, filter: { type: "creature" } },
      { kind: "gain-life", amount: { product: [3, { thisWay: "exiled" }] } },
    ],
  },
});
