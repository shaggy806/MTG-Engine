import { defineCard } from "../define.js";

// EDHREC rank 1192. "Put into a graveyard from the battlefield" is the `dies`
// event for any permanent (rule 700.4 names it "dies" only for creatures).
const REDUCE = "Enchantment spells you cast cost {1} less to cast.";
const GROW =
  "Whenever an enchantment you control is put into a graveyard from the battlefield, put a +1/+1 counter on this creature.";

export default defineCard({
  name: "Starfield Mystic",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 2,
  toughness: 2,
  text: `${REDUCE}\n${GROW}`,
  static: [
    {
      affects: { scope: "self" },
      costModification: { applies: { type: "enchantment" }, caster: "you", reduceGeneric: 1 },
      text: REDUCE,
    },
  ],
  triggered: [
    {
      trigger: { on: "dies", who: "you-control", filter: { type: "enchantment" } },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: GROW,
    },
  ],
});
