import { defineCard } from "../define.js";

export default defineCard({
  name: "Crumbling Vestige",
  colors: [],
  types: ["land"],
  text: "This land enters tapped.\nWhen this land enters, add one mana of any color.\n{T}: Add {C}. ({C} represents colorless mana.)",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "modal",
        minModes: 1,
        maxModes: 1,
        modes: [
          { text: "Add {W}.", effect: { kind: "add-mana", mana: "W", amount: 1 } },
          { text: "Add {U}.", effect: { kind: "add-mana", mana: "U", amount: 1 } },
          { text: "Add {B}.", effect: { kind: "add-mana", mana: "B", amount: 1 } },
          { text: "Add {R}.", effect: { kind: "add-mana", mana: "R", amount: 1 } },
          { text: "Add {G}.", effect: { kind: "add-mana", mana: "G", amount: 1 } },
        ],
      },
      resolve: null,
      text: "When this land enters, add one mana of any color.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
});
