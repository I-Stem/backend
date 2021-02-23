class ReviewModel {
    serviceRequestId: string = '';
    ratings: number;
    text: string;

    constructor(serviceRequestId: string, ratings: number, text: string) {
        this.serviceRequestId = serviceRequestId;
        this.ratings = ratings;
        this.text = text;
            }

}

export default ReviewModel;
