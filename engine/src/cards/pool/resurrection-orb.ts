import { defineCard } from "../define.js";
import { equip } from "../helpers.js";

const DIES_TEXT =
  "Whenever equipped creature dies, return that card to the battlefield under its owner's control at the beginning of the next end step.";

// The return is a delayed trigger, so it happens even if Resurrection Orb
// is gone by then (the ruling); a card that has left the graveyard since is
// a new object and stays where it is (rule 400.7).
export default defineCard({
  name: "Resurrection Orb",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  subtypes: ["Equipment"],
  text:
    "Equipped creature has lifelink.\n" +
    `${DIES_TEXT}\nEquip {4} ({4}: Attach to target creature you control. Equip only as a sorcery.)`,
  static: [{ affects: { scope: "attached" }, grantKeywords: ["lifelink"], text: "Equipped creature has lifelink." }],
  triggered: [
    {
      trigger: { on: "dies", who: "attached" },
      targets: [],
      effect: {
        kind: "delayed-trigger",
        at: "next-end-step",
        effect: { kind: "put-onto-battlefield", target: "trigger-object" },
        text: "Return that card to the battlefield under its owner's control.",
      },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
  activated: [equip("{4}")],
});
