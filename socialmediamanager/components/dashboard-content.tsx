"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Youtube, CheckCircle2, XCircle, BarChart3, Users, TrendingUp, Plus, Settings, Lock, ExternalLink, Unplug, RefreshCw, AlertCircle } from "lucide-react"
import { YouTubeCredentialsSetup } from "@/components/youtube-credentials-setup"

type SocialAccount = {
  id: string
  platform: string
  platformUsername: string | null
  createdAt: Date
}

type Brand = {
  id: string
  name: string
  logo: string | null
  description: string | null
  socialAccounts: SocialAccount[]
}

type User = {
  name?: string | null
  email?: string | null
  image?: string | null
}

export function DashboardContent({ brand, user }: { brand: Brand; user: User }) {
  const searchParams = useSearchParams()
  const [isConnecting, setIsConnecting] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [showSetupWizard, setShowSetupWizard] = useState(false)
  const [hasYouTubeCredentials, setHasYouTubeCredentials] = useState(false)
  const [isCheckingCredentials, setIsCheckingCredentials] = useState(true)
  const [accountHealth, setAccountHealth] = useState<{ isValid: boolean; needsReconnect: boolean; error?: string } | null>(null)

  const success = searchParams.get("success")
  const error = searchParams.get("error")

  // Check if brand has YouTube credentials
  useEffect(() => {
    const checkCredentials = async () => {
      try {
        const response = await fetch(`/api/youtube/credentials?brandId=${brand.id}`)
        const data = await response.json()
        setHasYouTubeCredentials(data.hasCredentials)
      } catch (error) {
        console.error("Failed to check credentials:", error)
      } finally {
        setIsCheckingCredentials(false)
      }
    }

    checkCredentials()
  }, [brand.id])

  // Check YouTube account health if connected
  useEffect(() => {
    const checkHealth = async () => {
      const youtubeAccount = brand.socialAccounts.find((acc) => acc.platform === "youtube")
      if (!youtubeAccount) {
        setAccountHealth(null)
        return
      }

      try {
        const response = await fetch(`/api/social/youtube/health?accountId=${youtubeAccount.id}`)
        const data = await response.json()
        setAccountHealth(data)
      } catch (error) {
        console.error("Failed to check account health:", error)
      }
    }

    checkHealth()
  }, [brand.socialAccounts])

  const handleConnectYouTube = async () => {
    if (!hasYouTubeCredentials) {
      setShowSetupWizard(true)
      return
    }

    setIsConnecting(true)
    try {
      const response = await fetch(`/api/social/youtube/connect?brandId=${brand.id}`)
      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else if (data.error === "YouTube credentials not configured") {
        setShowSetupWizard(true)
        setIsConnecting(false)
      } else {
        alert(data.message || "Failed to connect YouTube account")
        setIsConnecting(false)
      }
    } catch (error) {
      alert("Failed to connect YouTube account")
      setIsConnecting(false)
    }
  }

  const handleSetupSuccess = () => {
    setHasYouTubeCredentials(true)
  }

  const handleDisconnectYouTube = async () => {
    const youtubeAccount = brand.socialAccounts.find((acc) => acc.platform === "youtube")
    if (!youtubeAccount) return

    if (!confirm("Are you sure you want to disconnect this YouTube account?")) {
      return
    }

    setIsDisconnecting(true)
    try {
      const response = await fetch(
        `/api/social/youtube/disconnect?accountId=${youtubeAccount.id}`,
        { method: "DELETE" }
      )
      const data = await response.json()

      if (response.ok) {
        // Reload the page to show updated state
        window.location.reload()
      } else {
        alert(data.error || "Failed to disconnect YouTube account")
      }
    } catch (error) {
      alert("Failed to disconnect YouTube account")
    } finally {
      setIsDisconnecting(false)
    }
  }

  const handleReconnectYouTube = async () => {
    // First disconnect, then reconnect
    const youtubeAccount = brand.socialAccounts.find((acc) => acc.platform === "youtube")
    if (!youtubeAccount) return

    if (!confirm("This will disconnect and reconnect your YouTube account. Continue?")) {
      return
    }

    setIsDisconnecting(true)
    try {
      // Disconnect
      const disconnectResponse = await fetch(
        `/api/social/youtube/disconnect?accountId=${youtubeAccount.id}`,
        { method: "DELETE" }
      )

      if (!disconnectResponse.ok) {
        throw new Error("Failed to disconnect")
      }

      // Then connect
      const connectResponse = await fetch(`/api/social/youtube/connect?brandId=${brand.id}`)
      const data = await connectResponse.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.message || "Failed to reconnect")
      }
    } catch (error) {
      alert("Failed to reconnect YouTube account")
      setIsDisconnecting(false)
    }
  }

  const youtubeAccount = brand.socialAccounts.find((acc) => acc.platform === "youtube")

  return (
    <div className="space-y-6 p-6">
      {/* YouTube Credentials Setup Dialog */}
      <YouTubeCredentialsSetup
        brandId={brand.id}
        open={showSetupWizard}
        onOpenChange={setShowSetupWizard}
        onSuccess={handleSetupSuccess}
      />

      {/* Success/Error Messages */}
      {success === "youtube_connected" && (
        <div className="rounded-lg bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-900 p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />
          <p className="text-sm text-green-800 dark:text-green-200">YouTube channel connected successfully!</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 p-4 flex items-center gap-3">
          <XCircle className="h-5 w-5 text-red-600 dark:text-red-500" />
          <p className="text-sm text-red-800 dark:text-red-200">
            {error === "access_denied" && "Access was denied"}
            {error === "invalid_request" && "Invalid request"}
            {error === "brand_not_found" && "Brand not found"}
            {error === "no_channel" && "No YouTube channel found"}
            {error === "account_already_linked" && "This account is already linked to another brand"}
            {error === "connection_failed" && "Failed to connect account"}
            {error === "credentials_not_configured" && "YouTube credentials not configured. Please set up your API credentials first."}
          </p>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Accounts</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brand.socialAccounts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {brand.socialAccounts.length === 1 ? 'platform' : 'platforms'} connected
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground mt-1">
              Coming soon
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-950 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground mt-1">
              Coming soon
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Social Accounts Section */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Social Accounts</CardTitle>
              <CardDescription className="mt-1.5">
                Connect and manage social media accounts
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* YouTube */}
          {!isCheckingCredentials && (
            <>
              {!hasYouTubeCredentials ? (
                // YouTube credentials not configured
                <div className="rounded-lg border-2 border-dashed border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950">
                      <Lock className="h-6 w-6 text-amber-600 dark:text-amber-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                        YouTube API Setup Required
                      </h4>
                      <p className="text-sm text-amber-800 dark:text-amber-200 mb-4">
                        To use YouTube features, you need to add your own YouTube API credentials. This gives you full control and unlimited quota.
                      </p>
                      <Button
                        onClick={() => setShowSetupWizard(true)}
                        variant="default"
                        size="sm"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Setup YouTube API
                      </Button>
                    </div>
                  </div>
                </div>
              ) : youtubeAccount ? (
                // YouTube channel connected
                <>
                  {accountHealth?.needsReconnect && (
                    <div className="rounded-lg border-2 border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20 p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                            YouTube Account Needs Reconnection
                          </h4>
                          <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                            {accountHealth.error || "The OAuth tokens have expired or become invalid. Please reconnect your account to continue uploading videos."}
                          </p>
                          <Button
                            onClick={handleReconnectYouTube}
                            disabled={isDisconnecting}
                            size="sm"
                            variant="destructive"
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            {isDisconnecting ? "Reconnecting..." : "Reconnect Now"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-red-600 text-white">
                      <Youtube className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">
                          {youtubeAccount.platformUsername || "YouTube Channel"}
                        </p>
                        {accountHealth?.isValid ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500 flex-shrink-0" />
                        ) : accountHealth?.needsReconnect ? (
                          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-500 flex-shrink-0" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Connected {new Date(youtubeAccount.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Link href={`/dashboard/youtube?brand=${brand.id}`}>
                        <Button size="sm" variant="outline">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Manage
                        </Button>
                      </Link>
                      <Button
                        onClick={handleDisconnectYouTube}
                        disabled={isDisconnecting}
                        size="sm"
                        variant="ghost"
                      >
                        <Unplug className="h-4 w-4 mr-2" />
                        {isDisconnecting ? "..." : "Disconnect"}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                // YouTube credentials configured but channel not connected
                <div className="flex items-center gap-4 rounded-lg border border-dashed bg-muted/50 p-4 transition-colors hover:bg-muted">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted-foreground/10">
                    <Youtube className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">YouTube</p>
                    <p className="text-sm text-muted-foreground">
                      Connect your YouTube channel to get started
                    </p>
                  </div>
                  <Button
                    onClick={handleConnectYouTube}
                    disabled={isConnecting}
                    size="sm"
                    className="flex-shrink-0"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {isConnecting ? "Connecting..." : "Connect"}
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Coming Soon Platforms */}
          <div className="rounded-lg border border-dashed bg-muted/30 p-6">
            <p className="text-sm text-muted-foreground text-center">
              🚀 Instagram, Twitter, Facebook, LinkedIn, and TikTok coming soon
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Placeholder */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription className="mt-1.5">
            Latest updates from your connected accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-muted-foreground">
              No activity yet
            </p>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
              Connect your social accounts to see analytics, insights, and performance metrics
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
