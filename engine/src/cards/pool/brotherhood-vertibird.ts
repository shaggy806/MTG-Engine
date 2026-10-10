import { defineCard } from "../define.js";
import { crew, crewText } from "../helpers.js";

// EDHREC rank 4831. Bronze Guardian's characteristic-defining power (rule
// 604.3), itself among the artifacts.
const CDA_TEXT = "Brotherhood Vertibird's power is equal to the number of artifacts you control.";

export default defineCard({
  name: "Brotherhood Vertibird",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Vehicle"],
  power: 0,
  toughness: 4,
  keywords: ["flying"],
  text: `Flying\n${CDA_TEXT}\nCrew 2 (Tap any number of creatures you control with total power 2 or greater: This Vehicle becomes an artifact creature until end of turn.)`,
  static: [
    {
      affects: { scope: "self" },
      setBasePtFromCount: {
        countOf: { countOf: { type: "artifact", controlledBy: "you" } },
        plusPower: 0,
        plusToughness: 0,
        only: "power",
      },
      text: CDA_TEXT,
    },
  ],
  activated: [crew(2, crewText(2))],
});
