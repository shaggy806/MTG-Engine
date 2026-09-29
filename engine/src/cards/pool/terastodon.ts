import { defineCard } from "../define.js";
import { distinctTargets } from "../helpers.js";

const ENTER_TEXT =
  "When this creature enters, you may destroy up to three target noncreature permanents. For " +
  "each permanent put into a graveyard this way, its controller creates a 3/3 green Elephant " +
  "creature token.";

// "Put into a graveyard this way" is destroyed and put there (`died`): an
// indestructible one, or one a replacement exiles, makes no Elephant. Each
// token's creator is that permanent's controller as it left.
export default defineCard({
  name: "Terastodon",
  manaCost: "{6}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elephant"],
  power: 9,
  toughness: 9,
  text: ENTER_TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: distinctTargets(3, { kind: "permanent", filter: { notTypes: ["creature"] } }, { optional: true }),
      effect: {
        kind: "may",
        prompt: "Destroy the targets?",
        effect: {
          kind: "sequence",
          effects: [
            {
              // One instruction over every target: they're destroyed together.
              kind: "sequence",
              simultaneous: true,
              effects: [
                { kind: "destroy", target: 0 },
                { kind: "destroy", target: 1 },
                { kind: "destroy", target: 2 },
              ],
            },
            {
              kind: "create-token",
              token: "Elephant Token",
              who: "each-player",
              count: { thisWay: "died", who: "each" },
            },
          ],
        },
      },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
});
