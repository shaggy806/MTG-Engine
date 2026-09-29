import { defineCard } from "../define.js";

const FLASH_TEXT = "You may cast Aura and Equipment spells as though they had flash.";
const ATTACH_TEXT = "Whenever an Equipment you control enters, you may attach it to target creature you control.";

export default defineCard({
  name: "Sigarda's Aid",
  manaCost: "{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: `${FLASH_TEXT}\n${ATTACH_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      castAsThoughFlash: { subtypes: ["Aura", "Equipment"] },
      text: FLASH_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { subtype: "Equipment" } },
      targets: ["creature-you-control"],
      effect: {
        kind: "may",
        prompt: "Attach that Equipment to the targeted creature?",
        effect: { kind: "attach", target: 0, attachment: "trigger-object" },
      },
      resolve: null,
      text: ATTACH_TEXT,
    },
  ],
});
