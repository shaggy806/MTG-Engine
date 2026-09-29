import { defineCard } from "../define.js";

// #262 in top-commanders.txt. A discard of several lands at once is one
// event, so it drains once.
const DRAIN_TEXT = "Whenever you discard one or more land cards, each opponent loses 2 life.";
const COMBAT_TEXT =
  "At the beginning of combat on your turn, target Villain you control gains menace until end of turn. It " +
  "connives. (Draw a card, then discard a card. If you discarded a nonland card, put a +1/+1 counter on that " +
  "creature.)";

export default defineCard({
  name: "Doctor Doom, King of Latveria",
  manaCost: "{1}{U}{B}{R}",
  colors: ["U", "B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Noble", "Villain"],
  power: 3,
  toughness: 3,
  text: `${DRAIN_TEXT}\n${COMBAT_TEXT}`,
  triggered: [
    {
      trigger: { on: "discards", who: "you", filter: { type: "land" } },
      targets: [],
      effect: { kind: "lose-life", amount: 2, who: "each-opponent" },
      resolve: null,
      text: DRAIN_TEXT,
    },
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      targets: [{ kind: "permanent", whose: "you", filter: { subtype: "Villain" } }],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "grant-keyword", target: 0, keyword: "menace", duration: "end-of-turn" },
          { kind: "connive", target: 0 },
        ],
      },
      resolve: null,
      text: COMBAT_TEXT,
    },
  ],
});
