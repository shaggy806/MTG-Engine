import { defineCard } from "../define.js";

const CORRUPTED_TEXT =
  "Corrupted — At the beginning of your end step, each opponent who has three or more poison counters exiles " +
  "the top card of their library face down. You may look at and play those cards for as long as they remain " +
  "exiled, and you may spend mana as though it were mana of any color to cast those spells.";

// The rulings this follows: not an intervening "if" — it triggers every end
// step, and each opponent's poison counters are read as it resolves, those
// with three or more exiling at once. The cards are face down: only Ixhel's
// controller may look at them (rule 406.3), and goes on being able to play
// them — a land with their land drop, a spell at its normal timing, paying
// its costs — after Ixhel leaves, where another player who gains control of
// Ixhel can't. The any-colour spending is only for those spells (rule
// 118.14).
export default defineCard({
  name: "Ixhel, Scion of Atraxa",
  manaCost: "{1}{W}{B}{G}",
  colors: ["W", "B", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Angel"],
  power: 2,
  toughness: 5,
  keywords: ["flying", "vigilance"],
  toxic: 2,
  text: `Flying, vigilance, toxic 2\n${CORRUPTED_TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [],
      effect: {
        kind: "impulse-exile",
        amount: 1,
        whose: "each-opponent",
        whoseIf: { kind: "player-counters", counter: "poison", who: "that-player", atLeast: 3 },
        duration: "while-exiled",
        faceDown: true,
        spendAs: "any-color",
      },
      resolve: null,
      text: CORRUPTED_TEXT,
    },
  ],
});
