"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function NewBrandPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [logo, setLogo] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/brands", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          logo: logo || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to create brand")
        setIsLoading(false)
        return
      }

      router.push("/dashboard")
      router.refresh()
    } catch (error) {
      setError("Something went wrong")
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-4">
      <Card className="w-full max-w-2xl border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Create Your First Brand</CardTitle>
          <CardDescription>
            Let&apos;s start by creating a brand. You can connect your social media accounts to it later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Brand Name *</Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., My Awesome Brand"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo">Logo URL (optional)</Label>
              <Input
                id="logo"
                type="url"
                placeholder="https://example.com/logo.png"
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                You can add or update this later
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <textarea
                id="description"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                placeholder="Tell us about your brand..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                rows={4}
              />
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Brand"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
