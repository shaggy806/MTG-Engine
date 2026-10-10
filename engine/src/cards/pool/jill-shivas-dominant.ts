import { defineCard } from "../define.js";

// EDHREC rank 6056. Dion, Bahamut's Dominant's shape: the transform ability
// is a flicker of the source back face up, a Saga that enters with its first
// lore counter; a copy that isn't double-faced stays in exile (rule 712.14a,
// the ruling).
const ENTER_TEXT = "When Jill enters, return up to one other target nonland permanent to its owner's hand.";
const FLIP_TEXT =
  "{3}{U}{U}, {T}: Exile Jill, then return it to the battlefield transformed under its owner's control. " +
  "Activate only as a sorcery.";

export default defineCard({
  name: "Jill, Shiva's Dominant",
  manaCost: "{2}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Noble", "Warrior"],
  power: 2,
  toughness: 2,
  text: `${ENTER_TEXT}\n${FLIP_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "optional", of: { kind: "other", of: "nonland-permanent" } }],
      effect: { kind: "return-to-hand", target: 0 },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{3}{U}{U}", tap: true },
      sorcerySpeed: true,
      targets: [],
      effect: { kind: "flicker", target: "source", transformed: true },
      resolve: null,
      text: FLIP_TEXT,
    },
  ],
  faces: ["Jill, Shiva's Dominant", "Shiva, Warden of Ice"],
  transform: true,
});
