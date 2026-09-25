import { defineCard } from "../define.js";

export default defineCard({
  name: "Haazda Officer",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 3,
  toughness: 2,
  text: "When this creature enters, target creature you control gets +1/+1 until end of turn.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature-you-control"],
      effect: { kind: "modify-pt", target: 0, power: 1, toughness: 1, duration: "end-of-turn" },
      resolve: null,
      text: "When this creature enters, target creature you control gets +1/+1 until end of turn.",
    },
  ],
});
