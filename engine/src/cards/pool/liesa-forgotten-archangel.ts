import { defineCard } from "../define.js";

const RETURN_TEXT =
  "Whenever another nontoken creature you control dies, return that card to its owner's hand at the beginning of the next end step.";
const EXILE_TEXT = "If a creature an opponent controls would die, exile it instead.";

// "That card" rides forward on the delayed trigger, and is found only if it's
// still the card that died, in its owner's graveyard (rule 400.7). The
// exile is the dies-only replacement Vren, the Relentless has.
export default defineCard({
  name: "Liesa, Forgotten Archangel",
  manaCost: "{2}{W}{W}{B}",
  colors: ["W", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 4,
  toughness: 5,
  keywords: ["flying", "lifelink"],
  text: `Flying, lifelink\n${RETURN_TEXT}\n${EXILE_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "would-be-put-into-graveyard",
        instead: "exile",
        from: "battlefield",
        filter: { type: "creature", controlledBy: "opponent" },
      },
      text: EXILE_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "dies", who: "you-control", otherOnly: true, filter: { type: "creature", token: false } },
      targets: [],
      effect: {
        kind: "delayed-trigger",
        at: "next-end-step",
        effect: { kind: "return-to-hand", target: "trigger-object", from: "graveyard" },
        text: "Return that card to its owner's hand.",
      },
      resolve: null,
      text: RETURN_TEXT,
    },
  ],
});
