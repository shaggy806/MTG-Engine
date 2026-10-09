import { defineCard } from "../define.js";

// EDHREC rank 2834.

const PT_TEXT = "Ulvenwald Hydra's power and toughness are each equal to the number of lands you control.";
const ETB_TEXT =
  "When this creature enters, you may search your library for a land card, put it onto the battlefield tapped, then shuffle.";

export default defineCard({
  name: "Ulvenwald Hydra",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Hydra"],
  power: 0,
  toughness: 0,
  keywords: ["reach"],
  text: `Reach\n${PT_TEXT}\n${ETB_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      setBasePtFromCount: { countOf: { countOf: { type: "land", controlledBy: "you" } }, plusPower: 0, plusToughness: 0 },
      text: PT_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Search your library for a land card?",
        effect: {
          kind: "search-library",
          filter: { type: "land" },
          destination: "battlefield",
          min: 0,
          max: 1,
          enterTapped: true,
        },
      },
      resolve: null,
      text: ETB_TEXT,
    },
  ],
});
