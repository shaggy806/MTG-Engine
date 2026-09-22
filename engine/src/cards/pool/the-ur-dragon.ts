import { defineCard } from "../define.js";

// #3 in top-commanders.txt, and the card that needed both halves of Eminence:
// the cost reduction is a *static* that functions from the command zone, where
// Edgar Markov's was a trigger.
//
// `otherOnly` on the cost modification is load-bearing here in a way it
// wouldn't be on an ordinary permanent: the static is live while The Ur-Dragon
// sits in the command zone, so without it the card would discount casting
// itself — and it says "other Dragon spells".
const EMINENCE_TEXT =
  "Eminence — As long as The Ur-Dragon is in the command zone or on the battlefield, " +
  "other Dragon spells you cast cost {1} less to cast.";
const ATTACK_TEXT =
  "Whenever one or more Dragons you control attack, draw that many cards, then you may " +
  "put a permanent card from your hand onto the battlefield.";

export default defineCard({
  name: "The Ur-Dragon",
  manaCost: "{4}{W}{U}{B}{R}{G}",
  colors: ["W", "U", "B", "R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Dragon", "Avatar"],
  power: 10,
  toughness: 10,
  keywords: ["flying"],
  text: `${EMINENCE_TEXT}\nFlying\n${ATTACK_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      fromCommandZone: true,
      costModification: {
        applies: { subtype: "Dragon", controlledBy: "you" },
        reduceGeneric: 1,
        otherOnly: true,
      },
      text: EMINENCE_TEXT,
    },
  ],
  triggered: [
    {
      // Batched: once per declaration however many Dragons attacked, with
      // that count as the trigger value — "draw that many cards".
      trigger: { on: "attacks-batch", who: "you", filter: { subtype: "Dragon", controlledBy: "you" } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: { triggerValue: true } },
          {
            // "you may put" — `min: 0` is the optional half, and `max: 1`
            // is "a permanent card".
            kind: "look-and-choose",
            zone: "hand",
            min: 0,
            max: 1,
            destination: "battlefield",
            leftover: "stay",
            filter: { notTypes: ["instant", "sorcery"] },
          },
        ],
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
