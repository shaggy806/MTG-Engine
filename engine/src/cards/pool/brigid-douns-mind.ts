import { defineCard } from "../define.js";

/** The back face of Brigid, Clachan's Heart. "X {G} or X {W}" is all of one
 * of them, never a mix (`same`); X counts the creatures you control other
 * than Brigid, as the ability is activated or a payment is planned. */
const MANA_TEXT = "{T}: Add X {G} or X {W}, where X is the number of other creatures you control.";
const TRANSFORM_TEXT = "At the beginning of your first main phase, you may pay {W}. If you do, transform Brigid.";

export default defineCard({
  name: "Brigid, Doun's Mind",
  // A back face has no Scryfall card of its own name — point at its art.
  art: "https://cards.scryfall.io/art_crop/back/c/b/cb7d5bbb-4f68-4e38-8bb0-a95af21b24c8.jpg",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Kithkin", "Soldier"],
  power: 3,
  toughness: 2,
  text: `${MANA_TEXT}\n${TRANSFORM_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: { oneOf: ["G", "W"], same: true },
        amount: { countOf: { type: "creature", controlledBy: "you" }, excludeSelf: true },
      },
      resolve: null,
      text: MANA_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "precombat-main", who: "you" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Pay {W} to transform Brigid?",
        cost: "{W}",
        effect: { kind: "transform", target: "source" },
      },
      resolve: null,
      text: TRANSFORM_TEXT,
    },
  ],
  faces: ["Brigid, Clachan's Heart", "Brigid, Doun's Mind"],
  transform: true,
});
