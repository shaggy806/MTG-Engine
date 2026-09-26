import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

const SCRY_TEXT = "{1}{U}, {T}: Scry 2. Activate only if you control a legendary creature.";
const LEGENDARY = { kind: "controls", filter: { type: "creature", supertype: "legendary" }, atLeast: 1 } as const;

// The legendary creature has to be there already as Rivendell enters; one
// entering alongside it doesn't count (the ruling — rule 614.12).
export default defineCard({
  name: "Rivendell",
  colors: [],
  supertypes: ["legendary"],
  types: ["land"],
  text: `Rivendell enters tapped unless you control a legendary creature.\n{T}: Add {U}.\n${SCRY_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tappedUnless: LEGENDARY },
      text: "Rivendell enters tapped unless you control a legendary creature.",
    },
  ],
  activated: [
    manaTapAbility("U"),
    {
      cost: { mana: "{1}{U}", tap: true },
      condition: LEGENDARY,
      targets: [],
      effect: { kind: "scry", amount: 2 },
      resolve: null,
      text: SCRY_TEXT,
    },
  ],
});
