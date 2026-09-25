import { defineCard } from "../define.js";

// #268 in top-commanders.txt. Transforms into Nicol Bolas, the Arisen.
//
// "Exile Nicol Bolas, then return him to the battlefield transformed" is a
// flicker of the source that returns it back face up, so the Arisen enters
// with its printed loyalty.
const ENTER_TEXT = "When Nicol Bolas enters, each opponent discards a card.";
const FLIP_TEXT =
  "{4}{U}{B}{R}: Exile Nicol Bolas, then return him to the battlefield transformed under his owner's " +
  "control. Activate only as a sorcery.";

export default defineCard({
  name: "Nicol Bolas, the Ravager",
  manaCost: "{1}{U}{B}{R}",
  colors: ["U", "B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elder", "Dragon"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text: `Flying\n${ENTER_TEXT}\n${FLIP_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "discard", target: "each-opponent", amount: 1 },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{4}{U}{B}{R}", tap: false },
      sorcerySpeed: true,
      targets: [],
      effect: { kind: "flicker", target: "source", transformed: true },
      resolve: null,
      text: FLIP_TEXT,
    },
  ],
  faces: ["Nicol Bolas, the Ravager", "Nicol Bolas, the Arisen"],
  transform: true,
});
