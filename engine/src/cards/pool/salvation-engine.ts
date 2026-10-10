import { defineCard } from "../define.js";
import { crew } from "../helpers.js";

// EDHREC rank 3779. While crewed it's an artifact creature itself, but
// "other" leaves it out.
const ANTHEM = "Other artifact creatures you control get +2/+2.";
const RETURN = "Whenever this Vehicle attacks, return up to one target artifact card from your graveyard to the battlefield.";

export default defineCard({
  name: "Salvation Engine",
  manaCost: "{4}{W}",
  colors: ["W"],
  types: ["artifact"],
  subtypes: ["Vehicle"],
  power: 6,
  toughness: 10,
  text: `${ANTHEM}\n${RETURN}\nCrew 6`,
  static: [
    {
      affects: { scope: "filter", filter: { types: ["artifact", "creature"], controlledBy: "you" }, excludeSelf: true },
      grantPt: [2, 2],
      text: ANTHEM,
    },
  ],
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [{ kind: "optional", of: { kind: "card-in-graveyard", whose: "you", filter: { type: "artifact" } } }],
      effect: { kind: "put-onto-battlefield", target: 0 },
      resolve: null,
      text: RETURN,
    },
  ],
  activated: [crew(6)],
});
