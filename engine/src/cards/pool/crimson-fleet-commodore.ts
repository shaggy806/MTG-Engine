import { defineCard } from "../define.js";

export default defineCard({
  name: "Crimson Fleet Commodore",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Ogre", "Pirate"],
  power: 5,
  toughness: 2,
  keywords: ["trample"],
  text: "Trample\nWhen this creature enters, you become the monarch.",
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
