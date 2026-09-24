import { ProfileForm } from '@/components/account/profile-form';
import { PageHeader } from '@/components/page-header';
import { requireUser } from '@/lib/auth-helpers';
import { getProfile } from '@/lib/services/user';

export default async function ProfilePage() {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  return (
    <>
      <PageHeader title="Profile" description="Update your name and preferences." />
      <ProfileForm initial={profile} />
    </>
  );
}