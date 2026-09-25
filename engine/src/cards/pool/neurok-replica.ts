import { defineCard } from "../define.js";

export default defineCard({
  name: "Neurok Replica",
  manaCost: "{3}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Wizard"],
  power: 1,
  toughness: 4,
  text: "{1}{U}, Sacrifice this creature: Return target creature to its owner's hand.",
  activated: [
    {
      cost: { mana: "{1}{U}", tap: false, sacrifice: "self" },
      targets: ["creature"],
      effect: { kind: "return-to-hand", target: 0 },
      resolve: null,
      text: "{1}{U}, Sacrifice this creature: Return target creature to its owner's hand.",
    },
  ],
});
