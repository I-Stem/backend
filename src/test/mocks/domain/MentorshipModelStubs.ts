import { ConnectOften, SignupAs } from "../../../domain/Community/MentorshipModel/MentorshipConstants";
import {MentorshipModel} from "../../../domain/Community/MentorshipModel";

export const MentorshipModelStubs = {
menteeApplication: new MentorshipModel({
    userId: "defined at runtime",
    industry: "CSE",
    currentPosition: "swordsman",
    isPWD: true,
    associatedDisabilities: ["blind"],
    signupAs: SignupAs.MENTEE,
    learnSkills: "backward slash",
    questionToMentor: "how to do?",
    menteeAgreement: true,
    mentorSkills: "",
    connectOften: ConnectOften.ONCE_EVERY_3_MONTHS,
    questionToMentee: "",
    pauseMentorship: false,
    pauseMenteeship: false,
    cancelMentorship: false,
    cancelMenteeship: false,
    contactNumber: "9898",
    anythingElse: "no",
    mentorshipStatus: []
}),

mentorApplication: new MentorshipModel({
    userId: "defined at runtime",
    industry: "CSE",
    currentPosition: "swordsman",
    isPWD: true,
    associatedDisabilities: ["blind"],
    signupAs: SignupAs.MENTOR,
    learnSkills: "",
    questionToMentor: "",
    menteeAgreement: false,
    mentorSkills: "all rounder",
    connectOften: ConnectOften.ONCE_EVERY_3_MONTHS,
    questionToMentee: "do you how to pick it up",
    pauseMentorship: false,
    pauseMenteeship: false,
    cancelMentorship: false,
    cancelMenteeship: false,
    contactNumber: "9898",
    anythingElse: "no",
    mentorshipStatus: []
}),

}