import { defineCard } from "../define.js";

// EDHREC rank 2391.

export default defineCard({
  name: "Earthshaker Dreadmaw",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Dinosaur"],
  power: 6,
  toughness: 6,
  keywords: ["trample"],
  text: "Trample\nWhen this creature enters, draw a card for each other Dinosaur you control.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      // Counted as the trigger resolves; "other" leaves the Dreadmaw itself out.
      effect: { kind: "draw", amount: { countOf: { subtype: "Dinosaur", controlledBy: "you" }, excludeSelf: true } },
      resolve: null,
      text: "When this creature enters, draw a card for each other Dinosaur you control.",
    },
  ],
});
