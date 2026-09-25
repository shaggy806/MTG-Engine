import { defineCard } from "../define.js";

export default defineCard({
  name: "Staunch Throneguard",
  manaCost: "{5}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Construct"],
  power: 2,
  toughness: 5,
  keywords: ["vigilance"],
  text: "Vigilance\nWhen this creature enters, you become the monarch.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "become-monarch" },
      resolve: null,
      text: "When this creature enters, you become the monarch.",
    },
  ],
});
