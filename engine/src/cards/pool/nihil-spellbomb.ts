import { defineCard } from "../define.js";

export default defineCard({
  name: "Nihil Spellbomb",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  text:
    "{T}, Sacrifice this artifact: Exile target player's graveyard.\n" +
    "When this artifact is put into a graveyard from the battlefield, you may pay {B}. If you do, draw a card.",
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: "self" },
      targets: ["player"],
      effect: { kind: "exile-graveyard", target: 0 },
      resolve: null,
      text: "{T}, Sacrifice this artifact: Exile target player's graveyard.",
    },
  ],
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Pay {B} to draw a card?",
        cost: "{B}",
        effect: { kind: "draw", amount: 1 },
      },
      resolve: null,
      text: "When this artifact is put into a graveyard from the battlefield, you may pay {B}. If you do, draw a card.",
    },
  ],
});
