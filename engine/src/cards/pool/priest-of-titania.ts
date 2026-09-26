import { defineCard } from "../define.js";

const MANA = "{T}: Add {G} for each Elf on the battlefield.";

// Every Elf on the battlefield, whoever controls it, this one included —
// counted as the mana ability resolves (a mana ability: nothing can answer
// it in between).
export default defineCard({
  name: "Priest of Titania",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Druid"],
  power: 1,
  toughness: 1,
  text: MANA,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "G", amount: { countOf: { subtype: "Elf" } } },
      resolve: null,
      text: MANA,
    },
  ],
});
