export interface Experience {
  id: string;
  title: string;
  company: string; // added to distinguish where the experience happened
  technologies: string[];
  startDate: Date;
  endDate?: Date; // optional for ongoing roles like your thesis or externship
  description: string;
  bulletPoints: string[];
  link?: string; // optional link to a repo or paper
  picture: string; 
}