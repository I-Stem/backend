import {JobPreferencesModel} from "../../../domain/Community/JobPreferencesModel";
import {HighestQualification, JobNature} from "../../../domain/Community/JobPreferencesModel/JobPreferencesConstants";

export const JobPreferencesModelStubs = {
    application: new JobPreferencesModel({
    userId: "defined at runtime",
    natureOfJob: JobNature.FULL_TIME,
    highestDegree: "b.tech",
    highestEducation: HighestQualification.GRADUATE_DEGREE,
    inputFileId: "defined at runtime",
    seekingJob: true,
    industry: "writing",
    idealPosition: "swordsman",
    major: "bowmanship",
    workExperience: "5 battles",
    totalExperience: "many",
    associatedDisabilities: ["blindness", "obisity"],
    currentPlace: "night's watch",
    canRelocate: false,
    linkedIn: "",
    portfolioLink: "",
    resumeLink: "",
    needCareerHelp: true,
    interested:[],
    ignored:[],
    actionLog: []
})
}
