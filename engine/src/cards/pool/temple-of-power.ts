import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

// The back face of Ojer Axonil, Deepest Might.
const TRANSFORM_TEXT =
  "{2}{R}, {T}: Transform this land. Activate only if red sources you controlled dealt 4 or more " +
  "noncombat damage this turn and only as a sorcery.";

export default defineCard({
  name: "Temple of Power",
  art: "https://cards.scryfall.io/art_crop/back/5/0/50f8e2b6-98c7-4f28-bb39-e1fbe841f1ee.jpg",
  types: ["land"],
  text: `(Transforms from Ojer Axonil, Deepest Might.)\n{T}: Add {R}.\n${TRANSFORM_TEXT}`,
  activated: [
    manaTapAbility("R"),
    {
      cost: { mana: "{2}{R}", tap: true },
      condition: { kind: "damage-dealt-this-turn", colors: ["R"], combat: false, atLeast: 4 },
      sorcerySpeed: true,
      targets: [],
      effect: { kind: "transform", target: "source" },
      resolve: null,
      text: TRANSFORM_TEXT,
    },
  ],
  faces: ["Ojer Axonil, Deepest Might", "Temple of Power"],
  transform: true,
});
