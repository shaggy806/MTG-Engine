import { defineCard } from "../define.js";

/** The adventure half of Bramble Familiar. "Put … from among the milled
 * cards" finds them wherever they went (rule 701.17c) — in exile, with Rest
 * in Peace out — and isn't optional: one is put if there's one to put. */
export default defineCard({
  name: "Fetch Quest",
  manaCost: "{5}{G}{G}",
  colors: ["G"],
  types: ["sorcery"],
  subtypes: ["Adventure"],
  text:
    "Mill seven cards. Then put a creature, enchantment, or land card from among the milled cards onto the battlefield. " +
    "(Then exile this card. You may cast the creature later from exile.)",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "mill", target: "you", amount: 7 },
      {
        kind: "look-and-choose",
        zone: "graveyard",
        min: 1,
        max: 1,
        destination: "battlefield",
        leftover: "stay",
        filter: { thisWay: "milled", typesAnyOf: ["creature", "enchantment", "land"] },
      },
    ],
  },
  faces: ["Bramble Familiar", "Fetch Quest"],
  adventure: true,
});
