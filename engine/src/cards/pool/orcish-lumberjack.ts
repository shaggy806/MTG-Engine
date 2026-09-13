import { defineCard } from "../define.js";

/** `isManaAbility` requires a self (or no) sacrifice cost — a *filtered*
 * sacrifice (here, "a Forest", chosen among possibly several) needs a real
 * choice the auto-payment scan doesn't make, so this ability uses the stack
 * like an ordinary activated ability rather than resolving instantly as a
 * true mana ability (rule 605.1a). A minor, documented deviation — it can't
 * be tapped for as part of paying another cost, and an opponent gets a
 * response window before it resolves. needed-cards P20. */
export default defineCard({
  name: "Orcish Lumberjack",
  manaCost: "{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Orc"],
  power: 1,
  toughness: 1,
  text: "{T}, Sacrifice a Forest: Add three mana in any combination of {R} and/or {G}.",
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: { filter: { subtype: "Forest" } } },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["R", "G"] }, amount: 3 },
      resolve: null,
      text: "{T}, Sacrifice a Forest: Add three mana in any combination of {R} and/or {G}.",
    },
  ],
});
