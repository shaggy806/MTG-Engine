import { defineCard } from "../define.js";

// The draw trigger resolves before the noncreature spell that caused it (its
// ruling). The three cards are discarded as the ability goes on the stack. The
// delayed return finds only the card this exiled, still in exile (rule
// 603.7c), and brings back a new object (400.7), tapped and under its owner's
// control: no counters, Auras or combat (its ruling).
const DRAW_TEXT = "Whenever an opponent casts a noncreature spell, draw a card.";
const BLINK_TEXT =
  "Discard three cards: Exile Nezahal. Return it to the battlefield tapped under its owner's control at the beginning of the next end step.";

export default defineCard({
  name: "Nezahal, Primal Tide",
  manaCost: "{5}{U}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elder", "Dinosaur"],
  power: 7,
  toughness: 7,
  cantBeCountered: true,
  text: `This spell can't be countered.\nYou have no maximum hand size.\n${DRAW_TEXT}\n${BLINK_TEXT}`,
  static: [{ affects: { scope: "self" }, noMaxHandSize: true, text: "You have no maximum hand size." }],
  triggered: [
    {
      trigger: { on: "cast-spell", who: "opponent", noncreatureOnly: true },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: false, discard: { count: 3 } },
      targets: [],
      effect: {
        kind: "flicker",
        target: "source",
        returnAt: "next-end-step",
        tapped: true,
        returnText: "Return Nezahal, Primal Tide to the battlefield tapped under its owner's control.",
      },
      resolve: null,
      text: BLINK_TEXT,
    },
  ],
});
