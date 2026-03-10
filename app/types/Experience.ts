export interface Experience {
  id: string;
  title: string;
  company: string;
  technologies: string[];
  startDate: Date;
  endDate?: Date;
  description: string;
  bulletPoints: string[];
  picture: string;
}
