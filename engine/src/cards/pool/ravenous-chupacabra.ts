import { defineCard } from "../define.js";

export default defineCard({
  name: "Ravenous Chupacabra",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Beast", "Horror"],
  power: 2,
  toughness: 2,
  text: "When this creature enters, destroy target creature an opponent controls.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature-an-opponent-controls"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "When this creature enters, destroy target creature an opponent controls.",
    },
  ],
});
