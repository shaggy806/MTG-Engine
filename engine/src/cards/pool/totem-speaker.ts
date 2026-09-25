import { defineCard } from "../define.js";

export default defineCard({
  name: "Totem Speaker",
  manaCost: "{4}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Druid"],
  power: 3,
  toughness: 3,
  text: "Whenever a Beast enters, you may gain 3 life.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "any", filter: { subtype: "Beast" } },
      targets: [],
      effect: { kind: "may", prompt: "Gain 3 life?", effect: { kind: "gain-life", amount: 3 } },
      resolve: null,
      text: "Whenever a Beast enters, you may gain 3 life.",
    },
  ],
});
