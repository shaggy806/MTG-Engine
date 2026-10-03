import { defineCard } from "../define.js";

const ENTER_TEXT =
  "When this creature enters, you may sacrifice another creature you control. If you do, create a number of Treasure tokens equal to that creature's power.";
const RETURN_TEXT =
  "{2}{B}, Sacrifice X artifacts: Return target creature card with power X or less from your graveyard to the battlefield. X can't be 0.";

// "That creature's power" is the sacrificed creature's as it last existed on
// the battlefield — the power sacrificed this way, which is 0 when nothing
// was ("if you do"). X is announced with the activation (rule 107.3a), at
// least 1, and fixes what may be targeted — the ability is offered once per X
// with a creature card that small — before the X artifacts are chosen as the
// cost is paid.
export default defineCard({
  name: "Ruthless Technomancer",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Wizard"],
  power: 2,
  toughness: 4,
  text: `${ENTER_TEXT}\n${RETURN_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Sacrifice another creature to create Treasures equal to its power?",
        effect: {
          kind: "sequence",
          effects: [
            { kind: "sacrifice", who: "you", filter: { type: "creature" }, count: 1, exceptSource: true },
            {
              kind: "create-token",
              token: "Treasure Token",
              count: { thisWay: "sacrificed", sumOf: "power" },
            },
          ],
        },
      },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{2}{B}", tap: false, sacrifice: { filter: { type: "artifact" }, count: "x" } },
      minX: 1,
      targets: [
        {
          kind: "card-in-graveyard",
          whose: "you",
          filter: { type: "creature", power: { op: "lte", n: "x" } },
        },
      ],
      effect: { kind: "put-onto-battlefield", target: 0 },
      resolve: null,
      text: RETURN_TEXT,
    },
  ],
});
