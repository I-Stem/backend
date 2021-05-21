import { expect } from 'chai';
import dbHandler from "../dbHandler";
import {UserModelStubs} from "../mocks/domain/UserModelStubs";
import {FileModelStubs} from "../mocks/domain/FileModelStubs";
import {EscalationModelStubs} from "../mocks/domain/EscalationModelStubs";
import {AFCProcessStubs} from "../mocks/domain/AFCProcessStubs";
import {VCProcessStubs} from "../mocks/domain/VCProcessStubs";
import {AfcModelStubs} from "../mocks/domain/AfcModelStubs";
import {VCModelStubs} from "../mocks/domain/VcModelStubs";
import {EscalationModel} from "../../domain/EscalationModel";
import { HandleAccessibilityRequests } from '../../domain/organization/OrganizationConstants';
import { AIServiceCategory, EscalationStatus } from '../../domain/EscalationModel/EscalationConstants';

describe('domain level operation for remediation process', () => {
    const requester = UserModelStubs.JohnSnow;
const inputFile = FileModelStubs.SongOfIceAndFire;
const afcProcess = AFCProcessStubs.afcProcess;
const afcRequest = AfcModelStubs.afcRequest;
const remediationProcess = new EscalationModel({...EscalationModelStubs.remediationProcess});

const vcProcess = VCProcessStubs.vcProcess;
const vcRequest = VCModelStubs.vcRequest;

        before(async function() {
    await dbHandler.createConnection();
    await requester.persist();
    inputFile.userContexts[0].userId = requester.userId;
    await inputFile.persist();
    afcProcess.inputFileId = inputFile.fileId;
    await afcProcess.persist();
    afcRequest.userId = requester.userId;
    afcRequest.inputFileId = inputFile.fileId;
    afcRequest.resultType = HandleAccessibilityRequests.MANUAL;
    await afcRequest.persist();

    vcProcess.inputFileId = inputFile.fileId;
    await vcProcess.persist();
    vcRequest.userId = requester.userId;
    vcRequest.inputFileId = inputFile.fileId;
    vcRequest.resultType = HandleAccessibilityRequests.MANUAL;
    await vcRequest.persist();
        });
    
        after(async function() {
            await dbHandler.cleanup();
            await dbHandler.closeConnection();
        });
            
        it('should create new remediation Process in database', async () => {
remediationProcess.serviceRequestId = afcProcess.processId;
remediationProcess.sourceFileId = inputFile.fileId;
remediationProcess.waitingRequests.push(afcRequest.afcRequestId);
const result = await EscalationModel.findOrCreateRemediationProcess(remediationProcess);

expect(result.escalationId.toString().length).to.be.above(20);
        });

it("should successfully notify waiting request for completion of remediation process", async function() {
    await remediationProcess.completePostRemediationProcessing(inputFile.fileId);

expect(remediationProcess.remediatedFile).not.to.be.equal(undefined);
});

it("should successfully complete escalated vc process", async function () {
    const process = await EscalationModel.findOrCreateRemediationProcess(remediationProcess);
    process.escalationForService = AIServiceCategory.VC;
    process.serviceRequestId = vcProcess.processId;
    process.waitingRequests.push(vcRequest.vcRequestId);
    await process.completePostRemediationProcessing(inputFile.fileId);
    await process.clearWaitingQueue();
expect(process.waitingRequests.length).to.be.equal(0);
});

it("should get remediation process details", async function() {
    const process = await EscalationModel.findOrCreateRemediationProcess(remediationProcess);
    await EscalationModel.updateResolver(process.escalationId, requester.userId);
const remediation = await EscalationModel.getEscalationDetailsById(process.escalationId);

expect(remediation.escalationForService).to.be.equal(AIServiceCategory.AFC);
});

it("should retrieve all escalations by status and service", async function() {
    const process = await EscalationModel.findOrCreateRemediationProcess(remediationProcess);
    const escalations = await EscalationModel.getEscalations(EscalationStatus.INPROGRESS, "AFC");

    expect(escalations.length).to.be.equal(1);

    const organizationEscalations = await EscalationModel.getEscalationsByOrganization(remediationProcess.escalatorOrganization, EscalationStatus.INPROGRESS, "AFC");
    expect(organizationEscalations.length).to.be.equal(1);

});

it("should successfully clear queue", async function() {
    const process = await EscalationModel.findOrCreateRemediationProcess(remediationProcess);
    process.waitingRequests.push(afcRequest.afcRequestId);
    await process.clearWaitingQueue();
    expect(process.waitingRequests.length).to.be.equal(0);
});

it("should get remediation details ", async function() {
    const process = await EscalationModel.findOrCreateRemediationProcess(remediationProcess);
    const result = await EscalationModel.getRemediationProcessDetailsBySourceFile(remediationProcess.sourceFileId);
    expect(result).to.be.not.null;

    const result2 = await EscalationModel.getRemediationProcessById(process.escalationId);
    expect(result2).to.be.not.null;

});

it("should get escalation count for users", async function() {
const result1 = await EscalationModel.getVcEscalationCountForUser(requester.userId);
expect(result1).to.be.equal(0);

const result2 = await EscalationModel.getAfcEscalationCountForUser(requester.userId);
expect(result1).to.be.equal(0);


});

it("should notify teams for escalation", async function() {
    await remediationProcess.notifyAFCResolvingTeam(afcRequest, inputFile, "2-3");
    await remediationProcess.notifyVCResolvingTeam(vcRequest, inputFile);
})
    });