import { expect } from 'chai';
import dbHandler from "../dbHandler";
import {UserModelStubs} from "../mocks/domain/UserModelStubs";
import {FileModelStubs} from "../mocks/domain/FileModelStubs";
import {EscalationModelStubs} from "../mocks/domain/EscalationModelStubs";
import {AFCProcessStubs} from "../mocks/domain/AFCProcessStubs";
import {AfcModelStubs} from "../mocks/domain/AfcModelStubs";
import {EscalationModel} from "../../domain/EscalationModel";
import { HandleAccessibilityRequests } from '../../domain/organization/OrganizationConstants';
import { AIServiceCategory, EscalationStatus } from '../../domain/EscalationModel/EscalationConstants';

describe('domain level operation for job preferences', () => {
    const requester = UserModelStubs.JohnSnow;
const inputFile = FileModelStubs.SongOfIceAndFire;
const afcProcess = AFCProcessStubs.afcProcess;
const afcRequest = AfcModelStubs.afcRequest;
const remediationProcess = EscalationModelStubs.remediationProcess;

        before(async function() {
    await dbHandler.createConnection();
    await requester.persist();
    await inputFile.persist();
    afcProcess.inputFileId = inputFile.fileId;
    await afcProcess.persist();
    afcRequest.userId = requester.userId;
    afcRequest.inputFileId = inputFile.fileId;
    afcRequest.resultType = HandleAccessibilityRequests.MANUAL;
    await afcRequest.persist();
        });
    
        after(async function() {
            await dbHandler.cleanup();
            await dbHandler.closeConnection();
        });
            
        it('should create new remediation Process in database', async () => {
remediationProcess.serviceRequestId = afcProcess.processId;
remediationProcess.sourceFileId = inputFile.fileId;
remediationProcess.waitingRequests.push(afcRequest.afcRequestId);
await remediationProcess.persist();

expect(remediationProcess.escalationId.toString().length).to.be.above(20);
        });

it("should successfully notify waiting request for completion of remediation process", async function() {
    await remediationProcess.completePostRemediationProcessing(inputFile.fileId);

expect(remediationProcess.remediatedFile).not.to.be.equal(undefined);
});

it("should get remediation process details", async function() {
    await EscalationModel.updateResolver(remediationProcess.escalationId, requester.userId);
const remediation = await EscalationModel.getEscalationDetailsById(remediationProcess.escalationId);

expect(remediation.escalationForService).to.be.equal(AIServiceCategory.AFC);
});

it("should retrieve all escalations by status and service", async function() {
    const escalations = await EscalationModel.getEscalations(EscalationStatus.INPROGRESS, "AFC");

    expect(escalations.length).to.be.equal(1);
})
    });