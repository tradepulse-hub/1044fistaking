"use client"

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import { Configuration, SDKApi } from "@dynamic-labs/sdk-api-core"
import { getAuthToken, VERSION as SDKVersion } from "@dynamic-labs/sdk-react-core"
import { FetchService } from "@dynamic-labs/utils"

// Constants
export const DYNAMIC_ENVIRONMENT_ID = process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID!

// Dynamic API helper for authentication and verification
export const dynamicApi = () => {
  const settings = {
    basePath: "https://app.dynamicauth.com/api/v0",
    headers: {
      "Content-Type": "application/json",
      "x-dyn-version": `WalletKit/${SDKVersion}`,
      "x-dyn-api-version": "API/0.0.507",
      Authorization: "",
    },
  }

  const minJwt = getAuthToken()
  if (minJwt) {
    settings.headers.Authorization = `Bearer ${minJwt}`
  }

  return new SDKApi(
    new Configuration({
      ...settings,
      fetchApi: FetchService.fetch,
    }),
  )
}
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
