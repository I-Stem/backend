import { createObjectCsvStringifier } from "csv-writer";
import { saveStudentsReportCSV } from "../../utils/file";
import ServiceRequestTemplates from "../../MessageTemplates/ServiceRequestTemplates";
import AdminReviewModel, {
    ReviewEnum,
    ReviewRequestType,
} from "../AdminReviewModel";
import ReportTemplate from "../../MessageTemplates/ReportTemplate";
import loggerFactory from "../../middlewares/WinstonLogger";
import UniversityDbModel from "../../models/Organization";
import AfcModel from "../AfcModel";
import FeedbackModel, { FeedbackCategory } from "../FeedbackModel";
import FileModel from "../FileModel";
import UserModel from "../user/User";
import UserDBModel from "../../models/User";
import VcModel from "../VcModel";
import User from "../../models/User";
import EmailService from "../../services/EmailService";
import AuthMessageTemplates from "../../MessageTemplates/AuthTemplates";

export const enum EscalationsHandledBy {
    UNIVERSITY = "UNIVERSITY",
    I_STEM = "I_STEM",
    NONE = "NONE",
}
export const enum DomainAccess {
    AUTO = "AUTO",
    MANUAL = "MANUAL",
    NONE = "NONE",
}

export const enum UniversityRoles {
    STUDENT = "STUDENT",
    STAFF = "STAFF",
    REMEDIATOR = "REMEDIATOR",
}

export const enum UniversityAccountStatus {
    CREATED = "CREATED",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
}

class UniversityAccountLifecycleEvent {
    status: UniversityAccountStatus;
    actionAt: Date;

    constructor(status: UniversityAccountStatus) {
        this.status = status;
        this.actionAt = new Date();
    }
}

export const enum DomainAccessStatus {
    VERIFIED = "VERIFIED",
    NOT_VERIFIED = "NOT_VERIFIED",
    PENDING = "PENDING",
    REJECTED = "REJECTED",
}

class DomainAccessLifecycleEvent {
    status: DomainAccessStatus;
    actionAt: Date;

    constructor(status: DomainAccessStatus) {
        this.status = status;
        this.actionAt = new Date();
    }
}

export interface University {
    _id?: string;
    universityId?: string;
    code: string;
    name: string;
    address?: string;
    domain?: string;
    students?: string[];
    staffs?: string[];
    registeredByUser?: string;
    organizationType?: string;
    noStudentsWithDisability?: string;
    escalationHandledBy?: EscalationsHandledBy;
    domainAccess?: DomainAccess;
    domainAccessStatusLog?: DomainAccessLifecycleEvent[];
    accountStatus?: UniversityAccountStatus;
    statusLog?: UniversityAccountLifecycleEvent[];
    domainAccessRequestedBy?: string;
    domainAccessStatus?: string;
}

class UniversityModel {
    static ServiceName = "UniversityModel";

    universityId: string;
    code: string;
    name: string;
    address: string;
    domain?: string;
    students: string[];
    staffs: string[];
    registeredByUser?: string;
    organizationType?: string;
    noStudentsWithDisability?: string;
    escalationHandledBy?: EscalationsHandledBy;
    domainAccess?: DomainAccess;
    accountStatus: UniversityAccountStatus;
    statusLog: UniversityAccountLifecycleEvent[];
    domainAccessStatusLog: DomainAccessLifecycleEvent[];
    domainAccessRequestedBy: string;
    domainAccessStatus: string;

    constructor(props: University) {
        this.universityId = props.universityId || props._id || "";
        this.name = props.name;
        this.address = props.address || "";
        this.code = props.code;
        this.domain = props.domain;
        this.students = props.students || [];
        this.staffs = props.staffs || [];
        this.registeredByUser = props.registeredByUser || undefined;
        this.organizationType = props.organizationType;
        this.noStudentsWithDisability = props.noStudentsWithDisability;
        this.escalationHandledBy = props.escalationHandledBy;
        this.domainAccess = props.domainAccess;
        this.accountStatus =
            props.accountStatus || UniversityAccountStatus.CREATED;
        this.statusLog = props.statusLog || [
            new UniversityAccountLifecycleEvent(this.accountStatus),
        ];
        this.domainAccessStatusLog = props.domainAccessStatusLog || [
            new DomainAccessLifecycleEvent(DomainAccessStatus.NOT_VERIFIED),
        ];
        this.domainAccessRequestedBy = props.domainAccessRequestedBy || "";
        this.domainAccessStatus =
            props.domainAccessStatus ||
            this.domainAccessStatusLog[this.domainAccessStatusLog?.length - 1]
                .status;
    }

    persistUniversity(currUserId: string) {
        const logger = loggerFactory(
            UniversityModel.ServiceName,
            "persistUniversity"
        );
        this.registeredByUser = currUserId;
        this.domainAccessRequestedBy = currUserId;
        new UniversityDbModel(this).save((err: any) => {
            if (err) {
                logger.error(err);
            }
        });
    }

    async registerUniversity(data: any, userId: any) {
        const logger = loggerFactory(
            UniversityModel.ServiceName,
            "updateUniversity"
        );
        await UniversityDbModel.findOneAndUpdate(
            { code: data.code },
            {
                name: data.name,
                address: data.address,
                noStudentsWithDisability: data.noStudentsWithDisability,
                registeredByUser: userId,
            }
        ).exec((err: any) => {
            if (err) {
                logger.error(err);
            }
        });
    }

    static async updateDomainAccessStatus(
        universityCode: string,
        status: DomainAccessStatus
    ): Promise<void> {
        const logger = loggerFactory(
            UniversityModel.ServiceName,
            "updateDomainAccessStatus"
        );
        const _status = new DomainAccessLifecycleEvent(status);
        try {
            const university = await UniversityDbModel.findOneAndUpdate(
                { code: universityCode },
                {
                    $push: {
                        domainAccessStatusLog: _status,
                    },
                }
            );
            logger.info(`Domain access status updated to: ${status} `);
        } catch (err) {
            logger.error(`Error occured while updating status: ${err}`);
            throw new Error("Error occured while updating status");
        }
    }

    async updateUniversity(data: any, userId: string) {
        const logger = loggerFactory(
            UniversityModel.ServiceName,
            "updateUniversity"
        );

        const university = await UniversityModel.getUniversityByCode(data.code);
        if (
            university.domain !== data.domain &&
            university.domainAccessStatus !== DomainAccessStatus.PENDING &&
            university.domainAccessStatus !== DomainAccessStatus.VERIFIED &&
            data.domainAccess === DomainAccess.AUTO
        ) {
            const user = await UserModel.getUserById(userId);
            if (user) {
                EmailService.notifyIStemTeam(
                    ServiceRequestTemplates.getDomainAccessRequest({
                        domainName: data.domain,
                        universityName: university.name,
                        userName: user.fullname,
                    })
                );
                const status = new DomainAccessLifecycleEvent(
                    DomainAccessStatus.PENDING
                );

                await AdminReviewModel.getInstance({
                    requestType: ReviewRequestType.AUTO_DOMAIN,
                    status: ReviewEnum.REQUESTED,
                    domainAccessRequest: {
                        domain: data.domain,
                        organizationCode: data.code,
                        organizationName: university.name,
                        requestedBy: user.userId,
                    },
                }).persist();
                await UniversityDbModel.findOneAndUpdate(
                    { code: data.code },
                    {
                        domain: data.domain,
                        escalationHandledBy: data.escalationHandledBy,
                        domainAccess: data.domainAccess,
                        domainAccessRequestedBy: userId,
                        $push: { domainAccessStatusLog: status },
                    }
                ).exec((err: any) => {
                    if (err) {
                        logger.error(err);
                    }
                });
            }
        } else {
            await UniversityDbModel.findOneAndUpdate(
                { code: data.code },
                {
                    domain: data.domain,
                    escalationHandledBy: data.escalationHandledBy,
                    domainAccess: data.domainAccess,
                }
            ).exec((err: any) => {
                if (err) {
                    logger.error(err);
                }
            });
        }
    }

    static async getUniversityByCode(code: string) {
        const logger = loggerFactory(
            UniversityModel.ServiceName,
            "getUniversityByCode"
        );
        logger.info(`University Code, ${code}`);
        const university = await UniversityDbModel.findOne({
            code: code,
        }).lean();
        if (university) {
            logger.info(`University: ${JSON.stringify(university)}`);
            return new UniversityModel(university);
        } else {
            logger.error(`University data not found`);
            throw new Error("University data not found");
        }
    }

    static async getMetricsByUniversityCode(
        universityCode: string
    ): Promise<any[]> {
        const logger = loggerFactory(
            UniversityModel.ServiceName,
            "getStudentsByUniversityId"
        );
        const metricsData: any = {
            averageRatingAfc: 0,
            averageResolutionTimeAfc: 0,
            totalRequestsAfc: 0,
            studentsUsingAfc: 0,
            averageRatingVc: 0,
            averageResolutionTimeVc: 0,
            totalRequestsVc: 0,
            studentsUsingVc: 0,
        };
        await User.find({
            organizationCode: universityCode,
            role: UniversityRoles.STUDENT,
        })
            .exec()
            .then(async (students) => {
                const studentsCount = students.length;
                let vcAverageRating = 0;
                let afcAverageRating = 0;
                let afcUserCount = 0;
                let vcUserCount = 0;
                for (let i = 0; i < studentsCount; ++i) {
                    // logger.info(`student: ${students[i]}`);
                    const afcRequests = AfcModel.getAfcRequestCountForUser(
                        students[i].id
                    );
                    const vcRequests = VcModel.getVcRequestCountForUser(
                        students[i].id
                    );
                    const afcResolutionTime = AfcModel.averageResolutionTime(
                        students[i].id
                    );
                    const vcResolutionTime = VcModel.averageResolutionTime(
                        students[i].id
                    );
                    const afcRating = AfcModel.getAfcRatingCountForUser(
                        students[i].id
                    );
                    const afcFeedbackRating = FeedbackModel.getFeedbackRatingCountForUser(
                        students[i].id,
                        FeedbackCategory.AFC_SERVICE
                    );
                    const vcRating = VcModel.getVcRatingCountForUser(
                        students[i].id
                    );
                    const vcFeedbackRating = FeedbackModel.getFeedbackRatingCountForUser(
                        students[i].id,
                        FeedbackCategory.VC_SERVICE
                    );
                    const dataResolver = await Promise.all([
                        afcRequests,
                        vcRequests,
                        afcResolutionTime,
                        vcResolutionTime,
                        afcRating,
                        afcFeedbackRating,
                        vcRating,
                        vcFeedbackRating,
                    ]);
                    metricsData.totalRequestsAfc += dataResolver[0];
                    metricsData.totalRequestsVc += dataResolver[1];
                    metricsData.averageResolutionTimeAfc += isNaN(
                        dataResolver[2]
                    )
                        ? 0
                        : dataResolver[2];
                    metricsData.averageResolutionTimeVc += isNaN(
                        dataResolver[3]
                    )
                        ? 0
                        : dataResolver[3];
                    if (
                        dataResolver[4].count !== 0 ||
                        dataResolver[5].count !== 0
                    ) {
                        afcAverageRating += Number(
                            (
                                (dataResolver[4].rating +
                                    dataResolver[5].rating) /
                                (dataResolver[4].count + dataResolver[5].count)
                            ).toFixed(1)
                        );
                        afcUserCount +=
                            dataResolver[5].count + dataResolver[4].count;
                    }
                    if (
                        dataResolver[6].count !== 0 ||
                        dataResolver[7].count !== 0
                    ) {
                        vcAverageRating += Number(
                            (
                                (dataResolver[6].rating +
                                    dataResolver[7].rating) /
                                (dataResolver[6].count + dataResolver[7].count)
                            ).toFixed(1)
                        );
                        vcUserCount +=
                            dataResolver[6].count + dataResolver[7].count;
                    }
                    metricsData.averageRatingAfc = afcAverageRating;
                    metricsData.averageRatingVc = vcAverageRating;
                    if (dataResolver[0] > 0) {
                        metricsData.studentsUsingAfc += 1;
                    }
                    if (dataResolver[1] > 0) {
                        metricsData.studentsUsingVc += 1;
                    }
                }
                logger.info(
                    "Total user count for VC and AFC rating: " +
                        vcUserCount +
                        ", " +
                        afcUserCount
                );
                metricsData.averageResolutionTimeAfc =
                    metricsData.averageResolutionTimeAfc /
                    metricsData.studentsUsingAfc;
                metricsData.averageResolutionTimeVc =
                    metricsData.averageResolutionTimeVc /
                    metricsData.studentsUsingVc;
                metricsData.averageRatingAfc =
                    metricsData.averageRatingAfc / afcUserCount;
                metricsData.averageRatingVc =
                    metricsData.averageRatingVc / vcUserCount;
            });
        // logger.info(`metrics data: ${JSON.stringify(metricsData)}`);
        return metricsData;
    }

    static async getStudentsByUniversityCode(
        universityCode: string,
        limit: number,
        offset: number,
        searchString?: string
    ): Promise<any[]> {
        const logger = loggerFactory(
            UniversityModel.ServiceName,
            "getStudentsByUniversityCode"
        );
        const studentData: any[] = [];
        logger.info(
            `limit, offset and search string: ${limit} ${offset} ${searchString}`
        );
        logger.info("getting student details for the university");
        const students = await UserModel.getUserDetailsByOrganizationCodeAndRole(
            universityCode,
            UniversityRoles.STUDENT,
            offset,
            limit,
            searchString || ""
        );
        logger.info(`students by university code: ${universityCode}`);
        for (let i = 0; i < students.length; ++i) {
            const afcRequests = AfcModel.getAfcRequestCountForUser(
                students[i]._id
            );
            const afcEscalatedRequests = AfcModel.getAfcEscalatedRequestsForUser(
                students[i]._id
            );
            const vcRequests = VcModel.getVcRequestCountForUser(
                students[i]._id
            );
            const vcEscalatedRequests = VcModel.getVcEscalatedRequestCountForUser(
                students[i]._id
            );

            const dataResolver = await Promise.all([
                students[i],
                afcRequests,
                vcRequests,
                afcEscalatedRequests,
                vcEscalatedRequests,
            ]);
            const totalRequests = dataResolver[1] + dataResolver[2];
            const escalatedRequests = dataResolver[3] + dataResolver[4];
            studentData.push({
                name: dataResolver[0]?.fullname,
                email: dataResolver[0]?.email,
                id: dataResolver[0]?._id,
                roll: dataResolver[0]?.rollNumber,
                totalRequests,
                escalatedRequests,
            });
        }

        return studentData;
    }

    static async emailStudentDataForUniversityAsCsv(
        universityCode: string,
        userId: string
    ) {
        const allStudents = await UserModel.getStudentDetailsByOrganizationCode(
            universityCode
        );
        const logger = loggerFactory(
            UniversityModel.ServiceName,
            "getStudentDataForUniversityAsCsv"
        );
        logger.info(`Generating csv for university code: ${universityCode}`);
        const csvWriter = createObjectCsvStringifier({
            header: [
                { id: "name", title: "STUDENT NAME" },
                { id: "email", title: "EMAIL " },
                { id: "rollNumber", title: "ROLL NUMBER" },
                { id: "totalRequests", title: "TOTAL REQUESTS" },
                { id: "escalatedRequests", title: "ESCALATED REQUESTS" },
            ],
        });
        const studentsRecords: any[] = [];
        for (let i = 0; i < allStudents.length; ++i) {
            const afcRequests = AfcModel.getAfcRequestCountForUser(
                allStudents[i]._id
            );
            const afcEscalatedRequests = AfcModel.getAfcEscalatedRequestsForUser(
                allStudents[i]._id
            );
            const vcRequests = VcModel.getVcRequestCountForUser(
                allStudents[i]._id
            );
            const vcEscalatedRequests = VcModel.getVcEscalatedRequestCountForUser(
                allStudents[i]._id
            );

            const dataResolver = await Promise.all([
                allStudents[i],
                afcRequests,
                vcRequests,
                afcEscalatedRequests,
                vcEscalatedRequests,
            ]);
            const totalRequests = dataResolver[1] + dataResolver[2];
            const escalatedRequests = dataResolver[3] + dataResolver[4];
            studentsRecords.push({
                name: dataResolver[0]?.fullname,
                email: dataResolver[0]?.email,
                rollNumber: dataResolver[0]?.rollNumber,
                totalRequests,
                escalatedRequests,
            });
        }
        const upload_url = await saveStudentsReportCSV(
            csvWriter.getHeaderString() +
                csvWriter.stringifyRecords(studentsRecords),
            `university/${universityCode}`,
            "Request-Metrics-Report.csv"
        );
        const user = await UserModel.getUserById(userId);
        if (user && upload_url) {
            EmailService.sendEmailToUser(
                user,
                ReportTemplate.getGenerateReportForMetricsMessage({
                    url: upload_url,
                    user,
                })
            );
        }
    }

    static async getStudentActivityByUserId(userId: string) {
        const logger = loggerFactory(
            UniversityModel.ServiceName,
            "getStudentActivityByUserId"
        );
        const afcActivity = AfcModel.getAllAfcActivityForUser(userId);
        const vcActivity = VcModel.getAllVcActivityForUser(userId);
        const vcEscalatedActivity = VcModel.getEscalatedVcRequestForUser(
            userId
        );
        const vcCompletedActivity = VcModel.getCompletedVcRequestForUser(
            userId
        );
        const vcActiveActivity = VcModel.getActiveVcRequestForUser(userId);
        const afcEscalatedActivity = AfcModel.getEscalatedAfcRequestForUser(
            userId
        );
        const afcCompletedActivity = AfcModel.getCompletedAfcRequestForUser(
            userId
        );
        const afcActiveActivity = AfcModel.getActiveAfcRequestForUser(userId);
        try {
            const dataResolver = await Promise.all([
                afcActivity,
                vcActivity,
                vcEscalatedActivity,
                vcCompletedActivity,
                vcActiveActivity,
                afcEscalatedActivity,
                afcCompletedActivity,
                afcActiveActivity,
            ]);
            logger.info(`Student id: ${userId} `);
            return {
                afcActivity: dataResolver[0],
                vcActivity: dataResolver[1],
                vcEscalatedActivity: dataResolver[2],
                vcCompletedActivity: dataResolver[3],
                vcActiveActivity: dataResolver[4],
                afcEscalatedActivity: dataResolver[5],
                afcCompletedActivity: dataResolver[6],
                afcActiveActivity: dataResolver[7],
            };
        } catch (err) {
            throw new Error(`Error resolving data`);
        }
    }

    public async changeAccountStatusTo(newStatus: UniversityAccountStatus) {
        const logger = loggerFactory(
            UniversityModel.ServiceName,
            "changeAccountStatusTo"
        );

        try {
            logger.info(
                `Changing account status to: ${newStatus} of university: ${this.code}`
            );
            this.accountStatus = newStatus;
            const event = new UniversityAccountLifecycleEvent(newStatus);
            this.statusLog.push(event);

            await UniversityDbModel.findByIdAndUpdate(this.universityId, {
                accountStatus: newStatus,
                $push: { statusLog: event },
            });

            return this;
        } catch (error) {
            logger.error("error: %o", error);
        }
    }

    public static async findUniversityByDomainName(domainName: string) {
        const logger = loggerFactory(
            UniversityModel.ServiceName,
            "findUniversityByDomainName"
        );
        let university;
        try {
            logger.info(`University domain: ${domainName}`);
            university = UniversityDbModel.findOne({
                domain: domainName,
                domainAccess: DomainAccess.AUTO,
                accountStatus: UniversityAccountStatus.APPROVED,
                domainAccessStatusLog: {
                    $in: [
                        new DomainAccessLifecycleEvent(
                            DomainAccessStatus.VERIFIED
                        ),
                    ],
                },
            }).lean();
        } catch (err) {
            logger.error(`Error finding university by domain name`);
            university = null;
        }
        return university;
    }

    public static async performUniversityAccountPreApprovalRequest(
        registeringUser: UserModel
    ) {
        const logger = loggerFactory(
            UniversityModel.ServiceName,
            "performUniversityAccountPreApprovalRequest"
        );
        logger.info(
            `got an organization request for organization name: ${registeringUser.organizationName}`
        );
        EmailService.notifyIStemTeam(
            AuthMessageTemplates.getNewOrganizationRegistrationRequestMessage({
                firstUser: registeringUser,
            })
        );
        await AdminReviewModel.getInstance({
            requestType: ReviewRequestType.ORGANIZATION,
            status: ReviewEnum.REQUESTED,
            organizationRequest: {
                organizationCode: registeringUser.organizationCode,
                organizationName: registeringUser.organizationName,
                userId: registeringUser.userId,
            },
        }).persist();
        const organization = new UniversityModel({
            code: registeringUser.organizationCode,
            name: registeringUser.organizationName || "",
            registeredByUser: registeringUser.userId,
            organizationType: registeringUser.userType,
        });

        await organization.persistUniversity(registeringUser.userId);
    }
}

export default UniversityModel;
