import { defineCard } from "../define.js";

// #396 in top-commanders.txt. Transforms into Ifrit, Warden of Inferno.
//
// The transform ability is a flicker of the source that returns it back face
// up — a Saga that enters and gets its first lore counter.
const ENTER_TEXT =
  "When Clive enters, you may discard your hand, then draw cards equal to your devotion to red. (Each " +
  "{R} in the mana costs of permanents you control counts toward your devotion to red.)";
const FLIP_TEXT =
  "{4}{R}{R}, {T}: Exile Clive, then return it to the battlefield transformed under its owner's " +
  "control. Activate only as a sorcery.";

export default defineCard({
  name: "Clive, Ifrit's Dominant",
  manaCost: "{4}{R}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Noble", "Warrior"],
  power: 5,
  toughness: 5,
  text: `${ENTER_TEXT}\n${FLIP_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Discard your hand, then draw cards equal to your devotion to red?",
        effect: {
          kind: "sequence",
          effects: [
            { kind: "discard-hand", who: "you" },
            { kind: "draw", amount: { devotionTo: "R" } },
          ],
        },
      },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{4}{R}{R}", tap: true },
      sorcerySpeed: true,
      targets: [],
      effect: { kind: "flicker", target: "source", transformed: true },
      resolve: null,
      text: FLIP_TEXT,
    },
  ],
  faces: ["Clive, Ifrit's Dominant", "Ifrit, Warden of Inferno"],
  transform: true,
});
