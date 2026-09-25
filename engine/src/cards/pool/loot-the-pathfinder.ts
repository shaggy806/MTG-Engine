import { defineCard } from "../define.js";

// #489 in top-commanders.txt.
//
// The first exhaust ability is a mana ability with a coloured cost, so it's
// activated by hand; "three mana of any one color" is offered one colour at
// a time.
const MANA_TEXT = "Exhaust — {G}, {T}: Add three mana of any one color.";
const DRAW_TEXT = "Exhaust — {U}, {T}: Draw three cards.";
const DAMAGE_TEXT = "Exhaust — {R}, {T}: Loot deals 3 damage to any target.";

export default defineCard({
  name: "Loot, the Pathfinder",
  manaCost: "{2}{G}{U}{R}",
  colors: ["G", "U", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Beast", "Noble"],
  power: 2,
  toughness: 4,
  keywords: ["double-strike", "vigilance", "haste"],
  text:
    `Double strike, vigilance, haste\n${MANA_TEXT}\n${DRAW_TEXT}\n${DAMAGE_TEXT}\n` +
    "(Activate each exhaust ability only once.)",
  activated: [
    {
      cost: { mana: "{G}", tap: true },
      exhaust: true,
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 3 },
      resolve: null,
      text: MANA_TEXT,
    },
    {
      cost: { mana: "{U}", tap: true },
      exhaust: true,
      targets: [],
      effect: { kind: "draw", amount: 3 },
      resolve: null,
      text: DRAW_TEXT,
    },
    {
      cost: { mana: "{R}", tap: true },
      exhaust: true,
      targets: ["any-target"],
      effect: { kind: "damage", amount: 3, target: 0 },
      resolve: null,
      text: DAMAGE_TEXT,
    },
  ],
});
