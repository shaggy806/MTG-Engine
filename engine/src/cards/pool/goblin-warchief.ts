import { defineCard } from "../define.js";

const COST_TEXT = "Goblin spells you cast cost {1} less to cast.";
const HASTE_TEXT = "Goblins you control have haste.";

export default defineCard({
  name: "Goblin Warchief",
  manaCost: "{1}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Warrior"],
  power: 2,
  toughness: 2,
  text: `${COST_TEXT}\n${HASTE_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      costModification: { applies: { subtype: "Goblin" }, caster: "you", reduceGeneric: 1 },
      text: COST_TEXT,
    },
    {
      affects: { scope: "filter", filter: { type: "creature", subtype: "Goblin", controlledBy: "you" } },
      grantKeywords: ["haste"],
      text: HASTE_TEXT,
    },
  ],
});
