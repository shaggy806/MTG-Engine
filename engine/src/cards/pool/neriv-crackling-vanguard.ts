import { defineCard } from "../define.js";

// Each differently named token you control counts once, by its name — the
// one its maker gave it, else its subtypes plus "Token" (rule 111.4; the
// rulings: two Elf Tokens and a Goblin Token exile two). The exiled cards
// stay playable for as long as they stay exiled, but only during a turn in
// which you attacked with a commander — any commander you attacked with.
const ETB_TEXT = "When Neriv enters, create two 1/1 red Goblin creature tokens.";
const ATTACK_TEXT =
  "Whenever Neriv attacks, exile a number of cards from the top of your library equal to the number of differently named tokens you control. During any turn you attacked with a commander, you may play those cards.";

export default defineCard({
  name: "Neriv, Crackling Vanguard",
  manaCost: "{2}{R}{W}{B}",
  colors: ["R", "W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Spirit", "Dragon"],
  power: 4,
  toughness: 4,
  keywords: ["flying", "deathtouch"],
  text: `Flying, deathtouch\n${ETB_TEXT}\n${ATTACK_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Goblin Token", count: 2 },
      resolve: null,
      text: ETB_TEXT,
    },
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "impulse-exile",
        amount: { distinctTokenNames: { token: true, controlledBy: "you" } },
        duration: "while-exiled",
        gate: { kind: "attacked-with-commander-this-turn" },
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
