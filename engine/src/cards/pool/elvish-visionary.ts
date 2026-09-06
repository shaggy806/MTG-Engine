import { defineCard } from "../define.js";

export default defineCard({
  name: "Elvish Visionary",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Shaman"],
  power: 1,
  toughness: 1,
  text: "When Elvish Visionary enters the battlefield, draw a card.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "When Elvish Visionary enters the battlefield, draw a card.",
    },
  ],
});
