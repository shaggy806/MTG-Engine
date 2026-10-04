import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

// EDHREC rank 3946.
//
// The granted ability is the equipped creature's own: "this creature" is
// the creature, read as the ability resolves. "Put a number of +1/+1
// counters equal to the difference" if the tapped creature's power is
// greater is the `difference` amount, which never goes below 0 — so when
// it isn't greater, no counters (rule 107.1b).
const GRANTED_TEXT =
  "Whenever this creature attacks, tap target creature defending player controls. If that creature has greater power than this creature, put a number of +1/+1 counters on this creature equal to the difference.";
const STATIC_TEXT = `Equipped creature has "${GRANTED_TEXT}"`;

export default defineCard({
  name: "Conformer Shuriken",
  manaCost: "{2}",
  colors: [],
  supertypes: ["legendary"],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${STATIC_TEXT}\nEquip {2}`,
  static: [
    {
      affects: { scope: "attached" },
      grantsTriggered: [
        {
          trigger: { on: "attacks", who: "self" },
          targets: ["creature-defending-player-controls"],
          effect: {
            kind: "sequence",
            effects: [
              { kind: "tap", target: 0 },
              {
                kind: "add-counter",
                target: "source",
                counter: "+1/+1",
                amount: { difference: [{ powerOf: 0 }, { powerOf: "source" }] },
              },
            ],
          },
          resolve: null,
          text: GRANTED_TEXT,
        },
      ],
      text: STATIC_TEXT,
    },
  ],
  activated: [equip("{2}")],
});
