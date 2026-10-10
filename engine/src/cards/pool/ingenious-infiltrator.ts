import { defineCard } from "../define.js";
import { ninjutsu, ninjutsuText } from "../helpers.js";

// EDHREC rank 3161.
const HIT = "Whenever a Ninja you control deals combat damage to a player, draw a card.";

export default defineCard({
  name: "Ingenious Infiltrator",
  manaCost: "{2}{U}{B}",
  colors: ["U", "B"],
  types: ["creature"],
  subtypes: ["Vedalken", "Ninja"],
  power: 2,
  toughness: 3,
  text: `${ninjutsuText("{U}{B}")}\n${HIT}`,
  activated: [ninjutsu("{U}{B}")],
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "you-control", filter: { subtype: "Ninja" } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: HIT,
    },
  ],
});
