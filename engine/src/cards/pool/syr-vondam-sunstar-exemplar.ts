import { defineCard } from "../define.js";

// EDHREC rank 4566.
//
// Rulings:
//   [2025-07-25] Syr Vondam, Sunstar Exemplar’s first triggered ability refers to creatures you
//     control being put into exile from the battlefield. It won’t trigger if a creature card is
//     put into exile from another zone.
//   [2025-07-25] If Syr Vondam, Sunstar Exemplar leaves the battlefield at the same time as one or
//     more other creatures you control die or are put into exile, its first triggered ability will
//     trigger for each of those other creatures.

// "Dies or is put into exile" is a `leaves-battlefield` trigger bounded to
// those two destinations (God-Eternal Oketra's shape), its filter read as the
// creature last existed on the battlefield — so the first ability sees
// creatures leaving alongside Syr Vondam (the ruling), and the second reads
// Syr Vondam's own power as it last existed (Shirei's `power` filter shape).
// If Syr Vondam has already left, the counter finds nothing and the life is
// still gained.
const GROW_TEXT =
  "Whenever another creature you control dies or is put into exile, put a +1/+1 counter on Syr Vondam and you gain 1 life.";
const DEATH_TEXT =
  "When Syr Vondam dies or is put into exile while its power is 4 or greater, destroy up to one target nonland permanent.";

export default defineCard({
  name: "Syr Vondam, Sunstar Exemplar",
  manaCost: "{W}{B}",
  colors: ["W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Knight"],
  power: 2,
  toughness: 2,
  keywords: ["vigilance", "menace"],
  text: `Vigilance, menace\n${GROW_TEXT}\n${DEATH_TEXT}`,
  triggered: [
    {
      trigger: {
        on: "leaves-battlefield",
        who: "you-control",
        filter: { type: "creature" },
        otherOnly: true,
        to: ["graveyard", "exile"],
      },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
          { kind: "gain-life", amount: 1 },
        ],
      },
      resolve: null,
      text: GROW_TEXT,
    },
    {
      trigger: {
        on: "leaves-battlefield",
        who: "self",
        filter: { power: { op: "gte", n: 4 } },
        to: ["graveyard", "exile"],
      },
      targets: [{ kind: "optional", of: "nonland-permanent" }],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: DEATH_TEXT,
    },
  ],
});
