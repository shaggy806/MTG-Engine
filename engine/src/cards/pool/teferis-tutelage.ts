import { defineCard } from "../define.js";

export default defineCard({
  name: "Teferi's Tutelage",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["enchantment"],
  text: "When this enchantment enters, draw a card, then discard a card.\nWhenever you draw a card, target opponent mills two cards. (They put the top two cards of their library into their graveyard.)",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [{ kind: "draw", amount: 1 }, { kind: "discard", target: "you", amount: 1 }],
      },
      resolve: null,
      text: "When this enchantment enters, draw a card, then discard a card.",
    },
    {
      trigger: { on: "draws", who: "you" },
      targets: ["opponent"],
      effect: { kind: "mill", target: 0, amount: 2 },
      resolve: null,
      text: "Whenever you draw a card, target opponent mills two cards.",
    },
  ],
});
