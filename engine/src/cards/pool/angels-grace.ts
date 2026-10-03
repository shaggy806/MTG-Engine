import { defineCard } from "../define.js";

const LOCK = "You can't lose the game this turn and your opponents can't win the game this turn.";
const FLOOR = "Until end of turn, damage that would reduce your life total to less than 1 reduces it to 1 instead.";

// Everything lasts until this turn's cleanup (rule 514.2), where a player
// left at 0 or less life loses at the next check. The floor is a
// replacement of how damage changes the life total, not a prevention: the
// damage is still dealt — lifelink gains in full and a commander's combat
// damage still counts (the rulings) — and a life total already below 1
// drops as normal. Life lost, not dealt as damage, isn't stopped.
export default defineCard({
  name: "Angel's Grace",
  manaCost: "{W}",
  colors: ["W"],
  types: ["instant"],
  text:
    "Split second (As long as this spell is on the stack, players can't cast spells or activate abilities that aren't mana abilities.)\n" +
    `${LOCK} ${FLOOR}`,
  splitSecond: true,
  effect: {
    kind: "player-effect",
    duration: "end-of-turn",
    cantLoseGame: "you",
    cantWinGame: "each-opponent",
    damageLifeFloor: { who: "you", floor: 1 },
  },
});
