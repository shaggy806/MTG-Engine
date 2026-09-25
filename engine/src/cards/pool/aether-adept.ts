import { defineCard } from "../define.js";

export default defineCard({
  name: "Aether Adept",
  manaCost: "{1}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 2,
  toughness: 2,
  text: "When this creature enters, return target creature to its owner's hand.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature"],
      effect: { kind: "return-to-hand", target: 0 },
      resolve: null,
      text: "When this creature enters, return target creature to its owner's hand.",
    },
  ],
});
