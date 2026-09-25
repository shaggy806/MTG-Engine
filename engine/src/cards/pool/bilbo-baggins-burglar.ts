import { defineCard } from "../define.js";

export default defineCard({
  name: "Bilbo Baggins, Burglar",
  manaCost: "{2}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Halfling", "Rogue"],
  power: 2,
  toughness: 1,
  text: "When Bilbo Baggins enters, draw a card.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "When Bilbo Baggins enters, draw a card.",
    },
  ],
  faces: ["Bilbo Baggins, Burglar", "Take a Glance"],
  adventure: true,
});
