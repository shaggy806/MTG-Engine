import type { EffectSpec } from "../../effects.js";
import { defineCard } from "../define.js";

// #431 in top-commanders.txt — a transforming double-faced card; the back
// face is Brigid, Doun's Mind. "Your first main phase" is the precombat main
// phase.
const KITHKIN_TEXT =
  "Whenever this creature enters or transforms into Brigid, Clachan's Heart, create a 1/1 green and white " +
  "Kithkin creature token.";
const TRANSFORM_TEXT = "At the beginning of your first main phase, you may pay {G}. If you do, transform Brigid.";

const KITHKIN: EffectSpec = { kind: "create-token", token: "Kithkin Token", count: 1 };

export default defineCard({
  name: "Brigid, Clachan's Heart",
  manaCost: "{2}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Kithkin", "Warrior"],
  power: 3,
  toughness: 2,
  text: `${KITHKIN_TEXT}\n${TRANSFORM_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: KITHKIN,
      resolve: null,
      text: KITHKIN_TEXT,
    },
    {
      trigger: { on: "transforms", who: "self", intoFront: true },
      targets: [],
      effect: KITHKIN,
      resolve: null,
      text: KITHKIN_TEXT,
    },
    {
      trigger: { on: "step-begins", step: "precombat-main", who: "you" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Pay {G} to transform Brigid?",
        cost: "{G}",
        effect: { kind: "transform", target: "source" },
      },
      resolve: null,
      text: TRANSFORM_TEXT,
    },
  ],
  faces: ["Brigid, Clachan's Heart", "Brigid, Doun's Mind"],
  transform: true,
});
