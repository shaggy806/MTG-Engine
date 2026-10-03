import { defineCard } from "../define.js";

// Whose graveyard it went to doesn't matter, only that an opponent controlled
// it as it died with at least one -1/-1 counter (the rulings) — read as it
// last existed on the battlefield. It comes back as a new object, without
// the counters, and only if it's still the card that died (rule 400.7).
const TEXT =
  "Whenever a creature an opponent controls with a -1/-1 counter on it dies, you may return that card " +
  "to the battlefield under your control.";

export default defineCard({
  name: "Necroskitter",
  manaCost: "{1}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 1,
  toughness: 4,
  keywords: ["wither"],
  text: `Wither (This deals damage to creatures in the form of -1/-1 counters.)\n${TEXT}`,
  triggered: [
    {
      trigger: {
        on: "dies",
        who: "opponent",
        filter: { type: "creature", counters: { kind: "-1/-1", compare: { op: "gte", n: 1 } } },
      },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Return that card to the battlefield under your control?",
        effect: { kind: "put-onto-battlefield", target: "trigger-object", underYourControl: true },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
