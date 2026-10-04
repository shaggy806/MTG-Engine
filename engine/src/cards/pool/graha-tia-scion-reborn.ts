import { defineCard } from "../define.js";

// EDHREC rank 5972.
//
// Rulings:
//   [2025-06-06] For spells on the stack with {X} in their mana costs, use the value chosen for X
//     to determine the spell's mana value.
//   [2025-06-06] Alternative costs, additional costs, and cost reductions don't change a spell's
//     mana value. Its mana value is still based on its mana cost.
//   [2025-06-06] G'raha Tia's last ability resolves before the spell that caused it to trigger. It
//     resolves even if that spell is countered or otherwise leaves the stack.
//
// X is the triggering spell's mana value, its {X} included, read as it last
// was on the stack if it has left (`manaValueOf: "trigger-object"`). "Do this
// only once each turn" is the `may`'s `oncePerTurn` (Leonardo, the Balance):
// every noncreature spell still triggers it, but once paid this turn it isn't
// offered again (a declined one doesn't use it up).
const TEXT =
  "Throw Wide the Gates — Whenever you cast a noncreature spell, you may pay X life, where X is that spell's mana value. If you do, create a 1/1 colorless Hero creature token and put X +1/+1 counters on it. Do this only once each turn.";
const X = { manaValueOf: "trigger-object" } as const;

export default defineCard({
  name: "G'raha Tia, Scion Reborn",
  manaCost: "{W}{U}{B}",
  colors: ["W", "U", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Cat", "Wizard"],
  power: 2,
  toughness: 3,
  keywords: ["lifelink"],
  text: `Lifelink\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", noncreatureOnly: true },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Pay X life (X = that spell's mana value) to create a 1/1 Hero with X +1/+1 counters?",
        costLife: X,
        oncePerTurn: true,
        effect: {
          kind: "create-token",
          token: "Hero Token (Black Mage's Rod)",
          count: 1,
          thenCounters: { kind: "+1/+1", amount: X },
        },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
