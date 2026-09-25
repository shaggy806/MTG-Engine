import { defineCard } from "../define.js";

export default defineCard({
  name: "Smokespew Invoker",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie", "Mutant"],
  power: 3,
  toughness: 1,
  text: "{7}{B}: Target creature gets -3/-3 until end of turn.",
  activated: [
    {
      cost: { mana: "{7}{B}", tap: false },
      targets: ["creature"],
      effect: { kind: "modify-pt", target: 0, power: -3, toughness: -3, duration: "end-of-turn" },
      resolve: null,
      text: "{7}{B}: Target creature gets -3/-3 until end of turn.",
    },
  ],
});
