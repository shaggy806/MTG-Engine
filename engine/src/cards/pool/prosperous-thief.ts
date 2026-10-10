import { defineCard } from "../define.js";
import { ninjutsu, ninjutsuText } from "../helpers.js";

// EDHREC rank 2528. Once for each player the batch damaged.
const HIT =
  "Whenever one or more Ninja or Rogue creatures you control deal combat damage to a player, create a Treasure token. (It's an artifact with \"{T}, Sacrifice this token: Add one mana of any color.\")";

export default defineCard({
  name: "Prosperous Thief",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Ninja"],
  power: 3,
  toughness: 2,
  text: `${ninjutsuText("{1}{U}")}\n${HIT}`,
  activated: [ninjutsu("{1}{U}")],
  triggered: [
    {
      trigger: {
        on: "deals-damage-batch",
        who: "you-control",
        filter: { type: "creature", subtypes: ["Ninja", "Rogue"] },
        combat: true,
      },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1 },
      resolve: null,
      text: HIT,
    },
  ],
});
