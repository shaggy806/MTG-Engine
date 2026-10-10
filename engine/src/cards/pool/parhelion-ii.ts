import { defineCard } from "../define.js";
import { crew, crewText } from "../helpers.js";

// EDHREC rank 3225. The Angels enter attacking (rule 508.4): never declared
// as attackers, so nothing "whenever a creature attacks" sees them, and
// their controller picks whom each attacks.
const ANGELS =
  "Whenever Parhelion II attacks, create two 4/4 white Angel creature tokens with flying and vigilance that are attacking.";

export default defineCard({
  name: "Parhelion II",
  manaCost: "{6}{W}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["artifact"],
  subtypes: ["Vehicle"],
  power: 5,
  toughness: 5,
  keywords: ["flying", "first-strike", "vigilance"],
  text: `Flying, first strike, vigilance\n${ANGELS}\n${crewText(4)}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "4/4 Vigilant Angel Token", count: 2, attacking: "choose" },
      resolve: null,
      text: ANGELS,
    },
  ],
  activated: [crew(4, crewText(4))],
});
