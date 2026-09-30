import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

const BOUNCE_TEXT = "{1}{U}, {T}: Return target Wizard you control to its owner's hand.";

export default defineCard({
  name: "Riptide Laboratory",
  types: ["land"],
  text: `{T}: Add {C}.\n${BOUNCE_TEXT}`,
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: "{1}{U}", tap: true },
      targets: [{ kind: "permanent", whose: "you", filter: { subtype: "Wizard" } }],
      effect: { kind: "return-to-hand", target: 0 },
      resolve: null,
      text: BOUNCE_TEXT,
    },
  ],
});
