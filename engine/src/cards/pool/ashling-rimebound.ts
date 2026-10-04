import type { EffectSpec } from "../../effects.js";
import { defineCard } from "../define.js";

/** The back face of Ashling, Rekindled. "Whenever this creature transforms
 * into Ashling, Rimebound and at the beginning of your first main phase" is
 * one ability with two trigger conditions — written as two triggers with one
 * effect (Brigid, Clachan's Heart's enters-or-transforms shape). The mana is
 * all one color (`any-color` with an amount), and "spells with mana value 4 or
 * greater" counts a spell's chosen {X} (rule 202.3e). */
const MANA_TEXT =
  "Whenever this creature transforms into Ashling, Rimebound and at the beginning of your first main phase, add two mana of any one color. Spend this mana only to cast spells with mana value 4 or greater.";
const TRANSFORM_TEXT = "At the beginning of your first main phase, you may pay {R}. If you do, transform Ashling.";

const MANA: EffectSpec = {
  kind: "add-mana",
  mana: "any-color",
  amount: 2,
  spendOnly: {
    spell: { manaValue: { op: "gte", n: 4 } },
    text: "Spend this mana only to cast spells with mana value 4 or greater.",
  },
};

export default defineCard({
  name: "Ashling, Rimebound",
  art: "https://cards.scryfall.io/art_crop/back/7/d/7d7faefe-9c0d-45b6-8ea4-5fa666762a2c.jpg",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elemental", "Wizard"],
  power: 1,
  toughness: 3,
  text: `${MANA_TEXT}\n${TRANSFORM_TEXT}`,
  triggered: [
    {
      trigger: { on: "transforms", who: "self", intoFront: false },
      targets: [],
      effect: MANA,
      resolve: null,
      text: MANA_TEXT,
    },
    {
      trigger: { on: "step-begins", step: "precombat-main", who: "you" },
      targets: [],
      effect: MANA,
      resolve: null,
      text: MANA_TEXT,
    },
    {
      trigger: { on: "step-begins", step: "precombat-main", who: "you" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Pay {R} to transform Ashling?",
        cost: "{R}",
        effect: { kind: "transform", target: "source" },
      },
      resolve: null,
      text: TRANSFORM_TEXT,
    },
  ],
  faces: ["Ashling, Rekindled", "Ashling, Rimebound"],
  transform: true,
});
