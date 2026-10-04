import { defineCard } from "../define.js";

// Rule 111.10g: the predefined Blood token. Voldaren Estate's Blood token.
// The sacrifice is paid as the ability is activated and the discard is asked
// right after (rule 602.2b), before anyone gets priority; no token can be
// sacrificed to pay two costs (the ruling), and the ability keeps each Blood
// out of token stacks, as a Clue's does.
const TEXT = "{1}, {T}, Discard a card, Sacrifice this token: Draw a card.";

export default defineCard({
  name: "Blood Token",
  art: "4d4b2e0c-0e81-4147-aeef-579491d7ebc2",
  colors: [],
  types: ["artifact"],
  subtypes: ["Blood"],
  text: TEXT,
  activated: [
    {
      cost: { mana: "{1}", tap: true, discard: { count: 1 }, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
