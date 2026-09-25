import { defineCard } from "../define.js";

export default defineCard({
  name: "Woodland Liege",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Druid", "Noble"],
  power: 2,
  toughness: 2,
  text: "Whenever a Beast you control enters, draw a card.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { subtype: "Beast" } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Whenever a Beast you control enters, draw a card.",
    },
  ],
});
