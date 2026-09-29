import { defineCard } from "../define.js";
import { evolve } from "../helpers.js";

const MANA_TEXT = "{T}: Add {G} for each +1/+1 counter on this creature.";

// With no +1/+1 counters it makes no mana, and the auto-payer leaves it be.
export default defineCard({
  name: "Gyre Sage",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Druid"],
  power: 1,
  toughness: 2,
  text: `${evolve().text}\n${MANA_TEXT}`,
  triggered: [evolve()],
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "G", amount: { countersOn: "source", counter: "+1/+1" } },
      resolve: null,
      text: MANA_TEXT,
    },
  ],
});
