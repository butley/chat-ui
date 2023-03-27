"use client"
import { useSession, signOut } from "next-auth/react";

import {FC} from "react";
import { UserCard } from "@/components/UserCard";

interface Props {

}

export const TopBar: FC<Props> = ({
}) => {
  const { data: session } = useSession();
  console.log('topbar-session: ', session);

  const handleLogout = async () => {
    await signOut()
  }

  return (
      <div className="fixed shadow-neutral-900 top-0 z-10 w-full h-12 bg-gray-600 text-white flex justify-end">
        <UserCard user={session?.user} onLogout={handleLogout} />
      </div>
  );
};
