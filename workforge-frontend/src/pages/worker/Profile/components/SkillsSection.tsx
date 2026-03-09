import React, { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Card, CardHeader, CardBody } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { SkillBadge } from '@components/common/SkillBadge';
import { AddSkillModal } from './AddSkillModal';
import { useWorkerSkills, useRemoveWorkerSkill, useAddWorkerSkill } from '@hooks/useWorkerSkills';
import { Skeleton } from '@components/ui/Skeleton';

const getProficiencyLevel = (level: number): 'beginner' | 'intermediate' | 'advanced' | 'expert' => {
  if (level <= 1) return 'beginner';
  if (level <= 2) return 'beginner';
  if (level <= 3) return 'intermediate';
  if (level <= 4) return 'advanced';
  return 'expert';
};

interface SkillsSectionProps {
  isOwnProfile?: boolean;
}

export const SkillsSection: React.FC<SkillsSectionProps> = ({
  isOwnProfile = true,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { data: skills, isLoading } = useWorkerSkills();
  const removeSkill = useRemoveWorkerSkill();
  const addSkill = useAddWorkerSkill();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Skills</h3>
        </CardHeader>
        <CardBody>
          <div className="flex flex-wrap gap-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="w-24 h-8 rounded-full" />
            ))}
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Skills & Expertise</h3>
          {isOwnProfile && (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<PlusIcon className="w-4 h-4" />}
              onClick={() => setIsAddModalOpen(true)}
            >
              Add Skill
            </Button>
          )}
        </CardHeader>
        <CardBody>
          {skills && skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <SkillBadge
                  key={skill.id}
                  skill={skill.skill?.name || ''}
                  level={getProficiencyLevel(skill.proficiency_level || 0)}
                  onRemove={isOwnProfile ? () => removeSkill.mutate(skill.skill_id) : undefined}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-500  py-4">
              {isOwnProfile
                ? 'Add skills to get better job recommendations'
                : 'No skills listed yet'}
            </p>
          )}
        </CardBody>
      </Card>

      <AddSkillModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={(skill, level) => {
          addSkill.mutate({ skill_name: skill, proficiency_level: level });
          setIsAddModalOpen(false);
        }}
      />
    </>
  );
};