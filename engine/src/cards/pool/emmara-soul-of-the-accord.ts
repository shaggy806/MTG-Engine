import { defineCard } from "../define.js";

// The trigger is "becomes tapped" (rule 701.21a), so it fires for tapping to
// attack, to pay a cost, or to convoke — not only for an activated ability.
export default defineCard({
  name: "Emmara, Soul of the Accord",
  manaCost: "{G}{W}",
  colors: ["G", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elf", "Cleric"],
  power: 2,
  toughness: 2,
  text:
    "Whenever Emmara, Soul of the Accord becomes tapped, create a 1/1 white Soldier creature " +
    "token with lifelink.",
  triggered: [
    {
      trigger: { on: "becomes-tapped", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Lifelink Soldier Token", count: 1 },
      resolve: null,
      text:
        "Whenever Emmara, Soul of the Accord becomes tapped, create a 1/1 white Soldier " +
        "creature token with lifelink.",
    },
  ],
});
