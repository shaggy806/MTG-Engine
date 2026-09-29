import { defineCard } from "../define.js";

const TAPPED_TEXT = "Other tapped creatures you control have deathtouch.";
const UNTAPPED_TEXT = "Other untapped creatures you control have hexproof.";
const UNTAP_TEXT = "{1}, {T}: Untap another target creature or land you control.";

// Both statics apply whether Saryth herself is tapped or not (the ruling).
export default defineCard({
  name: "Saryth, the Viper's Fang",
  manaCost: "{2}{G}{G}",
  colors: ["G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Warlock"],
  power: 3,
  toughness: 4,
  text: `${TAPPED_TEXT}\n${UNTAPPED_TEXT}\n${UNTAP_TEXT}`,
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", controlledBy: "you", tapped: true }, excludeSelf: true },
      grantKeywords: ["deathtouch"],
      text: TAPPED_TEXT,
    },
    {
      affects: { scope: "filter", filter: { type: "creature", controlledBy: "you", tapped: false }, excludeSelf: true },
      grantKeywords: ["hexproof"],
      text: UNTAPPED_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{1}", tap: true },
      targets: [{ kind: "other", of: { kind: "permanent", whose: "you", filter: { typesAnyOf: ["creature", "land"] } } }],
      effect: { kind: "untap", target: 0 },
      resolve: null,
      text: UNTAP_TEXT,
    },
  ],
});
