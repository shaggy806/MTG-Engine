import { defineCard } from "../define.js";

export default defineCard({
  name: "Network Disruptor",
  manaCost: "{U}",
  colors: ["U"],
  types: ["artifact", "creature"],
  subtypes: ["Moonfolk", "Rogue"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying\nWhen this creature enters, tap target permanent.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["permanent"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: "When this creature enters, tap target permanent.",
    },
  ],
});
