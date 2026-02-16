export interface Skill {
  id: number;
  name: string;
  category: string;
}

export interface SkillCreateRequest {
  name: string;
  category: string;
}

export interface SkillUpdateRequest {
  name?: string;
  category?: string;
}