import { defineCard } from "../define.js";

export default defineCard({
  name: "Blister Beetle",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Insect"],
  power: 1,
  toughness: 1,
  text: "When this creature enters, target creature gets -1/-1 until end of turn.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: -1, toughness: -1, duration: "end-of-turn" },
      resolve: null,
      text: "When this creature enters, target creature gets -1/-1 until end of turn.",
    },
  ],
});
