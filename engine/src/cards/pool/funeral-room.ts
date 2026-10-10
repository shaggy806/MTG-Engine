import { defineCard } from "../define.js";
import { ROOM_REMINDER } from "../helpers.js";

// The left door of Funeral Room // Awakening Hall (funeral-room-awakening-hall.ts).
const DRAIN = "Whenever a creature you control dies, each opponent loses 1 life and you gain 1 life.";

export default defineCard({
  name: "Funeral Room",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["enchantment"],
  subtypes: ["Room"],
  text: `${DRAIN}\n${ROOM_REMINDER}`,
  triggered: [
    {
      trigger: { on: "dies", who: "you-control", filter: { type: "creature" } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 1, who: "each-opponent" },
          { kind: "gain-life", amount: 1 },
        ],
      },
      resolve: null,
      text: DRAIN,
    },
  ],
  faces: ["Funeral Room // Awakening Hall", "Funeral Room", "Awakening Hall"],
  split: true,
});
