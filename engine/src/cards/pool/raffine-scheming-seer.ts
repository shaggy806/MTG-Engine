import { defineCard } from "../define.js";
import { ward } from "../helpers.js";

// #250 in top-commanders.txt. X counts every attacking creature as the
// ability resolves (only the attacking player's creatures attack).
const TEXT =
  "Whenever you attack, target attacking creature connives X, where X is the number of attacking creatures. " +
  "(Draw X cards, then discard X cards. Put a +1/+1 counter on that creature for each nonland card discarded " +
  "this way.)";

export default defineCard({
  name: "Raffine, Scheming Seer",
  manaCost: "{W}{U}{B}",
  colors: ["W", "U", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Sphinx", "Demon"],
  power: 1,
  toughness: 4,
  keywords: ["flying"],
  text: `Flying, ward {1}\n${TEXT}`,
  triggered: [
    ward({ mana: "{1}" }),
    {
      trigger: { on: "attack-with", who: "you", atLeast: 1 },
      targets: [{ kind: "permanent", filter: { type: "creature", attacking: true } }],
      effect: {
        kind: "connive",
        target: 0,
        amount: { countOf: { type: "creature", attacking: true } },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
