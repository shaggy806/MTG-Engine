import { defineCard } from "../define.js";

const ENTER_TEXT = "This artifact enters with a page counter on it.";
const PAGE_TEXT = "Whenever your commander enters or attacks, put a page counter on this artifact.";
const DRAW_TEXT = "{1}, {T}, Remove a page counter from this artifact: Draw a card.";
const YOUR_COMMANDER = { isCommander: true, ownedBy: "you" } as const;

// "Your commander" is one you own, whoever controls it (the 2019-10-04
// ruling): a stolen commander of yours still turns a page, and someone
// else's commander attacking for you doesn't.
export default defineCard({
  name: "Tome of Legends",
  manaCost: "{2}",
  types: ["artifact"],
  subtypes: ["Book"],
  text: `${ENTER_TEXT}\n${PAGE_TEXT}\n${DRAW_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", counters: { kind: "page", amount: 1 } },
      text: ENTER_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "any", filter: YOUR_COMMANDER },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "page", amount: 1 },
      resolve: null,
      text: PAGE_TEXT,
    },
    {
      trigger: { on: "attacks", who: "any", filter: YOUR_COMMANDER },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "page", amount: 1 },
      resolve: null,
      text: PAGE_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{1}", tap: true, removeCounter: { kind: "page", count: 1 } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
