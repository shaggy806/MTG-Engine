import { defineCard } from "../define.js";

export default defineCard({
  name: "Midnight Guard",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 2,
  toughness: 3,
  text: "Whenever another creature enters, untap this creature.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "any", filter: { type: "creature" }, otherOnly: true },
      targets: [],
      effect: { kind: "untap", target: "source" },
      resolve: null,
      text: "Whenever another creature enters, untap this creature.",
    },
  ],
});
