import { defineCard } from "../define.js";

// EDHREC rank 5521.

const TEXT = "Sacrifice this creature: Counter target instant or sorcery spell unless its controller pays {1}.";

// Mana Tithe's "unless its controller pays {1}" on a sacrifice-self ability.
export default defineCard({
  name: "Judge's Familiar",
  manaCost: "{W/U}",
  colors: ["W", "U"],
  types: ["creature"],
  subtypes: ["Bird"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: `Flying\n${TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: ["instant-or-sorcery-spell"],
      effect: {
        kind: "unless",
        chooser: 0,
        options: [{ pay: "{1}", text: "Pay {1}" }],
        otherwise: { kind: "counter", target: 0 },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
