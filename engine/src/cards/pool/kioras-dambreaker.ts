import { defineCard } from "../define.js";

export default defineCard({
  name: "Kiora's Dambreaker",
  manaCost: "{5}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Leviathan"],
  power: 5,
  toughness: 6,
  text: "When this creature enters, proliferate. (Choose any number of permanents and/or players, then give each another counter of each kind already there.)",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "proliferate" },
      resolve: null,
      text: "When this creature enters, proliferate.",
    },
  ],
});
