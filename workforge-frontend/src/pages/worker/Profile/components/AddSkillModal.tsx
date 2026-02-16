import React from 'react';
import { Modal } from '@components/ui/Modal';
import { Button } from '@components/ui/Button';

interface AddSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (skill: string, level: string) => void;
}

export const AddSkillModal: React.FC<AddSkillModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [skill, setSkill] = React.useState('');
  const [level, setLevel] = React.useState('intermediate');

  const handleSubmit = () => {
    if (skill.trim()) {
      onAdd(skill, level);
      setSkill('');
      setLevel('intermediate');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Header onClose={onClose}>Add Skill</Modal.Header>
      <Modal.Body>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Skill Name</label>
            <input
              type="text"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="e.g., Plumbing, Electrical"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Proficiency Level</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit}>Add Skill</Button>
      </Modal.Footer>
    </Modal>
  );
};
