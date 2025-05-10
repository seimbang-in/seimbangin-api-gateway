import { eq } from "drizzle-orm";
import db from "..";
import { itemsTable, transactionsTable } from "../schema";

//

// async function run() {
//     console.log("Updating Items...");
//     try {
//         const result = await db
//             .update(itemsTable)
//             .set({ category: "freelance" })
//             .where(eq(itemsTable.category, "Freelance"));

//         console.log("Updated Items:", result);

//     } catch (error) {
//         console.error("Error updating transactions:", error);
//     }
// }

// run().catch(console.error);
