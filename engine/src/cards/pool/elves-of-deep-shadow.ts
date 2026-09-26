import { defineCard } from "../define.js";

const MANA = "{T}: Add {B}. This creature deals 1 damage to you.";

// The damage is part of the mana ability (Ancient Tomb's shape), so it's
// dealt as the mana is made and only when this ability makes it.
export default defineCard({
  name: "Elves of Deep Shadow",
  manaCost: "{G}",
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
      effect: { kind: "add-mana", mana: "B", amount: 1, painToController: 1 },
      resolve: null,
      text: MANA,
    },
  ],
});
