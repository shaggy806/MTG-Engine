import { addManaAbility } from "../helpers.js";
import { defineCard } from "../define.js";

// EDHREC rank 4775.
// Makes Eldrazi Spawn → use "Eldrazi Spawn Token".
//
// Rulings:
//   [2024-06-07] In the rare case where Path of Annihilation is an Eldrazi, it will grant itself
//     the ability "{T}: Add one mana of any color."
//   [2024-06-07] Path of Annihilation's last ability resolves before the spell that causes it to
//     trigger. The ability will resolve even if that spell is countered or otherwise leaves the
//     stack.
//   [2024-06-07] Devoid works in all zones, not just on the battlefield.

const ENTER_TEXT =
  'When this enchantment enters, create two 0/1 colorless Eldrazi Spawn creature tokens with "Sacrifice this token: Add {C}."';
const GRANT_TEXT = 'Eldrazi you control have "{T}: Add one mana of any color."';
const LIFE_TEXT = "Whenever you cast a creature spell with mana value 7 or greater, you gain 4 life.";

const anyColor = () => addManaAbility({ mana: "any-color", text: "{T}: Add one mana of any color." });

export default defineCard({
  name: "Path of Annihilation",
  manaCost: "{3}{G}",
  // Devoid: colorless in every zone (its color identity is still green).
  colors: [],
  types: ["enchantment"],
  text: `Devoid (This card has no color.)\n${ENTER_TEXT}\n${GRANT_TEXT}\n${LIFE_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Eldrazi Spawn Token", count: 2 },
      resolve: null,
      text: ENTER_TEXT,
    },
    {
      trigger: { on: "cast-spell", who: "you", filter: { type: "creature", manaValue: { op: "gte", n: 7 } } },
      targets: [],
      effect: { kind: "gain-life", amount: 4 },
      resolve: null,
      text: LIFE_TEXT,
    },
  ],
  static: [
    {
      // Every Eldrazi permanent you control, whatever its card types — this
      // enchantment too, were it ever an Eldrazi (the ruling).
      affects: { scope: "filter", filter: { subtype: "Eldrazi", controlledBy: "you" } },
      grantsActivated: [anyColor()],
      text: GRANT_TEXT,
    },
  ],
});
