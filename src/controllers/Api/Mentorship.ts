/**
 * Define Job Preferences api
 *
 */
import { Request, Response } from 'express';
import { createResponse, response } from '../../utils/response';
import * as HttpStatus from 'http-status-codes';
import Mentorship from '../../models/Mentorship';
import loggerFactory from '../../middlewares/WinstonLogger';
import MentorshipModel, { JoinAs } from '../../domain/MentorshipModel';
import {plainToClass} from 'class-transformer';
import emailService from '../../services/EmailService';
import MentorshipTemplate from '../../MessageTemplates/MentorshipTemplate';
import { getFormattedJson } from '../../utils/formatter';
import UserModel from '../../domain/User';

class MentorshipController {

    static ServiceName = 'MentorshipController';

    public static async addMentorship(req: Request, res: Response) {
        const logger = loggerFactory(MentorshipController.ServiceName, 'addMentorship');
        logger.info('Request Received: %o', req.body);
        const mentorshipInstance = new MentorshipModel(req.body);
        if(req.body.mentorshipId){
            logger.info(`mentorship id: ${req.body.mentorshipId}`)
            if(req.body.mentorshipStatus.length !== 0)
            await MentorshipModel.updateMentorshipForUser(req.body.mentorshipId, req.body.mentorshipStatus, req.body.signupAs);
            if(req.body.cancelMenteeship !== undefined)
            await MentorshipModel.updateMenteeshipForUser(req.body.mentorshipId, req.body.cancelMenteeship, req.body.signupAs);
            emailService.reportMentorship(MentorshipTemplate.getMentorshipMessage({
                user: await UserModel.getUserById(res.locals.user.id),
                formData: getFormattedJson(req.body)
            }));
            return createResponse(res, HttpStatus.OK, `mentorship details updated`);
        }
        mentorshipInstance.persistMentorship(res.locals.user.id);
        const user = await UserModel.getUserById(res.locals.user.id);
        emailService.reportMentorship(MentorshipTemplate.getMentorshipMessage({
            user: user,
            formData: getFormattedJson(req.body)
        }));

        if(user!== null) {
        if(mentorshipInstance.signupAs.toUpperCase() === JoinAs.MENTEE.toUpperCase()) {
            emailService.sendEmailToUser(user, MentorshipTemplate.getMentorshipApplicationReceivedAcknowledgementMessage({
                user:user,
                subject: "[I-Stem] Thanks for signing up as mentee!!",
bodyBlock: `We have received a menteeship application from you. We are looking into it and we will reach out to you as soon as we find a mentor for you  on your registered email.
<br/>
You can always reach out to us at info@inclusivestem.org, if you have any query or suggestions.`
            }));
        } else if(mentorshipInstance.signupAs.toUpperCase() === JoinAs.MENTOR.toUpperCase()) {
            emailService.sendEmailToUser(user, MentorshipTemplate.getMentorshipApplicationReceivedAcknowledgementMessage({
                user:user,
                subject: "[I-Stem] Thanks for signing up as mentor!!",
bodyBlock: `Thanks a lot for agreeing to share your experience. We are sure that our community will grow and get a lot of help from your experience. We are currently finding mentee for you and we'll reach out to you as soon as we find a match on your registered email.
<br/>
You can always reach out to us, if you have any query or suggestions at info@inclusivestem.org
`
            }));
        } else if(mentorshipInstance.signupAs.toUpperCase() === JoinAs.BOTH.toUpperCase()) {
            emailService.sendEmailToUser(user, MentorshipTemplate.getMentorshipApplicationReceivedAcknowledgementMessage({
                user:user,
                subject: `[I-Stem] Thanks for signing up for mentorship service!!`,
                bodyBlock: `Welcome to I-Stem community. We are currently finding people for you with whom you could connect and learn from them, also while helping others to grow. We'll reach out to you as soon as we find match for you over your registered email.
                <br/>
                You can always reach out to us at info@inclusivestem.org, if you have any query or suggestions.
                `
            }))
        }
    }
        return createResponse(res, HttpStatus.OK, `mentorship details saved`);
   }

    public static async get(req: Request, res: Response) {
        const logger = loggerFactory(MentorshipController.ServiceName, 'getMentorship');
        try {
        const results = await MentorshipModel.MentorshipForUser(res.locals.user.id);
        logger.info('before sort: %o', results);
        const result = results.sort((a, b) =>  {
            if (a.createdAt && b.createdAt) {
            return b.createdAt.getTime() - a.createdAt.getTime();
            }

            return 0;
        });
        logger.info('after sort: %o', result);
        return createResponse(res, HttpStatus.OK, `mentorship results retrieved`, result.length > 0 ? result[0] : null);
        } catch (error) {
            logger.error('error: %o', error);
            return createResponse(res, HttpStatus.BAD_GATEWAY, 'error encountered');
        }
    }

}

export default MentorshipController;
