import { defineCard } from "../define.js";

// EDHREC rank 5948. Circuitous Route's filter, to the hand.

export default defineCard({
  name: "Gatecreeper Vine",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Plant"],
  power: 0,
  toughness: 2,
  keywords: ["defender"],
  text: "Defender\nWhen this creature enters, you may search your library for a basic land card or a Gate card, reveal it, put it into your hand, then shuffle.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { anyOf: [{ type: "land", supertype: "basic" }, { subtype: "Gate" }] },
        destination: "hand",
        min: 0,
        max: 1,
        reveal: true,
      },
      resolve: null,
      text: "When this creature enters, you may search your library for a basic land card or a Gate card, reveal it, put it into your hand, then shuffle.",
    },
  ],
});
