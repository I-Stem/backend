import { Ability, AbilityBuilder, MongoQuery } from '@casl/ability';
import { UserRoleEnum } from '../models/User';

type Actions = 'VIEW';
type Subjects = 'AI_SERVICES' | 'PROGRAMS_AND_RESOURCES';
type AppAbility = Ability<[Actions, Subjects]>;

export function abilitiesforUser(role: UserRoleEnum): Ability<any, MongoQuery> {
    const { rules, can, cannot } = new AbilityBuilder<AppAbility>();
    if (role === UserRoleEnum.ADMIN || role === UserRoleEnum.PREMIUM ) {
        can('VIEW', ['AI_SERVICES', 'PROGRAMS_AND_RESOURCES']);
    } else {
        cannot('VIEW', 'AI_SERVICES');
        can('VIEW', 'PROGRAMS_AND_RESOURCES');
    }
    return new Ability(rules);
}
