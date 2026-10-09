import { defineCard } from "../define.js";

// EDHREC rank 4149. Transforms into Bahamut, Warden of Light.
//
// Rulings:
//   [2025-06-06] Dion's first ability will still give it flying during your turn even if Dion
//     somehow isn't a Knight.
//   [2025-06-06] If you are instructed to put a card that isn't a double-faced card onto the
//     battlefield transformed, it will not enter at all. In that case, it stays in the zone it was
//     previously in.
//
// - Dragonfire Dive is two statics over one line: Dion itself, Knight or not
//   (the ruling), and the other Knights you control.
// - The transform ability is Clive, Ifrit's Dominant's: a flicker of the
//   source back face up, a Saga that enters with its first lore counter; a
//   copy that isn't double-faced stays in exile (rule 712.14a).
const DIVE_TEXT = "Dragonfire Dive — During your turn, Dion and other Knights you control have flying.";
const ENTER_TEXT = "When Dion enters, create a 2/2 white Knight creature token.";
const FLIP_TEXT =
  "{4}{W}{W}, {T}: Exile Dion, then return it to the battlefield transformed under its owner's control. " +
  "Activate only as a sorcery.";

export default defineCard({
  name: "Dion, Bahamut's Dominant",
  manaCost: "{3}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Noble", "Knight"],
  power: 3,
  toughness: 3,
  text: `${DIVE_TEXT}\n${ENTER_TEXT}\n${FLIP_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      condition: { kind: "your-turn" },
      grantKeywords: ["flying"],
      text: DIVE_TEXT,
    },
    {
      affects: { scope: "creatures-you-control", subtype: "Knight", excludeSelf: true },
      condition: { kind: "your-turn" },
      grantKeywords: ["flying"],
      text: DIVE_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "2/2 White Knight Token", count: 1 },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{4}{W}{W}", tap: true },
      sorcerySpeed: true,
      targets: [],
      effect: { kind: "flicker", target: "source", transformed: true },
      resolve: null,
      text: FLIP_TEXT,
    },
  ],
  faces: ["Dion, Bahamut's Dominant", "Bahamut, Warden of Light"],
  transform: true,
});
