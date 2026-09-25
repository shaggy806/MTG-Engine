import { defineCard } from "../define.js";

export default defineCard({
  name: "Foul Familiar",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 3,
  toughness: 1,
  text: "This creature can't block.\n{B}, Pay 1 life: Return this creature to its owner's hand.",
  activated: [
    {
      cost: { mana: "{B}", tap: false, payLife: 1 },
      targets: [],
      effect: { kind: "return-to-hand", target: "source" },
      resolve: null,
      text: "{B}, Pay 1 life: Return this creature to its owner's hand.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      restrictions: ["cant-block"],
      text: "This creature can't block.",
    },
  ],
});
