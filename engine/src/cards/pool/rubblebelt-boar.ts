import { defineCard } from "../define.js";

export default defineCard({
  name: "Rubblebelt Boar",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Boar"],
  power: 3,
  toughness: 3,
  text: "When this creature enters, target creature gets +2/+0 until end of turn.",
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
