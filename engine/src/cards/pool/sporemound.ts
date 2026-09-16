import { defineCard } from "../define.js";

export default defineCard({
  name: "Sporemound",
  manaCost: "{3}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Fungus"],
  power: 3,
  toughness: 3,
  text:
    "Landfall — Whenever a land you control enters, create a 1/1 green Saproling " +
    "creature token.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you",
        filter: { type: "land", controlledBy: "you" },
      },
      targets: [],
      effect: { kind: "create-token", token: "Saproling Token", count: 1 },
      resolve: null,
      text:
        "Landfall — Whenever a land you control enters, create a 1/1 green Saproling " +
        "creature token.",
    },
  ],
});
