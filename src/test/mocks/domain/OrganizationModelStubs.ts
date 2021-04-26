import { OrganizationModel, OrganizationProps } from "../../../domain/organization";
import { HandleAccessibilityRequests, OrganizationRequestedType } from "../../../domain/organization/OrganizationConstants";

export const OrganizationModelStubs = {
    winterfellUniversity: new OrganizationModel({
        code: "WINTERFELL",
        name: "Winterfell University",
        handleAccessibilityRequests: HandleAccessibilityRequests.AUTO,
        domain: "stark.com",
        organizationType: OrganizationRequestedType.UNIVERSITY
            })
};