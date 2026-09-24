import { defineCard } from "../define.js";
import type { EffectSpec } from "../../effects.js";
import type { TriggeredAbility } from "../../abilities.js";

// - "Whenever Derevi enters and whenever a creature you control deals combat
//   damage to a player" is one ability with two trigger conditions, authored
//   as two triggered abilities sharing an effect: each event fires it once,
//   exactly as the printed ability would.
// - "you may tap or untap target permanent": the target is chosen as it
//   triggers; tapping, untapping or neither is chosen on resolution — a
//   `modal` of zero or one of the two, the same `choose-modes` decision a
//   `may` raises.
// - "{1}{G}{W}{U}: Put Derevi onto the battlefield from the command zone." —
//   `zone: "command"`. Not a cast (no commander tax, no cast triggers); the
//   ability only works while Derevi is still the card that was in the command
//   zone when it was activated (see `ActivatedAbility.zone`).
const TRIGGER_TEXT =
  "Whenever Derevi enters and whenever a creature you control deals combat damage to a player, you may tap or untap target permanent.";
const COMMAND_TEXT = "{1}{G}{W}{U}: Put Derevi onto the battlefield from the command zone.";

const tapOrUntap: EffectSpec = {
  kind: "modal",
  minModes: 0,
  maxModes: 1,
  modes: [
    { text: "Tap that permanent.", effect: { kind: "tap", target: 0 } },
    { text: "Untap that permanent.", effect: { kind: "untap", target: 0 } },
  ],
};

const trigger = (on: TriggeredAbility["trigger"]): TriggeredAbility => ({
  trigger: on,
  targets: ["permanent"],
  effect: tapOrUntap,
  resolve: null,
  text: TRIGGER_TEXT,
});

export default defineCard({
  name: "Derevi, Empyrial Tactician",
  manaCost: "{G}{W}{U}",
  colors: ["G", "W", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Bird", "Wizard"],
  power: 2,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\n" + TRIGGER_TEXT + "\n" + COMMAND_TEXT,
  triggered: [
    trigger({ on: "enters-battlefield", who: "self" }),
    trigger({ on: "deals-combat-damage-to-player", who: "you-control", filter: { type: "creature" } }),
  ],
  activated: [
    {
      cost: { mana: "{1}{G}{W}{U}", tap: false },
      zone: "command",
      targets: [],
      effect: { kind: "put-onto-battlefield", target: "source" },
      resolve: null,
      text: COMMAND_TEXT,
    },
  ],
});
