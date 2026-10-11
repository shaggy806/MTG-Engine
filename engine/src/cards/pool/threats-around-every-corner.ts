import { defineCard } from "../define.js";

const DREAD_TEXT = "When this enchantment enters, manifest dread.";
const LAND_TEXT =
  "Whenever a face-down permanent you control enters, search your library for a basic land card, put it onto the battlefield tapped, then shuffle.";

export default defineCard({
  name: "Threats Around Every Corner",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: `${DREAD_TEXT}\n${LAND_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "manifest-dread" },
      resolve: null,
      text: DREAD_TEXT,
    },
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { faceDown: true } },
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
      text: LAND_TEXT,
    },
  ],
});
