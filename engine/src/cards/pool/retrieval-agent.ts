import { defineCard } from "../define.js";

export default defineCard({
  name: "Retrieval Agent",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 2,
  toughness: 5,
  text: "{2}: This creature gets +1/-1 until end of turn.",
  activated: [
    {
      cost: { mana: "{2}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: -1, duration: "end-of-turn" },
      resolve: null,
      text: "{2}: This creature gets +1/-1 until end of turn.",
    },
  ],
});
