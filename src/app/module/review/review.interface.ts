export interface ICreateReviewPayload {
  mentorId: string;
  rating: number; // 1 to 5
  comment?: string;
}
