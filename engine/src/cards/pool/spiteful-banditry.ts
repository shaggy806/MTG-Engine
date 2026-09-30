import { defineCard } from "../define.js";

const ENTER_TEXT = "When this enchantment enters, it deals X damage to each creature.";
const TREASURE_TEXT =
  "Whenever one or more creatures your opponents control die, you create a Treasure token. This ability triggers only once each turn.";

// Once each turn makes "one or more" exact: the first death of a batch
// triggers it and the rest can't.
export default defineCard({
  name: "Spiteful Banditry",
  manaCost: "{X}{R}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: `${ENTER_TEXT}\n${TREASURE_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "damage-all", filter: { type: "creature" }, amount: "x" },
      resolve: null,
      text: ENTER_TEXT,
    },
    {
      trigger: { on: "dies", who: "opponent", filter: { type: "creature" } },
      oncePerTurn: true,
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1 },
      resolve: null,
      text: TREASURE_TEXT,
    },
  ],
});
