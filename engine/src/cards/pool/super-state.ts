import { defineCard } from "../define.js";

const STATIC_TEXT =
  "Enchanted creature has base power and toughness 9/9 and has flying, first strike, trample, and haste.";
const DAMAGE_TEXT =
  "Whenever enchanted creature deals combat damage to an opponent, it deals that much damage to each other opponent.";

// "Each other opponent" is every opponent but the one it dealt damage to;
// the creature deals it, as it last existed if it has left.
export default defineCard({
  name: "Super State",
  manaCost: "{7}",
  colors: [],
  supertypes: ["legendary"],
  types: ["enchantment"],
  subtypes: ["Aura"],
  text: `Enchant creature you control\n${STATIC_TEXT}\n${DAMAGE_TEXT}`,
  targets: ["creature-you-control"],
  static: [
    {
      affects: { scope: "attached" },
      setBasePt: { power: 9, toughness: 9 },
      grantKeywords: ["flying", "first-strike", "trample", "haste"],
      text: STATIC_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "deals-damage", who: "attached", to: "opponent", combat: true },
      targets: [],
      effect: {
        kind: "damage",
        amount: { triggerValue: true },
        who: "each-other-opponent",
        from: "trigger-object",
      },
      resolve: null,
      text: DAMAGE_TEXT,
    },
  ],
});
