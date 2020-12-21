import loggerFactory from '../middlewares/WinstonLogger';
import MentorshipDbModel from '../models/Mentorship';

export const enum JoinAs {
    MENTOR = 'mentor',
    MENTEE =  'mentee',
    BOTH =  'both'
}

export const enum ConnectOften {
    ONCE_EVERY_WEEK = 'once_every_week',
    ONCE_EVERY_OTHER_WEEK = 'once_every_other_week',
    ONCE_EVERY_MONTH = 'once_every_month',
    ONCE_EVERY_3_MONTH = 'once_every_3_month'
}

export interface MentorshipModelProps {
    _id: string;
    mentorshipId: string;
    userId: string;
    industry: string;
    currentPosition: string;
    isPWD: Boolean;
    associatedDisabilities: string[];
    signupAs: JoinAs;
    learnSkills: string;
    questionToMentor: string;
    anythingElse: string;
    menteeAgreement: boolean;
    mentorSkills: string;
    connectOften: ConnectOften;
    questionToMentee: string;
    pauseMentorship: Boolean;
    pauseMenteeship: Boolean;
    cancelMentorship: Boolean;
    cancelMenteeship: Boolean;
    mentorshipStatus: string[];
    createdAt?: Date;
}

class MentorshipModel {

    static ServiceName = 'MentorshipModel';

    mentorshipId: string;
    userId: string = '';
    industry: string = '';
    currentPosition: string = '';
    isPWD: Boolean = false;
    associatedDisabilities: string[] = [];
    signupAs: JoinAs = JoinAs.MENTEE;
    learnSkills: string = '';
    questionToMentor: string = '';
    anythingElse: string = '';
    menteeAgreement: boolean;
    mentorSkills: string = '';
    connectOften: ConnectOften = ConnectOften.ONCE_EVERY_WEEK;
    questionToMentee: string = '';
    pauseMentorship: Boolean = false;
    pauseMenteeship: Boolean = false;
    cancelMentorship: Boolean = false;
    cancelMenteeship: Boolean = false;
    mentorshipStatus: string[] = [];
createdAt?: Date;

    constructor(props: MentorshipModelProps) {
        this.mentorshipId = props.mentorshipId || props._id;
        this.userId = props.userId;
        this.industry = props.industry;
        this.currentPosition = props.currentPosition;
        this.isPWD = props.isPWD;
        this.associatedDisabilities = props.associatedDisabilities;
        this.signupAs = props.signupAs;
        this.learnSkills = props.learnSkills;
        this.questionToMentor = props.questionToMentor;
        this.anythingElse = props.anythingElse;
        this.menteeAgreement = props.menteeAgreement;
        this.mentorSkills = props.mentorSkills;
        this.connectOften = props.connectOften;
        this.questionToMentee = props.questionToMentee;
        this.pauseMentorship = props.pauseMentorship;
        this.pauseMenteeship = props.pauseMenteeship;
        this.cancelMentorship = props.cancelMentorship;
        this.cancelMenteeship = props.cancelMenteeship;
        this.createdAt = props.createdAt;
        this.mentorshipStatus = props.mentorshipStatus;
        }

persistMentorship(currUserId: string) {
    const logger = loggerFactory(MentorshipModel.ServiceName, 'persistMentorship');
    this.userId = currUserId;
    new MentorshipDbModel(this)
.save((err: any) => {
    if (err) {
    logger.error(err);
    }
});

}

public static async updateMentorshipForUser(mentorshipId: string, mentorshipStatus: string[], signupAs: JoinAs) : Promise<any> {
    const logger = loggerFactory(MentorshipModel.ServiceName, 'updateMentorshipForUser');
    logger.info(`Updating Mentorship by id: ${mentorshipId}`);
    MentorshipDbModel.findByIdAndUpdate(mentorshipId, {mentorshipStatus, signupAs}).exec().
    then(res => logger.info(`Mentorship updated`)).
    catch(err => logger.error('error occured while updating mentorship data'));
}

public static async updateMenteeshipForUser(mentorshipId: string, cancelMenteeship: boolean, signupAs: JoinAs): Promise<any> {
    const logger = loggerFactory(MentorshipModel.ServiceName, 'updateMentorshipForUser');
    logger.info(`Updating Menteeship by id: ${mentorshipId}`);
    MentorshipDbModel.findByIdAndUpdate(mentorshipId, {cancelMenteeship, signupAs}).exec().
    then(res => logger.info(`Menteeship updated`)).
    catch(err => logger.error('error occured while updating mentorship data'));
}

public static async MentorshipForUser(userId: string): Promise<MentorshipModel[]> {
    const logger = loggerFactory(MentorshipModel.ServiceName, 'MentorshipForUser');
    logger.info(`Mentorship by user: ${userId}`);
    return MentorshipDbModel.find({userId: userId}).exec();
}
}

export default MentorshipModel;
