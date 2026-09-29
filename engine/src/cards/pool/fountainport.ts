import { defineCard } from "../define.js";

const DRAW_TEXT = "{2}, {T}, Sacrifice a token: Draw a card.";
const FISH_TEXT = "{3}, {T}, Pay 1 life: Create a 1/1 blue Fish creature token.";
const TREASURE_TEXT = "{4}, {T}: Create a Treasure token.";

export default defineCard({
  name: "Fountainport",
  colors: [],
  types: ["land"],
  text: `{T}: Add {C}.\n${DRAW_TEXT}\n${FISH_TEXT}\n${TREASURE_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{2}", tap: true, sacrifice: { filter: { token: true } } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
    {
      cost: { mana: "{3}", tap: true, payLife: 1 },
      targets: [],
      effect: { kind: "create-token", token: "Fish Token", count: 1 },
      resolve: null,
      text: FISH_TEXT,
    },
    {
      cost: { mana: "{4}", tap: true },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1 },
      resolve: null,
      text: TREASURE_TEXT,
    },
  ],
});
