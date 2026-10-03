import { defineCard } from "../define.js";
import { hideaway, playHideawayCard } from "../helpers.js";

// Hideaway (rule 702.75): the exiled card is linked to this enchantment
// (607.2a). "Then if you control a creature with power 7 or greater" is
// checked as the trigger resolves, after the counter.
const COMBAT_TEXT =
  "At the beginning of combat on your turn, put a +1/+1 counter on target creature you control. Then if you control a creature with power 7 or greater, you may play the exiled card without paying its mana cost.";

export default defineCard({
  name: "Fight Rigging",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text:
    "Hideaway 5 (When this enchantment enters, look at the top five cards of your library, exile one face down, then put the rest on the bottom in a random order.)\n" +
    COMBAT_TEXT,
  triggered: [
    hideaway(5, "enchantment"),
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      targets: ["creature-you-control"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
          {
            kind: "conditional",
            condition: {
              kind: "controls",
              filter: { type: "creature", power: { op: "gte", n: 7 } },
              atLeast: 1,
            },
            then: playHideawayCard(),
          },
        ],
      },
      resolve: null,
      text: COMBAT_TEXT,
    },
  ],
});
