import { defineCard } from "../define.js";

const ENTER_TEXT =
  "When Eddie Brock enters, return target creature card with mana value 1 or less from your graveyard to " +
  "the battlefield.";
const TRANSFORM_TEXT = "{3}{B}{R}{G}: Transform Eddie Brock. Activate only as a sorcery.";

// A modal DFC whose front can transform into its back face, Venom, Lethal
// Protector (the 2025 rules let a modal DFC transform to a permanent face).
export default defineCard({
  name: "Eddie Brock",
  manaCost: "{2}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Hero", "Villain"],
  power: 3,
  toughness: 3,
  text: `${ENTER_TEXT}\n${TRANSFORM_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [
        { kind: "card-in-graveyard", whose: "you", filter: { type: "creature", manaValue: { op: "lte", n: 1 } } },
      ],
      effect: { kind: "put-onto-battlefield", target: 0, underYourControl: true },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{3}{B}{R}{G}", tap: false },
      sorcerySpeed: true,
      targets: [],
      effect: { kind: "transform", target: "source" },
      resolve: null,
      text: TRANSFORM_TEXT,
    },
  ],
  faces: ["Eddie Brock", "Venom, Lethal Protector"],
});
