/**
 * Define AFC api
 *
 */

import { Request, Response } from 'express';
import { createResponse, response } from '../../utils/response';
import * as HttpStatus from 'http-status-codes';
import Tag, { ITagModel } from '../../models/Tag';
import loggerFactory from '../../middlewares/WinstonLogger';
import UserModel from '../../domain/user/User';

class TagController {
    static servicename = 'Tag Controller';
    public static async index(req: Request, res: Response) {
        const methodname = 'index';
        const logger = loggerFactory(TagController.servicename, methodname);

        try {
        const loggedInUser = res.locals.user;
        const user = await UserModel.getUserById(loggedInUser.id);
        const tags = user?.tags;
        logger.info(`Got tag results ${tags?.length}`);
        return createResponse(res, HttpStatus.OK, `tag get call`, tags?.map((str, index) => ({name:str, id:index})));
        } catch (err) {
            logger.error('Internal error occurred while getting Tag results. %o', err);
            return createResponse(res, HttpStatus.BAD_GATEWAY, `An internal server error occured `);
        }

    }

    public static post(req: Request, res: Response) {
        const methodname = 'post';
        const logger = loggerFactory(TagController.servicename, methodname);

        const loggedInUser = res.locals.user;
        const tag = new Tag({
            userId: loggedInUser.id,
            name: req.body.name
        });
        tag.save((err) => {
            if (err) {
                logger.error(`Error occurred while saving tag information. ${err}`);
                return res.status(HttpStatus.BAD_GATEWAY).json(
                    response[HttpStatus.BAD_GATEWAY]({
                        message: `An error occured while saving tag information ${err}.`
                    })
                );
            }
            // user.deductCredits(_credits, 'AFC Service used');
            logger.info(`Tag added successfully: ${tag}`);
            return res.status(HttpStatus.OK).json(
                response[HttpStatus.OK]({
                    message: `Tag added successfully`,
                    data: tag
                })
            );
        });
    }
    public static patch(req: Request, res: Response) {
        const methodname = 'patch';
        const logger = loggerFactory(TagController.servicename, methodname);
        const loggedInUser = res.locals.user;
        Tag.findByIdAndUpdate(req.params.id, req.body, {new: true})
            .populate('userId', 'id name')
            .exec()
            .then(tag => {
                logger.info(`Tag updated successfully. ${tag}`);
                return res.status(HttpStatus.OK).json(
                    response[HttpStatus.OK]({
                        data: tag?.toJSON(),
                        message: `Tag updated successfully`
                    })
                );
            })
            .catch(err => {
                console.log(err);
                logger.error(`Error occurred while updating tag information. ${err}`);
                if (err) {
                    return res.status(HttpStatus.BAD_GATEWAY).json(
                        response[HttpStatus.BAD_GATEWAY]({
                            message: `An error occured while updating tag information.`
                        })
                    );
                }
            });

    }
}

export default TagController;
