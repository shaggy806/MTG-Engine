import { defineCard } from "../define.js";

export default defineCard({
  name: "Orc Sureshot",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Orc", "Archer"],
  power: 4,
  toughness: 2,
  text: "Whenever another creature you control enters, target creature an opponent controls gets -1/-1 until end of turn.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "creature" },
        otherOnly: true,
      },
      targets: ["creature-an-opponent-controls"],
      effect: { kind: "modify-pt", target: 0, power: -1, toughness: -1, duration: "end-of-turn" },
      resolve: null,
      text: "Whenever another creature you control enters, target creature an opponent controls gets -1/-1 until end of turn.",
    },
  ],
});
