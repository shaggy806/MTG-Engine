import { defineCard } from "../define.js";
import { ROOM_REMINDER } from "../helpers.js";

// The right door of Bottomless Pool // Locker Room. Once for each player
// the batch damaged.
const DRAW = "Whenever one or more creatures you control deal combat damage to a player, draw a card.";

export default defineCard({
  name: "Locker Room",
  manaCost: "{4}{U}",
  colors: ["U"],
  types: ["enchantment"],
  subtypes: ["Room"],
  text: `${DRAW}\n${ROOM_REMINDER}`,
  triggered: [
    {
      trigger: { on: "deals-damage-batch", who: "you-control", filter: { type: "creature" }, combat: true },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW,
    },
  ],
  faces: ["Bottomless Pool // Locker Room", "Bottomless Pool", "Locker Room"],
  split: true,
});
