import { defineCard } from "../define.js";

const LIFE_TEXT = "Whenever you gain life, put a +1/+1 counter on this creature.";
const DRAW_TEXT =
  "Whenever you put one or more +1/+1 counters on this creature, draw a card. This ability triggers only once each turn.";

// Its draw triggers on counters you put on it for any reason, not only its
// own (the ruling) — and not on counters an opponent puts there.
export default defineCard({
  name: "Exemplar of Light",
  manaCost: "{2}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 3,
  toughness: 3,
  keywords: ["flying"],
  text: `Flying\n${LIFE_TEXT}\n${DRAW_TEXT}`,
  triggered: [
    {
      trigger: { on: "gains-life", who: "you" },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: LIFE_TEXT,
    },
    {
      trigger: { on: "counters-put", who: "self", counter: "+1/+1", byYou: true },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      oncePerTurn: true,
      text: DRAW_TEXT,
    },
  ],
});
