import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:3000").replace(/\/$/, "")

function formatDate(value) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString()
}

function BusinessListCard({ business }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl">{business.business_name || "Unnamed business"}</CardTitle>
            <CardDescription className="mt-1">{business.email || "No email provided"}</CardDescription>
          </div>
          <Badge variant="secondary">Business</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <span className="font-medium text-muted-foreground">Phone: </span>
          <span>{business.phone_number || "—"}</span>
        </div>
        <div>
          <span className="font-medium text-muted-foreground">Address: </span>
          <span>{business.postal_address || "—"}</span>
        </div>
        <div>
          <span className="font-medium text-muted-foreground">Joined: </span>
          <span>{formatDate(business.createdAt)}</span>
        </div>
      </CardContent>
    </Card>
  )
}

export function Businesses() {
  const [businesses, setBusinesses] = useState([])
  const [count, setCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const [keywordInput, setKeywordInput] = useState("")
  const [keyword, setKeyword] = useState("")
  const [sort, setSort] = useState("")
  const [order, setOrder] = useState("asc")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  useEffect(() => {
    let ignore = false

    async function loadBusinesses() {
      setIsLoading(true)
      setError("")

      try {
        const params = new URLSearchParams()
        if (keyword.trim()) params.set("keyword", keyword.trim())
        if (sort) params.set("sort", sort)
        if (sort) params.set("order", order)
        params.set("page", String(page))
        params.set("limit", String(limit))

        const response = await fetch(`${BACKEND_URL}/businesses?${params.toString()}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data?.error || data?.message || "Failed to load businesses.")
        }

        if (!ignore) {
          setBusinesses(Array.isArray(data.results) ? data.results : [])
          setCount(Number(data.count) || 0)
        }
      } catch (err) {
        if (!ignore) {
          setBusinesses([])
          setCount(0)
          setError(err.message || "Failed to load businesses.")
        }
      } finally {
        if (!ignore) setIsLoading(false)
      }
    }

    loadBusinesses()

    return () => {
      ignore = true
    }
  }, [keyword, sort, order, page, limit])

  const totalPages = useMemo(() => {
    const pages = Math.ceil(count / limit)
    return pages > 0 ? pages : 1
  }, [count, limit])

  const onSearchSubmit = (event) => {
    event.preventDefault()
    setPage(1)
    setKeyword(keywordInput)
  }

  const onReset = () => {
    setKeywordInput("")
    setKeyword("")
    setSort("")
    setOrder("asc")
    setPage(1)
    setLimit(10)
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Businesses</h1>
          <p className="mt-2 text-muted-foreground">
            Browse businesses using the platform. Search by name, email, address, or phone.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/register/business">Register Your Business</Link>
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <form className="grid gap-4 md:grid-cols-5" onSubmit={onSearchSubmit}>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium">Search</label>
              <Input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                placeholder="Business name, email, address, or phone"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Sort By</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value)
                  setPage(1)
                }}
              >
                <option value="">Default</option>
                <option value="business_name">Business Name</option>
                <option value="email">Email</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Order</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                value={order}
                onChange={(e) => {
                  setOrder(e.target.value)
                  setPage(1)
                }}
                disabled={!sort}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Per Page</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                value={String(limit)}
                onChange={(e) => {
                  setLimit(Number(e.target.value))
                  setPage(1)
                }}
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>

            <div className="md:col-span-5 flex flex-wrap gap-2">
              <Button type="submit">Apply</Button>
              <Button type="button" variant="outline" onClick={onReset}>
                Reset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>{isLoading ? "Loading businesses..." : `${count} business${count === 1 ? "" : "es"} found`}</span>
        <span>Page {page} of {totalPages}</span>
      </div>

      {error ? (
        <Card>
          <CardContent className="py-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      {!error && !isLoading && businesses.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No businesses matched your current filters.
          </CardContent>
        </Card>
      ) : null}

      {!error && businesses.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {businesses.map((business) => (
            <BusinessListCard key={business.id} business={business} />
          ))}
        </div>
      ) : null}

      <div className="mt-8 flex items-center justify-between gap-4">
        <Button
          variant="outline"
          disabled={page <= 1 || isLoading}
          onClick={() => setPage((current) => Math.max(current - 1, 1))}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          disabled={page >= totalPages || isLoading}
          onClick={() => setPage((current) => current + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
