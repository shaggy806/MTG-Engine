import { defineCard } from "../define.js";

const TEXT =
  "When this creature enters, reveal the top four cards of your library. You may put a land card from among them into your hand. Put the rest into your graveyard.";

export default defineCard({
  name: "Satyr Wayfinder",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Satyr"],
  power: 1,
  toughness: 1,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "library",
        count: 4,
        reveal: true,
        min: 0,
        max: 1,
        destination: "hand",
        leftover: "graveyard",
        filter: { type: "land" },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
