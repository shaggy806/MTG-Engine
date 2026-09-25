import { defineCard } from "../define.js";

export default defineCard({
  name: "Ravenous Intruder",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Gremlin"],
  power: 1,
  toughness: 2,
  text: "Sacrifice an artifact: This creature gets +2/+2 until end of turn.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: { filter: { type: "artifact" } } },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 2, toughness: 2, duration: "end-of-turn" },
      resolve: null,
      text: "Sacrifice an artifact: This creature gets +2/+2 until end of turn.",
    },
  ],
});
