import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

const ENTER_TEXT = "When this enchantment enters, create a Food token.";
const GRANT_TEXT = 'Foods you control have "{T}: Add {G}."';
const SAC_TEXT =
  "{5}{G}{G}, Sacrifice this enchantment: Creatures you control get +X/+X until end of turn, where X is the number of Foods you control. Activate only as a sorcery.";

const FOODS = { subtype: "Food", controlledBy: "you" } as const;

export default defineCard({
  name: "Night of the Sweets' Revenge",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: `${ENTER_TEXT} (It's an artifact with "{2}, {T}, Sacrifice this token: You gain 3 life.")\n${GRANT_TEXT}\n${SAC_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Food Token", count: 1 },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "filter", filter: FOODS },
      grantsActivated: [addManaAbility({ mana: "G", text: "{T}: Add {G}." })],
      text: GRANT_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{5}{G}{G}", tap: false, sacrifice: "self" },
      sorcerySpeed: true,
      targets: [],
      effect: {
        kind: "modify-pt-all",
        filter: { type: "creature", controlledBy: "you" },
        power: { countOf: FOODS },
        toughness: { countOf: FOODS },
        duration: "end-of-turn",
      },
      resolve: null,
      text: SAC_TEXT,
    },
  ],
});
