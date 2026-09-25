import { defineCard } from "../define.js";

export default defineCard({
  name: "Blinking Spirit",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 2,
  toughness: 2,
  text: "{0}: Return this creature to its owner's hand.",
  activated: [
    {
      cost: { mana: "{0}", tap: false },
      targets: [],
      effect: { kind: "return-to-hand", target: "source" },
      resolve: null,
      text: "{0}: Return this creature to its owner's hand.",
    },
  ],
});
