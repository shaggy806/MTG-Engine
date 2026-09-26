import { defineCard } from "../define.js";

// #213 in top-commanders.txt.
//
// The token's exceptions are part of its copiable values (rule 707.9b): a 1/1
// red Balloon with flying and haste besides what the creature is, under every
// other effect, and copied along by anything that copies the token.
const COPY_TEXT =
  "{1}, {T}: Create a token that's a copy of another target creature you control, except it's a 1/1 red Balloon " +
  "creature in addition to its other colors and types and it has flying and haste. Sacrifice it at the beginning " +
  "of the next end step. Activate only as a sorcery.";

export default defineCard({
  name: "The Jolly Balloon Man",
  manaCost: "{1}{R}{W}",
  colors: ["R", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Clown"],
  power: 1,
  toughness: 4,
  keywords: ["haste"],
  text: `Haste\n${COPY_TEXT}`,
  activated: [
    {
      cost: { mana: "{1}", tap: true },
      sorcerySpeed: true,
      targets: [{ kind: "other", of: "creature-you-control" }],
      effect: {
        kind: "create-token-copy",
        of: 0,
        count: 1,
        who: "you",
        sacrificeAtEndStep: true,
        exceptions: {
          basePt: [1, 1],
          addColors: ["R"],
          addTypes: ["creature"],
          addSubtypes: ["Balloon"],
          keywords: ["flying", "haste"],
        },
      },
      resolve: null,
      text: COPY_TEXT,
    },
  ],
});
