import { defineCard } from "../define.js";

// EDHREC rank 4439.
// The copy's exceptions are The Jolly Balloon Man's shape: base P/T 1/1, and
// creature and Soldier added to whatever it copies (rule 707.9b — copiable
// values, so another copy of the token is a 1/1 Soldier too).
//
// Rulings:
//   [2022-10-14] If the copied permanent is a token, the token created with Urza copies the
//     original characteristics of that token as stated by the effect that created that token, with
//     the listed exceptions.
//   [2022-10-14] The token is a Soldier creature in addition to its other types. Its base power
//     and toughness is 1/1. These are the copiable values of the token's characteristics that
//     other effects may copy.
//   [2022-10-14] If the copied permanent has {X} in its mana cost, X is considered to be 0.
//   [2022-10-14] For Urza, Prince of Kroog's activated ability, the token copies exactly what was
//     printed on the original permanent, with the listed exceptions, and nothing else (unless that
//     permanent is copying something else or is a token; see below). It doesn't copy whether that
//     permanent is tapped or untapped, whether it has any counters on it or Auras and Equipment
//     attached to it, or any non-copy effects that have changed its power, toughness, types,
//     color, or so on.
//   [2022-10-14] If the copied permanent is copying something else, then the token enters the
//     battlefield as whatever that permanent copied, with the listed exceptions.

const ANTHEM_TEXT = "Artifact creatures you control get +2/+2.";
const COPY_TEXT =
  "{6}: Create a token that's a copy of target artifact you control, except it's a 1/1 Soldier creature in addition to its other types.";

export default defineCard({
  name: "Urza, Prince of Kroog",
  manaCost: "{2}{W}{U}",
  colors: ["W", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Artificer"],
  power: 2,
  toughness: 3,
  text: `${ANTHEM_TEXT}\n${COPY_TEXT}`,
  static: [
    {
      affects: { scope: "filter", filter: { types: ["artifact", "creature"], controlledBy: "you" } },
      grantPt: [2, 2],
      text: ANTHEM_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{6}", tap: false },
      targets: [{ kind: "permanent", filter: { type: "artifact", controlledBy: "you" } }],
      effect: {
        kind: "create-token-copy",
        of: 0,
        count: 1,
        who: "you",
        exceptions: {
          basePt: [1, 1],
          addTypes: ["creature"],
          addSubtypes: ["Soldier"],
        },
      },
      resolve: null,
      text: COPY_TEXT,
    },
  ],
});
