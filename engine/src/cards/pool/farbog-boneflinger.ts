import { defineCard } from "../define.js";

export default defineCard({
  name: "Farbog Boneflinger",
  manaCost: "{4}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie"],
  power: 2,
  toughness: 2,
  text: "When this creature enters, target creature gets -2/-2 until end of turn.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: -2, toughness: -2, duration: "end-of-turn" },
      resolve: null,
      text: "When this creature enters, target creature gets -2/-2 until end of turn.",
    },
  ],
});
