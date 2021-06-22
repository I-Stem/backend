import Sinon from "sinon";
import chai, { expect } from "chai";
import db from "../dbHandler";
import ProcessQueue from "../../queues/processQueue";
import processQueue from "../../queues/processQueue";




describe("Must call cron handlers for afc/vc impending failures", async function() {

        before(async function() {
            await db.createConnection();
            console.log("setting up the environment");
                });
        
                after(async function() {
                    await db.cleanup();
                    await db.closeConnection();
                });
                
    
    it("must call cron jobs", async function() {
        await processQueue.huntImpendingFailures({
            data: {
            }
        }, () => {
            console.log("called handlers");
        });
  


    });



});
