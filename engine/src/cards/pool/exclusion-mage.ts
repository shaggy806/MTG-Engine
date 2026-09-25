import { defineCard } from "../define.js";

export default defineCard({
  name: "Exclusion Mage",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 2,
  toughness: 2,
  text: "When this creature enters, return target creature an opponent controls to its owner's hand.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature-an-opponent-controls"],
      effect: { kind: "return-to-hand", target: 0 },
      resolve: null,
      text: "When this creature enters, return target creature an opponent controls to its owner's hand.",
    },
  ],
});
