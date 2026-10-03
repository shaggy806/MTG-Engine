import { defineCard } from "../define.js";

const LOCK = "You can't lose the game and your opponents can't win the game.";

// Platinum Angel's lock on a flash flier: read off the battlefield
// (`playerCantLoseGame` / `playerCantWinGame`). Conceding still loses, and
// paying life still needs the life (the rulings).
export default defineCard({
  name: "Herald of Eternal Dawn",
  manaCost: "{4}{W}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 6,
  toughness: 6,
  keywords: ["flash", "flying"],
  text: `Flash (You may cast this spell any time you could cast an instant.)\nFlying\n${LOCK}`,
  static: [
    {
      affects: { scope: "self" },
      cantLoseGame: true,
      opponentsCantWinGame: true,
      text: LOCK,
    },
  ],
});
