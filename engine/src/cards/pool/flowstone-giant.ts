import { defineCard } from "../define.js";

export default defineCard({
  name: "Flowstone Giant",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Giant"],
  power: 3,
  toughness: 3,
  text: "{R}: This creature gets +2/-2 until end of turn.",
  activated: [
    {
      cost: { mana: "{R}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 2, toughness: -2, duration: "end-of-turn" },
      resolve: null,
      text: "{R}: This creature gets +2/-2 until end of turn.",
    },
  ],
});
