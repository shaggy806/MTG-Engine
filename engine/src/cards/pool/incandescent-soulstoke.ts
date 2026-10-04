import { defineCard } from "../define.js";

// EDHREC rank 6077.

const LORD_TEXT = "Other Elemental creatures you control get +1/+1.";
const SNEAK_TEXT =
  "{1}{R}, {T}: You may put an Elemental creature card from your hand onto the battlefield. That creature gains haste until end of turn. Sacrifice it at the beginning of the next end step.";

// Sneak Attack's shape, limited to Elementals.
export default defineCard({
  name: "Incandescent Soulstoke",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Elemental", "Shaman"],
  power: 2,
  toughness: 2,
  text: `${LORD_TEXT}\n${SNEAK_TEXT}`,
  activated: [
    {
      cost: { mana: "{1}{R}", tap: true },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "hand",
        min: 0,
        max: 1,
        destination: "battlefield",
        leftover: "stay",
        filter: { type: "creature", subtype: "Elemental" },
        then: {
          kind: "sequence",
          effects: [
            { kind: "grant-keyword", target: 0, keyword: "haste", duration: "end-of-turn" },
            {
              kind: "delayed-trigger",
              at: "next-end-step",
              effect: { kind: "sacrifice-target", target: 0 },
              text: "Sacrifice the creature Incandescent Soulstoke put onto the battlefield.",
            },
          ],
        },
      },
      resolve: null,
      text: SNEAK_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true, subtype: "Elemental" },
      grantPt: [1, 1],
      text: LORD_TEXT,
    },
  ],
});
