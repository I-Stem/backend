import { expect } from 'chai';
import dbHandler from "../dbHandler";
import {UserModelStubs} from "../mocks/domain/UserModelStubs";
import { AdminReviewModel } from '../../domain/AdminReviewModel';
import { AdminReviewStatus, ReviewEnum, ReviewRequestType } from '../../domain/AdminReviewModel/AdminReviewConstants';
import {AdminReviewModelStubs} from "../mocks/domain/AdminReviewModelStubs";


describe('domain level operation for admin actions', () => {
    const requester = UserModelStubs.JohnSnow;
    const serviceRoleRequest = AdminReviewModelStubs.serviceRoleRequest;

        before(async function() {
    await dbHandler.createConnection();
    await requester.persist();
        });
    
        after(async function() {
            await dbHandler.cleanup();
            await dbHandler.closeConnection();
        });
            
        it('should create new admin review entry in database', async () => {
            serviceRoleRequest.serviceRoleRequest.userId = requester.userId;
        const result = await serviceRoleRequest.persist();
    
        expect(result.id.toString().length).to.above(20);
    });
   
    it('should get all admin review entry in database', async () => {

const result = await AdminReviewModel.getAllRequests(ReviewRequestType.SERVICE, 0);

    expect(result.length).to.equal(1);
});

it('should get all admin review pending entry count in database', async () => {

    const result = await AdminReviewModel.getCountAllPendingRequests();
    
        expect(result.SERVICE).to.equal(1);
        expect(result.ORGANIZATION).to.equal(0);
    });
    
   
    it('should get all admin reviewed entry count in database', async () => {

        const result = await AdminReviewModel.getCountAllReviewedRequests();
        
            expect(result.SERVICE).to.equal(0);
            expect(result.ORGANIZATION).to.equal(0);
        });
   
        it('should update status in database of admin review', async () => {
serviceRoleRequest.status = ReviewEnum.REVIEWED;
serviceRoleRequest.adminReviewStatus = AdminReviewStatus.APPROVED;
serviceRoleRequest.reviewerId = requester.userId;
            const result = await serviceRoleRequest.updateStatus();
            
            });
   
            it('should get all admin reviewed entry count in database by request type', async () => {

                const result = await AdminReviewModel.getAllReviewedRequestsByRequestType(ReviewRequestType.SERVICE, 0);
                
                    expect(result.length).to.equal(1);
                });
        

});