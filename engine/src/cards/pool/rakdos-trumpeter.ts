import { defineCard } from "../define.js";

export default defineCard({
  name: "Rakdos Trumpeter",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Shaman"],
  power: 1,
  toughness: 3,
  keywords: ["menace"],
  text: "Menace (This creature can't be blocked except by two or more creatures.)\n{3}{R}: This creature gets +2/+0 until end of turn.",
  activated: [
    {
      cost: { mana: "{3}{R}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 2, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "{3}{R}: This creature gets +2/+0 until end of turn.",
    },
  ],
});
