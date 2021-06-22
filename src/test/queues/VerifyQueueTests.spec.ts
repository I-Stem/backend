import Sinon from "sinon";
import chai, { expect } from "chai";
import db from "../dbHandler";
import verifyQueue from "../../queues/verify";





describe("Must verify deletion of unverified users", async function() {

        before(async function() {
            await db.createConnection();
            console.log("setting up the environment");
                });
        
                after(async function() {
                    await db.cleanup();
                    await db.closeConnection();
                });
                
    
    it("must call deletion of unverified email users", async function() {
        await verifyQueue.deleteOldUnverifiedUsers({
            data: {
            }
        }, () => {
            console.log("deleted data");
        });
  


    });



});
