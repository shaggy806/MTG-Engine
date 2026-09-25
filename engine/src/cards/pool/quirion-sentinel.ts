import { defineCard } from "../define.js";

export default defineCard({
  name: "Quirion Sentinel",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Druid"],
  power: 2,
  toughness: 1,
  text: "When this creature enters, add one mana of any color.",
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
      text: "When this creature enters, add one mana of any color.",
    },
  ],
});
