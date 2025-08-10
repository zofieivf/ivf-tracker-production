import Link from "next/link"
import { format, parseISO } from "date-fns"
import { Calendar, FileText, MapPin, TestTube, Eye, Edit, DollarSign } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ProcedureRecord } from "@/lib/types"

interface ProcedureCardProps {
  procedure: ProcedureRecord
}

export function ProcedureCard({ procedure }: ProcedureCardProps) {
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
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <TestTube className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">{displayName}</CardTitle>
              <CardDescription className="flex items-center gap-1 mt-1">
                <Calendar className="h-4 w-4" />
                {format(parseISO(procedure.procedureDate), "MMMM d, yyyy")}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Procedure
            </Badge>
            <div className="flex gap-1">
              <Button asChild variant="ghost" size="sm">
                <Link href={`/procedures/${procedure.id}`}>
                  <Eye className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href={`/procedures/${procedure.id}/edit`}>
                  <Edit className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-3">
        <div className="space-y-3">
          {procedure.clinicName && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {procedure.clinicName}
            </div>
          )}
          
          {procedure.results && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4" />
                Results
              </div>
              <p className="text-sm text-muted-foreground pl-6 whitespace-pre-wrap">
                {procedure.results}
              </p>
            </div>
          )}
          
          {procedure.notes && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4" />
                Notes
              </div>
              <p className="text-sm text-muted-foreground pl-6 whitespace-pre-wrap">
                {procedure.notes}
              </p>
            </div>
          )}

          {(procedure.cost || procedure.insuranceCoverage) && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                <DollarSign className="h-4 w-4" />
                Cost
              </div>
              <div className="pl-6 text-sm space-y-1">
                {procedure.cost && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Cost:</span>
                    <span>{formatCurrency(procedure.cost)}</span>
                  </div>
                )}
                {procedure.insuranceCoverage && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Insurance Coverage:</span>
                    <span className="text-green-600">-{formatCurrency(procedure.insuranceCoverage)}</span>
                  </div>
                )}
                {procedure.cost && procedure.insuranceCoverage && (
                  <div className="flex justify-between font-medium border-t pt-1">
                    <span>Net Cost:</span>
                    <span className={netCost < 0 ? "text-green-600" : ""}>{formatCurrency(netCost)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
