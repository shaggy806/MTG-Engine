import { defineCard } from "../define.js";

const ENTER_TEXT = "When Honest Rutstein enters, return target creature card from your graveyard to your hand.";
const COST_TEXT = "Creature spells you cast cost {1} less to cast.";

export default defineCard({
  name: "Honest Rutstein",
  manaCost: "{1}{B}{G}",
  colors: ["B", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Warlock"],
  power: 3,
  toughness: 2,
  text: `${ENTER_TEXT}\n${COST_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      costModification: { applies: { type: "creature" }, caster: "you", reduceGeneric: 1 },
      text: COST_TEXT,
    },
  ],
});
