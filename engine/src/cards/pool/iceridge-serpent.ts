import { defineCard } from "../define.js";

export default defineCard({
  name: "Iceridge Serpent",
  manaCost: "{4}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Serpent"],
  power: 3,
  toughness: 3,
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
