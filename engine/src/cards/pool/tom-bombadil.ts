import { defineCard } from "../define.js";

// #64 in top-commanders.txt.
//
// "Four or more lore counters among Sagas you control" is an `aggregate`
// condition summing lore counters. The reveal fires once a turn at most
// (`oncePerTurn` on the trigger), and a Saga it puts onto the battlefield
// starts its own chapter I.
const STATIC_TEXT =
  "As long as there are four or more lore counters among Sagas you control, Tom Bombadil has " +
  "hexproof and indestructible.";
const TRIGGER_TEXT =
  "Whenever the final chapter ability of a Saga you control resolves, reveal cards from the top " +
  "of your library until you reveal a Saga card. Put that card onto the battlefield and the rest " +
  "on the bottom of your library in a random order. This ability triggers only once each turn.";

export default defineCard({
  name: "Tom Bombadil",
  manaCost: "{W}{U}{B}{R}{G}",
  colors: ["W", "U", "B", "R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["God", "Bard"],
  power: 4,
  toughness: 4,
  text: `${STATIC_TEXT}\n${TRIGGER_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      condition: {
        kind: "aggregate",
        value: { aggregate: "sum", of: { counters: "lore" }, filter: { subtype: "Saga", controlledBy: "you" } },
        compare: { op: "gte", n: 4 },
      },
      grantKeywords: ["hexproof", "indestructible"],
      text: STATIC_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "chapter-resolves", who: "you-control", finalOnly: true },
      oncePerTurn: true,
      targets: [],
      effect: { kind: "reveal-until", filter: { subtype: "Saga" }, put: "battlefield", rest: "bottom-random" },
      resolve: null,
      text: TRIGGER_TEXT,
    },
  ],
});
