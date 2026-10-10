import { defineCard } from "../define.js";
import { crew } from "../helpers.js";

// EDHREC rank 6230. A granted crew 2 is each Vehicle's own ability: it taps
// creatures other than that Vehicle, Kotori included.
const GRANT = "Vehicles you control have crew 2.";
const COMBAT =
  "At the beginning of combat on your turn, target artifact creature you control gains lifelink and vigilance until end of turn.";

export default defineCard({
  name: "Kotori, Pilot Prodigy",
  manaCost: "{1}{W}{U}",
  colors: ["W", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Moonfolk", "Pilot"],
  power: 2,
  toughness: 4,
  text: `${GRANT}\n${COMBAT}`,
  static: [
    {
      affects: { scope: "filter", filter: { subtype: "Vehicle", controlledBy: "you" } },
      grantsActivated: [crew(2)],
      text: GRANT,
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      targets: [{ kind: "permanent", whose: "you", filter: { types: ["artifact", "creature"] } }],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "grant-keyword", target: 0, keyword: "lifelink", duration: "end-of-turn" },
          { kind: "grant-keyword", target: 0, keyword: "vigilance", duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: COMBAT,
    },
  ],
});
