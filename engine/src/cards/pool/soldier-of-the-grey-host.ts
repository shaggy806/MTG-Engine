import { defineCard } from "../define.js";

export default defineCard({
  name: "Soldier of the Grey Host",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Spirit", "Soldier"],
  power: 2,
  toughness: 2,
  keywords: ["flash", "flying"],
  text: "Flash\nFlying\nWhen this creature enters, target creature gets +2/+0 until end of turn.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 2, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "When this creature enters, target creature gets +2/+0 until end of turn.",
    },
  ],
});
