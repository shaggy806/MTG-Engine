import { defineCard } from "../define.js";

const ATTACK_TEXT = "Whenever Laelia attacks, exile the top card of your library. You may play that card this turn.";
const GROW_TEXT =
  "Whenever one or more cards are put into exile from your library and/or your graveyard, put a +1/+1 counter on Laelia.";

// Whoever exiles them, and for any reason — delve included; once per move,
// however many cards it takes, so cascade's one-at-a-time exiles each count
// (the rulings).
export default defineCard({
  name: "Laelia, the Blade Reforged",
  manaCost: "{2}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Spirit", "Warrior"],
  power: 2,
  toughness: 2,
  keywords: ["haste"],
  text: `Haste\n${ATTACK_TEXT}\n${GROW_TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: { kind: "impulse-exile", amount: 1, duration: "end-of-turn" },
      resolve: null,
      text: ATTACK_TEXT,
    },
    {
      trigger: { on: "put-into-exile", who: "you", from: ["library", "graveyard"] },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: GROW_TEXT,
    },
  ],
});
