/**
 * Validator interface for University.
 *
 */

 import { ContainerTypes, ValidatedRequestSchema } from "express-joi-validation";

 export interface UniversityRequestSchema extends ValidatedRequestSchema {
     [ContainerTypes.Body]: {
         code: string;
         name: string;
         address: string;
         domain: string;
         students: string;
         staffs: string;
         registeredByUser: string;
         organizationType: string;
         noStudentsWithDisability?: string;
         domainAccess: string;
         escalationHandledBy: string;
         handleAccessibilityRequests: string;
     };
 }
 