import type { ActivatedAbility } from "../../abilities.js";
import { defineCard } from "../define.js";

// "Two mana of any one color" is both of one colour, chosen as it's made.
const TREASURE_TEXT = 'Treasures you control have "{T}, Sacrifice this artifact: Add two mana of any one color."';
const TRIGGER_TEXT = "Whenever this creature attacks or becomes the target of a spell, create a Treasure token.";

const TWO_OF_ONE: ActivatedAbility = {
  cost: { mana: null, tap: true, sacrifice: "self" },
  targets: [],
  effect: { kind: "add-mana", mana: { oneOf: ["W", "U", "B", "R", "G"], same: true }, amount: 2 },
  resolve: null,
  text: "{T}, Sacrifice this artifact: Add two mana of any one color.",
};

export default defineCard({
  name: "Goldspan Dragon",
  manaCost: "{3}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 4,
  toughness: 4,
  keywords: ["flying", "haste"],
  text: `Flying, haste\n${TRIGGER_TEXT}\n${TREASURE_TEXT}`,
  static: [
    {
      affects: { scope: "filter", filter: { subtype: "Treasure", controlledBy: "you" } },
      grantsActivated: [TWO_OF_ONE],
      text: TREASURE_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1 },
      resolve: null,
      text: TRIGGER_TEXT,
    },
    {
      trigger: { on: "becomes-target", who: "self", spellOnly: true },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1 },
      resolve: null,
      text: TRIGGER_TEXT,
    },
  ],
});
