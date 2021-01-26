import { Ability, AbilityBuilder, MongoQuery } from "@casl/ability";
import { UniversityRoles } from "../domain/UniversityModel";
import { OtherUserRoles } from "../domain/user";
import { ServiceRoleEnum, UserRoleEnum } from "../models/User";

type Actions = "VIEW";
type Subjects =
    | "AI_SERVICES"
    | "PROGRAMS_AND_RESOURCES"
    | "ADMIN_PANEL"
    | "SETTINGS"
    | "ESCALATIONS"
    | "METRICS"
    | "STUDENTS";
type AppAbility = Ability<[Actions, Subjects]>;

export function abilitiesforUser(
    serviceRole: ServiceRoleEnum,
    userRole: UserRoleEnum | UniversityRoles | OtherUserRoles
): Ability<any, MongoQuery> {
    const { rules, can, cannot } = new AbilityBuilder<AppAbility>();
    if (serviceRole === ServiceRoleEnum.PREMIUM) {
        can("VIEW", ["AI_SERVICES", "PROGRAMS_AND_RESOURCES"]);
    } else {
        cannot("VIEW", "AI_SERVICES");
        can("VIEW", "PROGRAMS_AND_RESOURCES");
    }

    if (userRole === UniversityRoles.STAFF) {
        can("VIEW", ["SETTINGS", "ESCALATIONS", "METRICS", "STUDENTS"]);
        cannot("VIEW", "ADMIN_PANEL");
    }

    if (userRole === UniversityRoles.REMEDIATOR) {
        can("VIEW", "ESCALATIONS");
        cannot("VIEW", ["SETTINGS", "METRICS", "STUDENTS", "ADMIN_PANEL"]);
    }
    if (userRole === UserRoleEnum.ADMIN) {
        can("VIEW", [
            "ADMIN_PANEL",
            "SETTINGS",
            "ESCALATIONS",
            "METRICS",
            "STUDENTS",
        ]);
    }
    return new Ability(rules);
}
