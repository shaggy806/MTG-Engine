import { defineCard } from "../define.js";

// #380 in top-commanders.txt. A modal DFC whose front can transform into
// its back face, The Incredible Hulk (the 2025 rules let a modal DFC
// transform to a permanent face).
const DRAW_TEXT = "{X}{X}, {T}: Draw X cards. Activate only as a sorcery.";
const TRANSFORM_TEXT = "{2}{R}{R}{G}{G}: Transform Bruce Banner. Activate only as a sorcery.";

export default defineCard({
  name: "Bruce Banner",
  manaCost: "{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Scientist", "Hero"],
  power: 1,
  toughness: 1,
  text: `${DRAW_TEXT}\n${TRANSFORM_TEXT}`,
  activated: [
    {
      cost: { mana: "{X}{X}", tap: true },
      sorcerySpeed: true,
      targets: [],
      effect: { kind: "draw", amount: "x" },
      resolve: null,
      text: DRAW_TEXT,
    },
    {
      cost: { mana: "{2}{R}{R}{G}{G}", tap: false },
      sorcerySpeed: true,
      targets: [],
      effect: { kind: "transform", target: "source" },
      resolve: null,
      text: TRANSFORM_TEXT,
    },
  ],
  faces: ["Bruce Banner", "The Incredible Hulk"],
});
