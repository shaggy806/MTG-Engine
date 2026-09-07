import { defineCard } from "../define.js";

/**
 * ROADMAP Phase 6b — a static grant of flashback to a graveyard spell. The
 * trigger targets an instant/sorcery in your graveyard (a new
 * `"instant-or-sorcery-in-your-graveyard"` target spec) and the
 * `grant-flashback` effect gives it flashback until end of turn at a cost
 * equal to its mana cost. A "lite" version: the real card also grants nothing
 * if the spell can't be cast, and the trigger's target is auto-picked by the
 * engine for now (`chooseTargets` — same gap as any targeted trigger).
 */
export default defineCard({
  name: "Snapcaster Mage",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 2,
  toughness: 1,
  keywords: ["flash"],
  text: "Flash\nWhen Snapcaster Mage enters the battlefield, target instant or sorcery card in your graveyard gains flashback until end of turn. The flashback cost is equal to its mana cost.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["instant-or-sorcery-in-your-graveyard"],
      effect: { kind: "grant-flashback", target: 0 },
      resolve: null,
      text: "When Snapcaster Mage enters the battlefield, target instant or sorcery card in your graveyard gains flashback until end of turn.",
    },
  ],
});
