import NextAuth, {User} from "next-auth"
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github"
import { PortalUser, UserEntity } from "@/types/custom";
import { createUser, getUserByEmail } from "@/components/api";
import { useState } from 'react';
import {Session} from "next-auth/core/types";
import {JWT} from "next-auth/jwt";
import {AdapterUser} from "next-auth/adapters";

export const createUserIfNotExists = async (portalUser : PortalUser) => {
  try {
    const user = await getUserByEmail(portalUser.email!!);
    //console.log('User exists', user)
    return user;
  } catch (error) {
    console.log('User does not exist', error)
    if (error.response && error.response.status === 404) {
      const newUser : UserEntity = {
        email: portalUser.email,
        firstName: portalUser.firstName,
        lastName: portalUser.lastName,
        provider: 'GOOGLE',
        status: 'ACTIVE',
      };
      const createdUser = await createUser(newUser);
      console.log('Created user', createdUser);
      return createdUser;
    } else {
      // Handle any other error cases here
      console.error("An error occurred:", error);
    }
  }
};

export default NextAuth({
  // Configure one or more authentication providers
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    // GithubProvider({
    //   clientId: process.env.GITHUB_ID as string,
    //   clientSecret: process.env.GITHUB_SECRET as string,
    // }),
    // ...add more providers here
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      const portalUser: PortalUser = {
        clientId: account?.providerAccountId,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        clientName: account?.provider,
        email: profile?.email,
        firstName: profile?.given_name,
        lastName: profile?.family_name,
        emailVerified: profile?.email_verified,
        idToken: account?.id_token,
        picture: user.image,
      };

      await createUserIfNotExists(portalUser);
      user.portalUser = portalUser;
      console.log('user', user);
      return true
    },
    jwt: async ({ token, user }) => {
      user && (token.user = user)
      return token
    },
    session: async ({ session, token }) => {
      session.user = token.user.portalUser
      return session
    }
  },
  session: {
    strategy: 'jwt',
  },
  //secret: process.env.NEXTAUTH_SECRET
});
