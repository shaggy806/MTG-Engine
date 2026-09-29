import { defineCard } from "../define.js";

export default defineCard({
  name: "Patriar's Seal",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Add one mana of any color.\n{1}, {T}: Untap target legendary creature you control.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{T}: Add one mana of any color.",
    },
    {
      cost: { mana: "{1}", tap: true },
      targets: [{ kind: "permanent", whose: "you", filter: { type: "creature", supertype: "legendary" } }],
      effect: { kind: "untap", target: 0 },
      resolve: null,
      text: "{1}, {T}: Untap target legendary creature you control.",
    },
  ],
});
