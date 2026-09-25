import { defineCard } from "../define.js";

export default defineCard({
  name: "Friendly Ghost",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 2,
  toughness: 4,
  keywords: ["flying"],
  text: "Flying\nWhen this creature enters, target creature gets +2/+4 until end of turn.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 2, toughness: 4, duration: "end-of-turn" },
      resolve: null,
      text: "When this creature enters, target creature gets +2/+4 until end of turn.",
    },
  ],
});
