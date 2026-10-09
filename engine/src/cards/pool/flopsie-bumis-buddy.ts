import { defineCard } from "../define.js";

// EDHREC rank 6528. The restriction is Challenger Troll's.
const ENTER = "When Flopsie enters, put a +1/+1 counter on each creature you control.";
const BLOCK = "Each creature you control with power 4 or greater can't be blocked by more than one creature.";

export default defineCard({
  name: "Flopsie, Bumi's Buddy",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Ape", "Goat"],
  power: 4,
  toughness: 4,
  text: `${ENTER}\n${BLOCK}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "add-counter-all", filter: { type: "creature", controlledBy: "you" }, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: ENTER,
    },
  ],
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", controlledBy: "you", power: { op: "gte", n: 4 } } },
      blockedByAtMostOne: true,
      text: BLOCK,
    },
  ],
});
