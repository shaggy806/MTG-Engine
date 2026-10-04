import { defineCard } from "../define.js";
import { CHOSEN_CREATURE_TYPE } from "../helpers.js";

// The type is chosen as the trigger resolves, and the permanents of that type
// are fixed then (rule 611.2c). "Other permanents", not only creatures.
const OTHERS = { controlledBy: "you", subtype: CHOSEN_CREATURE_TYPE } as const;

// EDHREC rank 3995.
//
// Rulings:
//   [2025-11-17] You can tap any untapped creature you control to convoke a spell, even one you
//     haven't controlled continuously since the beginning of your most recent turn.
//   [2025-11-17] If a creature you control has a mana ability with {T} in the cost, activating
//     that ability while casting a spell with convoke will result in the creature being tapped
//     before you pay the spell's costs. You won't be able to tap it again for convoke. Similarly,
//     if you sacrifice a creature to activate a mana ability while casting a spell with convoke,
//     that creature won't be on the battlefield when you pay the spell's costs, so you won't be
//     able to tap it for convoke.
//   [2025-11-17] When calculating a spell's total cost, include any alternative costs, additional
//     costs, or anything else that increases or reduces the cost to cast the spell. Convoke
//     applies after the total cost is calculated. Convoke doesn't change a spell's mana cost or
//     mana value.
//   [2025-11-17] You choose the creature type as Selfless Safewright's last ability resolves. Once
//     the ability starts to resolve, players can't respond to the choice or take any actions until
//     the ability finishes resolving.
//   [2025-11-17] Tapping an untapped creature that's attacking or blocking to convoke a spell
//     won't cause that creature to stop attacking or blocking.

export default defineCard({
  name: "Selfless Safewright",
  manaCost: "{3}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Warrior"],
  power: 4,
  toughness: 2,
  keywords: ["flash"],
  text: "Flash\nConvoke (Your creatures can help cast this spell. Each creature you tap while casting this spell pays for {1} or one mana of that creature's color.)\nWhen this creature enters, choose a creature type. Other permanents you control of that type gain hexproof and indestructible until end of turn.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "choose-creature-type",
        then: {
          kind: "sequence",
          effects: [
            { kind: "grant-keyword-all", filter: OTHERS, keyword: "hexproof", duration: "end-of-turn", exceptSource: true },
            { kind: "grant-keyword-all", filter: OTHERS, keyword: "indestructible", duration: "end-of-turn", exceptSource: true },
          ],
        },
      },
      resolve: null,
      text: "When this creature enters, choose a creature type. Other permanents you control of that type gain hexproof and indestructible until end of turn.",
    },
  ],
  convoke: true,
});
