import { defineCard } from "../define.js";
import { myriad } from "../helpers.js";

const MYRIAD_TEXT =
  "Myriad (Whenever this creature attacks, for each opponent other than defending player, you may create a token copy that's tapped and attacking that player or a planeswalker they control. Exile the tokens at end of combat.)";
const COST_TEXT = "Instant and sorcery spells you cast cost {1} less to cast.";
const FLASH_TEXT = "You may cast sorcery spells as though they had flash.";

export default defineCard({
  name: "Wizards of Thay",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 3,
  toughness: 3,
  text: `${MYRIAD_TEXT}\n${COST_TEXT}\n${FLASH_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      costModification: { applies: { typesAnyOf: ["instant", "sorcery"] }, caster: "you", reduceGeneric: 1 },
      text: COST_TEXT,
    },
    {
      affects: { scope: "self" },
      castAsThoughFlash: { type: "sorcery" },
      text: FLASH_TEXT,
    },
  ],
  triggered: [myriad()],
});
