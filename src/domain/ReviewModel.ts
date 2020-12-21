class ReviewModel {
    serviceRequestId: string = '';
    rating: number;
    text: string;

    constructor(serviceRequestId: string, rating: number, text: string) {
        this.serviceRequestId = serviceRequestId;
        this.rating = rating;
        this.text = text;
            }

}

export default ReviewModel;
