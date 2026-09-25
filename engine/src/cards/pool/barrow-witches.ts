import { defineCard } from "../define.js";

export default defineCard({
  name: "Barrow Witches",
  manaCost: "{4}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Warlock"],
  power: 3,
  toughness: 4,
  text: "When this creature enters, return target Knight card from your graveyard to your hand.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { subtype: "Knight" } }],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: "When this creature enters, return target Knight card from your graveyard to your hand.",
    },
  ],
});
