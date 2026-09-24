import { requireUser } from '@/lib/auth-helpers';
import { listAddresses } from '@/lib/services/user';
import { AddressList } from '@/components/account/address-list';
import { PageHeader } from '@/components/page-header';

export default async function AddressesPage() {
  const user = await requireUser();
  const addresses = await listAddresses(user.id);
  return (
    <>
      <PageHeader title="Addresses" description="Manage your shipping and billing addresses." />
      <AddressList initial={addresses} />
    </>
  );
}