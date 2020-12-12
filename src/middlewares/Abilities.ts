import { Ability, AbilityBuilder, MongoQuery } from "@casl/ability";
import { OtherUserRoles } from "src/domain/User";
import { UniversityRoles } from "../domain/UniversityModel";
import { ServiceRoleEnum, UserRoleEnum } from "../models/User";

type Actions = "VIEW";
type Subjects = "AI_SERVICES" | "PROGRAMS_AND_RESOURCES";
type AppAbility = Ability<[Actions, Subjects]>;

export function abilitiesforUser(
    serviceRole: ServiceRoleEnum
): Ability<any, MongoQuery> {
    const { rules, can, cannot } = new AbilityBuilder<AppAbility>();
    if (serviceRole === ServiceRoleEnum.PREMIUM) {
        can("VIEW", ["AI_SERVICES", "PROGRAMS_AND_RESOURCES"]);
    } else {
        cannot("VIEW", "AI_SERVICES");
        can("VIEW", "PROGRAMS_AND_RESOURCES");
    }
    return new Ability(rules);
}
