import { defineCard } from "../define.js";

// EDHREC rank 5002.
//
// "Only to activate abilities": an `abilityOf` over any source, in any zone,
// and no `spell` — so the mana can't cast a spell, and a payment that isn't
// an activation (a ward cost, a cost paid as something resolves) names no
// ability and can't use it either.
const MANA_TEXT = "{T}: Add {C}{U}. Spend this mana only to activate abilities.";

export default defineCard({
  name: "Omen Hawker",
  manaCost: "{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Octopus", "Advisor"],
  power: 1,
  toughness: 1,
  text: MANA_TEXT,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: { all: ["C", "U"] },
        amount: 1,
        spendOnly: { abilityOf: {}, abilityOfAnyZone: true, text: "Spend this mana only to activate abilities." },
      },
      resolve: null,
      text: MANA_TEXT,
    },
  ],
});
