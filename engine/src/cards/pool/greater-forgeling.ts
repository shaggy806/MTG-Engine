import { defineCard } from "../define.js";

export default defineCard({
  name: "Greater Forgeling",
  manaCost: "{3}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 3,
  toughness: 4,
  text: "{1}{R}: This creature gets +3/-3 until end of turn.",
  activated: [
    {
      cost: { mana: "{1}{R}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 3, toughness: -3, duration: "end-of-turn" },
      resolve: null,
      text: "{1}{R}: This creature gets +3/-3 until end of turn.",
    },
  ],
});
