import { defineCard } from "../define.js";
import { crew } from "../helpers.js";
import type { TriggeredAbility } from "../../abilities.js";

// EDHREC rank 4161. Its power is a characteristic-defining ability (rule
// 604.3) — Bronze Guardian's shape — and matters once it's a creature.
// "Enters or attacks" is two triggers (Primeval Herald's).
const CDA_TEXT = "This Vehicle's power is equal to the number of lands you control.";
const RAMP =
  "Whenever this Vehicle enters or attacks, you may search your library for a basic land card, put it onto the battlefield tapped, then shuffle.";

const ramp = (on: "enters-battlefield" | "attacks"): TriggeredAbility => ({
  trigger: { on, who: "self" },
  targets: [],
  effect: {
    kind: "may",
    prompt: "Search your library for a basic land card?",
    effect: {
      kind: "search-library",
      filter: { supertype: "basic", type: "land" },
      destination: "battlefield",
      min: 0,
      max: 1,
      enterTapped: true,
    },
  },
  resolve: null,
  text: RAMP,
});

export default defineCard({
  name: "Lumbering Worldwagon",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["artifact"],
  subtypes: ["Vehicle"],
  power: 0,
  toughness: 4,
  text: `${CDA_TEXT}\n${RAMP}\nCrew 4`,
  static: [
    {
      affects: { scope: "self" },
      setBasePtFromCount: {
        countOf: { countOf: { type: "land", controlledBy: "you" } },
        plusPower: 0,
        plusToughness: 0,
        only: "power",
      },
      text: CDA_TEXT,
    },
  ],
  triggered: [ramp("enters-battlefield"), ramp("attacks")],
  activated: [crew(4)],
});
