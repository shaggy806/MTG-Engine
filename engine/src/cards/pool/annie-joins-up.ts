import { defineCard } from "../define.js";

const ETB_TEXT =
  "When Annie Joins Up enters, it deals 5 damage to target creature or planeswalker an opponent controls.";
const DOUBLE_TEXT =
  "If a triggered ability of a legendary creature you control triggers, that ability triggers an additional time.";

// The additional instance chooses its own modes and targets (the ruling),
// as any trigger does; replacement effects and "as this enters" abilities
// aren't triggers and are left alone.
export default defineCard({
  name: "Annie Joins Up",
  manaCost: "{1}{R}{G}{W}",
  colors: ["R", "G", "W"],
  supertypes: ["legendary"],
  types: ["enchantment"],
  text: `${ETB_TEXT}\n${DOUBLE_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "permanent", whose: "opponent", filter: { typesAnyOf: ["creature", "planeswalker"] } }],
      effect: { kind: "damage", amount: 5, target: 0 },
      resolve: null,
      text: ETB_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      doubleTriggersOf: { filter: { type: "creature", supertype: "legendary", controlledBy: "you" } },
      text: DOUBLE_TEXT,
    },
  ],
});
