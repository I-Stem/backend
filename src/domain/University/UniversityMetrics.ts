class RequestMetrics {
    averageRating: string;
    averageResolution: string;
    studentsUsingService: string;
    requestsByStudents: string;

    constructor(
        averageRating: string,
        averageResolution: string,
        studentsUsingService: string,
        requestsByStudents: string
    ) {
        this.averageRating = averageRating;
        this.averageResolution = averageResolution;
        this.requestsByStudents = requestsByStudents;
        this.studentsUsingService = studentsUsingService;
    }
}

export interface UniversityMetricsProps {
    afc: RequestMetrics;
    vc: RequestMetrics;
    universityCode: string;
}

class UniversityMetrics implements UniversityMetricsProps {
    afc: RequestMetrics;
    vc: RequestMetrics;
    universityCode: string;

    constructor(props: UniversityMetricsProps) {
        this.afc = props.afc;
        this.vc = props.vc;
        this.universityCode = props.universityCode;
    }
}

export default UniversityMetrics;
