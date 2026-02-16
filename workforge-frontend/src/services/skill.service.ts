import { axiosClient } from '@lib/axios';
import { Skill } from '@types';

class SkillService {
	async getSkills(): Promise<Skill[]> {
		return axiosClient.get<Skill[]>('/skills');
	}
}

export const skillService = new SkillService();
