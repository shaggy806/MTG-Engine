import { defineCard } from "../define.js";

// #117 in top-commanders.txt.
//
// An Aura it finds chooses what it enchants as it enters, and one with nothing
// it could enchant stays in the library (rule 303.4f–g — the Zur ruling).
const ATTACK_TEXT =
  "Whenever Zur attacks, you may search your library for an enchantment card with mana value 3 or less, put it " +
  "onto the battlefield, then shuffle.";

export default defineCard({
  name: "Zur the Enchanter",
  manaCost: "{1}{W}{U}{B}",
  colors: ["W", "U", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 1,
  toughness: 4,
  keywords: ["flying"],
  text: `Flying\n${ATTACK_TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { type: "enchantment", manaValue: { op: "lte", n: 3 } },
        destination: "battlefield",
        min: 0,
        max: 1,
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
