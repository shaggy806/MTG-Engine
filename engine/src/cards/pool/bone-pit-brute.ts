import { defineCard } from "../define.js";

export default defineCard({
  name: "Bone Pit Brute",
  manaCost: "{4}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Cyclops"],
  power: 4,
  toughness: 5,
  keywords: ["menace"],
  text: "Menace (This creature can't be blocked except by two or more creatures.)\nWhen this creature enters, target creature gets +4/+0 until end of turn.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 4, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "When this creature enters, target creature gets +4/+0 until end of turn.",
    },
  ],
});
