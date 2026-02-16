import { useQuery } from '@tanstack/react-query';
import { skillService } from '@services/skill.service';

export const useSkills = () => {
  return useQuery({
    queryKey: ['skills'],
    queryFn: () => skillService.getSkills(),
  });
};
