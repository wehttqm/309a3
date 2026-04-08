import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "@/context/auth-context"
import { apiClient } from "@/lib/api/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

function BusinessListCard({ business, isAdmin }) {
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
        {isAdmin ? (
          <div>
            <span className="font-medium text-muted-foreground">Owner: </span>
            <span>{business.owner_name || "—"}</span>
          </div>
        ) : null}

        <div>
          <span className="font-medium text-muted-foreground">Phone: </span>
          <span>{business.phone_number || "—"}</span>
        </div>
        <div>
          <span className="font-medium text-muted-foreground">Address: </span>
          <span>{business.postal_address || "—"}</span>
        </div>

        {isAdmin ? (
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge variant={business.activated ? "default" : "outline"}>
              {business.activated ? "Activated" : "Inactive"}
            </Badge>
            <Badge variant={business.verified ? "default" : "secondary"}>
              {business.verified ? "Verified" : "Pending verification"}
            </Badge>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

export function Businesses() {
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"

  const [businesses, setBusinesses] = useState([])
  const [count, setCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const [keywordInput, setKeywordInput] = useState("")
  const [keyword, setKeyword] = useState("")
  const [sort, setSort] = useState("")
  const [order, setOrder] = useState("asc")
  const [activated, setActivated] = useState("all")
  const [verified, setVerified] = useState("all")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  useEffect(() => {
    let ignore = false

    async function loadBusinesses() {
      setIsLoading(true)
      setError("")

      try {
        const query = {
          page,
          limit,
        }

        if (keyword.trim()) query.keyword = keyword.trim()
        if (sort) query.sort = sort
        if (sort) query.order = order
        if (isAdmin && activated !== "all") query.activated = activated === "true"
        if (isAdmin && verified !== "all") query.verified = verified === "true"

        const data = await apiClient.getBusinesses({ query })

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
  }, [activated, isAdmin, keyword, limit, order, page, sort, verified])

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
    setActivated("all")
    setVerified("all")
    setPage(1)
    setLimit(10)
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Businesses</h1>
          <p className="mt-2 text-muted-foreground">
            {isAdmin
              ? "Browse businesses with admin-only details, including owner name, activation, and verification state."
              : "Browse businesses using the platform. Search by name, email, address, or phone."}
          </p>
        </div>
        {!isAdmin ? (
          <Button asChild variant="outline">
            <Link to="/register/business">Register Your Business</Link>
          </Button>
        ) : null}
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <form className="grid gap-4 md:grid-cols-5" onSubmit={onSearchSubmit}>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium">Search</label>
              <Input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                placeholder={
                  isAdmin
                    ? "Business, owner, email, address, or phone"
                    : "Business name, email, address, or phone"
                }
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
                {isAdmin ? <option value="owner_name">Owner Name</option> : null}
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

            {isAdmin ? (
              <>
                <div>
                  <label className="mb-2 block text-sm font-medium">Activated</label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                    value={activated}
                    onChange={(e) => {
                      setActivated(e.target.value)
                      setPage(1)
                    }}
                  >
                    <option value="all">All</option>
                    <option value="true">Activated</option>
                    <option value="false">Not activated</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Verified</label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                    value={verified}
                    onChange={(e) => {
                      setVerified(e.target.value)
                      setPage(1)
                    }}
                  >
                    <option value="all">All</option>
                    <option value="true">Verified</option>
                    <option value="false">Not verified</option>
                  </select>
                </div>
              </>
            ) : null}

            <div className="flex flex-wrap gap-2 md:col-span-5">
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
            <BusinessListCard key={business.id} business={business} isAdmin={isAdmin} />
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
