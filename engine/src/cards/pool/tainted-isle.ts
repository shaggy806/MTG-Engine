import type { ActivatedAbility } from "../../abilities.js";
import type { Color } from "../../mana.js";
import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

// "{T}: Add {U} or {B}" is one printed ability with two outcomes; like a pain
// land it's spelled as one gated ability per colour, which the auto-payer
// reads as two options of one tap (rule 605.1a).
const gated = (c: Color): ActivatedAbility => ({
  cost: { mana: null, tap: true },
  condition: { kind: "controls", filter: { subtype: "Swamp" }, atLeast: 1 },
  targets: [],
  effect: { kind: "add-mana", mana: c, amount: 1 },
  resolve: null,
  text: `{T}: Add {${c}}. Activate only if you control a Swamp.`,
});

export default defineCard({
  name: "Tainted Isle",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{T}: Add {U} or {B}. Activate only if you control a Swamp.",
  activated: [addManaAbility({ mana: "C", text: "{T}: Add {C}." }), gated("U"), gated("B")],
});
