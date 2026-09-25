import { defineCard } from "../define.js";

export default defineCard({
  name: "Chrome Prowler",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["artifact", "creature"],
  subtypes: ["Phyrexian", "Cat"],
  power: 3,
  toughness: 2,
  keywords: ["flash"],
  text: "Flash\nWhen this creature enters, tap target creature an opponent controls.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature-an-opponent-controls"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: "When this creature enters, tap target creature an opponent controls.",
    },
  ],
});
