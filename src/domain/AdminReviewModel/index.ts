import { ServiceRoleEnum } from "../../domain/user/UserConstants";
import loggerFactory from "../../middlewares/WinstonLogger";
import AdminReviewDb from "../../models/AdminReview";
import UserModel from "../user/User";
import {ReviewEnum, ReviewRequestType, AdminReviewStatus} from "./AdminReviewConstants";
import {OrganizationRequestedType} from "../organization/OrganizationConstants";

export class ServiceRoleRequest {
    userId: string;
    role: ServiceRoleEnum;
    fullName: string;
    email: string;
    constructor(
        userId: string,
        role: ServiceRoleEnum,
        fullName: string,
        email: string
    ) {
        this.role = role;
        this.userId = userId;
        this.fullName = fullName;
        this.email = email;
    }
}

export class OrganizationRequest {
    organizationName?: string;
    userName?: string;
    organizationType?: OrganizationRequestedType;
    userEmail?: string;
    organizationCode?: string;
    constructor(
        organizationName?: string,
        userName?: string,
        organizationType?: OrganizationRequestedType,
        userEmail?: string,
        organizationCode?: string
    ) {
        this.organizationType = organizationType;
        this.organizationName = organizationName;
        this.userEmail = userEmail;
        this.userName = userName;
        this.organizationCode = organizationCode;
    }
}

export class DomainAccessRequest {
    organizationCode: string;
    domain: string;
    requestedBy?: string;
    organizationName?: string;
    constructor(
        organizationCode: string,
        domain: string,
        requestedBy?: string,
        organizationName?: string
    ) {
        this.organizationCode = organizationCode;
        this.domain = domain;
        this.requestedBy = requestedBy;
        this.organizationName = organizationName;
    }
}

class StatusLifeCycle {
    status: ReviewEnum;
    actionAt: Date;
    constructor(status: ReviewEnum, actionAt: Date) {
        this.actionAt = actionAt;
        this.status = status;
    }
}


interface AdminReviewModelProps {
    serviceRoleRequest?: ServiceRoleRequest;
    organizationRequest?: OrganizationRequest;
    statusLog?: StatusLifeCycle[];
    status: ReviewEnum;
    requestType: ReviewRequestType;
    id?: string;
    domainAccessRequest?: DomainAccessRequest;
    adminReviewStatus?: AdminReviewStatus;
    reviewerId?: string;
}

export class AdminReviewModel implements AdminReviewModelProps {
    serviceRoleRequest?: ServiceRoleRequest;
    organizationRequest?: OrganizationRequest;
    statusLog?: StatusLifeCycle[];
    status: ReviewEnum;
    requestType: ReviewRequestType;
    domainAccessRequest?: DomainAccessRequest;
    id?: string;
    adminReviewStatus?: AdminReviewStatus;
    reviewerId?: string;

    static serviceName = "AdminReviewModel";

    private static instance: AdminReviewModel;

    private constructor(props: AdminReviewModelProps) {
        this.organizationRequest = props.organizationRequest;
        this.statusLog = props.statusLog;
        this.serviceRoleRequest = props.serviceRoleRequest;
        this.requestType = props.requestType;
        this.status = props.status;
        this.domainAccessRequest = props.domainAccessRequest;
        this.id = props.id;
        this.adminReviewStatus = props.adminReviewStatus;
        this.reviewerId = props.reviewerId;
    }
    /**
     * Returns instance of AdminReviewModel
     *
     * @param props AdminReviewModelProps
     */
    public static getInstance(props: AdminReviewModelProps): AdminReviewModel {
        return (AdminReviewModel.instance = new AdminReviewModel(props));
    }

    /**
     * Persist user requests to database
     */
    public async persist(): Promise<any> {
        const logger = loggerFactory(AdminReviewModel.serviceName, "persist");
        this.statusLog = [];
        this.statusLog?.push(new StatusLifeCycle(this.status, new Date()));
        logger.info(
            `Persisting request for admin review: ${JSON.stringify(this)}`
        );
        try {
        const result = await new AdminReviewDb(this).save();
        this.id = result.id;
        return this;
    } catch(error) {
                logger.error(`Error persisting data, ${error}`);
            }

            return undefined;
    }

    /**
     * Retrieve all the requests for Admin if it has not been reviewed based on the request type.
     */
    public static async getAllRequests(
        requestType: ReviewRequestType,
        offset: number
    ): Promise<any[]> {
        const logger = loggerFactory(
            AdminReviewModel.serviceName,
            "getAllRequests"
        );
        logger.info(
            "Fetching all requests for Admin for request " + requestType
        );
        const requests = await AdminReviewDb.find({
            status: ReviewEnum.REQUESTED,
            requestType: requestType,
        })
            .skip(offset)
            .limit(10)
            .sort({ createdAt: -1 });
        const formatValues = {
            name: "",
            currentStatus: "",
            requestedOn: "",
            id: "",
        };
        const requestData: typeof formatValues[] = [];
        requests.forEach((request) => {
            if (requestType === ReviewRequestType.AUTO_DOMAIN) {
                formatValues.name =
                    request.domainAccessRequest?.organizationName || "";
            } else if (requestType === ReviewRequestType.SERVICE) {
                formatValues.name = request.serviceRoleRequest?.fullName || "";
            } else {
                formatValues.name =
                    request.organizationRequest?.organizationName || "";
            }
            formatValues.currentStatus = request.status;
            formatValues.requestedOn = ((request as unknown) as any).createdAt;
            formatValues.id = request.id;
            requestData.push({ ...formatValues });
        });
        return requestData;
    }

    /**
     * Retrieve count of all requests having `REQUESTED` status
     */
    public static async getCountAllPendingRequests(): Promise<any> {
        const logger = loggerFactory(
            AdminReviewModel.serviceName,
            "getCountAllPendingRequests"
        );
        const totalOrganizationRequests = AdminReviewDb.countDocuments({
            status: ReviewEnum.REQUESTED,
            requestType: ReviewRequestType.ORGANIZATION,
        });
        const totalAutoDomainRequests = AdminReviewDb.countDocuments({
            status: ReviewEnum.REQUESTED,
            requestType: ReviewRequestType.AUTO_DOMAIN,
        });
        const totalServiceRequests = AdminReviewDb.countDocuments({
            status: ReviewEnum.REQUESTED,
            requestType: ReviewRequestType.SERVICE,
        });
        try {
            const dataResolver = await Promise.all([
                totalAutoDomainRequests,
                totalOrganizationRequests,
                totalServiceRequests,
            ]);
            return {
                AUTO_DOMAIN: dataResolver[0],
                ORGANIZATION: dataResolver[1],
                SERVICE: dataResolver[2],
            };
        } catch (err) {
            logger.error("Error occured while resolving promise: " + err);
        }
    }

    public static async getCountAllReviewedRequests(): Promise<any> {
        const logger = loggerFactory(
            AdminReviewModel.serviceName,
            "getCountAllReviewedRequests"
        );
        const totalOrganizationRequests = AdminReviewDb.countDocuments({
            status: ReviewEnum.REVIEWED,
            requestType: ReviewRequestType.ORGANIZATION,
        });
        const totalAutoDomainRequests = AdminReviewDb.countDocuments({
            status: ReviewEnum.REVIEWED,
            requestType: ReviewRequestType.AUTO_DOMAIN,
        });
        const totalServiceRequests = AdminReviewDb.countDocuments({
            status: ReviewEnum.REVIEWED,
            requestType: ReviewRequestType.SERVICE,
        });
        try {
            const dataResolver = await Promise.all([
                totalAutoDomainRequests,
                totalOrganizationRequests,
                totalServiceRequests,
            ]);
            return {
                AUTO_DOMAIN: dataResolver[0],
                ORGANIZATION: dataResolver[1],
                SERVICE: dataResolver[2],
            };
        } catch (err) {
            logger.error("Error occured while resolving promise: " + err);
        }
    }

    /**
     * Update current status of User request
     */
    public async updateStatus(): Promise<void> {
        const logger = loggerFactory(
            AdminReviewModel.serviceName,
            "updateStatus"
        );
        logger.info(`Updating status to: ${this.status}`);
        await AdminReviewDb.findByIdAndUpdate(this.id, {
            $set: {
                status: this.status,
                adminReviewStatus: this.adminReviewStatus,
                reviewerId: this.reviewerId,
            },
            $push: {
                statusLog: new StatusLifeCycle(this.status, new Date()),
            },
        }).exec();
    }

    public static async getRequestDetailsById(id: string): Promise<any> {
        const logger = loggerFactory(
            AdminReviewModel.serviceName,
            "getRequestDetailsById"
        );
        const request = await AdminReviewDb.findById(id);
        if (request?.requestType === ReviewRequestType.AUTO_DOMAIN) {
            const user = await UserModel.getUserById(
                request.domainAccessRequest?.requestedBy || ""
            );
            logger.info("Get request for: " + id);
            return {
                organizationName: request.domainAccessRequest?.organizationName,
                requestedDomain: request.domainAccessRequest?.domain,
                fullName: user?.fullname,
            };
        } else if (request?.requestType === ReviewRequestType.ORGANIZATION) {
            const { organizationRequest } = request;
            return {
                organizationName: organizationRequest?.organizationName,
                fullName: organizationRequest?.userName,
                email: organizationRequest?.userEmail,
                orgType: organizationRequest?.organizationType,
                orgCode: organizationRequest?.organizationCode
            };
        }
        return {
            email: request?.serviceRoleRequest?.email,
            fullName: request?.serviceRoleRequest?.fullName,
            requestedRole: request?.serviceRoleRequest?.role,
        };
    }

    public static async getAllReviewedRequestsByRequestType(
        requestType: ReviewRequestType,
        offset: number
    ): Promise<any> {
        const requests = await AdminReviewDb.find({
            status: ReviewEnum.REVIEWED,
            requestType,
        })
            .skip(offset)
            .limit(10)
            .sort({ updatedAt: -1 });
        const formatValues = {
            name: "",
            currentStatus: "",
            reviewedOn: "",
            reviewedBy: "",
            id: "",
            action: "",
        };
        const requestData: typeof formatValues[] = [];
        await Promise.all(
            requests.map(async (request) => {
                formatValues.currentStatus = request.status;
                if (request.reviewerId) {
                    const user = await UserModel.getUserById(
                        request.reviewerId
                    );
                    formatValues.reviewedBy = user?.fullname || "";
                }
                if (requestType === ReviewRequestType.AUTO_DOMAIN) {
                    formatValues.name =
                        request.domainAccessRequest?.organizationName || "";
                } else if (requestType === ReviewRequestType.SERVICE) {
                    formatValues.name =
                        request.serviceRoleRequest?.fullName || "";
                } else if (requestType === ReviewRequestType.ORGANIZATION) {
                    formatValues.name =
                        request.organizationRequest?.organizationName || "";
                }
                formatValues.id = request._id;
                formatValues.action = request.adminReviewStatus || "";
                request.statusLog?.forEach((status) => {
                    if (status.status === ReviewEnum.REVIEWED) {
                        formatValues.reviewedOn = status.actionAt.toISOString();
                    }
                });
                requestData.push({ ...formatValues });
            })
        );
        return requestData;
    }
}


