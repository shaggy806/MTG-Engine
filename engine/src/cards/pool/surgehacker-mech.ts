import { defineCard } from "../define.js";
import { crew } from "../helpers.js";

// EDHREC rank 4707. The Vehicles are counted as the trigger resolves, this
// one included.
const SHOOT =
  "When this Vehicle enters, it deals damage equal to twice the number of Vehicles you control to target creature or planeswalker an opponent controls.";

export default defineCard({
  name: "Surgehacker Mech",
  manaCost: "{4}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Vehicle"],
  power: 5,
  toughness: 5,
  keywords: ["menace"],
  text: `Menace\n${SHOOT}\nCrew 4`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "permanent", whose: "opponent", filter: { typesAnyOf: ["creature", "planeswalker"] } }],
      effect: { kind: "damage", target: 0, amount: { countOf: { subtype: "Vehicle", controlledBy: "you" }, times: 2 } },
      resolve: null,
      text: SHOOT,
    },
  ],
  activated: [crew(4)],
});
