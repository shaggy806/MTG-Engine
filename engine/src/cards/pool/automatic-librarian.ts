import { defineCard } from "../define.js";

export default defineCard({
  name: "Automatic Librarian",
  manaCost: "{3}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Construct"],
  power: 3,
  toughness: 2,
  text: "When this creature enters, scry 2. (Look at the top two cards of your library, then put any number of them on the bottom and the rest on top in any order.)",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "scry", amount: 2 },
      resolve: null,
      text: "When this creature enters, scry 2.",
    },
  ],
});
