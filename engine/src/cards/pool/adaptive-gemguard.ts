import { defineCard } from "../define.js";

export default defineCard({
  name: "Adaptive Gemguard",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["artifact", "creature"],
  subtypes: ["Gnome"],
  power: 3,
  toughness: 3,
  text: "Tap two untapped artifacts and/or creatures you control: Put a +1/+1 counter on this creature. Activate only as a sorcery.",
  activated: [
    {
      cost: {
        mana: null,
        tap: false,
        tapOthers: {
          count: 2,
          filter: { typesAnyOf: ["artifact", "creature"], controlledBy: "you" },
          includeSelf: true,
        },
      },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Tap two untapped artifacts and/or creatures you control: Put a +1/+1 counter on this creature. Activate only as a sorcery.",
      sorcerySpeed: true,
    },
  ],
});
