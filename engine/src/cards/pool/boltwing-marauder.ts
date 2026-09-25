import { defineCard } from "../define.js";

export default defineCard({
  name: "Boltwing Marauder",
  manaCost: "{3}{B}{R}",
  colors: ["B", "R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 5,
  toughness: 4,
  keywords: ["flying"],
  text: "Flying\nWhenever another creature you control enters, target creature gets +2/+0 until end of turn.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "creature" },
        otherOnly: true,
      },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: 2, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "Whenever another creature you control enters, target creature gets +2/+0 until end of turn.",
    },
  ],
});
