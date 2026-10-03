import { defineCard } from "../define.js";

const TEXT =
  "Each opponent sacrifices a creature or planeswalker with the greatest mana value among creatures and " +
  "planeswalkers they control.";

const CREATURE_OR_PLANESWALKER = { typesAnyOf: ["creature", "planeswalker"] } as const;

// Each opponent picks among their own tied permanents, in turn order and
// knowing the earlier picks, and they're all sacrificed together (the
// ruling).
export default defineCard({
  name: "Soul Shatter",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["instant"],
  text: TEXT,
  effect: {
    kind: "sacrifice",
    who: "each-opponent",
    filter: {
      ...CREATURE_OR_PLANESWALKER,
      greatestAmongItsController: { of: "mana-value", among: CREATURE_OR_PLANESWALKER },
    },
    count: 1,
  },
});
