import { defineCard } from "../define.js";

const EXILE_TEXT = "Whenever you sacrifice a nontoken permanent, exile the top card of your library.";
const PLAY_TEXT =
  "During your turn, as long as you've sacrificed a nontoken permanent this turn, you may play cards exiled with this creature.";
const MANA_TEXT = "{T}, Sacrifice a land: Add {R}{R}.";

// Theater of Horrors' shape: the permission lasts while this creature stays
// on the battlefield as the same object (`whileSource`), and is gated, every
// time it's used, on its being your turn and on a nontoken permanent you
// sacrificed this turn (as it last existed — a sacrificed token is still a
// token). Lands and spells alike, with their normal timing and costs.
export default defineCard({
  name: "Evendo Brushrazer",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Insect", "Warrior"],
  power: 2,
  toughness: 2,
  text: `${EXILE_TEXT}\n${PLAY_TEXT}\n${MANA_TEXT}`,
  triggered: [
    {
      trigger: { on: "sacrifice", who: "you", filter: { token: false } },
      targets: [],
      effect: {
        kind: "impulse-exile",
        amount: 1,
        duration: "while-source",
        whileSource: true,
        yourTurnOnly: true,
        gate: { kind: "turn-history", what: "sacrificed", who: "you", filter: { token: false } },
      },
      resolve: null,
      text: EXILE_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: { filter: { type: "land" } } },
      targets: [],
      effect: { kind: "add-mana", mana: "R", amount: 2 },
      resolve: null,
      text: MANA_TEXT,
    },
  ],
});
