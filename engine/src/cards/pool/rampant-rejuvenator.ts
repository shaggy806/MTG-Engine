import { defineCard } from "../define.js";

// EDHREC rank 3313.
//
// Rulings:
//   [2022-02-18] Use Rampant Rejuvenator's power as it last existed on the battlefield to
//     determine the value of X for its last ability.

const ENTER_TEXT = "This creature enters with two +1/+1 counters on it.";
const DIES_TEXT =
  "When this creature dies, search your library for up to X basic land cards, where X is this creature's power, put them onto the battlefield, then shuffle.";

export default defineCard({
  name: "Rampant Rejuvenator",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Plant", "Hydra"],
  power: 0,
  toughness: 0,
  text: `${ENTER_TEXT}\n${DIES_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", counters: { kind: "+1/+1", amount: 2 } },
      text: ENTER_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      // X is the power it died with (the ruling): `powerOf: "source"` from a
      // dies trigger reads last-known information.
      effect: {
        kind: "search-library",
        filter: { supertype: "basic", type: "land" },
        destination: "battlefield",
        min: 0,
        max: { powerOf: "source" },
      },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
});
