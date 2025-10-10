"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, ExternalLink, Loader2, AlertCircle } from "lucide-react"

type YouTubeCredentialsSetupProps = {
  brandId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function YouTubeCredentialsSetup({
  brandId,
  open,
  onOpenChange,
  onSuccess,
}: YouTubeCredentialsSetupProps) {
  const [step, setStep] = useState(1)
  const [clientId, setClientId] = useState("")
  const [clientSecret, setClientSecret] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleValidate = async () => {
    if (!clientId || !clientSecret) {
      setError("Please enter both Client ID and Client Secret")
      return
    }

    setIsValidating(true)
    setError("")

    try {
      const response = await fetch("/api/youtube/credentials/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId,
          clientSecret,
        }),
      })

      const data = await response.json()

      if (response.ok && data.valid) {
        setStep(3)
      } else {
        setError(data.error || "Invalid credentials")
      }
    } catch (error) {
      setError("Failed to validate credentials")
    } finally {
      setIsValidating(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError("")

    try {
      const response = await fetch("/api/youtube/credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brandId,
          clientId,
          clientSecret,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          onOpenChange(false)
          if (onSuccess) onSuccess()
          // Reset state
          setStep(1)
          setClientId("")
          setClientSecret("")
          setSuccess(false)
        }, 1500)
      } else {
        setError(data.error || "Failed to save credentials")
      }
    } catch (error) {
      setError("Failed to save credentials")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Setup YouTube API Credentials</DialogTitle>
          <DialogDescription>
            Configure your YouTube API credentials to enable video management features
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Instructions */}
        {step === 1 && (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Follow these steps to create your YouTube API credentials
              </AlertDescription>
            </Alert>

            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-medium">Go to Google Cloud Console</p>
                  <a
                    href="https://console.cloud.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    Open Console
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-medium">Create a new project or select existing</p>
                  <p className="text-muted-foreground">Name it something like "Social Media Manager"</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-medium">Enable YouTube Data API v3</p>
                  <p className="text-muted-foreground">Search for "YouTube Data API v3" and enable it</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                  4
                </div>
                <div className="flex-1">
                  <p className="font-medium">Create OAuth 2.0 Credentials</p>
                  <p className="text-muted-foreground">
                    Go to Credentials → Create Credentials → OAuth client ID
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                  5
                </div>
                <div className="flex-1">
                  <p className="font-medium">Configure OAuth consent screen</p>
                  <p className="text-muted-foreground">Add your email and app info (External user type)</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                  6
                </div>
                <div className="flex-1">
                  <p className="font-medium">Add authorized redirect URI</p>
                  <code className="block rounded bg-muted px-2 py-1 text-xs mt-1">
                    {process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/social/youtube/callback
                  </code>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                  7
                </div>
                <div className="flex-1">
                  <p className="font-medium">Copy Client ID and Client Secret</p>
                  <p className="text-muted-foreground">You'll need both in the next step</p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => setStep(2)}>
                Next: Enter Credentials
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 2: Enter Credentials */}
        {step === 2 && (
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clientId">Client ID</Label>
                <Input
                  id="clientId"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="Enter your Google OAuth Client ID"
                  disabled={isValidating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientSecret">Client Secret</Label>
                <Input
                  id="clientSecret"
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="Enter your Google OAuth Client Secret"
                  disabled={isValidating}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                disabled={isValidating}
              >
                Back
              </Button>
              <Button onClick={handleValidate} disabled={isValidating}>
                {isValidating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isValidating ? "Validating..." : "Validate Credentials"}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <div className="space-y-4">
            {success ? (
              <Alert className="border-green-200 bg-green-50 dark:bg-green-950/50">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Credentials saved successfully! YouTube features are now enabled.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <Alert className="border-green-200 bg-green-50 dark:bg-green-950/50">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    Credentials validated successfully!
                  </AlertDescription>
                </Alert>

                <div className="rounded-lg border p-4 space-y-2">
                  <h4 className="font-medium">Ready to save</h4>
                  <p className="text-sm text-muted-foreground">
                    Your YouTube API credentials will be encrypted and stored securely. You can now connect your YouTube channel and start managing videos.
                  </p>
                </div>

                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setStep(2)}
                    disabled={isSaving}
                  >
                    Back
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSaving ? "Saving..." : "Save Credentials"}
                  </Button>
                </DialogFooter>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
