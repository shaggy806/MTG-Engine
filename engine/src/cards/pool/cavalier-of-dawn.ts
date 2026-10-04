import { defineCard } from "../define.js";

// EDHREC rank 5669.
//
// Rulings:
//   [2025-02-07] You may put this creature's enters ability onto the stack without choosing any
//     target. It will resolve with no effect. However, if you do choose a target and the target
//     permanent is an illegal target by the time that ability tries to resolve, the ability won't
//     resolve. No player will create a Golem token. If the target is legal but not destroyed (most
//     likely because it has indestructible), its controller will create a Golem token.
//
// `target-chosen` gives the no-target case its "no effect" (an empty
// `target-controller` would otherwise default to you); a chosen target that
// survives the destroy still gets its controller a Golem.
const ENTER_TEXT =
  "When this creature enters, destroy up to one target nonland permanent. Its controller creates a 3/3 colorless Golem artifact creature token.";
const DIES_TEXT = "When this creature dies, return target artifact or enchantment card from your graveyard to your hand.";

export default defineCard({
  name: "Cavalier of Dawn",
  manaCost: "{2}{W}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Elemental", "Knight"],
  power: 4,
  toughness: 6,
  keywords: ["vigilance"],
  text: `Vigilance\n${ENTER_TEXT}\n${DIES_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "optional", of: "nonland-permanent" }],
      effect: {
        kind: "conditional",
        condition: { kind: "target-chosen", index: 0 },
        then: {
          kind: "sequence",
          effects: [
            { kind: "destroy", target: 0 },
            { kind: "create-token", token: "Golem Token", count: 1, who: "target-controller" },
          ],
        },
      },
      resolve: null,
      text: ENTER_TEXT,
    },
    {
      trigger: { on: "dies", who: "self" },
      targets: [
        {
          kind: "card-in-graveyard",
          whose: "you",
          filter: { typesAnyOf: ["artifact", "enchantment"] },
        },
      ],
      effect: { kind: "return-to-hand", target: 0, from: "graveyard" },
      resolve: null,
      text: DIES_TEXT,
    },
  ],
});
