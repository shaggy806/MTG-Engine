import { defineCard } from "../define.js";

const LOCK = "You can't lose the game and your opponents can't win the game.";

// Both halves are facts about players, read off the battlefield
// (`playerCantLoseGame` / `playerCantWinGame`): 0 life, poison, an empty
// library and "you lose the game" all wait until it's gone, and an
// opponent's "you win the game" does nothing. Conceding still loses (the
// ruling), and so does leaving it as the last opponent standing's rival
// (rule 104.2a).
export default defineCard({
  name: "Platinum Angel",
  manaCost: "{7}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Angel"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text: `Flying\n${LOCK}`,
  static: [
    {
      affects: { scope: "self" },
      cantLoseGame: true,
      opponentsCantWinGame: true,
      text: LOCK,
    },
  ],
});
