import { defineCard } from "../define.js";
import { hideaway, playHideawayCard } from "../helpers.js";

// Hideaway (rule 702.75): the exiled card is linked to this enchantment
// (607.2a). Batched: once per declaration, with how many creatures attacked
// as "that many". "Then if you control ten or more creatures" is checked as
// the trigger resolves, the new Citizens counted.
const ATTACK_TEXT =
  "Whenever you attack with one or more creatures, create that many 1/1 green and white Citizen creature tokens. Then if you control ten or more creatures, you may play the exiled card without paying its mana cost.";

export default defineCard({
  name: "Rabble Rousing",
  manaCost: "{4}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text:
    "Hideaway 5 (When this enchantment enters, look at the top five cards of your library, exile one face down, then put the rest on the bottom in a random order.)\n" +
    ATTACK_TEXT,
  triggered: [
    hideaway(5, "enchantment"),
    {
      trigger: { on: "attacks-batch", who: "you", filter: { type: "creature" } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "create-token", token: "Citizen Token", count: { triggerValue: true } },
          {
            kind: "conditional",
            condition: { kind: "controls", filter: { type: "creature" }, atLeast: 10 },
            then: playHideawayCard(),
          },
        ],
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
