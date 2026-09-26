import { defineCard } from "../define.js";
import { partnerWithTrigger } from "../helpers.js";

// #332 in top-commanders.txt.
//
// The cards are exiled and the counters put on Pako in one resolution, with
// nothing in between (its ruling). The fetch counters mean nothing without
// Haldan, Avid Arcanist, whose permission reads them.
const ATTACK_TEXT =
  "Whenever Pako attacks, exile the top card of each player's library and put a fetch counter on each of them. " +
  "Put a +1/+1 counter on Pako for each noncreature card exiled this way.";

export default defineCard({
  name: "Pako, Arcane Retriever",
  manaCost: "{3}{R}{G}",
  colors: ["R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elemental", "Dog"],
  power: 3,
  toughness: 3,
  keywords: ["haste"],
  pairing: { kind: "partner-with", name: "Haldan, Avid Arcanist" },
  text:
    "Partner with Haldan, Avid Arcanist (When this creature enters, target player may put Haldan into their " +
    `hand from their library, then shuffle.)\nHaste\n${ATTACK_TEXT}`,
  triggered: [
    partnerWithTrigger("Haldan, Avid Arcanist"),
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          {
            kind: "exile-from-library",
            whose: "each-player",
            amount: 1,
            withCounters: { kind: "fetch", amount: 1 },
          },
          {
            kind: "add-counter",
            target: "source",
            counter: "+1/+1",
            amount: { thisWay: "exiled", filter: { notTypes: ["creature"] } },
          },
        ],
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
