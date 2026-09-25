import { defineCard } from "../define.js";

export default defineCard({
  name: "Glowing Anemone",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Jellyfish", "Beast"],
  power: 1,
  toughness: 3,
  text: "When this creature enters, you may return target land to its owner's hand.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["land"],
      effect: {
        kind: "may",
        prompt: "Return target land to its owner's hand?",
        effect: { kind: "return-to-hand", target: 0 },
      },
      resolve: null,
      text: "When this creature enters, you may return target land to its owner's hand.",
    },
  ],
});
