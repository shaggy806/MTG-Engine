import { defineCard } from "../define.js";

const TEXT =
  "Whenever you put one or more +1/+1 counters on a creature you control, you may draw that many cards. Do this only once each turn.";

// It triggers every time; once you've drawn this way this turn it isn't
// offered again ("do this only once each turn" — `may.oncePerTurn`), and a
// declined one doesn't use it up. Counters a creature enters with were put
// on it too (rule 122.6).
export default defineCard({
  name: "Terrasymbiosis",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: {
        on: "counters-put",
        who: "you-control",
        counter: "+1/+1",
        filter: { type: "creature" },
        byYou: true,
      },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Draw that many cards?",
        effect: { kind: "draw", amount: { triggerValue: true } },
        oncePerTurn: true,
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
