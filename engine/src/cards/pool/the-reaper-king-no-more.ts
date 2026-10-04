import { defineCard } from "../define.js";
import { distinctTargets } from "../helpers.js";

// EDHREC rank 5910.

const ENTER_TEXT = "When The Reaper enters, put a -1/-1 counter on each of up to two target creatures.";
const DIES_TEXT =
  "Whenever a creature an opponent controls with a -1/-1 counter on it dies, you may put that card onto the battlefield under your control. Do this only once each turn.";

export default defineCard({
  name: "The Reaper, King No More",
  manaCost: "{2/B}{2/R}{2/G}",
  colors: ["B", "R", "G"],
  supertypes: ["legendary"],
  types: ["artifact", "creature"],
  subtypes: ["Scarecrow"],
  power: 3,
  toughness: 3,
  text: `${ENTER_TEXT}\n${DIES_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: distinctTargets(2, "creature", { optional: true }),
      effect: {
        kind: "sequence",
        effects: [
          { kind: "add-counter", target: 0, counter: "-1/-1", amount: 1 },
          { kind: "add-counter", target: 1, counter: "-1/-1", amount: 1 },
        ],
      },
      resolve: null,
      text: ENTER_TEXT,
    },
    {
      // The counter is read as the creature last existed (Blowfly
      // Infestation's filter).
      trigger: {
        on: "dies",
        who: "opponent",
        filter: { type: "creature", counters: { kind: "-1/-1", compare: { op: "gte", n: 1 } } },
      },
      targets: [],
      // It triggers every time; the "may" is what happens only once a turn
      // (Terrasymbiosis's `oncePerTurn`).
      effect: {
        kind: "may",
        prompt: "Put that card onto the battlefield under your control?",
        oncePerTurn: true,
        effect: { kind: "put-onto-battlefield", target: "trigger-object", underYourControl: true },
      },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
});
