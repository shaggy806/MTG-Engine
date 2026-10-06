import { defineCard } from "../define.js";

/** The back face of Thing in the Ice. */
const TRANSFORM_TEXT =
  "When this creature transforms into Awoken Horror, return all non-Horror creatures to their owners' hands.";

export default defineCard({
  name: "Awoken Horror",
  art: "https://cards.scryfall.io/art_crop/back/7/2/7269d533-cb3f-498e-b97f-eb6c49e170c3.jpg",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Kraken", "Horror"],
  power: 7,
  toughness: 8,
  text: TRANSFORM_TEXT,
  triggered: [
    {
      trigger: { on: "transforms", who: "self", intoFront: false },
      targets: [],
      effect: { kind: "return-to-hand-all", filter: { type: "creature", notSubtypes: ["Horror"] } },
      resolve: null,
      text: TRANSFORM_TEXT,
    },
  ],
  faces: ["Thing in the Ice", "Awoken Horror"],
  transform: true,
});
