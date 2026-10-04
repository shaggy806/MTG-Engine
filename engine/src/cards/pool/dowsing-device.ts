import type { TriggeredAbility } from "../../abilities.js";
import { defineCard } from "../define.js";

// EDHREC rank 5767.
//
// Rulings:
//   [2023-11-10] The value of X for Geode Grotto's last ability is determined only as it resolves.
//     Once that happens, the value of X won't change later in the turn even if the number of
//     artifacts you control changes.

const TEXT =
  "Whenever this artifact or another artifact you control enters, up to one target creature you control gets +1/+0 and gains haste until end of turn. Then transform this artifact if you control four or more artifacts.";

// "This or another artifact" is two triggers, so it fires for itself however
// its types change. The artifact count includes this one.
const TRIGGER: Omit<TriggeredAbility, "trigger"> = {
  targets: [{ kind: "optional", of: "creature-you-control" }],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "modify-pt", target: 0, power: 1, toughness: 0, duration: "end-of-turn" },
      { kind: "grant-keyword", target: 0, keyword: "haste", duration: "end-of-turn" },
      {
        kind: "conditional",
        condition: { kind: "controls", filter: { type: "artifact" }, atLeast: 4 },
        then: { kind: "transform", target: "source" },
      },
    ],
  },
  resolve: null,
  text: TEXT,
};

export default defineCard({
  name: "Dowsing Device",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["artifact"],
  text: TEXT,
  faces: ["Dowsing Device", "Geode Grotto"],
  transform: true,
  triggered: [
    { ...TRIGGER, trigger: { on: "enters-battlefield", who: "self" } },
    {
      ...TRIGGER,
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "artifact" }, otherOnly: true },
    },
  ],
});
