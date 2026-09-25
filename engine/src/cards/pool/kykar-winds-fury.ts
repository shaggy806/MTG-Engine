import { defineCard } from "../define.js";

// #151 in top-commanders.txt.
//
// "Sacrifice a Spirit: Add {R}" is a mana ability with a chosen-sacrifice
// cost: activated by hand (the auto-payer doesn't sacrifice creatures on its
// own), its mana floating for what comes next, never on the stack.
const TOKEN_TEXT = "Whenever you cast a noncreature spell, create a 1/1 white Spirit creature token with flying.";
const MANA_TEXT = "Sacrifice a Spirit: Add {R}.";

export default defineCard({
  name: "Kykar, Wind's Fury",
  manaCost: "{1}{U}{R}{W}",
  colors: ["U", "R", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Bird", "Wizard"],
  power: 3,
  toughness: 3,
  keywords: ["flying"],
  text: `Flying\n${TOKEN_TEXT}\n${MANA_TEXT}`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
      targets: [],
      effect: { kind: "create-token", token: "Spirit Token", count: 1 },
      resolve: null,
      text: TOKEN_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: { filter: { subtype: "Spirit" } } },
      targets: [],
      effect: { kind: "add-mana", mana: "R", amount: 1 },
      resolve: null,
      text: MANA_TEXT,
    },
  ],
});
