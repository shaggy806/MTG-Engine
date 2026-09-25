import { defineCard } from "../define.js";

export default defineCard({
  name: "Kinsbaile Skirmisher",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Kithkin", "Soldier"],
  power: 2,
  toughness: 2,
  text: "When this creature enters, target creature gets +1/+1 until end of turn.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "When this creature enters, target creature gets +1/+1 until end of turn.",
    },
  ],
});
