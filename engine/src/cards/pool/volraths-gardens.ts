import { defineCard } from "../define.js";

export default defineCard({
  name: "Volrath's Gardens",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: "{2}, Tap an untapped creature you control: You gain 2 life. Activate only as a sorcery.",
  activated: [
    {
      cost: {
        mana: "{2}",
        tap: false,
        tapOthers: { count: 1, filter: { type: "creature", controlledBy: "you" }, includeSelf: true },
      },
      targets: [],
      effect: { kind: "gain-life", amount: 2 },
      resolve: null,
      text: "{2}, Tap an untapped creature you control: You gain 2 life. Activate only as a sorcery.",
      sorcerySpeed: true,
    },
  ],
});
