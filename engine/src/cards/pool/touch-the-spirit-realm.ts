import { defineCard } from "../define.js";

const ENTER_TEXT =
  "When this enchantment enters, exile up to one target artifact or creature until this enchantment leaves the battlefield.";
const CHANNEL_TEXT =
  "Channel — {1}{W}, Discard this card: Exile target artifact or creature. Return it to the battlefield under its owner's control at the beginning of the next end step.";

const ARTIFACT_OR_CREATURE = { kind: "permanent", filter: { typesAnyOf: ["artifact", "creature"] } } as const;

export default defineCard({
  name: "Touch the Spirit Realm",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: `${ENTER_TEXT}\n${CHANNEL_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [{ kind: "optional", of: ARTIFACT_OR_CREATURE }],
      effect: { kind: "exile", target: 0, untilSourceLeaves: true },
      resolve: null,
      text: ENTER_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{1}{W}", tap: false },
      zone: "hand",
      targets: [ARTIFACT_OR_CREATURE],
      effect: { kind: "flicker", target: 0, returnAt: "next-end-step" },
      resolve: null,
      text: CHANNEL_TEXT,
    },
  ],
});
