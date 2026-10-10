import { defineCard } from "../define.js";
import { crew, crewText } from "../helpers.js";
import type { TriggeredAbility } from "../../abilities.js";

// EDHREC rank 2711. "Enters or attacks" is two triggers. Its enters
// trigger fires whether or not it's a creature then.
const SHOOT = "Whenever Skysovereign enters or attacks, it deals 3 damage to target creature or planeswalker an opponent controls.";

const shoot = (on: "enters-battlefield" | "attacks"): TriggeredAbility => ({
  trigger: { on, who: "self" },
  targets: [{ kind: "permanent", whose: "opponent", filter: { typesAnyOf: ["creature", "planeswalker"] } }],
  effect: { kind: "damage", amount: 3, target: 0 },
  resolve: null,
  text: SHOOT,
});

export default defineCard({
  name: "Skysovereign, Consul Flagship",
  manaCost: "{5}",
  colors: [],
  supertypes: ["legendary"],
  types: ["artifact"],
  subtypes: ["Vehicle"],
  power: 6,
  toughness: 5,
  keywords: ["flying"],
  text: `Flying\n${SHOOT}\n${crewText(3)}`,
  triggered: [shoot("enters-battlefield"), shoot("attacks")],
  activated: [crew(3, crewText(3))],
});
