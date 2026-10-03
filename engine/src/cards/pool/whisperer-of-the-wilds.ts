import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

const FEROCIOUS_TEXT =
  "Ferocious — {T}: Add {G}{G}. Activate only if you control a creature with power 4 or greater.";

// The Ferocious ability is gated by `ActivatedAbility.condition`, as Fanatic
// of Rhonas's is: unavailable until its condition is met.
export default defineCard({
  name: "Whisperer of the Wilds",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Human", "Shaman"],
  power: 0,
  toughness: 2,
  text: `{T}: Add {G}.\n${FEROCIOUS_TEXT}`,
  activated: [
    manaTapAbility("G"),
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "G", amount: 2 },
      resolve: null,
      condition: {
        kind: "controls",
        filter: { type: "creature", power: { op: "gte", n: 4 } },
        atLeast: 1,
      },
      text: FEROCIOUS_TEXT,
    },
  ],
});
