import { defineCard } from "../define.js";

export default defineCard({
  name: "Dori, Bearer of Friends",
  manaCost: "{2}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Dwarf", "Warrior"],
  power: 3,
  toughness: 2,
  keywords: ["trample"],
  text: "Trample\nWhen Dori enters, create a Treasure token. (It's an artifact with \"{T}, Sacrifice this token: Add one mana of any color.\")",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1 },
      resolve: null,
      text: "When Dori enters, create a Treasure token.",
    },
  ],
});
