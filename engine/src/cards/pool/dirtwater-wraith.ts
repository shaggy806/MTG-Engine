import { defineCard } from "../define.js";

export default defineCard({
  name: "Dirtwater Wraith",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Wraith"],
  power: 1,
  toughness: 3,
  keywords: ["swampwalk"],
  text: "Swampwalk (This creature can't be blocked as long as defending player controls a Swamp.)\n{B}: This creature gets +1/+0 until end of turn.",
  activated: [
    {
      cost: { mana: "{B}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "{B}: This creature gets +1/+0 until end of turn.",
    },
  ],
});
