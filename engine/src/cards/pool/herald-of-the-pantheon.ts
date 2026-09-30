import { defineCard } from "../define.js";

const COST_TEXT = "Enchantment spells you cast cost {1} less to cast.";
const GAIN_TEXT = "Whenever you cast an enchantment spell, you gain 1 life.";

export default defineCard({
  name: "Herald of the Pantheon",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Centaur", "Shaman"],
  power: 2,
  toughness: 2,
  text: `${COST_TEXT}\n${GAIN_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      costModification: { applies: { type: "enchantment" }, caster: "you", reduceGeneric: 1 },
      text: COST_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { type: "enchantment" } },
      targets: [],
      effect: { kind: "gain-life", amount: 1 },
      resolve: null,
      text: GAIN_TEXT,
    },
  ],
});
