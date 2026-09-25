import { defineCard } from "../define.js";

export default defineCard({
  name: "Fleeting Memories",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["enchantment"],
  text: "When this enchantment enters, investigate. (Create a Clue token. It's an artifact with \"{2}, Sacrifice this token: Draw a card.\")\nWhenever you sacrifice a Clue, target player mills three cards.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Clue Token", count: 1 },
      resolve: null,
      text: "When this enchantment enters, investigate.",
    },
    {
      trigger: { on: "sacrifice", who: "you", filter: { subtype: "Clue" } },
      targets: ["player"],
      effect: { kind: "mill", target: 0, amount: 3 },
      resolve: null,
      text: "Whenever you sacrifice a Clue, target player mills three cards.",
    },
  ],
});
