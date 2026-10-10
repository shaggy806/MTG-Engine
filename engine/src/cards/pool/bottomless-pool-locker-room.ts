import { roomCard } from "../helpers.js";
import left from "./bottomless-pool.js";
import right from "./locker-room.js";

// EDHREC rank 5938. A Room (rule 709.5): each door is cast on its own and
// enters unlocked; the other is unlocked by paying its mana cost as a
// sorcery.
export default roomCard("Bottomless Pool // Locker Room", left, right);
