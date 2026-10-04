import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

// EDHREC rank 4639.
//
// Rulings:
//   [2025-06-06] If the equipped creature is dealt lethal damage at the same time that you gain
//     life, it will die before Excalibur II's first ability would resolve.
//   [2025-06-06] Each creature with lifelink dealing combat damage causes a separate life-gaining
//     event. For example, if two creatures you control with lifelink deal combat damage at the
//     same time, Excalibur II's ability will trigger twice. However, if a single creature you
//     control with lifelink deals combat damage to multiple creatures, players, planeswalkers,
//     and/or battles at the same time (perhaps because it has trample or was blocked by more than
//     one creature), the ability will trigger only once.
//   [2025-06-06] If you gain an amount of life "for each" of something or "equal to the number" of
//     something, that life is gained as one event and Excalibur II's first ability triggers only
//     once.
//   [2025-06-06] Excalibur II's first ability triggers just once for each life-gaining event,
//     whether it's 1 life from Al Bhed Salvagers or 3 life from Balamb T-Rexaur.
//   [2025-06-06] In a Two-Headed Giant game, life gained by your teammate won't cause Excalibur
//     II's first ability to trigger, even though it caused your team's life total to increase.
//
// Door of Destinies' `countersOnSource` bonus, on the equipped creature.
// The trigger fires once per life-gain event (the rulings).

const CHARGE_TEXT = "Whenever you gain life, put a charge counter on Excalibur II.";
const PT_TEXT = "Equipped creature gets +1/+1 for each charge counter on Excalibur II.";

export default defineCard({
  name: "Excalibur II",
  manaCost: "{1}",
  colors: [],
  supertypes: ["legendary"],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text: `${CHARGE_TEXT}\n${PT_TEXT}\nEquip {3}`,
  static: [
    {
      affects: { scope: "attached" },
      grantPtPerCount: { countersOnSource: "charge", pt: [1, 1] },
      text: PT_TEXT,
    },
  ],
  activated: [equip("{3}")],
  triggered: [
    {
      trigger: { on: "gains-life", who: "you" },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "charge", amount: 1 },
      resolve: null,
      text: CHARGE_TEXT,
    },
  ],
});
