import { defineCard } from "../define.js";

const TREASURE_TEXT =
  "Whenever one or more creatures you control deal combat damage to a player, create two Treasure tokens.";
const SHRINK_TEXT =
  "{B}, Sacrifice X Treasures: Target creature gets -X/-X until end of turn. Activate only as a sorcery.";

// "Sacrifice X Treasures" announces X with the activation (rule 107.3a) —
// `count: "x"`, which the effect's `"x"` reads — and the Treasures are chosen
// as the cost is paid, after the {B}: a Treasure the {B} had to come from
// isn't there to sacrifice as well.
export default defineCard({
  name: "Grim Hireling",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Tiefling", "Rogue"],
  power: 3,
  toughness: 2,
  text: `${TREASURE_TEXT}\n${SHRINK_TEXT}`,
  triggered: [
    {
      trigger: {
        on: "deals-damage-batch",
        who: "you-control",
        filter: { type: "creature" },
        combat: true,
      },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 2 },
      resolve: null,
      text: TREASURE_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{B}", tap: false, sacrifice: { filter: { subtype: "Treasure" }, count: "x" } },
      targets: ["creature"],
      effect: {
        kind: "modify-pt",
        target: 0,
        power: { product: ["x", -1] },
        toughness: { product: ["x", -1] },
        duration: "end-of-turn",
      },
      resolve: null,
      sorcerySpeed: true,
      text: SHRINK_TEXT,
    },
  ],
});
