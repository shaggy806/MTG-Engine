import { defineCard } from "../define.js";

export default defineCard({
  name: "Ogre Arsonist",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Ogre"],
  power: 3,
  toughness: 3,
  text: "When this creature enters, destroy target land.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["land"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "When this creature enters, destroy target land.",
    },
  ],
});
