import { defineCard } from "../define.js";

const TAPPED_TEXT = "Barad-dûr enters tapped unless you control a legendary creature.";
const AMASS_TEXT = "{X}{X}{B}, {T}: Amass Orcs X. Activate only if a creature died this turn.";

export default defineCard({
  name: "Barad-dûr",
  supertypes: ["legendary"],
  types: ["land"],
  text: `${TAPPED_TEXT}\n{T}: Add {B}.\n${AMASS_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "enters-battlefield",
        tappedUnless: { kind: "controls", filter: { type: "creature", supertype: "legendary" }, atLeast: 1 },
      },
      text: TAPPED_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "B", amount: 1 },
      resolve: null,
      text: "{T}: Add {B}.",
    },
    {
      cost: { mana: "{X}{X}{B}", tap: true },
      condition: { kind: "creature-died-this-turn" },
      targets: [],
      effect: { kind: "amass", amount: "x", creatureType: "Orc" },
      resolve: null,
      text: AMASS_TEXT,
    },
  ],
});
