import { defineCard } from "../define.js";

export default defineCard({
  name: "Worthy Knight",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Knight"],
  power: 2,
  toughness: 2,
  text: "Whenever you cast a Knight spell, create a 1/1 white Human creature token.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { subtype: "Knight" } },
      targets: [],
      effect: { kind: "create-token", token: "Human Token", count: 1 },
      resolve: null,
      text: "Whenever you cast a Knight spell, create a 1/1 white Human creature token.",
    },
  ],
});
