"use client";

import { Amplify } from "aws-amplify";
import { parseAmplifyConfig } from "aws-amplify/utils";

// This will be replaced by environment variables
Amplify.configure({
    Auth: {
        Cognito: {
            userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || "",
            userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || "",
        },
    },
});

export default function ConfigureAmplifyClientSide() {
    return null;
}
