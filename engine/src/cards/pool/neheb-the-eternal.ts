import { defineCard } from "../define.js";
import { afflict } from "../helpers.js";

// EDHREC rank 1193. Life lost, not life total changed: an opponent who lost 2
// and gained 8 still gives {R}{R}, and one who has since lost the game still
// counts (the rulings — the `life-lost` turn stat). Not a mana ability: it
// triggers at the beginning of a step, so it uses the stack (the rulings).
const MANA =
  "At the beginning of each of your postcombat main phases, add {R} for each 1 life your opponents have lost this turn.";

export default defineCard({
  name: "Neheb, the Eternal",
  manaCost: "{3}{R}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Zombie", "Minotaur", "Warrior"],
  power: 4,
  toughness: 6,
  text: `Afflict 3 (Whenever this creature becomes blocked, defending player loses 3 life.)\n${MANA}`,
  triggered: [
    afflict(3),
    {
      trigger: { on: "step-begins", step: "postcombat-main", who: "you" },
      targets: [],
      effect: { kind: "add-mana", mana: "R", amount: { turnStat: "life-lost", who: "each-opponent" } },
      resolve: null,
      text: MANA,
    },
  ],
});
