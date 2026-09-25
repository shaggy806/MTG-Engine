import { defineCard } from "../define.js";

// #237 in top-commanders.txt.
//
// The type and the granted dies trigger both last for as long as the
// creature stays on the battlefield. The token is made tapped, and the
// trigger belongs to the creature, so its controller when it dies draws and
// makes the token.
const DIES_TEXT =
  "When this creature dies, draw a card and create a tapped 4/3 white and black Vampire Demon " +
  "creature token with flying.";
const TRIGGER_TEXT =
  "Whenever you attack, target attacking Vampire that isn't a Demon becomes a Demon in addition to " +
  `its other types. It gains "${DIES_TEXT}"`;

export default defineCard({
  name: "Clavileño, First of the Blessed",
  manaCost: "{1}{W}{B}",
  colors: ["W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Vampire", "Cleric"],
  power: 2,
  toughness: 2,
  text: TRIGGER_TEXT,
  triggered: [
    {
      trigger: { on: "attack-with", who: "you", atLeast: 1 },
      targets: [
        {
          kind: "permanent",
          whose: "any",
          filter: { subtype: "Vampire", notSubtypes: ["Demon"], attacking: true },
        },
      ],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-types", target: 0, addSubtypes: ["Demon"], duration: "permanent" },
          {
            kind: "grant-triggered",
            target: 0,
            duration: "permanent",
            ability: {
              trigger: { on: "dies", who: "self" },
              targets: [],
              effect: {
                kind: "sequence",
                effects: [
                  { kind: "draw", amount: 1 },
                  { kind: "create-token", token: "Vampire Demon Token", count: 1, tapped: true },
                ],
              },
              resolve: null,
              text: DIES_TEXT,
            },
          },
        ],
      },
      resolve: null,
      text: TRIGGER_TEXT,
    },
  ],
});
