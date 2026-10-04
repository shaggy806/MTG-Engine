import { defineCard } from "../define.js";

// EDHREC rank 4661.
//
// Rulings:
//   [2022-09-09] A legendary land entering the battlefield without being played does not cause
//     Shanid’s last ability to trigger.
//   [2022-09-09] If casting a legendary spell causes Shanid’s last ability to trigger, that
//     ability goes on the stack above the spell that caused it to trigger and resolves first. It
//     resolves even if that spell is countered or otherwise left the stack.
//
// "Play a legendary land or cast a legendary spell" is playing a legendary card (rule 305.1 /
// 601.2): the `plays-card` trigger, which a land put onto the battlefield doesn't fire.

const MENACE_TEXT = "Other legendary creatures you control have menace.";
const DRAW_TEXT =
  "Whenever you play a legendary land or cast a legendary spell, you draw a card and you lose 1 life.";

export default defineCard({
  name: "Shanid, Sleepers' Scourge",
  manaCost: "{1}{R}{W}{B}",
  colors: ["W", "B", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Knight"],
  power: 2,
  toughness: 4,
  keywords: ["menace"],
  text: `Menace\n${MENACE_TEXT}\n${DRAW_TEXT}`,
  static: [
    {
      affects: {
        scope: "filter",
        filter: { type: "creature", supertype: "legendary", controlledBy: "you" },
        excludeSelf: true,
      },
      grantKeywords: ["menace"],
      text: MENACE_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "plays-card", who: "you", filter: { supertype: "legendary" } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          { kind: "lose-life", amount: 1, who: "you" },
        ],
      },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
