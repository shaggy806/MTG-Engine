import { defineCard } from "../define.js";

// EDHREC rank 5719.

const END_TEXT =
  "At the beginning of your end step, you may pay {1}. When you do, Go-Shintai of Ancient Wars deals X damage to target player or planeswalker, where X is the number of Shrines you control.";

export default defineCard({
  name: "Go-Shintai of Ancient Wars",
  manaCost: "{2}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["enchantment", "creature"],
  subtypes: ["Shrine"],
  power: 2,
  toughness: 2,
  keywords: ["first-strike"],
  text: `First strike\n${END_TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [],
      // A reflexive trigger (rule 603.12): the target is chosen once {1} is
      // paid, and X is counted as it resolves.
      effect: {
        kind: "may",
        prompt: "Pay {1} to have Go-Shintai of Ancient Wars deal damage?",
        cost: "{1}",
        effect: {
          kind: "reflexive-trigger",
          targets: ["player-or-planeswalker"],
          effect: { kind: "damage", target: 0, amount: { countOf: { subtype: "Shrine", controlledBy: "you" } } },
          text: "When you do, Go-Shintai of Ancient Wars deals X damage to target player or planeswalker, where X is the number of Shrines you control.",
        },
      },
      resolve: null,
      text: END_TEXT,
    },
  ],
});
