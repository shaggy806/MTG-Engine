import { defineCard } from "../define.js";

// Brothers' War. Prototype (rule 718) is `prototype`: cast for {2}{W} it's a
// white 1/1 on the stack and the battlefield (and to anything that copies
// it), a colorless 3/3 everywhere else.
const ENTERS_TEXT = "When this creature enters, draw a card.";

export default defineCard({
  name: "Combat Thresher",
  manaCost: "{7}",
  types: ["artifact", "creature"],
  subtypes: ["Construct"],
  power: 3,
  toughness: 3,
  keywords: ["double-strike"],
  text:
    "Prototype {2}{W} — 1/1 (You may cast this spell with different mana cost, color, and size. " +
    "It keeps its abilities and types.)\n" +
    `Double strike\n${ENTERS_TEXT}`,
  prototype: { cost: "{2}{W}", power: 1, toughness: 1 },
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: ENTERS_TEXT,
    },
  ],
});
