import { defineCard } from "../define.js";

export default defineCard({
  name: "Ulvenwald Mysteries",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: "Whenever a nontoken creature you control dies, investigate. (Create a Clue token. It's an artifact with \"{2}, Sacrifice this token: Draw a card.\")\nWhenever you sacrifice a Clue, create a 1/1 white Human Soldier creature token.",
  triggered: [
    {
      trigger: { on: "dies", who: "you-control", filter: { token: false, type: "creature" } },
      targets: [],
      effect: { kind: "create-token", token: "Clue Token", count: 1 },
      resolve: null,
      text: "Whenever a nontoken creature you control dies, investigate.",
    },
    {
      trigger: { on: "sacrifice", who: "you", filter: { subtype: "Clue" } },
      targets: [],
      effect: { kind: "create-token", token: "Human Soldier Token", count: 1 },
      resolve: null,
      text: "Whenever you sacrifice a Clue, create a 1/1 white Human Soldier creature token.",
    },
  ],
});
