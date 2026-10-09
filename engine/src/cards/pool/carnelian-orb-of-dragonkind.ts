import { defineCard } from "../define.js";

// Reign of Dragons. "If that mana is spent on a Dragon creature spell, it
// gains haste until end of turn" is an additional effect of the mana on the
// spell it pays for (rule 106.6), not a trigger: the spell — and the Dragon
// it becomes — has haste whether or not the Orb is still around.
const TEXT = "{T}: Add {R}. If that mana is spent on a Dragon creature spell, it gains haste until end of turn.";

export default defineCard({
  name: "Carnelian Orb of Dragonkind",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["artifact"],
  text: TEXT,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "R",
        amount: 1,
        spellGains: { spell: { type: "creature", subtype: "Dragon" }, keywords: ["haste"] },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
