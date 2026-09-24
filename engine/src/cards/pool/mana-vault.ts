import { defineCard } from "../define.js";

// "If this artifact is tapped" is an intervening-if (rule 603.4), asked as
// the draw step begins and again as the ability resolves.
export default defineCard({
  name: "Mana Vault",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  text:
    "This artifact doesn't untap during your untap step.\n" +
    "At the beginning of your upkeep, you may pay {4}. If you do, untap this artifact.\n" +
    "At the beginning of your draw step, if this artifact is tapped, it deals 1 damage to you.\n" +
    "{T}: Add {C}{C}{C}.",
  static: [
    {
      affects: { scope: "self" },
      doesntUntap: true,
      text: "This artifact doesn't untap during your untap step.",
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Pay {4} to untap Mana Vault?",
        cost: "{4}",
        effect: { kind: "untap", target: "source" },
      },
      resolve: null,
      text: "At the beginning of your upkeep, you may pay {4}. If you do, untap this artifact.",
    },
    {
      trigger: { on: "step-begins", step: "draw", who: "you" },
      condition: { kind: "source", filter: { tapped: true } },
      targets: [],
      effect: { kind: "damage", amount: 1, who: "you" },
      resolve: null,
      text: "At the beginning of your draw step, if this artifact is tapped, it deals 1 damage to you.",
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 3 },
      resolve: null,
      text: "{T}: Add {C}{C}{C}.",
    },
  ],
});
