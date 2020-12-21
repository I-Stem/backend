import MLModelDbModel from '../models/MLModel';
import loggerFactory from '../middlewares/WinstonLogger';

export enum TrainingStatus {
    CREATED = 'created',
     AFC_INITIATED = 'afc_initiated',
     AFC_COMPLETED = 'afc_completed',
     TRAINING_FAILED = 'training_failed',
     TRAINED = 'trained'
}

export interface MLModelProps {
    modelId?: string;
    _id?: string;
    name: string;
    createdBy: string;
    trainedModelId?: string;
    trainings?: TrainingInstance[];
    }

export class TrainingInstance {
    status: TrainingStatus;
    statusLog: TrainingStatus[] = [];
// map of data file ids and corresponding afc request
    dataAfcRequests: Map<string, string>;

    constructor(status: TrainingStatus, data: Map<string, string>) {
        this.status = status;
        this.dataAfcRequests = data;
    }
}

class MLModelModel {
static serviceName = 'MLModelModel';

    modelId: string = '';
name: string;
createdBy: string;
trainedModelId?: string;
trainings: TrainingInstance[] = [];

constructor(props: MLModelProps) {
    this.name = props.name;
    this.createdBy = props.createdBy;
    this.trainedModelId = props.trainedModelId;
    this.modelId = props.modelId || props._id || '';
    this.trainings = props.trainings || [];
}

public async persist() {
    const model = await new MLModelDbModel(this)
    .save();

    this.modelId = model._id;
    return this;
}

public async updateTrainedModelId(trainedModel: string) {
    const logger = loggerFactory(MLModelModel.serviceName, 'updateTrainedModelId');
    logger.info('got model id after training: %o', trainedModel);
    this.trainedModelId = trainedModel;
    await MLModelDbModel.findByIdAndUpdate(this.modelId, {trainedModelId: trainedModel}, {new: true}).lean();
}

public static async getModelById(id: string) {
    const logger = loggerFactory(MLModelModel.serviceName, 'getModelById');
    logger.info('retrieving model for id: ' + id);
    const modelData = await MLModelDbModel.findById(id).lean();
    if (modelData !== null) {
   return new MLModelModel(modelData);
    }
}

public static async getAllUserModels(userId: string) {
    const logger = loggerFactory(MLModelModel.serviceName, 'getAllUserModels');
    logger.info('getting models for user id: ' + userId);
    const models =   await MLModelDbModel.find({createdBy: userId})
    .lean();
    return models?.map(modelDbData => new MLModelModel(modelDbData));
}
}

export default MLModelModel;
