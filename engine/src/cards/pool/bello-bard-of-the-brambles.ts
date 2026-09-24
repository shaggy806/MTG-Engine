import { defineCard } from "../define.js";

// One static spanning four layers: the creature type and Elemental subtype
// (4), indestructible, haste and the granted draw trigger (6), and the 4/4
// base (7b). Its reach is fixed in layer 4 (rule 613.6), so the later parts
// go to exactly the permanents it animated. "During your turn" is the
// static's condition: on an opponent's turn none of it applies.
export default defineCard({
  name: "Bello, Bard of the Brambles",
  manaCost: "{1}{R}{G}",
  colors: ["R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Raccoon", "Bard"],
  power: 3,
  toughness: 3,
  text:
    "During your turn, each non-Equipment artifact and non-Aura enchantment you control with mana value 4 or greater is a 4/4 Elemental creature in addition to its other types and has indestructible, haste, and \"Whenever this creature deals combat damage to a player, draw a card.\"",
  static: [
    {
      affects: {
        scope: "filter",
        filter: {
          controlledBy: "you",
          manaValue: { op: "gte", n: 4 },
          anyOf: [
            { type: "artifact", notSubtypes: ["Equipment"] },
            { type: "enchantment", notSubtypes: ["Aura"] },
          ],
        },
      },
      condition: { kind: "your-turn" },
      addTypes: ["creature"],
      addSubtypes: ["Elemental"],
      setBasePt: { power: 4, toughness: 4 },
      grantKeywords: ["indestructible", "haste"],
      grantsTriggered: [
        {
          trigger: { on: "deals-combat-damage-to-player", who: "self" },
          targets: [],
          effect: { kind: "draw", amount: 1 },
          resolve: null,
          text: "Whenever this creature deals combat damage to a player, draw a card.",
        },
      ],
      text:
        "During your turn, each non-Equipment artifact and non-Aura enchantment you control with mana value 4 or greater is a 4/4 Elemental creature in addition to its other types and has indestructible, haste, and \"Whenever this creature deals combat damage to a player, draw a card.\"",
    },
  ],
});
