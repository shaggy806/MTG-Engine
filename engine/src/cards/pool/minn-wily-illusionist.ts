import { defineCard } from "../define.js";

const DRAW_TEXT =
  "Whenever you draw your second card each turn, create a 1/1 blue Illusion creature token " +
  'with "This token gets +1/+0 for each other Illusion you control."';
const DIES_TEXT =
  "Whenever an Illusion you control dies, you may put a permanent card with mana value less " +
  "than or equal to that creature's power from your hand onto the battlefield.";

export default defineCard({
  name: "Minn, Wily Illusionist",
  manaCost: "{1}{U}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Gnome", "Wizard"],
  power: 1,
  toughness: 3,
  text: `${DRAW_TEXT}\n${DIES_TEXT}`,
  triggered: [
    {
      trigger: { on: "draws", who: "you", nthEachTurn: 2 },
      targets: [],
      effect: { kind: "create-token", token: "Illusion Token (Minn)", count: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
    {
      // "That creature's power" is the power it died with, read by
      // last-known information (rule 608.2h) — counters and the other
      // Illusions' bonus included.
      trigger: { on: "dies", who: "you-control", filter: { subtype: "Illusion" } },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "hand",
        min: 0,
        max: 1,
        destination: "battlefield",
        leftover: "stay",
        filter: {
          // A permanent card: anything but an instant or a sorcery.
          notTypes: ["instant", "sorcery"],
          manaValue: { op: "lte", n: { amount: { powerOf: "trigger-object" } } },
        },
      },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
});
