import { defineCard } from "../define.js";

// EDHREC rank 4956.
//
// Rulings:
//   [2004-10-04] It determines the land's controller at the time the ability resolves. If the land
//     leaves the battlefield before the ability resolves, the land's last controller before it
//     left is used.
//   [2004-10-04] This triggers on any land entering. This includes playing a land or putting a
//     land onto the battlefield using a spell or ability.
//
// Zo-Zu the Punisher's shape: "that land's controller" is `trigger-controller`.

export default defineCard({
  name: "Ankh of Mishra",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: "Whenever a land enters, this artifact deals 2 damage to that land's controller.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "any", filter: { type: "land" } },
      targets: [],
      effect: { kind: "damage", amount: 2, who: "trigger-controller" },
      resolve: null,
      text: "Whenever a land enters, this artifact deals 2 damage to that land's controller.",
    },
  ],
});
