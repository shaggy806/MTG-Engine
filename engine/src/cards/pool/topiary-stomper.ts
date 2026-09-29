import { defineCard } from "../define.js";

const ENTER_TEXT =
  "When this creature enters, search your library for a basic land card, put it onto the battlefield tapped, then shuffle.";
const RESTRICT_TEXT = "This creature can't attack or block unless you control seven or more lands.";

export default defineCard({
  name: "Topiary Stomper",
  manaCost: "{1}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Plant", "Dinosaur"],
  power: 4,
  toughness: 4,
  keywords: ["vigilance"],
  text: `Vigilance\n${ENTER_TEXT}\n${RESTRICT_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      condition: { kind: "not", of: { kind: "controls", filter: { type: "land" }, atLeast: 7 } },
      restrictions: ["cant-attack", "cant-block"],
      text: RESTRICT_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { supertype: "basic", type: "land" },
        destination: "battlefield",
        enterTapped: true,
        min: 0,
        max: 1,
      },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
});
