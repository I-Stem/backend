import DisabilitiesModel from "../../domain/DisabilitiesModel";
import IndustryModel from "../../domain/IndustryModel";
import SkillModel from "../../domain/SkillsModel";
import WebinarModel from "../../domain/WebinarsModel";
import db from "../dbHandler";

describe("pojo tests", async function() {

    before(async function() {
        await db.createConnection();
            });
    
            after(async function() {
                await db.cleanup();
                await db.closeConnection();
            });
            

    it("should create and test all pojo", async function() {
const disability = new DisabilitiesModel("blindness");
await disability.persistDisabilities();

const industry = new IndustryModel("software engineering");
await industry.persistIndustry();

const skill = new SkillModel("writing");
await skill.persistSkills();

const webinar = new WebinarModel("google", "logo", "unknown");
await webinar.persistWebinars();
    });
})