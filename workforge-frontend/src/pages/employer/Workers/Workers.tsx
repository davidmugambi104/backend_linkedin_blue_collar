import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  UsersIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  WrenchScrewdriverIcon,
  StarIcon,
  BriefcaseIcon,
  EnvelopeIcon,
  PhoneIcon,
  EllipsisHorizontalIcon,
  CheckBadgeIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';

// Search Input
const SearchInput: React.FC<{ 
  value: string; 
  onChange: (value: string) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder = 'Search...' }) => (
  <div className="relative">
    <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="input-field pl-12"
    />
  </div>
);

// Filter Chip
interface FilterChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  count?: number;
}

const FilterChip: React.FC<FilterChipProps> = ({ label, active, onClick, count }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      active 
        ? 'bg-navy text-white shadow-md' 
        : 'bg-white text-muted border border-charcoal-200 hover:border-navy hover:text-navy'
    }`}
  >
    {label}
    {count !== undefined && (
      <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${active ? 'bg-white/20' : 'bg-charcoal-100'}`}>
        {count}
      </span>
    )}
  </button>
);

// Skill Badge
const SkillBadge: React.FC<{ skill: string }> = ({ skill }) => (
  <span className="px-3 py-1 rounded-full text-xs font-medium bg-navy-50 text-navy border border-navy-100">
    {skill}
  </span>
);

// Worker Card
interface Worker {
  id: number;
  name: string;
  location: string;
  bio: string;
  skills: string[];
  rating: number;
  reviews: number;
  jobsCompleted: number;
  hourlyRate: string;
  avatar?: string;
  verified: boolean;
}

const WorkerCard: React.FC<{ worker: Worker }> = ({ worker }) => (
  <div className="solid-card p-5 group hover:border-navy/30">
    <div className="flex items-start gap-4">
      <div className="relative">
        <div className="w-14 h-14 rounded-xl bg-navy flex items-center justify-center text-white font-bold text-lg">
          {worker.name.split(' ').map(n => n[0]).join('')}
        </div>
        {worker.verified && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white">
            <CheckBadgeIcon className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold text-charcoal group-hover:text-navy transition-colors">{worker.name}</h4>
            <p className="text-sm text-muted flex items-center gap-1 mt-0.5">
              <MapPinIcon className="w-3.5 h-3.5" />
              {worker.location}
            </p>
          </div>
          <button className="icon-btn opacity-0 group-hover:opacity-100 transition-opacity">
            <EllipsisHorizontalIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>

    <p className="text-sm text-charcoal mt-4 line-clamp-2">{worker.bio}</p>

    <div className="flex flex-wrap gap-2 mt-4">
      {worker.skills.slice(0, 3).map((skill) => (
        <SkillBadge key={skill} skill={skill} />
      ))}
      {worker.skills.length > 3 && (
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-charcoal-100 text-charcoal-600">
          +{worker.skills.length - 3} more
        </span>
      )}
    </div>

    <div className="flex items-center justify-between mt-5 pt-4 border-t border-charcoal-100">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <StarIcon className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span className="text-sm font-semibold text-charcoal">{worker.rating}</span>
          <span className="text-xs text-muted">({worker.reviews})</span>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted">
          <BriefcaseIcon className="w-4 h-4" />
          <span>{worker.jobsCompleted} jobs</span>
        </div>
      </div>
      <span className="text-sm font-semibold text-navy">{worker.hourlyRate}</span>
    </div>

    <div className="flex items-center gap-2 mt-4">
      <button className="btn-primary flex-1 text-sm">
        <EnvelopeIcon className="w-4 h-4" />
        Contact
      </button>
      <button className="btn-secondary flex-1 text-sm">
        <ArrowTopRightOnSquareIcon className="w-4 h-4" />
        Profile
      </button>
    </div>
  </div>
);

// Filter Sidebar
const FilterSidebar: React.FC<{
  selectedSkills: string[];
  onSkillToggle: (skill: string) => void;
}> = ({ selectedSkills, onSkillToggle }) => {
  const skillOptions = [
    'Electrical', 'HVAC', 'Plumbing', 'Carpentry', 'Welding', 
    'Masonry', 'Painting', 'Roofing', 'Flooring', 'Landscaping'
  ];

  return (
    <div className="solid-card p-5">
      <h3 className="font-semibold text-charcoal mb-4">Filters</h3>
      
      <div className="mb-6">
        <h4 className="text-sm font-medium text-muted mb-3">Skills</h4>
        <div className="flex flex-wrap gap-2">
          {skillOptions.map((skill) => (
            <button
              key={skill}
              onClick={() => onSkillToggle(skill)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedSkills.includes(skill)
                  ? 'bg-navy text-white'
                  : 'bg-charcoal-50 text-charcoal-600 hover:bg-charcoal-100'
              }`}
            >
              {skill}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-sm font-medium text-muted mb-3">Rating</h4>
        <div className="flex items-center gap-2">
          {[4, 3, 2, 1].map((stars) => (
            <button
              key={stars}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-charcoal-50 text-charcoal-600 hover:bg-charcoal-100"
            >
              <StarIcon className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              {stars}+
            </button>
          ))}
        </div>
      </div>

      <button 
        onClick={() => {}}
        className="w-full btn-ghost text-sm text-navy"
      >
        Clear all filters
      </button>
    </div>
  );
};

// Mock Data
const mockWorkers: Worker[] = [
  { 
    id: 1, 
    name: 'Adrian Cole', 
    location: 'Dallas, TX', 
    bio: 'Licensed electrician with 7 years field experience. Specializing in commercial and industrial installations.',
    skills: ['Electrical', 'Troubleshooting', 'Panel Installation', 'Code Compliance'],
    rating: 4.8,
    reviews: 124,
    jobsCompleted: 89,
    hourlyRate: '$45/hr',
    verified: true
  },
  { 
    id: 2, 
    name: 'Maya Ortiz', 
    location: 'Austin, TX', 
    bio: 'Commercial HVAC specialist focused on safety-first installs and energy-efficient solutions.',
    skills: ['HVAC', 'Maintenance', 'Refrigeration', 'Ductwork'],
    rating: 4.9,
    reviews: 98,
    jobsCompleted: 67,
    hourlyRate: '$52/hr',
    verified: true
  },
  { 
    id: 3, 
    name: 'Leo Kim', 
    location: 'Houston, TX', 
    bio: 'Certified welder for industrial and municipal projects. AWS certified with experience in structural welding.',
    skills: ['Welding', 'Fabrication', 'Metalwork', 'Blueprint Reading'],
    rating: 4.7,
    reviews: 76,
    jobsCompleted: 54,
    hourlyRate: '$48/hr',
    verified: true
  },
  { 
    id: 4, 
    name: 'Sarah Johnson', 
    location: 'San Antonio, TX', 
    bio: 'Master plumber with expertise in residential and commercial systems. Fast and reliable service.',
    skills: ['Plumbing', 'Pipe Fitting', 'Water Heaters', 'Drain Cleaning'],
    rating: 4.6,
    reviews: 142,
    jobsCompleted: 112,
    hourlyRate: '$50/hr',
    verified: true
  },
  { 
    id: 5, 
    name: 'Marcus Thompson', 
    location: 'Fort Worth, TX', 
    bio: 'Experienced carpenter specializing in custom builds, renovations, and finish work.',
    skills: ['Carpentry', 'Cabinetry', 'Framing', 'Finish Work'],
    rating: 4.5,
    reviews: 63,
    jobsCompleted: 41,
    hourlyRate: '$42/hr',
    verified: false
  },
  { 
    id: 6, 
    name: 'Emily Chen', 
    location: 'Austin, TX', 
    bio: 'Professional painter with an eye for detail. Interior and exterior painting services.',
    skills: ['Painting', 'Drywall', 'Surface Prep', 'Color Consultation'],
    rating: 4.8,
    reviews: 89,
    jobsCompleted: 78,
    hourlyRate: '$38/hr',
    verified: true
  },
];

const Workers = () => {
  const [query, setQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  // Filter workers
  const filtered = useMemo(() => {
    return mockWorkers.filter((worker) => {
      const matchesQuery = 
        worker.name.toLowerCase().includes(query.toLowerCase()) ||
        worker.skills.some(s => s.toLowerCase().includes(query.toLowerCase()));
      const matchesSkills = selectedSkills.length === 0 || 
        worker.skills.some(s => selectedSkills.includes(s));
      return matchesQuery && matchesSkills;
    });
  }, [query, selectedSkills]);

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  return (
    <div className="animate-fade-in-up">
      {/* Page Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Workers</h1>
          <p className="page-subtitle">Browse and connect with skilled professionals</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted">{filtered.length} workers found</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="solid-card p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1">
            <SearchInput 
              value={query} 
              onChange={setQuery}
              placeholder="Search workers by name or skills..."
            />
          </div>
          <div className="flex items-center gap-2">
            {['Electrician', 'HVAC', 'Plumber', 'Carpenter'].map((skill) => (
              <FilterChip 
                key={skill}
                label={skill}
                active={selectedSkills.includes(skill)}
                onClick={() => handleSkillToggle(skill)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <FilterSidebar 
          selectedSkills={selectedSkills}
          onSkillToggle={handleSkillToggle}
        />

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="w-16 h-16 rounded-full bg-charcoal-100 flex items-center justify-center mx-auto mb-4">
              <UsersIcon className="w-8 h-8 text-muted" />
            </div>
            <h3 className="text-lg font-semibold text-charcoal mb-2">No workers found</h3>
            <p className="text-muted">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((worker) => (
              <WorkerCard key={worker.id} worker={worker} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Workers;
