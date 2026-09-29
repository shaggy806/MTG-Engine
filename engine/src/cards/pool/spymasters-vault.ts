import { defineCard } from "../define.js";
import { manaTapAbility } from "../helpers.js";

const CONNIVE_TEXT =
  "{B}, {T}: Target creature you control connives X, where X is the number of creatures that died this turn. " +
  "(Draw X cards, then discard X cards. Put a +1/+1 counter on that creature for each nonland card discarded " +
  "this way.)";

export default defineCard({
  name: "Spymaster's Vault",
  colors: [],
  types: ["land"],
  text: `This land enters tapped unless you control a Swamp.\n{T}: Add {B}.\n${CONNIVE_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "enters-battlefield",
        tappedUnless: { kind: "controls", filter: { subtype: "Swamp" }, atLeast: 1 },
      },
      text: "This land enters tapped unless you control a Swamp.",
    },
  ],
  activated: [
    manaTapAbility("B"),
    {
      cost: { mana: "{B}", tap: true },
      targets: [{ kind: "permanent", whose: "you", filter: { type: "creature" } }],
      effect: { kind: "connive", target: 0, amount: { creaturesDiedThisTurn: true, anyController: true } },
      resolve: null,
      text: CONNIVE_TEXT,
    },
  ],
});
