import { ReviewEnum, ReviewRequestType } from "../../../domain/AdminReviewModel/AdminReviewConstants";
import { ServiceRoleEnum } from "../../../domain/user/UserConstants";
import {AdminReviewModel, ServiceRoleRequest, OrganizationRequest} from "../../../domain/AdminReviewModel";
import {OrganizationRequestedType} from "../../../domain/organization/OrganizationConstants";

export const AdminReviewModelStubs = {
    serviceRoleRequest: AdminReviewModel.getInstance({
        requestType: ReviewRequestType.SERVICE,
        serviceRoleRequest: new ServiceRoleRequest("to be set during runtime", ServiceRoleEnum.PREMIUM, "Rob", "Rob@stark.com"),
        status: ReviewEnum.REQUESTED,
    }),

    organizationRequest: AdminReviewModel.getInstance({
        requestType: ReviewRequestType.ORGANIZATION,
        organizationRequest: new OrganizationRequest("Lannister", "sersie", OrganizationRequestedType.UNIVERSITY, "S. l.", "lannister_family"),
        status: ReviewEnum.REQUESTED
    })
}