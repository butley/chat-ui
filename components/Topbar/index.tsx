"use client"
import { useSession, signOut } from "next-auth/react";
import {FC, useEffect, useState} from "react";
import { UserCard } from "@/components/UserCard";
import {BillingCycle, formatCurrency, formatDate, PortalUser} from "@/types/custom";
import { getOpenBillingCycle } from "@/components/api";

interface Props {
}

export const TopBar: FC<Props> = ({
}) => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>();
  const { data: session } = useSession();
  const portalUser: PortalUser = session?.user as PortalUser;

  const handleLogout = async () => {
    await signOut()
  }

  useEffect(() => {
    const fetchBillingCycle = async () => {
      try {
        const response = await getOpenBillingCycle(portalUser?.id!!);
        setBillingCycle(response.data);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    }
    fetchBillingCycle();
  });

  return (
      <div className="fixed shadow-neutral-900 top-0 z-10 w-full h-12 bg-gray-600 text-white flex justify-end">
        {billingCycle && (
            <div className="flex flex-col justify-center mr">
              <span className="text-sm">{formatCurrency(billingCycle.tokensTotal * billingCycle.rate)}</span>
              {billingCycle?.date ? formatDate(billingCycle.date) : 'Loading...'}
            </div>
        )}
        <div className="topbar-divider d-none d-sm-block"></div>
        {/*<button*/}
        {/*    onClick={handleLogout}*/}
        {/*    className="text-sm font-semibold focus:outline-none mr-2"*/}
        {/*>*/}
        {/*  Logout*/}
        {/*</button>*/}
        <UserCard user={session?.user as PortalUser} onLogout={handleLogout} />
      </div>
  );
};
