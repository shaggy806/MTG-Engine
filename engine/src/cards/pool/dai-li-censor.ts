import { defineCard } from "../define.js";

export default defineCard({
  name: "Dai Li Censor",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Soldier", "Advisor"],
  power: 2,
  toughness: 1,
  text: "{1}, Sacrifice another creature: This creature gets +2/+2 until end of turn. Activate only once each turn.",
  activated: [
    {
      cost: { mana: "{1}", tap: false, sacrifice: "creature-you-control" },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 2, toughness: 2, duration: "end-of-turn" },
      resolve: null,
      text: "{1}, Sacrifice another creature: This creature gets +2/+2 until end of turn. Activate only once each turn.",
      otherOnly: true,
      oncePerTurn: true,
    },
  ],
});
