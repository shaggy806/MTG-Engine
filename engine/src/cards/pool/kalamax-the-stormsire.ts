import { defineCard } from "../define.js";

// Top-commanders rank 318. The rulings this follows: "your first instant
// spell each turn" counts the whole turn, so an instant cast before Kalamax
// was tapped means the next one isn't the first; Kalamax tapped to pay for
// that instant still counts; the copy is made even if the spell was countered
// in response, keeps its modes, {X}, division and the costs paid for it, isn't
// cast, and resolves first; each copy of an instant spell (not a copy of a
// card) puts a counter on Kalamax, before the copy resolves.
const COPY_TEXT =
  "Whenever you cast your first instant spell each turn, if Kalamax is tapped, copy that spell. You may " +
  "choose new targets for the copy.";
const COUNTER_TEXT = "Whenever you copy an instant spell, put a +1/+1 counter on Kalamax.";

export default defineCard({
  name: "Kalamax, the Stormsire",
  manaCost: "{1}{G}{U}{R}",
  colors: ["G", "U", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elemental", "Dinosaur"],
  power: 4,
  toughness: 4,
  text: `${COPY_TEXT}\n${COUNTER_TEXT}`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { type: "instant" }, firstEachTurn: true },
      condition: { kind: "source", filter: { tapped: true } },
      targets: [],
      effect: { kind: "copy-spell", target: "trigger-spell", newTargets: true },
      resolve: null,
      text: COPY_TEXT,
    },
    {
      trigger: { on: "cast-spell", who: "you", copyOnly: true, filter: { type: "instant" } },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: COUNTER_TEXT,
    },
  ],
});
