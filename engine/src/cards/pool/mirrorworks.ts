import { defineCard } from "../define.js";

// EDHREC rank 3093.
//
// Rulings:
//   [2011-06-01] The copiable values of the token's characteristics are the same as the copiable
//     values of the characteristics of the artifact it's copying.
//   [2011-06-01] As the token is created, it checks the printed values of the artifact it's
//     copying, as well as any copy effects that have been applied to it.
//   [2011-06-01] If the artifact that caused Mirrorworks's ability to trigger has already left the
//     battlefield by the time the ability resolves, you can still pay {2}. If you do, you'll still
//     put a token onto the battlefield. That token has the copiable values of the characteristics
//     of that nontoken artifact as it last existed on the battlefield.
//   [2011-06-01] Each time the ability triggers, you can pay {2} only one time to get one token.

const TEXT =
  "Whenever another nontoken artifact you control enters, you may pay {2}. If you do, create a token that's a copy of that artifact.";

export default defineCard({
  name: "Mirrorworks",
  manaCost: "{5}",
  colors: [],
  types: ["artifact"],
  text: TEXT,
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { token: false, type: "artifact" },
        otherOnly: true,
      },
      targets: [],
      // Flameshadow Conjuring's shape: the copy is read off the artifact as it
      // last existed if it has left (the third ruling).
      effect: {
        kind: "may",
        prompt: "Pay {2} to create a token that's a copy of that artifact?",
        cost: "{2}",
        effect: { kind: "create-token-copy", of: "trigger-object", count: 1, who: "you" },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
