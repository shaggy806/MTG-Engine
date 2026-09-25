import { defineCard } from "../define.js";

export default defineCard({
  name: "Fiery Hellhound",
  manaCost: "{1}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Elemental", "Dog"],
  power: 2,
  toughness: 2,
  text: "{R}: This creature gets +1/+0 until end of turn.",
  activated: [
    {
      cost: { mana: "{R}", tap: false },
      targets: [],
      effect: { kind: "modify-pt", target: "source", power: 1, toughness: 0, duration: "end-of-turn" },
      resolve: null,
      text: "{R}: This creature gets +1/+0 until end of turn.",
    },
  ],
});
