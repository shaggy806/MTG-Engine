import { defineCard } from "../define.js";

// EDHREC rank 4273.
//
// A Background: "Commander creatures you own" reaches your commanders
// wherever they are on the battlefield, including under an opponent's
// control (Raised by Giants' shape) — and there the granted "your upkeep" is
// its controller's. X is the exiled card's mana value, read once as the
// ability resolves (0 with nothing exiled from an empty library).

const GRANTED_TEXT =
  "At the beginning of your upkeep, exile the top card of your library. This creature gets +X/+0 until end of turn, where X is that card's mana value. You may play that card this turn.";
const TEXT = `Commander creatures you own have "${GRANTED_TEXT}"`;

export default defineCard({
  name: "Tavern Brawler",
  manaCost: "{2}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["enchantment"],
  subtypes: ["Background"],
  text: TEXT,
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", isCommander: true, ownedBy: "you" } },
      grantsTriggered: [
        {
          trigger: { on: "step-begins", step: "upkeep", who: "you" },
          targets: [],
          effect: {
            kind: "sequence",
            effects: [
              { kind: "impulse-exile", amount: 1, duration: "end-of-turn" },
              {
                kind: "modify-pt",
                target: "source",
                power: { thisWay: "exiled", sumOf: "mana-value" },
                toughness: 0,
                duration: "end-of-turn",
              },
            ],
          },
          resolve: null,
          text: GRANTED_TEXT,
        },
      ],
      text: TEXT,
    },
  ],
});
