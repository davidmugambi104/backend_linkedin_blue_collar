import { PencilIcon } from '@heroicons/react/24/outline';
import { Avatar, Button, InputField, Label } from '@components/atoms';

export const ProfilePageLayout = () => (
  <section className="grid gap-4 lg:grid-cols-2">
    <article className="rounded-lg bg-white p-6 shadow-level-1">
      <Avatar name="Workforge Inc." size="lg" />
      <h2 className="mt-3 font-heading text-xl font-semibold text-gray-900">Workforge Inc.</h2>
      <p className="text-sm text-gray-500">Construction and skilled trades employer</p>
      <Button variant="tertiary" className="mt-3">
        <PencilIcon className="h-4 w-4" aria-hidden="true" /> Edit Logo
      </Button>
    </article>

    <article className="rounded-lg bg-white p-6 shadow-level-1">
      <div className="space-y-3">
        <div>
          <Label htmlFor="bio">Bio</Label>
          <InputField id="bio" placeholder="Short company bio" />
        </div>
        <div>
          <Label htmlFor="website">Website</Label>
          <InputField id="website" placeholder="https://example.com" />
        </div>
      </div>
    </article>
  </section>
);
