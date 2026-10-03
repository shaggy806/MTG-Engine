import { defineCard } from "../define.js";

const HASTE_TEXT = "Creatures you control have haste.";
const GOLEM_TEXT =
  "{2}{R}, {T}, Sacrifice a land: Create a 3/3 colorless Golem enchantment artifact creature token.";

export default defineCard({
  name: "Hammer of Purphoros",
  manaCost: "{1}{R}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["enchantment", "artifact"],
  text: `${HASTE_TEXT}\n${GOLEM_TEXT}`,
  static: [
    {
      affects: { scope: "creatures-you-control" },
      grantKeywords: ["haste"],
      text: HASTE_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{2}{R}", tap: true, sacrifice: { filter: { type: "land" } } },
      targets: [],
      effect: { kind: "create-token", token: "Golem Token (Enchantment Artifact)", count: 1 },
      resolve: null,
      text: GOLEM_TEXT,
    },
  ],
});
