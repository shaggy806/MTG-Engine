import { defineCard } from "../define.js";

// EDHREC rank 6597.

const ENTER_TEXT = "When Tombstone enters, return target Villain card from your graveyard to your hand.";
const COST_TEXT = "Villain spells you cast cost {1} less to cast.";

export default defineCard({
  name: "Tombstone, Career Criminal",
  manaCost: "{2}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Villain"],
  power: 2,
  toughness: 2,
  text: `${ENTER_TEXT}\n${COST_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "card-in-graveyard", whose: "you", filter: { subtype: "Villain" } }],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      // Dragonlord's Servant's shape.
      costModification: { applies: { subtype: "Villain", controlledBy: "you" }, reduceGeneric: 1 },
      text: COST_TEXT,
    },
  ],
});
