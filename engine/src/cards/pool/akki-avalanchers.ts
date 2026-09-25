import { defineCard } from "../define.js";

export default defineCard({
  name: "Akki Avalanchers",
  manaCost: "{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Warrior"],
  power: 1,
  toughness: 1,
  text: "Sacrifice a land: This creature gets +2/+0 until end of turn. Activate only once each turn.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: { filter: { type: "land" } } },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 2, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "Sacrifice a land: This creature gets +2/+0 until end of turn. Activate only once each turn.",
      oncePerTurn: true,
    },
  ],
});
