import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

const TAPPED_TEXT = "This land enters tapped unless you control a basic land.";
const EARTHBEND_TEXT =
  "{2}{G}, {T}: Earthbend 2. Activate only as a sorcery. (Target land you control becomes a 0/0 creature with haste that's still a land. Put two +1/+1 counters on it. When it dies or is exiled, return it to the battlefield tapped.)";

export default defineCard({
  name: "Ba Sing Se",
  types: ["land"],
  text: `${TAPPED_TEXT}\n{T}: Add {G}.\n${EARTHBEND_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "enters-battlefield",
        tappedUnless: { kind: "controls", filter: { supertype: "basic", type: "land" }, atLeast: 1 },
      },
      text: TAPPED_TEXT,
    },
  ],
  activated: [
    manaTapAbility("G"),
    {
      cost: { mana: "{2}{G}", tap: true },
      sorcerySpeed: true,
      targets: ["land-you-control"],
      effect: { kind: "earthbend", target: 0, amount: 2 },
      resolve: null,
      text: EARTHBEND_TEXT,
    },
  ],
});
