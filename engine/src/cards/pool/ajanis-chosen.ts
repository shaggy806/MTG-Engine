import { defineCard } from "../define.js";

// EDHREC rank 4036.
// Makes Cat → use "Cat Token".
//
// Rulings:
//   [2013-07-01] You may attach the Aura to the token only if it can legally enchant that token.
//     For example, if the enchantment that entered the battlefield is an Aura with "enchant land,"
//     it won't become attached to that token.
//   [2013-07-01] If you cast an Aura targeting an opponent or a permanent controlled by an
//     opponent, you control that Aura when it enters the battlefield. The ability of Ajani's
//     Chosen will trigger.
//   [2013-07-01] You may attach the Aura to the Cat token only if the Aura and the token are both
//     on the battlefield when the triggered ability resolves. If the Aura leaves the battlefield
//     before the ability resolves, it won't become attached to the token. If the token leaves the
//     battlefield before the ability resolves, the Aura won't become attached to that token.
//   [2013-07-01] The ability doesn't trigger until the enchantment enters the battlefield. This
//     means that, for example, you can't cast an Aura with enchant creature if there are no legal
//     targets available, hoping to enchant the Cat token. Ajani's Chosen itself, however, may be a
//     legal target for the Aura.

export default defineCard({
  name: "Ajani's Chosen",
  manaCost: "{2}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Cat", "Soldier"],
  power: 3,
  toughness: 3,
  text: "Whenever an enchantment you control enters, create a 2/2 white Cat creature token. If that enchantment is an Aura, you may attach it to the token.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "enchantment" } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "create-token", token: "Cat Token", count: 1 },
          {
            kind: "conditional",
            condition: { kind: "trigger-object", filter: { subtype: "Aura" } },
            then: {
              kind: "may",
              prompt: "Attach that Aura to the Cat token?",
              effect: { kind: "attach", target: "created", attachment: "trigger-object" },
            },
          },
        ],
      },
      resolve: null,
      text: "Whenever an enchantment you control enters, create a 2/2 white Cat creature token. If that enchantment is an Aura, you may attach it to the token.",
    },
  ],
});
