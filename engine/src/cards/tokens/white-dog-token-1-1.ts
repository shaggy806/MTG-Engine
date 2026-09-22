import { defineCard } from "../define.js";

// A 1/1 white Dog — Rin and Seri, Inseparable's Cat-spell token. Named with
// its size and colour to match its partner "1/1 Green Cat Token", and so a
// later card's differently-sized Dog doesn't collide with it.
export default defineCard({
  name: "1/1 White Dog Token",
  art: "4f8107b3-8539-4b9c-8d0d-c512c940838f",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Dog"],
  power: 1,
  toughness: 1,
});
