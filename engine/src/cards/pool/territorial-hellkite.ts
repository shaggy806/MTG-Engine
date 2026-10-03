import { defineCard } from "../define.js";

// The opponent is picked at random as the ability resolves, among those it
// didn't attack during your last combat — any of them if it didn't attack
// then (it was tapped, or you didn't control it) — and players can respond
// before it attacks. A player who can't be attacked may still be picked. It
// must attack that player if able, not a planeswalker of theirs; if it can't,
// or attacking them has a cost, it's free to attack elsewhere or not at all
// (the rulings).
const COMBAT_TEXT =
  "At the beginning of combat on your turn, choose an opponent at random that this creature didn't attack during your last combat. This creature attacks that player this combat if able. If you can't choose an opponent this way, tap this creature.";

export default defineCard({
  name: "Territorial Hellkite",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 6,
  toughness: 5,
  keywords: ["flying", "haste"],
  text: `Flying, haste\n${COMBAT_TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      targets: [],
      effect: {
        kind: "attack-random-opponent",
        target: "source",
        notAttackedLastCombat: true,
        else: { kind: "tap", target: "source" },
      },
      resolve: null,
      text: COMBAT_TEXT,
    },
  ],
});
