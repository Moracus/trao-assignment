export type QuestionCategory =
  | "technical"
  | "behavioural"
  | "system-design"
  | "company-fit"
  | "others";

export type BuilderQuestion = {
  id: string;
  category: QuestionCategory;
  prompt?: string;
  answer_outline?: string;
  answer?: string;
  requirement_ids?: string[];
  difficulty?: number;
  generated?: boolean;
  edited?: boolean;
  pinned?: boolean;
  deleted?: boolean;
  updatedAt?: string | Date;
  order?: number;
};

export type BuilderFlashcard = {
  id: string;
  front?: string;
  back?: string;
  requirement_ids?: string[];
  generated?: boolean;
  edited?: boolean;
  pinned?: boolean;
  deleted?: boolean;
  updatedAt?: string | Date;
};

export type CompanyBrief = {
  summary?: string;
  what_they_do?: string;
  sources?: string[];
  edited?: {
    summary?: boolean;
    what_they_do?: boolean;
  };
  pinned?: boolean;
};
