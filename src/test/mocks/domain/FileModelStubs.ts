import FileModel from "../../../domain/FileModel";
import {FileProcessAssociations} from "../../../domain/FileModel/FileConstants";

export const FileModelStubs = {
    SongOfIceAndFire :         new FileModel({
        hash: "martin",
        inputURL: "https://www.citidel.com/thebook",
        name: "A Song of Ice and Fire.html",
        container: "store",
        userContexts: [{ userId: "to be set during test runtime", organizationCode: "PEOPLE", associatedAt: new Date(), processAssociation: FileProcessAssociations.AFC_INPUT}],
pages: 50
    }),

    GOT:         new FileModel({
        hash: "george",
        inputURL: "https://www.citidel.com/theshow",
        name: "G.O.T.mp4",
        container: "store",
        userContexts: [{ userId: "to be set during test runtime", organizationCode: "PEOPLE", associatedAt: new Date(), processAssociation: FileProcessAssociations.VC_INPUT}],
        videoLength: 600
    }),
}