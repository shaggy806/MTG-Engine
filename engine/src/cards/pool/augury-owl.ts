import { defineCard } from "../define.js";

export default defineCard({
  name: "Augury Owl",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Bird"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying\nWhen this creature enters, scry 3. (Look at the top three cards of your library, then put any number of them on the bottom and the rest on top in any order.)",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "scry", amount: 3 },
      resolve: null,
      text: "When this creature enters, scry 3.",
    },
  ],
});
