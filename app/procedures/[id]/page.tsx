"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { ArrowLeft, Calendar, Edit, MapPin, TestTube, FileText, Trash2, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useIVFStore } from "@/lib/store"

export default function ProcedurePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { getProcedureById, procedures, deleteProcedure } = useIVFStore()
  const [procedure, setProcedure] = useState(getProcedureById(id))
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setProcedure(getProcedureById(id))
  }, [id, getProcedureById, procedures])

  const handleDelete = () => {
    if (procedure) {
      deleteProcedure(procedure.id)
      router.push("/")
    }
  }

  if (!mounted) return null

  if (!procedure) {
    return (
      <div className="container max-w-4xl py-10">
        <div className="flex flex-col items-center justify-center py-20">
          <h2 className="text-2xl font-bold mb-2">Procedure not found</h2>
          <p className="text-muted-foreground mb-6">The procedure you're looking for doesn't exist</p>
          <Button asChild>
            <Link href="/">Go back home</Link>
          </Button>
        </div>
      </div>
    )
  }

  const displayName = procedure.procedureType === "Other" 
    ? procedure.customProcedureName || "Other Procedure"
    : procedure.procedureType

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return null
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const totalCost = procedure.cost || 0
  const netCost = totalCost - (procedure.insuranceCoverage || 0)

  return (
    <div className="container max-w-4xl py-10">
      <Button variant="ghost" asChild className="mb-4 pl-0 hover:pl-0">
        <Link href="/" className="flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
      </Button>

      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TestTube className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold">{displayName}</h1>
              <Badge variant="outline">Procedure</Badge>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {format(parseISO(procedure.procedureDate), "PPP")}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild>
              <Link href={`/procedures/${procedure.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Procedure
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Procedure</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this procedure? This action cannot be undone and will permanently remove all procedure data including notes and results.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                    Delete Procedure
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>Procedure Details</CardTitle>
            <CardDescription>Complete information about this fertility procedure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground">Procedure Type</h3>
                <p className="font-medium">{displayName}</p>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground">Date</h3>
                <p className="font-medium">{format(parseISO(procedure.procedureDate), "PPPP")}</p>
              </div>
              
              {procedure.clinicName && (
                <div className="space-y-2 md:col-span-2">
                  <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Clinic/Location
                  </h3>
                  <p className="font-medium">{procedure.clinicName}</p>
                </div>
              )}
            </div>
            
            {procedure.results && (
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Results
                </h3>
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <p className="whitespace-pre-wrap text-sm">{procedure.results}</p>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {procedure.notes && (
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notes
                </h3>
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <p className="whitespace-pre-wrap text-sm">{procedure.notes}</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {(procedure.cost || procedure.insuranceCoverage) && (
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Cost Information
                </h3>
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      {procedure.cost && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Total Cost:</span>
                          <span className="font-medium">{formatCurrency(procedure.cost)}</span>
                        </div>
                      )}
                      {procedure.insuranceCoverage && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Insurance Coverage:</span>
                          <span className="font-medium text-green-600">-{formatCurrency(procedure.insuranceCoverage)}</span>
                        </div>
                      )}
                      {procedure.cost && procedure.insuranceCoverage && (
                        <div className="flex justify-between items-center border-t pt-3">
                          <span className="text-sm font-medium">Net Cost:</span>
                          <span className={`font-bold text-lg ${netCost < 0 ? "text-green-600" : ""}`}>
                            {formatCurrency(netCost)}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}