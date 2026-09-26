import type { ActivatedAbility } from "../../abilities.js";
import { defineCard } from "../define.js";

// #371 in top-commanders.txt.
//
// The blight is one effect (rule 613.7): the land loses its land types (layer
// 4 — it keeps any other card types and supertypes, its ruling) and all its
// abilities, and has "{T}: Add {C}", granted by that same effect so it isn't
// lost with the rest. It lasts for as long as the land has a blight counter
// (rule 611.2b). The last ability is a triggered mana ability (rule 605.1b):
// no stack, and the auto-payer counts the extra {C} — a blighted land taps
// for two.
const BLIGHT_MANA_TEXT = "{T}: Add {C}.";
const ATTACK_TEXT =
  "Whenever Ultima attacks, put a blight counter on target land. For as long as that land has a blight counter on " +
  `it, it loses all land types and abilities and has "${BLIGHT_MANA_TEXT}"`;
const MANA_TEXT = "Whenever you tap a land for {C}, add an additional {C}.";

const BLIGHT_MANA: ActivatedAbility = {
  cost: { mana: null, tap: true },
  targets: [],
  effect: { kind: "add-mana", mana: "C", amount: 1 },
  resolve: null,
  text: BLIGHT_MANA_TEXT,
};

export default defineCard({
  name: "Ultima, Origin of Oblivion",
  manaCost: "{5}",
  colors: [],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["God"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text: `Flying\n${ATTACK_TEXT}\n${MANA_TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: ["land"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: 0, counter: "blight", amount: 1 },
          {
            kind: "lose-abilities",
            target: 0,
            loseLandTypes: true,
            activated: [BLIGHT_MANA],
            duration: { whileCounter: "blight" },
          },
        ],
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
    {
      trigger: { on: "tapped-for-mana", who: "you-control", filter: { type: "land" }, producing: "C" },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: MANA_TEXT,
    },
  ],
});
