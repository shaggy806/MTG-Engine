import { defineCard } from "../define.js";

export default defineCard({
  name: "Burning-Tree Emissary",
  manaCost: "{R/G}{R/G}",
  colors: ["R", "G"],
  types: ["creature"],
  subtypes: ["Human", "Shaman"],
  power: 2,
  toughness: 2,
  text: "When this creature enters, add {R}{G}.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "add-mana", mana: { all: ["R", "G"] }, amount: 1 },
      resolve: null,
      text: "When this creature enters, add {R}{G}.",
    },
  ],
});
