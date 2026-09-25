import { defineCard } from "../define.js";

export default defineCard({
  name: "Frilled Mystic",
  manaCost: "{G}{G}{U}{U}",
  colors: ["U", "G"],
  types: ["creature"],
  subtypes: ["Elf", "Lizard", "Wizard"],
  power: 3,
  toughness: 2,
  keywords: ["flash"],
  text: "Flash\nWhen this creature enters, you may counter target spell.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["spell"],
      effect: { kind: "may", prompt: "Counter target spell?", effect: { kind: "counter", target: 0 } },
      resolve: null,
      text: "When this creature enters, you may counter target spell.",
    },
  ],
});
