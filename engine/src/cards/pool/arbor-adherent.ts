import { defineCard } from "../define.js";

const BIG_TEXT = "{T}: Add X mana of any one color, where X is the greatest toughness among other creatures you control.";

export default defineCard({
  name: "Arbor Adherent",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Dog", "Druid"],
  power: 2,
  toughness: 4,
  text: `{T}: Add one mana of any color.\n${BIG_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{T}: Add one mana of any color.",
    },
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "any-color",
        amount: { aggregate: "max", of: "toughness", filter: { type: "creature", controlledBy: "you" }, excludeSelf: true },
      },
      resolve: null,
      text: BIG_TEXT,
    },
  ],
});
