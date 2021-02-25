import { Request, Response } from "express";
import { createResponse } from "../../utils/response";
import {AdminReviewModel} from "../../domain/AdminReviewModel";
 import {
    ReviewRequestType,
} from "../../domain/AdminReviewModel/AdminReviewConstants";
import * as HttpStatus from "http-status-codes";

class AdminController {
    static servicename = "Admin Controller";

    public static async allAdminRequests(
        req: Request,
        res: Response
    ): Promise<any> {
        const allRequests = await AdminReviewModel.getAllRequests(
            (req.query.requestType as unknown) as ReviewRequestType,
            Number(req.query.offset)
        );
        return createResponse(res, HttpStatus.OK, "All requests", {
            allRequests,
        });
    }

    public static async allReviewedRequests(req: Request, res: Response) {
        const allRequests = await AdminReviewModel.getAllReviewedRequestsByRequestType(
            (req.query.requestType as unknown) as ReviewRequestType,
            Number(req.query.offset)
        );
        return createResponse(res, HttpStatus.OK, "All requests", {
            allRequests,
        });
    }

    public static async countAllPendingRequests(
        req: Request,
        res: Response
    ): Promise<any> {
        const count = await AdminReviewModel.getCountAllPendingRequests();
        return createResponse(
            res,
            HttpStatus.OK,
            "Count for all pending requests",
            {
                count,
            }
        );
    }

    public static async countAllReviewedRequests(
        req: Request,
        res: Response
    ): Promise<any> {
        const count = await AdminReviewModel.getCountAllReviewedRequests();
        return createResponse(
            res,
            HttpStatus.OK,
            "Count for all pending requests",
            {
                count,
            }
        );
    }

    public static async getRequestDetails(
        req: Request,
        res: Response
    ): Promise<any> {
        const details = await AdminReviewModel.getRequestDetailsById(
            String(req.query.id)
        );
        return createResponse(res, HttpStatus.OK, "Details for the request", {
            details,
        });
    }
}

export default AdminController;
