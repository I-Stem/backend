import ReqOrgDb from "../../../models/organization/RequestedOrganization";
import loggerFactory from "../../../middlewares/WinstonLogger";
import { OrganizationRequestedType, OrganizationRequestStatus, HandleAccessibilityRequests } from "../OrganizationConstants";
import EmailService from "../../../services/EmailService";
import AuthMessageTemplates from "../../../MessageTemplates/AuthTemplates";
import UserModel from "../../user/User";
import { UserType } from "../../user/UserConstants";
import { AdminReviewStatus } from "../../AdminReviewModel/AdminReviewConstants";



class OrganizationRequestStatusLog {
    status: OrganizationRequestStatus;
    actionAt: Date;

    constructor(status: OrganizationRequestStatus) {
        this.status = status;
        this.actionAt = new Date();
    }
}

export interface RequestedOrganizationProps {
    registeredByUserName?: string;
    organizationName?: string;
    registeredByUserEmail?: string;
    status?: OrganizationRequestStatus;
    statusLog?: OrganizationRequestStatusLog[];
    organizationType?: OrganizationRequestedType;
    organizationCode?: string;
    handleAccessibilityRequests?: HandleAccessibilityRequests;
    showRemediationSetting?: boolean;
}

/**
 * A class to manage properties and lifecycle of requested organization.
 */
export class RequestedOrganizationModel implements RequestedOrganizationProps {
    static ServiceName = "RequestedOrganizationModel";

    registeredByUserName?: string;
    organizationName?: string;
    registeredByUserEmail?: string;
    organizationType?: OrganizationRequestedType;
    organizationCode?: string;
    status: OrganizationRequestStatus;
    statusLog: OrganizationRequestStatusLog[];
    handleAccessibilityRequests?: HandleAccessibilityRequests;
    showRemediationSetting?: boolean;

    constructor(props: RequestedOrganizationProps) {
        this.registeredByUserEmail = props.registeredByUserEmail;
        this.organizationName = props.organizationName;
        this.status = props.status || OrganizationRequestStatus.REQUESTED;
        this.statusLog = props.statusLog || [
            new OrganizationRequestStatusLog(this.status),
        ];
        this.organizationType = props.organizationType;
        this.registeredByUserName = props.registeredByUserName;
        this.organizationCode = props.organizationCode;
        this.handleAccessibilityRequests = props.handleAccessibilityRequests;
        this.showRemediationSetting = props.showRemediationSetting;
    }

    /**
     * Function to persist data of requested organization
     */
    async persist(): Promise<RequestedOrganizationModel> {
        const logger = loggerFactory(
            RequestedOrganizationModel.ServiceName,
            "persist"
        );
        this.organizationCode = UserModel.generateOrganizationCodeFromUserTypeAndOrganizationName(
            (this.organizationType as unknown) as UserType,
            this.organizationName || ""
        );
        logger.info(
            `Persisting the request for new organization: ${JSON.stringify(
                this
            )}`
        );
        const persistedData = await ReqOrgDb.create(this);
        EmailService.notifyIStemTeam(
            AuthMessageTemplates.getNewOrganizationRegistrationRequestMessage({
                email: persistedData.registeredByUserEmail || "",
                organizationName: persistedData.organizationName || "",
                userName: persistedData.registeredByUserName || "",
            })
        );
        return persistedData;
    }

    /**
     * Function to get organization details by organization code
     * @param organizationCode
     */
    public static async getDetailsByOrganizationCode(
        organizationCode: string
    ): Promise<RequestedOrganizationModel | null> {
        const orgRequest = await ReqOrgDb.findOne({ organizationCode });
        return orgRequest;
    }

    public static async updateStatus(
        organizationCode: string | undefined,
        status: OrganizationRequestStatus,
        handleAccessibilityRequests?: HandleAccessibilityRequests,
        showRemediationSetting?: boolean
    ) {
        const logger = loggerFactory(
            RequestedOrganizationModel.ServiceName,
            "updateStatus"
        );
        try {
            await ReqOrgDb.findOneAndUpdate(
                { organizationCode },
                {
                    status: status,
                    handleAccessibilityRequests,
                    showRemediationSetting,
                }
            );
        } catch (err) {
            logger.error("Error occured while updating request status %o", err);
        }
    }
}

