import { defineCard } from "../define.js";

// #17 in top-commanders.txt.
//
// - The counters are an `others-enter-battlefield` replacement: every other
//   Angel entering under your control gets one +1/+1 counter per Angel you
//   control, counted as it enters. The count is "already": it never includes
//   the Angel entering or any Angel entering alongside it (a batch of tokens,
//   a mass reanimation), but does include Giada, and it doesn't matter when
//   the counted Angels arrived (the ruling).
// - The mana is Ancient Ziggurat's `spendOnly`, narrowed to Angel spells.
const REPLACEMENT_TEXT =
  "Each other Angel you control enters with an additional +1/+1 counter on it for each Angel " +
  "you already control.";
const MANA_TEXT = "{T}: Add {W}. Spend this mana only to cast an Angel spell.";

export default defineCard({
  name: "Giada, Font of Hope",
  manaCost: "{1}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 2,
  toughness: 2,
  keywords: ["flying", "vigilance"],
  text: `Flying, vigilance\n${REPLACEMENT_TEXT}\n${MANA_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "others-enter-battlefield",
        filter: { subtype: "Angel", controlledBy: "you" },
        counters: {
          kind: "+1/+1",
          amount: { countOf: { subtype: "Angel", controlledBy: "you" } },
        },
      },
      text: REPLACEMENT_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "W",
        amount: 1,
        spendOnly: {
          spell: { subtype: "Angel" },
          text: "Spend this mana only to cast an Angel spell.",
        },
      },
      resolve: null,
      text: MANA_TEXT,
    },
  ],
});
